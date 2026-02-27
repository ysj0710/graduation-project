const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const XLSX = require('xlsx');

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

// 解析CSV行（处理引号）
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
function getCategory(note, type = 'expense') {
  if (!note) return '其他';
  const n = note.toLowerCase();
  
  // 二维码收款/二维码支出单独处理
  if (n.includes('二维码') || n.includes('收款码')) return '二维码支出';
  
  if (type === 'income') {
    if (n.includes('工资') || n.includes('退款') || n.includes('转账') || n.includes('收入') || n.includes('还款') || n.includes('红包')) return '收入';
    return '其他收入';
  }
  
  if (n.includes('餐饮') || n.includes('美食') || n.includes('外卖') || n.includes('快餐') || n.includes('小吃') || n.includes('烧烤') || n.includes('火锅')) return '餐饮';
  if (n.includes('交通') || n.includes('打车') || n.includes('滴滴') || n.includes('地铁') || n.includes('公交') || n.includes('停车') || n.includes('高速') || n.includes('加油')) return '交通';
  if (n.includes('购物') || n.includes('商城') || n.includes('淘宝') || n.includes('京东') || n.includes('拼多多') || n.includes('外卖') || n.includes('天猫')) return '购物';
  if (n.includes('话费') || n.includes('充值') || n.includes('流量')) return '充值';
  if (n.includes('水电') || n.includes('物业') || n.includes('燃气') || n.includes('电费') || n.includes('水费') || n.includes('暖气')) return '生活缴费';
  if (n.includes('电影') || n.includes('视频') || n.includes('会员') || n.includes('音乐') || n.includes('游戏')) return '娱乐';
  if (n.includes('医疗') || n.includes('药店') || n.includes('看病') || n.includes('药房')) return '医疗';
  if (n.includes('保险')) return '保险';
  if (n.includes('工资') || n.includes('退款') || n.includes('转账') || n.includes('收入') || n.includes('还款') || n.includes('红包')) return '收入';
  if (n.includes('房租') || n.includes('租金')) return '住房';
  if (n.includes('学费') || n.includes('培训') || n.includes('教育')) return '教育';
  
  return '其他';
}

// 解析文件内容（CSV或XLSX）
function parseFile(content, filename) {
  const ext = filename.toLowerCase().split('.').pop();
  let data = [];
  
  if (ext === 'xlsx' || ext === 'xls') {
    // 解析XLSX
    const workbook = XLSX.read(content, { type: 'buffer' });
    const sheetName = workbook.SheetNames[0];
    const sheet = workbook.Sheets[sheetName];
    data = XLSX.utils.sheet_to_json(sheet, { header: 1 });
  } else {
    // 解析CSV
    const lines = content.split('\n').filter(line => line.trim());
    for (const line of lines) {
      if (line.includes('交易单号') || line.includes('订单号') || line.includes('总计') || line.includes('合计')) continue;
      data.push(parseCSVLine(line));
    }
  }
  
  return data;
}

// 导入微信账单
router.post('/wechat', requireAuth, async (ctx) => {
  try {
    const { csvContent, xlsxContent, accountId } = ctx.request.body;
    console.log('收到导入请求, xlsxContent:', xlsxContent ? '有内容' : '空', 'csvContent:', csvContent ? '有内容' : '空');
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    
    if (!csvContent && !xlsxContent) {
      ctx.status = 400;
      ctx.body = { message: '请提供CSV或XLSX文件内容' };
      return;
    }

    // 判断文件类型并解析
    let data = [];
    if (xlsxContent) {
      console.log('开始解析xlsx...');
      const buffer = Buffer.from(xlsxContent, 'base64');
      data = parseFile(buffer, 'wechat.xlsx');
      console.log('xlsx解析结果, data长度:', data.length);
    } else {
      console.log('开始解析csv...');
      data = parseFile(csvContent, 'wechat.csv');
      console.log('csv解析结果, data长度:', data.length);
    }
    
    if (data.length === 0) {
      ctx.body = { message: '成功导入 0 笔交易', count: 0 };
      return;
    }
    
    const transactions = [];
    let importedCount = 0;
    
    // 微信格式：时间,类型,对方,商品,金额,支付方式,状态,备注
    console.log('微信账单解析，数据条数:', data.length);
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 5) {
        console.log('跳过第', i, '行: row为空或长度不足');
        continue;
      }
      
      // 处理XLSX对象格式
      let fields = Array.isArray(row) ? row : Object.values(row);
      fields = fields.map(f => String(f || '').trim());
      
      // 微信xlsx格式：时间,类型,对方,商品,金额(元),支付方式,状态,备注
      // 尝试找到金额字段（通常是数字）
      let dateStr = fields[0];
      let type = fields[1];
      let counterparty = fields[2];
      let note = fields[3];
      let amountStr = '';
      
      // 金额可能在第4或第5列
      for (let j = 4; j < fields.length; j++) {
        const val = String(fields[j] || '').replace(/[^\d.-]/g, '');
        if (val && !isNaN(parseFloat(val))) {
          amountStr = val;
          break;
        }
      }
      
      // 如果第4列是数字，直接用
      if (!amountStr && fields[4]) {
        amountStr = String(fields[4]).replace(/[^\d.-]/g, '');
      }
      
      if (!dateStr || !amountStr) {
        console.log('跳过第', i, '行: dateStr或amountStr为空', dateStr, amountStr);
        continue;
      }
      
      const amount = Math.abs(parseFloat(amountStr) || 0);
      if (amount === 0) {
        console.log('跳过第', i, '行: amount为0');
        continue;
      }
      
      
      
      // 判断收入/支出
      let transactionType = 'expense';
      // 微信xlsx第5列是"收/支"字段
      const incomeExpense = fields[4] || '';
      if (incomeExpense.includes('收入')) {
        transactionType = 'income';
      } else if (incomeExpense.includes('支出')) {
        transactionType = 'expense';
      }
      // 检查note和counterparty是否包含二维码/收款
      const fullNote = (note || '') + ' ' + (counterparty || '');
      if (fullNote.includes('二维码') || fullNote.includes('收款码') || fullNote.includes('收款')) {
        transactionType = 'expense';
      }
      
      // 解析日期
      let date;
      try {
        date = new Date(dateStr.replace(/\//g, '-'));
      } catch (e) {
        date = new Date();
      }
      
      const transaction = new Transaction({
        userId,
        type: transactionType,
        amount,
        category: getCategory(note, transactionType),
        note: counterparty ? `${counterparty} - ${note}` : note,
        date
      });
      
      transactions.push(transaction);
      importedCount++;
    }
    
    if (transactions.length > 0) {
      await Transaction.insertMany(transactions);
      
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
      message: `成功导入 ${importedCount} 笔交易`,
      count: importedCount
    };
  } catch (error) {
    console.error('导入微信账单错误:', error);
    ctx.status = 500;
    ctx.body = { message: '导入失败', error: error.message };
  }
});

