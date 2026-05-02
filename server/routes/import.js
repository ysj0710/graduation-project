const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Account = require('../models/Account');
const Category = require('../models/Category');
const XLSX = require('xlsx');

const JWT_SECRET = 'your-secret-key-change-in-production';

const router = new Router();

// 缓存分类列表（按类型分组：name -> name）
let categoryCache = null;
let categoryCacheTime = 0;
const CACHE_TTL = 5 * 60 * 1000; // 5分钟

async function getCategoryNames(type) {
  const now = Date.now();
  if (!categoryCache || now - categoryCacheTime > CACHE_TTL) {
    const cats = await Category.find({}).lean();
    categoryCache = {
      income: cats.filter(c => c.type === 'income').map(c => c.name),
      expense: cats.filter(c => c.type === 'expense').map(c => c.name)
    };
    categoryCacheTime = now;
  }
  return categoryCache[type] || [];
}

// 根据关键词判断分类（优先匹配管理员预设分类名，fallback 到语义识别）
async function matchCategory(text, type = 'expense') {
  if (!text) return '其他';
  const n = text.toLowerCase();

  // 优先精确匹配管理员分类名（支持对方/商户 + 商品描述双重匹配）
  const names = await getCategoryNames(type);
  for (const name of names) {
    if (n.includes(name) || text.includes(name)) return name;
  }

  // 语义识别回退
  const rules = type === 'income'
    ? [
        { k: ['工资', '退款', '转账', '收入', '还款', '红包'], v: '工资' },
        { k: ['奖金', '绩效', '年终奖'], v: '奖金' },
        { k: ['理财', '利息', '投资收益'], v: '理财' },
        { k: ['兼职', '外快'], v: '兼职' }
      ]
    : [
        { k: ['餐饮', '美食', '外卖', '快餐', '小吃', '烧烤', '火锅', '餐馆', '饭店', '餐厅', '面馆', '饭店'], v: '餐饮' },
        { k: ['交通', '打车', '滴滴', '地铁', '公交', '停车', '高速', '加油', '顺风车', '出租车', '打车'], v: '交通' },
        { k: ['购物', '商城', '淘宝', '京东', '拼多多', '天猫', '外卖'], v: '购物' },
        { k: ['话费', '充值', '流量'], v: '充值' },
        { k: ['水电', '物业', '燃气', '电费', '水费', '暖气', '宽带'], v: '生活缴费' },
        { k: ['电影', '视频', '会员', '音乐', '游戏', '腾讯', '王者荣耀'], v: '娱乐' },
        { k: ['医疗', '药店', '看病', '药房', '医院'], v: '医疗' },
        { k: ['保险'], v: '保险' },
        { k: ['房租', '租金'], v: '住房' },
        { k: ['学费', '培训', '教育', '课程'], v: '教育' },
        { k: ['通讯', '话费'], v: '通讯' },
        { k: ['美团', '大众点评', '携程', '酒店'], v: '购物' }
      ];

  for (const rule of rules) {
    for (const kw of rule.k) {
      if (n.includes(kw)) return rule.v;
    }
  }

  // 最后兜底：尝试从已知分类名模糊匹配
  for (const name of names) {
    if (n.includes(name.charAt(0))) return name;
  }

  return '其他';
}

// 用户鉴权中间件
const requireAuth = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (!token) { ctx.status = 401; ctx.body = { message: '未授权' }; return; }
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ctx.state.userId = decoded.id;
    await next();
  } catch (error) { ctx.status = 401; ctx.body = { message: '无效的令牌' }; }
};

router.use(requireAuth);

// 解析CSV行（处理引号）
function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') { inQuotes = !inQuotes; }
    else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
    else { current += char; }
  }
  result.push(current.trim());
  return result;
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

