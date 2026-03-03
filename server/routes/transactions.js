const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const { JWT_SECRET } = require('../middleware/jwt');

const router = new Router();

// 用户鉴权中间件
// 浮点计算工具函数
const precisionAdd = (...nums) => nums.reduce((sum, num) => sum + num, 0);
const precisionSub = (a, b) => a - b;
const precisionMul = (a, b) => a * b;
const precisionDiv = (a, b) => b === 0 ? 0 : a / b;

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

// 获取记账列表
router.get('/', async (ctx) => {
  try {
    const { page = 1, pageSize = 20, type, category, startDate, endDate, keyword } = ctx.query;
    const userId = ctx.state.userId;
    
    const query = { userId };
    
    // 类型筛选
    if (type) {
      query.type = type;
    }
    
    // 分类筛选
    if (category) {
      query.category = category;
    }
    
    // 日期范围筛选
    if (startDate || endDate) {
      query.date = {};
      if (startDate) query.date.$gte = new Date(startDate);
      if (endDate) query.date.$lte = new Date(endDate);
    }
    
    // 关键词搜索（备注）
    if (keyword) {
      query.note = { $regex: keyword, $options: 'i' };
    }
    
    const total = await Transaction.countDocuments(query);
    const transactions = await Transaction.find(query)
      .sort({ date: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    ctx.body = {
      transactions,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize),
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取记账记录失败', error: error.message };
  }
});

// 添加记账
router.post('/', async (ctx) => {
  try {
    const { type, amount, category, note, date } = ctx.request.body;
    const userId = ctx.state.userId;
    
    if (!type || !amount || !category) {
      ctx.status = 400;
      ctx.body = { message: '缺少必要参数' };
      return;
    }
    
    const transaction = new Transaction({
      userId,
      type,
      amount: parseFloat(amount),
      category,
      note: note || '',
      date: date ? new Date(date) : new Date()
    });
    
    await transaction.save();
    
    ctx.status = 201;
    ctx.body = { message: '记账成功', transaction };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '记账失败', error: error.message };
  }
});

// 更新记账
router.put('/:id', async (ctx) => {
  try {
    const { type, amount, category, note, date } = ctx.request.body;
    const userId = ctx.state.userId;
    
    const transaction = await Transaction.findOne({ _id: ctx.params.id, userId });
    
    if (!transaction) {
      ctx.status = 404;
      ctx.body = { message: '记录不存在' };
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

// 删除记账
router.delete('/:id', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    
    const transaction = await Transaction.findOneAndDelete({ _id: ctx.params.id, userId });
    
    if (!transaction) {
      ctx.status = 404;
      ctx.body = { message: '记录不存在' };
      return;
    }
    
    ctx.body = { message: '删除成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '删除失败', error: error.message };
  }
});

// 获取统计数据
router.get('/statistics', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const { startDate, endDate, type } = ctx.query;
    
    const match = { userId: new mongoose.Types.ObjectId(userId) };
    if (type) {
      match.type = type;
    }
    if (startDate || endDate) {
      match.date = {};
      if (startDate) match.date.$gte = new Date(startDate);
      if (endDate) match.date.$lte = new Date(endDate);
    }
    
    // 按类型统计
    const stats = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    // 按分类统计
    const categoryStats = await Transaction.aggregate([
      { $match: match },
      {
        $group: {
          _id: { type: '$type', category: '$category' },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { total: -1 } }
    ]);
    
    // 格式化返回数据
    const result = {
      income: { total: 0, count: 0 },
      expense: { total: 0, count: 0 },
      balance: 0,
      byCategory: {}
    };
    
    stats.forEach(s => {
      if (s._id === 'income') {
        result.income = { total: s.total, count: s.count };
      } else if (s._id === 'expense') {
        result.expense = { total: s.total, count: s.count };
      }
    });
    
    result.balance = result.income.total - result.expense.total;
    
    // 分类详情
    categoryStats.forEach(s => {
      const type = s._id.type;
      const category = s._id.category;
      if (!result.byCategory[type]) {
        result.byCategory[type] = [];
      }
      result.byCategory[type].push({
        category,
        total: s.total,
        count: s.count
      });
    });
    
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取统计数据失败', error: error.message };
  }
});

// 获取本月统计
router.get('/month-stats', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    
    const stats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const result = {
      income: 0,
      expense: 0,
      balance: 0
    };
    
    stats.forEach(s => {
      if (s._id === 'income') result.income = s.total;
      else if (s._id === 'expense') result.expense = s.total;
    });
    
    result.balance = precisionSub(result.income, result.expense);
    
    // 获取上月数据用于对比
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59);
    
    const lastMonthStats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: lastMonthStart, $lte: lastMonthEnd }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    let lastMonthIncome = 0, lastMonthExpense = 0;
    lastMonthStats.forEach(s => {
      if (s._id === 'income') lastMonthIncome = s.total;
      else if (s._id === 'expense') lastMonthExpense = s.total;
    });
    
    result.lastMonthIncome = lastMonthIncome;
    result.lastMonthExpense = lastMonthExpense;
    // 计算环比变化，如果上月没有数据则显示为null（前端显示--）
    result.incomeChange = lastMonthIncome > 0 
      ? Math.round(precisionMul(precisionDiv(precisionSub(result.income, lastMonthIncome), lastMonthIncome), 100)) 
      : (lastMonthIncome === 0 && result.income > 0 ? 100 : null);
    result.expenseChange = lastMonthExpense > 0 
      ? Math.round(precisionMul(precisionDiv(precisionSub(result.expense, lastMonthExpense), lastMonthExpense), 100)) 
      : (lastMonthExpense === 0 && result.expense > 0 ? 100 : null);
    
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取月度统计失败', error: error.message };
  }
});

// 获取每日消费数据（用于柱状图）
router.get('/daily-stats', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const { range = 'month' } = ctx.query;
    
    const now = new Date();
    let startDate, endDate;
    
    if (range === 'week') {
      startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
      endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
    } else if (range === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1);
      endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
    } else {
      // 默认本月
      startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }
    
    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$date' }
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    // 转换为日期 -> 金额 的映射
    const dataMap = {};
    dailyStats.forEach(item => {
      dataMap[item._id] = item.total;
    });
    
    // 生成日期范围内的所有日期
    const result = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        amount: dataMap[dateStr] || 0
      });
      current.setDate(current.getDate() + 1);
    }
    
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取每日数据失败', error: error.message };
  }
});

module.exports = router;