// 导入支付宝账单
router.post('/alipay', requireAuth, async (ctx) => {
  try {
    const { csvContent, xlsxContent, accountId } = ctx.request.body;
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    
    if (!csvContent && !xlsxContent) {
      ctx.status = 400;
      ctx.body = { message: '请提供CSV或XLSX文件内容' };
      return;
    }

    let data = [];
    if (xlsxContent) {
      const buffer = Buffer.from(xlsxContent, 'base64');
      data = parseFile(buffer, 'alipay.xlsx');
    } else {
      data = parseFile(csvContent, 'alipay.csv');
    }
    
    const transactions = [];
    let importedCount = 0;
    
    // 支付宝格式：交易号,对方,商品,创建时间,完成时间,金额,状态
    for (let i = 1; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 6) continue;
      
      let fields = Array.isArray(row) ? row : Object.values(row);
      fields = fields.map(f => String(f || '').trim());
      
      const transactionNo = fields[0];
      const counterparty = fields[1];
      const note = fields[2];
      const createTime = fields[3];
      let amountStr = String(fields[5] || fields[4] || '0').replace(/[^\d.-]/g, '');
      
      if ((!createTime && !amountStr) || !amountStr) continue;
      
      const amount = Math.abs(parseFloat(amountStr) || 0);
      if (amount === 0) continue;
      
      // 判断收入/支出（支付宝：正数是支出，负数是收入）
      let transactionType = 'expense';
      if (parseFloat(amountStr) < 0) {
        transactionType = 'income';
      }
      
      // 解析日期
      let date;
      try {
        date = new Date((createTime || fields[4] || '').replace(/\//g, '-'));
      } catch (e) {
        date = new Date();
      }
      
      const transaction = new Transaction({
        userId,
        type: transactionType,
        amount,
        category: getCategory(note, transactionType),
        note: counterparty ? `${counterparty} - ${note}` : note,
        date
      });
      
      transactions.push(transaction);
      importedCount++;
    }
    
    if (transactions.length > 0) {
      await Transaction.insertMany(transactions);
      
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
      message: `成功导入 ${importedCount} 笔交易`,
      count: importedCount
    };
  } catch (error) {
    console.error('导入支付宝账单错误:', error);
    ctx.status = 500;
    ctx.body = { message: '导入失败', error: error.message };
  }
});

// 删除单笔交易
router.delete('/:id', async (ctx) => {
  try {
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    const transaction = await Transaction.findOneAndDelete({ 
      _id: ctx.params.id, 
      userId 
    });
    
    if (!transaction) {
      ctx.status = 404;
      ctx.body = { message: '交易记录不存在' };
      return;
    }
    
    ctx.body = { message: '删除成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '删除失败', error: error.message };
  }
});

// 批量删除交易
router.post('/batch-delete', async (ctx) => {
  try {
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    const { ids } = ctx.request.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      ctx.status = 400;
      ctx.body = { message: '请提供要删除的记录ID' };
      return;
    }
    
    const result = await Transaction.deleteMany({
      _id: { $in: ids },
      userId
    });
    
    ctx.body = { 
      message: `成功删除 ${result.deletedCount} 笔记录`,
      count: result.deletedCount
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '删除失败', error: error.message };
  }
});

// 更新交易记录
router.put('/:id', async (ctx) => {
  try {
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    const { type, amount, category, note, date } = ctx.request.body;
    
    const transaction = await Transaction.findOne({ _id: ctx.params.id, userId });
    
    if (!transaction) {
      ctx.status = 404;
      ctx.body = { message: '交易记录不存在' };
      return;
    }
    
    if (type) transaction.type = type;
    if (amount) transaction.amount = parseFloat(amount);
    if (category) transaction.category = category;
    if (note !== undefined) transaction.note = note;
    if (date) transaction.date = new Date(date);
    
    await transaction.save();
    
    ctx.body = { message: '更新成功', transaction };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '更新失败', error: error.message };
  }
});

module.exports = router;