// Excel 日期序列号转 JS Date
function excelDateToJSDate(val) {
  if (typeof val === 'number') {
    const ms = (val - 25569) * 86400 * 1000;
    return new Date(ms);
  }
  return new Date(val);
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

    // 微信xlsx：找到表头行 "交易时间"（行17），数据从下一行开始
    let headerIndex = -1;
    for (let i = 0; i < Math.min(data.length, 30); i++) {
      const row = data[i];
      if (row && row.some && row.some(cell => String(cell || '').includes('交易时间'))) {
        headerIndex = i;
        break;
      }
    }
    const startIndex = headerIndex >= 0 ? headerIndex + 1 : 1;

    // 根据表头确定各字段列位置
    let colIndex = { date: 0, type: 1, counterparty: 2, note: 3, incomeExpense: 4, amount: 5 };
    if (headerIndex >= 0) {
      const headerRow = data[headerIndex];
      headerRow.forEach((h, idx) => {
        const hStr = String(h || '');
        if (hStr.includes('交易时间')) colIndex.date = idx;
        else if (hStr.includes('交易类型')) colIndex.type = idx;
        else if (hStr.includes('交易对方')) colIndex.counterparty = idx;
        else if (hStr.includes('商品')) colIndex.note = idx;
        else if (hStr.includes('收/支')) colIndex.incomeExpense = idx;
        else if (hStr.includes('金额')) colIndex.amount = idx;
      });
    }

    const transactions = [];
    let importedCount = 0;

    console.log('微信账单解析，数据条数:', data.length, '起始行:', startIndex);
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 5) continue;

      let fields = Array.isArray(row) ? row : Object.values(row);
      fields = fields.map(f => String(f ?? '').trim());

      // 金额字段：优先用表头定位，否则找数字列
      let amountStr = '';
      if (colIndex.amount < fields.length) {
        amountStr = String(fields[colIndex.amount] || '').replace(/[^\d.-]/g, '');
      }
      if (!amountStr || isNaN(parseFloat(amountStr))) {
        for (let j = 4; j < Math.min(fields.length, 10); j++) {
          const val = String(fields[j] || '').replace(/[^\d.-]/g, '');
          if (val && !isNaN(parseFloat(val))) { amountStr = val; break; }
        }
      }

      // 日期字段：可能是 Excel 序列号（数字）
      let date;
      const dateVal = fields[colIndex.date] || '';
      if (!isNaN(parseFloat(dateVal))) {
        date = excelDateToJSDate(parseFloat(dateVal));
      } else {
        try {
          date = new Date(dateVal.replace(/\//g, '-'));
          if (isNaN(date.getTime())) date = new Date();
        } catch (e) {
          date = new Date();
        }
      }

      if (!amountStr) continue;
      const amount = Math.abs(parseFloat(amountStr) || 0);
      if (amount === 0) continue;

      // 收/支判断
      let transactionType = 'expense';
      const incomeExpense = fields[colIndex.incomeExpense] || '';
      if (incomeExpense.includes('收入')) {
        transactionType = 'income';
      } else if (incomeExpense.includes('支出')) {
        transactionType = 'expense';
      }
      const fullNote = (fields[colIndex.note] || '') + ' ' + (fields[colIndex.counterparty] || '');
      if (fullNote.includes('二维码') || fullNote.includes('收款码') || fullNote.includes('收款')) {
        transactionType = 'expense';
      }

      const transaction = new Transaction({
        userId,
        type: transactionType,
        amount,
        category: await matchCategory(
          [fields[colIndex.note], fields[colIndex.counterparty]].filter(Boolean).join(' '),
          transactionType
        ),
        note: fields[colIndex.counterparty] ? `${fields[colIndex.counterparty]} - ${fields[colIndex.note]}` : fields[colIndex.note],
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
    
    // 支付宝CSV可能需要处理编码
    // 尝试找到表头行
    let headerIndex = -1;
    for (let i = 0; i < Math.min(data.length, 30); i++) {
      const row = data[i];
      if (row && row.some(cell => String(cell || '').includes('交易时间'))) {
        headerIndex = i;
        break;
      }
    }
    
    const startIndex = headerIndex >= 0 ? headerIndex + 1 : 1;
    
    const transactions = [];
    let importedCount = 0;
    
    // 支付宝格式：交易时间,交易分类,交易对方,对方账号,商品说明,收/支,金额,...
    for (let i = startIndex; i < data.length; i++) {
      const row = data[i];
      if (!row || row.length < 7) continue;
      
      let fields = Array.isArray(row) ? row : Object.values(row);
      fields = fields.map(f => String(f || '').trim());
      
      const dateStr = fields[0];
      const category = fields[1];
      const counterparty = fields[2];
      const note = fields[4];
      const incomeExpense = fields[5]; // 收/支字段
      let amountStr = String(fields[6] || '').replace(/[^\d.-]/g, '');
      
      if (!dateStr || !amountStr) continue;
      
      const amount = Math.abs(parseFloat(amountStr) || 0);
      if (amount === 0) continue;
      
      // 判断收入/支出（根据收/支字段）
      let transactionType = 'expense';
      if (incomeExpense && incomeExpense.includes('收入')) {
        transactionType = 'income';
      } else if (incomeExpense && incomeExpense.includes('支出')) {
        transactionType = 'expense';
      }
      
      // 解析日期
      let date;
      try {
        date = new Date((dateStr || '').replace(/\//g, '-'));
        if (isNaN(date.getTime())) date = new Date();
      } catch (e) {
        date = new Date();
      }

      const transaction = new Transaction({
        userId,
        type: transactionType,
        amount,
        category: await matchCategory(
          [fields[4], counterparty].filter(Boolean).join(' '),
          transactionType
        ),
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
