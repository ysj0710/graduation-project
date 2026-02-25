const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');

const JWT_SECRET = 'your-secret-key-change-in-production';

const router = new Router();

// 用户鉴权中间件
const requireAuth = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    ctx.status = 401;
    ctx.body = { message: '未授权' };
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ctx.state.userId = decoded.id;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: '无效的令牌' };
  }
};

router.use(requireAuth);

// 解析CSV（处理带引号和逗号的字段）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  result.push(current.trim());
  return result;
}

// 根据关键词判断分类
function getCategory(note) {
  if (!note) return '其他';
  const n = note.toLowerCase();
  
  if (n.includes('餐饮') || n.includes('美食') || n.includes('外卖') || n.includes('快餐') || n.includes('小吃')) return '餐饮';
  if (n.includes('交通') || n.includes('打车') || n.includes('地铁') || n.includes('公交') || n.includes('停车') || n.includes('高速')) return '交通';
  if (n.includes('购物') || n.includes('商城') || n.includes('淘宝') || n.includes('京东') || n.includes('拼多多')) return '购物';
  if (n.includes('话费') || n.includes('充值') || n.includes('流量')) return '充值';
  if (n.includes('水电') || n.includes('物业') || n.includes('燃气') || n.includes('电费') || n.includes('水费')) return '生活缴费';
  if (n.includes('电影') || n.includes('视频') || n.includes('会员') || n.includes('音乐')) return '娱乐';
  if (n.includes('医疗') || n.includes('药店') || n.includes('看病')) return '医疗';
  if (n.includes('保险')) return '保险';
  if (n.includes('工资') || n.includes('退款') || n.includes('转账') || n.includes('收入')) return '收入';
  
  return '其他';
}

// 导入微信账单CSV
router.post('/wechat', async (ctx) => {
  try {
    const { csvContent, accountId } = ctx.request.body;
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    
    if (!csvContent) {
      ctx.status = 400;
      ctx.body = { message: '请提供CSV内容' };
      return;
    }
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const transactions = [];
    let importedCount = 0;
    let skipCount = 0;
    
    // 微信账单表头：交易时间,交易类型,交易对方,商品说明,金额(元),支付方式,状态,备注
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 跳过汇总行
      if (line.includes('交易单号') || line.includes('总计') || line.includes('共')) {
        continue;
      }
      
      const fields = parseCSVLine(line);
      
      // 微信账单格式：时间,类型,对方,商品,金额,支付方式,状态,备注
      if (fields.length >= 5) {
        const dateStr = fields[0];
        const type = fields[1];
        const counterparty = fields[2];
        const note = fields[3];
        let amountStr = fields[4];
        
        if (!dateStr || !amountStr) {
          skipCount++;
          continue;
        }
        
        // 处理金额（去除"元"和空格）
        amountStr = amountStr.replace(/[^\d.-]/g, '');
        const amount = Math.abs(parseFloat(amountStr) || 0);
        
        if (amount === 0) {
          skipCount++;
          continue;
        }
        
        // 判断收入/支出
        // 微信：收入类型包括"转入"、"收到"、"红包收入"等
        let transactionType = 'expense';
        if (type && (type.includes('转入') || type.includes('收入') || type.includes('退款') || parseFloat(amountStr) > 0)) {
          transactionType = 'income';
        }
        
        // 解析日期
        let date;
        try {
          // 微信格式：2024-01-01 12:00:00 或 2024/01/01 12:00:00
          date = new Date(dateStr.replace(/\//g, '-'));
        } catch (e) {
          date = new Date();
        }
        
        const transaction = new Transaction({
          userId,
          type: transactionType,
          amount,
          category: getCategory(note),
          note: counterparty ? `${counterparty} - ${note}` : note,
          date
        });
        
        transactions.push(transaction);
        importedCount++;
      }
    }
    
    if (transactions.length > 0) {
      await Transaction.insertMany(transactions);
      
      // 更新账户余额
      if (accountId) {
        const account = await Account.findOne({ _id: accountId, userId });
        if (account) {
          const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          account.balance += income - expense;
          await account.save();
        }
      }
    }
    
    ctx.body = { 
      message: `成功导入 ${importedCount} 笔交易${skipCount > 0 ? `，跳过 ${skipCount} 行无效数据` : ''}`,
      count: importedCount
    };
  } catch (error) {
    console.error('导入微信账单错误:', error);
    ctx.status = 500;
    ctx.body = { message: '导入失败', error: error.message };
  }
});

// 导入支付宝账单CSV
router.post('/alipay', async (ctx) => {
  try {
    const { csvContent, accountId } = ctx.request.body;
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    
    if (!csvContent) {
      ctx.status = 400;
      ctx.body = { message: '请提供CSV内容' };
      return;
    }
    
    const lines = csvContent.split('\n').filter(line => line.trim());
    const transactions = [];
    let importedCount = 0;
    let skipCount = 0;
    
    // 支付宝账单格式：交易号,交易对方,商品说明,创建时间,完成时间,金额,状态
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      // 跳过汇总行
      if (line.includes('订单号') || line.includes('总计') || line.includes('合计')) {
        continue;
      }
      
      const fields = parseCSVLine(line);
      
      if (fields.length >= 6) {
        const transactionNo = fields[0];
        const counterparty = fields[1];
        const note = fields[2];
        const createTime = fields[3];
        const amountStr = fields[5];
        
        if (!createTime || !amountStr) {
          skipCount++;
          continue;
        }
        
        // 处理金额
        const amount = Math.abs(parseFloat(amountStr) || 0);
        if (amount === 0) {
          skipCount++;
          continue;
        }
        
        // 判断收入/支出
        let transactionType = 'expense';
        // 支付宝金额正数表示支出，负数表示收入，或者根据状态判断
        if (parseFloat(amountStr) < 0 || fields[4]?.includes('收入')) {
          transactionType = 'income';
        }
        
        // 解析日期
        let date;
        try {
          // 支付宝格式：2024-01-01 12:00:00
          date = new Date(createTime.replace(/\//g, '-'));
        } catch (e) {
          date = new Date();
        }
        
        const transaction = new Transaction({
          userId,
          type: transactionType,
          amount,
          category: getCategory(note),
          note: counterparty ? `${counterparty} - ${note}` : note,
          date
        });
        
        transactions.push(transaction);
        importedCount++;
      }
    }
    
    if (transactions.length > 0) {
      await Transaction.insertMany(transactions);
      
      // 更新账户余额
      if (accountId) {
        const account = await Account.findOne({ _id: accountId, userId });
        if (account) {
          const income = transactions.filter(t => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
          const expense = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
          account.balance += income - expense;
          await account.save();
        }
      }
    }
    
    ctx.body = { 
      message: `成功导入 ${importedCount} 笔交易${skipCount > 0 ? `，跳过 ${skipCount} 行无效数据` : ''}`,
      count: importedCount
    };
  } catch (error) {
    console.error('导入支付宝账单错误:', error);
    ctx.status = 500;
    ctx.body = { message: '导入失败', error: error.message };
  }
});

module.exports = router;
