const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Transaction = require('../models/Transaction');
const Category = require('../models/Category');
const { JWT_SECRET } = require('../middleware/jwt');

const router = new Router();

// 用户鉴权中间件
// 浮点计算工具函数
const precisionAdd = (...nums) => nums.reduce((sum, num) => sum + num, 0);
const precisionSub = (a, b) => a - b;
const precisionMul = (a, b) => a * b;
const precisionDiv = (a, b) => b === 0 ? 0 : a / b;

// 验证分类与收支类型是否匹配
async function validateCategoryType(categoryName, txType) {
  const cat = await Category.findOne({ name: categoryName });
  if (!cat) return null; // 未在分类表中找到，不阻止
  return cat.type === txType ? null : cat.type;
}

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
    const rawBody = ctx.request.body;
    const { type, amount, category, note, date, items } = rawBody || {};
    const userId = ctx.state.userId;

    // 批量添加（来自记一笔面板）
    if (items && Array.isArray(items) && items.length > 0) {
      const transactionsToSave = [];
      const parsedDate = date ? new Date(date) : new Date();

      for (const item of items) {
        const { category: cat, amount: amt, note: itemNote, type: itemType } = item;
        if (!cat || !amt) continue;
        // 每个条目用自己的 type，不再统一用外层 type
        const txType = itemType || type || 'expense';
        const mismatchedType = await validateCategoryType(cat, txType);
        if (mismatchedType !== null) continue;
        transactionsToSave.push(new Transaction({
          userId,
          type: txType,
          amount: parseFloat(amt),
          category: cat,
          note: itemNote || '',
          date: parsedDate
        }));
      }

      if (transactionsToSave.length === 0) {
        ctx.status = 400;
        ctx.body = { message: '没有可添加的记录（条目可能缺少金额或分类类型不匹配）' };
        return;
      }

      await Transaction.insertMany(transactionsToSave);

      // 只要有支出就检查预算预警
      if (transactionsToSave.some(t => t.type === 'expense')) {
        await checkAndCreateBudgetAlert(userId);
      }

      ctx.status = 201;
      ctx.body = { message: `成功添加 ${transactionsToSave.length} 笔记录`, count: transactionsToSave.length };
      return;
    }

    // 单条添加（兼容原有逻辑）
    if (!type || !amount || !category) {
      ctx.status = 400;
      ctx.body = { message: `缺少必要参数：${!type ? 'type ' : ''}${!amount ? 'amount ' : ''}${!category ? 'category' : ''}` };
      return;
    }

    const mismatchedType = await validateCategoryType(category, type);
    if (mismatchedType !== null) {
      ctx.status = 400;
      ctx.body = { message: `「${category}」属于${mismatchedType === 'income' ? '收入' : '支出'}分类，不能用于${type === 'income' ? '收入' : '支出'}记录` };
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

    if (type === 'expense') {
      await checkAndCreateBudgetAlert(userId);
    }

    ctx.status = 201;
    ctx.body = { message: '记账成功', transaction };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '记账失败', error: error.message };
  }
});

// 检查并创建预算预警
async function checkAndCreateBudgetAlert(userId) {
  try {
    const UserConfig = require('../models/UserConfig');
    const Notification = require('../models/Notification');
    
    // 获取用户配置
    const config = await UserConfig.findOne({ userId });
    if (!config || !config.notification?.budgetAlert) {
      return;
    }
    
    const budget = config.budget?.monthly || 5000;
    const threshold = config.budget?.alertThreshold || 80;
    
    // 获取本月支出
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    const expenseResult = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          type: 'expense',
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    
    const spent = expenseResult[0]?.total || 0;
    const usageRate = (spent / budget * 100);
    
    // 检查是否超过预警阈值
    if (usageRate >= threshold) {
      // 检查今天是否已经发送过预警
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const existingAlert = await Notification.findOne({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'budget_alert',
        createdAt: { $gte: today }
      });
      
      if (!existingAlert) {
        // 创建预警通知
        const notification = new Notification({
          userId: new mongoose.Types.ObjectId(userId),
          type: 'budget_alert',
          title: '预算预警提醒',
          content: `您本月的支出已达到预算的 ${usageRate.toFixed(1)}%（¥${spent.toFixed(2)} / ¥${budget.toFixed(2)}），请注意控制消费。`,
          data: {
            budget,
            spent,
            usageRate: usageRate.toFixed(2)
          }
        });
        
        await notification.save();
      }
    }
  } catch (error) {
    console.error('检查预算预警失败:', error);
  }
}

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
    
    if (type) {
      // 验证分类类型是否匹配
      const catToCheck = category || transaction.category;
      const mismatchedType = await validateCategoryType(catToCheck, type);
      if (mismatchedType !== null) {
        ctx.status = 400;
        ctx.body = { message: `「${catToCheck}」属于${mismatchedType === 'income' ? '收入' : '支出'}分类，不能用于${type === 'income' ? '收入' : '支出'}记录` };
        return;
      }
      transaction.type = type;
    }
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
      if (endDate) {
        // 如果结束日期是月初(年份边界)，用 $lt 包含完整的上个月
        if (endDate.endsWith('-01')) {
          match.date.$lt = new Date(endDate);
        } else {
          match.date.$lte = new Date(endDate);
        }
      }
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
    const { range = 'month', startDate: startDateStr, endDate: endDateStr } = ctx.query;

    let startDate, endDate;

    // 优先使用传入的日期范围
    if (startDateStr && endDateStr) {
      startDate = new Date(startDateStr);
      endDate = new Date(endDateStr);
      endDate.setHours(23, 59, 59, 999);
    } else {
      const now = new Date();
      if (range === 'week') {
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 6);
        endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      } else if (range === 'year') {
        startDate = new Date(now.getFullYear(), 0, 1);
        endDate = new Date(now.getFullYear(), 11, 31, 23, 59, 59);
      } else {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
      }
    }

    const dailyStats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startDate, $lte: endDate }
        }
      },
      {
        $group: {
          _id: {
            date: { $dateToString: { format: '%Y-%m-%d', date: '$date' } },
            type: '$type'
          },
          total: { $sum: '$amount' }
        }
      },
      { $sort: { '_id.date': 1 } }
    ]);

    // 转换为日期 -> { amount, income } 的映射
    const dataMap = {};
    dailyStats.forEach(item => {
      const date = item._id.date;
      if (!dataMap[date]) dataMap[date] = { amount: 0, income: 0 };
      if (item._id.type === 'expense') dataMap[date].amount = item.total;
      else if (item._id.type === 'income') dataMap[date].income = item.total;
    });

    // 生成日期范围内的所有日期
    const result = [];
    const current = new Date(startDate);
    while (current <= endDate) {
      const dateStr = current.toISOString().split('T')[0];
      result.push({
        date: dateStr,
        amount: dataMap[dateStr]?.amount || 0,
        income: dataMap[dateStr]?.income || 0
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
