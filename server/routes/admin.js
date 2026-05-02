const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const UserConfig = require('../models/UserConfig');
const Notification = require('../models/Notification');
const SystemSettings = require('../models/SystemSettings');
const Category = require('../models/Category');
const MessageTemplate = require('../models/MessageTemplate');
const OperationLog = require('../models/OperationLog');
const { JWT_SECRET } = require('../middleware/jwt');
const { 
  calculateRiskFactors, 
  getRiskLevel, 
  getRiskLabel 
} = require('../utils/riskCalculator');

const router = new Router();

// 管理员中间件
const requireAdmin = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  if (!token) {
    ctx.status = 401;
    ctx.body = { message: '未授权' };
    return;
  }
  
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.role !== 'admin') {
      ctx.status = 403;
      ctx.body = { message: '权限不足' };
      return;
    }
    ctx.state.adminUser = user;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: '无效的令牌' };
  }
};

// 应用管理员中间件
router.use(requireAdmin);

// ==================== 统计数据API ====================

// 获取管理员仪表盘统计数据
router.get('/dashboard-stats', async (ctx) => {
  try {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    // 并行查询所有统计数据
    const [totalUsers, newUsersToday, activeUsers, monthlyTransactions, monthlyAmount, riskStats] = await Promise.all([
      User.countDocuments({ role: 'user' }),
      User.countDocuments({ role: 'user', createdAt: { $gte: startOfToday } }),
      User.countDocuments({ role: 'user', updatedAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) } }),
      Transaction.countDocuments({ date: { $gte: startOfMonth, $lte: endOfMonth } }),
      Transaction.aggregate([
        { $match: { date: { $gte: startOfMonth, $lte: endOfMonth } } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      calculateRiskUsers()
    ]);
    
    const monthlyTotal = monthlyAmount[0]?.total || 0;
    
    ctx.body = {
      totalUsers,
      newUsersToday,
      activeUsers,
      monthlyTransactions,
      monthlyTotal,
      highRiskUsers: riskStats.highRiskCount,
      mediumRiskUsers: riskStats.mediumRiskCount,
      lowRiskUsers: riskStats.lowRiskCount
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取统计数据失败', error: error.message };
  }
});

// 获取消费趋势数据（用于图表）- 优化为单次聚合
router.get('/trend-data', async (ctx) => {
  try {
    const { months = 6, year } = ctx.query;
    const now = new Date();
    const targetYear = year ? parseInt(year) : now.getFullYear();

    let startDate, endDate;
    if (year) {
      startDate = new Date(targetYear, 0, 1);
      endDate = new Date(targetYear, 11, 31, 23, 59, 59);
    } else {
      const startMonth = new Date(now.getFullYear(), now.getMonth() - parseInt(months) + 1, 1);
      startDate = startMonth;
      endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59);
    }

    // 单次聚合按月分组
    const monthlyStats = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: {
            year: { $year: '$date' },
            month: { $month: '$date' },
            type: '$type'
          },
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    // 构建月份映射
    const monthMap = {};
    monthlyStats.forEach(s => {
      const key = `${s._id.year}-${s._id.month}`;
      if (!monthMap[key]) monthMap[key] = { income: 0, expense: 0 };
      if (s._id.type === 'income') monthMap[key].income = s.total;
      else if (s._id.type === 'expense') monthMap[key].expense = s.total;
    });

    // 生成结果数组
    const result = [];
    if (year) {
      for (let m = 1; m <= 12; m++) {
        const key = `${targetYear}-${m}`;
        const data = monthMap[key] || { income: 0, expense: 0 };
        result.push({
          month: `${targetYear}年${m}月`,
          monthIndex: m - 1,
          income: data.income,
          expense: data.expense,
          balance: data.income - data.expense
        });
      }
    } else {
      for (let i = parseInt(months) - 1; i >= 0; i--) {
        const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
        const key = `${d.getFullYear()}-${d.getMonth() + 1}`;
        const data = monthMap[key] || { income: 0, expense: 0 };
        result.push({
          month: `${d.getFullYear()}年${d.getMonth() + 1}月`,
          monthIndex: d.getMonth(),
          income: data.income,
          expense: data.expense,
          balance: data.income - data.expense
        });
      }
    }

    // 计算环比增长率
    for (let i = 0; i < result.length; i++) {
      if (i === 0) {
        result[i].expenseGrowth = null;
        result[i].incomeGrowth = null;
      } else {
        const prev = result[i - 1];
        const prevTotal = prev.income + prev.expense;
        if (prevTotal > 0) {
          result[i].expenseGrowth = parseFloat(((result[i].expense - prev.expense) / prev.expense * 100).toFixed(1));
          result[i].incomeGrowth = parseFloat(((result[i].income - prev.income) / prev.income * 100).toFixed(1));
        } else {
          result[i].expenseGrowth = null;
          result[i].incomeGrowth = null;
        }
      }
    }

    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取趋势数据失败', error: error.message };
  }
});

// 获取风险用户列表（优化：批量查询替代 N+1）
router.get('/risk-users', async (ctx) => {
  try {
    const { page = 1, pageSize = 10, level = 'all' } = ctx.query;

    let query = {};
    if (level !== 'all') {
      query['financialHealth.riskLevel'] = level;
    }

    const [configs, total] = await Promise.all([
      UserConfig.find(query)
        .populate('userId', 'username nickname email createdAt')
        .skip((page - 1) * pageSize)
        .limit(parseInt(pageSize))
        .lean(),
      UserConfig.countDocuments(query)
    ]);

    // 批量获取本月支出
    const userIds = configs.filter(c => c.userId).map(c => c.userId._id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const monthlyExpenses = await Transaction.aggregate([
      { $match: { userId: { $in: userIds }, type: 'expense', date: { $gte: startOfMonth } } },
      { $group: { _id: '$userId', total: { $sum: '$amount' } } }
    ]);

    const expenseMap = {};
    monthlyExpenses.forEach(e => { expenseMap[e._id.toString()] = e.total; });

    const riskUsers = configs
      .filter(config => config.userId)
      .map(config => {
        const user = config.userId;
        const spent = expenseMap[user._id.toString()] || 0;
        const budget = config.budget?.monthly || 5000;
        const usageRate = budget > 0 ? (spent / budget * 100) : 0;

        return {
          id: user._id,
          name: user.nickname || user.username,
          email: user.email,
          budget,
          spent,
          usageRate: usageRate.toFixed(1),
          riskLevel: config.financialHealth?.riskLevel || 'low',
          riskScore: config.financialHealth?.score || 100,
          riskLabel: getRiskLabel(config.financialHealth?.riskLevel || 'low'),
          createdAt: user.createdAt
        };
      })
      .sort((a, b) => {
        const riskOrder = { high: 0, medium: 1, low: 2 };
        return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
      });

    ctx.body = {
      users: riskUsers,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取风险用户失败', error: error.message };
  }
});

// 获取各风险等级用户数量（优化：直接聚合查询）
router.get('/risk-counts', async (ctx) => {
  try {
    const riskStats = await calculateRiskUsers();
    ctx.body = { high: riskStats.highRiskCount, medium: riskStats.mediumRiskCount, low: riskStats.lowRiskCount };
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: '获取风险统计失败', error: error.message }
  }
})

// 获取指定风险等级的全部用户（不过分页，用于批量操作）
router.get('/risk-users-all', async (ctx) => {
  try {
    const { level } = ctx.query
    if (!level || level === 'all') {
      ctx.status = 400
      ctx.body = { message: '请指定风险等级（high/medium/low）' }
      return
    }

    const configs = await UserConfig.find({ 'financialHealth.riskLevel': level })
      .populate('userId', 'username nickname email')

    const users = configs
      .filter(c => c.userId)
      .map(c => ({
        _id: c.userId._id,
        name: c.userId.nickname || c.userId.username,
        email: c.userId.email
      }))

    ctx.body = { users }
  } catch (error) {
    ctx.status = 500
    ctx.body = { message: '获取用户列表失败', error: error.message }
  }
})

// 获取风险分布数据（用于饼图）
router.get('/risk-distribution', async (ctx) => {
  try {
    const distribution = await UserConfig.aggregate([
      {
        $group: {
          _id: '$financialHealth.riskLevel',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const result = {
      low: 0,
      medium: 0,
      high: 0
    };
    
    distribution.forEach(d => {
      if (d._id) {
        result[d._id] = d.count;
      }
    });
    
    ctx.body = {
      distribution: result,
      total: await UserConfig.countDocuments()
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取风险分布失败', error: error.message };
  }
});

// 发送提醒给风险用户
router.post('/send-alert', async (ctx) => {
  try {
    const { userId, message, type = 'risk_warning' } = ctx.request.body;
    
    if (!userId || !message) {
      ctx.status = 400;
      ctx.body = { message: '请提供用户ID和消息内容' };
      return;
    }
    
    // 创建通知
    const notification = new Notification({
      userId,
      type,
      title: '财务风险提醒',
      content: message,
      data: { sentBy: ctx.state.adminUser._id }
    });
    
    await notification.save();
    
    ctx.body = { message: '提醒发送成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '发送提醒失败', error: error.message };
  }
});

// 批量发送提醒
router.post('/batch-alert', async (ctx) => {
  try {
    const { userIds, message, type = 'risk_warning' } = ctx.request.body;
    
    if (!userIds || !Array.isArray(userIds) || userIds.length === 0 || !message) {
      ctx.status = 400;
      ctx.body = { message: '请提供用户ID列表和消息内容' };
      return;
    }
    
    // 批量创建通知
    const notifications = userIds.map(userId => ({
      userId,
      type,
      title: '财务风险提醒',
      content: message,
      data: { sentBy: ctx.state.adminUser._id },
      createdAt: new Date()
    }));
    
    await Notification.insertMany(notifications);
    
    ctx.body = { message: `成功发送提醒给 ${userIds.length} 位用户` };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '批量发送失败', error: error.message };
  }
});

// ==================== 用户管理API ====================

// 获取统计数据（优化：并行查询）
router.get('/statistics', async (ctx) => {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const [totalUsers, activeUsers, newUsersToday, riskStats] = await Promise.all([
      User.countDocuments(),
      User.countDocuments({ isActive: { $ne: false } }),
      User.countDocuments({ createdAt: { $gte: today } }),
      calculateRiskUsers()
    ]);

    ctx.body = {
      totalUsers,
      activeUsers,
      riskUsers: riskStats.highRiskCount + riskStats.mediumRiskCount,
      newUsersToday
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取统计数据失败' };
  }
});

// 获取用户列表（优化：批量查询替代 N+1）
router.get('/users', async (ctx) => {
  try {
    const { page = 1, pageSize = 10, search = '', status = '' } = ctx.query;

    const query = { role: { $ne: 'admin' } };

    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'normal') {
      query.isActive = { $ne: false };
    }

    const [total, users] = await Promise.all([
      User.countDocuments(query),
      User.find(query)
        .select('-password')
        .sort({ createdAt: -1 })
        .skip((page - 1) * pageSize)
        .limit(parseInt(pageSize))
        .lean()
    ]);

    // 批量获取用户配置和本月支出
    const userIds = users.map(u => u._id);
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [configs, monthlyExpenses] = await Promise.all([
      UserConfig.find({ userId: { $in: userIds } }).lean(),
      Transaction.aggregate([
        { $match: { userId: { $in: userIds }, type: 'expense', date: { $gte: startOfMonth } } },
        { $group: { _id: '$userId', total: { $sum: '$amount' } } }
      ])
    ]);

    // 构建映射
    const configMap = {};
    configs.forEach(c => { configMap[c.userId.toString()] = c; });
    const expenseMap = {};
    monthlyExpenses.forEach(e => { expenseMap[e._id.toString()] = e.total; });

    const usersWithConfig = users.map(user => ({
      ...user,
      config: configMap[user._id.toString()] || {},
      monthlySpent: expenseMap[user._id.toString()] || 0,
      yearlyBudget: configMap[user._id.toString()]?.budget?.yearly || 60000
    }));

    ctx.body = {
      users: usersWithConfig,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取用户列表失败' };
  }
});

// 获取单个用户
router.get('/users/:id', async (ctx) => {
  try {
    const user = await User.findById(ctx.params.id).select('-password');
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }
    
    const config = await UserConfig.findOne({ userId: user._id });
    
    ctx.body = {
      ...user.toObject(),
      config: config || {}
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取用户失败' };
  }
});

// 新增用户
router.post('/users', async (ctx) => {
  try {
    const { username, password, email, role = 'user' } = ctx.request.body;
    
    // 检查用户名是否存在
    const existingUser = await User.findOne({ username });
    if (existingUser) {
      ctx.status = 400;
      ctx.body = { message: '用户名已存在' };
      return;
    }
    
    const bcrypt = require('bcryptjs');
    const hashedPassword = await bcrypt.hash(password, 10);
    
    const user = new User({ 
      username, 
      password: hashedPassword, 
      email, 
      role 
    });
    await user.save();
    
    // 创建用户配置
    await UserConfig.create({ userId: user._id });
    
    ctx.body = { message: '用户创建成功', userId: user._id };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '创建用户失败' };
  }
});

// 更新用户
router.put('/users/:id', async (ctx) => {
  try {
    const { username, email, role, isActive, budget, theme } = ctx.request.body;
    
    const user = await User.findByIdAndUpdate(
      ctx.params.id,
      { username, email, role, isActive, updatedAt: Date.now() },
      { new: true }
    ).select('-password');
    
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }
    
    // 更新用户配置
    if (budget || theme) {
      await UserConfig.findOneAndUpdate(
        { userId: ctx.params.id },
        { 
          ...(budget && { budget }),
          ...(theme && { theme }),
          updatedAt: Date.now()
        },
        { upsert: true }
      );
    }
    
    ctx.body = { message: '用户更新成功', user };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '更新用户失败' };
  }
});

// 删除用户
router.delete('/users/:id', async (ctx) => {
  try {
    const user = await User.findByIdAndDelete(ctx.params.id);
    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }
    
    // 删除相关数据
    await Transaction.deleteMany({ userId: ctx.params.id });
    await UserConfig.deleteOne({ userId: ctx.params.id });
    await Notification.deleteMany({ userId: ctx.params.id });
    
    ctx.body = { message: '用户删除成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '删除用户失败' };
  }
});

// 批量操作
router.post('/users/batch', async (ctx) => {
  try {
    const { type, userIds } = ctx.request.body;
    
    switch (type) {
      case 'delete':
        await User.deleteMany({ _id: { $in: userIds } });
        await Transaction.deleteMany({ userId: { $in: userIds } });
        await UserConfig.deleteMany({ userId: { $in: userIds } });
        await Notification.deleteMany({ userId: { $in: userIds } });
        break;
      case 'activate':
        await User.updateMany({ _id: { $in: userIds } }, { isActive: true });
        break;
      case 'deactivate':
        await User.updateMany({ _id: { $in: userIds } }, { isActive: false });
        break;
      default:
        ctx.status = 400;
        ctx.body = { message: '无效的操作类型' };
        return;
    }
    
    ctx.body = { message: '批量操作成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '批量操作失败' };
  }
});

// ==================== 发送通知记录 ====================

// GET /api/admin/sent-notifications — 分页获取已发送的通知记录
router.get('/sent-notifications', async (ctx) => {
  try {
    const page = parseInt(ctx.query.page) || 1;
    const pageSize = 10;

    // 按 title + content + scope + 秒级时间 去重（忽略毫秒差异）
    const aggregation = await Notification.aggregate([
      { $match: { type: { $in: ['system', 'risk_warning'] } } },
      {
        $group: {
          _id: {
            title: '$title',
            content: '$content',
            scope: { $ifNull: ['$scope', 'all'] },
            // 截取 createdAt 到秒级，避免同一秒内创建的被分开
            createdSec: { $substr: [{ $dateToString: { format: '%Y-%m-%d %H:%M:%S', date: '$createdAt' } }, 0, 19] }
          },
          sentCount: { $sum: 1 }
        }
      },
      { $sort: { '_id.createdSec': -1 } },
      { $facet: {
        data: [
          { $skip: (page - 1) * pageSize },
          { $limit: pageSize }
        ],
        total: [{ $count: 'count' }]
      }}
    ]);

    const logs = aggregation[0].data.map(item => ({
      title: item._id.title,
      content: item._id.content,
      scope: item._id.scope,
      createdAt: item._id.createdSec,
      sentCount: item.sentCount
    }));

    const total = aggregation[0].total[0]?.count || 0;

    ctx.body = {
      logs,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize)
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取发送记录失败', error: error.message };
  }
});

// ==================== 辅助函数 ====================

// 计算风险用户数量（优化：单次聚合查询，不再逐用户更新）
async function calculateRiskUsers() {
  const riskCounts = await UserConfig.aggregate([
    {
      $group: {
        _id: '$financialHealth.riskLevel',
        count: { $sum: 1 }
      }
    }
  ]);

  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;

  riskCounts.forEach(item => {
    if (item._id === 'high') highRiskCount = item.count;
    else if (item._id === 'medium') mediumRiskCount = item.count;
    else lowRiskCount += item.count; // low 或 null 都算低风险
  });

  return { highRiskCount, mediumRiskCount, lowRiskCount };
}

// 更新用户财务健康评分
async function updateUserFinancialHealth(userId) {
  try {
    const config = await UserConfig.findOne({ userId });
    if (!config) return;
    
    const budget = config.budget?.monthly || 5000;
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    
    // 获取本月统计数据
    const monthlyStats = await Transaction.aggregate([
      {
        $match: {
          userId: new mongoose.Types.ObjectId(userId),
          date: { $gte: startOfMonth }
        }
      },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);
    
    const income = monthlyStats.find(s => s._id === 'income')?.total || 0;
    const expense = monthlyStats.find(s => s._id === 'expense')?.total || 0;
    
    // 计算各项风险指标
    const riskFactors = calculateRiskFactors(income, expense, budget, monthlyStats);
    
    // 综合评分（0-100，分数越低风险越高）
    const totalScore = Math.max(0, Math.min(100, 
      riskFactors.budgetScore * 0.4 + 
      riskFactors.balanceScore * 0.3 + 
      riskFactors.frequencyScore * 0.3
    ));
    
    // 确定风险等级
    const riskLevel = getRiskLevel(totalScore);
    
    // 更新配置
    await UserConfig.findOneAndUpdate(
      { userId },
      {
        'financialHealth.score': Math.round(totalScore),
        'financialHealth.riskLevel': riskLevel,
        'financialHealth.lastCalculatedAt': new Date()
      }
    );
    
    return { score: totalScore, riskLevel };
  } catch (error) {
    console.error('计算财务健康评分失败:', error);
    return null;
  }
}

// ==================== 新增统计接口 ====================

// 获取财务统计数据（优化：聚合查询替代全量取回JS处理）
router.get('/finance-stats', async (ctx) => {
  try {
    const { timeRange = 'month', year, month } = ctx.query;
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'year':
        const y = year ? parseInt(year) : now.getFullYear();
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);
        break;
      default:
        const ym = year ? parseInt(year) : now.getFullYear();
        const mm = month ? parseInt(month) : now.getMonth() + 1;
        startDate = new Date(ym, mm - 1, 1);
        endDate = new Date(ym, mm, 0, 23, 59, 59);
    }

    const stats = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      {
        $group: {
          _id: '$type',
          total: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      }
    ]);

    const totalIncome = stats.find(s => s._id === 'income')?.total || 0;
    const totalExpense = stats.find(s => s._id === 'expense')?.total || 0;
    const transactionCount = stats.reduce((sum, s) => sum + s.count, 0);

    ctx.body = {
      success: true,
      stats: {
        totalIncome,
        totalExpense,
        balance: totalIncome - totalExpense,
        transactionCount
      }
    };
  } catch (error) {
    console.error('获取财务统计错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 获取每日趋势数据（优化：聚合查询替代全量取回JS处理）
router.get('/daily-trend', async (ctx) => {
  try {
    let { startDate, endDate, timeRange = 'month', year, month } = ctx.query;
    const now = new Date();

    if (!startDate || !endDate) {
      switch (timeRange) {
        case 'week':
          startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
          endDate = now;
          break;
        case 'year':
          const y = year ? parseInt(year) : now.getFullYear();
          startDate = new Date(y, 0, 1);
          endDate = new Date(y, 11, 31, 23, 59, 59);
          break;
        default:
          const ym = year ? parseInt(year) : now.getFullYear();
          const mm = month ? parseInt(month) : now.getMonth() + 1;
          startDate = new Date(ym, mm - 1, 1);
          endDate = new Date(ym, mm, 0, 23, 59, 59);
      }
    } else {
      startDate = new Date(startDate);
      endDate = new Date(endDate);
    }

    const dailyStats = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
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

    // 转换为日期 -> { income, expense } 的映射
    const dataMap = {};
    dailyStats.forEach(item => {
      const date = item._id.date;
      if (!dataMap[date]) dataMap[date] = { date, income: 0, expense: 0, amount: 0 };
      if (item._id.type === 'expense') {
        dataMap[date].expense = item.total;
        dataMap[date].amount -= item.total;
      } else if (item._id.type === 'income') {
        dataMap[date].income = item.total;
        dataMap[date].amount += item.total;
      }
    });

    const result = Object.values(dataMap).sort((a, b) =>
      new Date(a.date) - new Date(b.date)
    );

    ctx.body = {
      success: true,
      data: result
    };
  } catch (error) {
    console.error('获取每日趋势错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 获取分类明细统计（优化：聚合查询替代全量取回JS处理）
router.get('/category-breakdown', async (ctx) => {
  try {
    const { timeRange = 'month', year, month } = ctx.query;
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'year':
        const y = year ? parseInt(year) : now.getFullYear();
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);
        break;
      default:
        const ym = year ? parseInt(year) : now.getFullYear();
        const mm = month ? parseInt(month) : now.getMonth() + 1;
        startDate = new Date(ym, mm - 1, 1);
        endDate = new Date(ym, mm, 0, 23, 59, 59);
    }

    const [categoryStats, totalResult] = await Promise.all([
      Transaction.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate }, type: 'expense' } },
        {
          $group: {
            _id: '$category',
            count: { $sum: 1 },
            amount: { $sum: '$amount' }
          }
        },
        { $sort: { amount: -1 } }
      ]),
      Transaction.aggregate([
        { $match: { date: { $gte: startDate, $lte: endDate }, type: 'expense' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    const totalExpense = totalResult[0]?.total || 0;

    const categories = categoryStats.map(c => ({
      name: c._id,
      iconId: c._id,
      count: c.count,
      amount: c.amount,
      percent: totalExpense > 0 ? Math.round((c.amount / totalExpense) * 100) : 0,
      color: getCategoryColor(c._id)
    }));

    ctx.body = {
      success: true,
      categories
    };
  } catch (error) {
    console.error('获取分类明细错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 获取分类分析数据（优化：聚合查询替代全量取回JS处理）
router.get('/category-analysis', async (ctx) => {
  try {
    const { timeRange = 'month', year, month, quarter } = ctx.query;
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        endDate = now;
        break;
      case 'quarter':
        const q = quarter ? parseInt(quarter) : Math.floor(now.getMonth() / 3) + 1;
        const qy = year ? parseInt(year) : now.getFullYear();
        startDate = new Date(qy, (q - 1) * 3, 1);
        endDate = new Date(qy, q * 3, 0, 23, 59, 59);
        break;
      case 'year':
        const y = year ? parseInt(year) : now.getFullYear();
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);
        break;
      default:
        const ym = year ? parseInt(year) : now.getFullYear();
        const mm = month ? parseInt(month) : now.getMonth() + 1;
        startDate = new Date(ym, mm - 1, 1);
        endDate = new Date(ym, mm, 0, 23, 59, 59);
    }

    const dateMatch = { date: { $gte: startDate, $lte: endDate } };

    const [expenseStats, incomeStats, totalStats] = await Promise.all([
      Transaction.aggregate([
        { $match: { ...dateMatch, type: 'expense' } },
        { $group: { _id: '$category', value: { $sum: '$amount' } } },
        { $sort: { value: -1 } }
      ]),
      Transaction.aggregate([
        { $match: { ...dateMatch, type: 'income' } },
        { $group: { _id: '$category', value: { $sum: '$amount' } } },
        { $sort: { value: -1 } }
      ]),
      Transaction.aggregate([
        { $match: dateMatch },
        { $group: { _id: '$type', total: { $sum: '$amount' } } }
      ])
    ]);

    const totalExpense = totalStats.find(s => s._id === 'expense')?.total || 0;
    const totalIncome = totalStats.find(s => s._id === 'income')?.total || 0;

    const expensePieData = expenseStats.map(s => ({
      name: s._id,
      value: s.value,
      color: getCategoryColor(s._id),
      percent: totalExpense > 0 ? ((s.value / totalExpense) * 100).toFixed(1) : 0
    }));

    const incomePieData = incomeStats.map(s => ({
      name: s._id,
      value: s.value,
      color: '#10B981',
      percent: totalIncome > 0 ? ((s.value / totalIncome) * 100).toFixed(1) : 0
    }));

    const barData = expensePieData.slice(0, 8).map(item => ({
      category: item.name,
      value: item.value,
      color: item.color
    }));

    ctx.body = {
      success: true,
      expensePieData,
      incomePieData,
      barData,
      totalExpense,
      totalIncome,
      hasData: totalExpense > 0 || totalIncome > 0
    };
  } catch (error) {
    console.error('获取分类分析错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 获取指定用户的消费汇总（支持月/季度/年）
router.get('/user-consumption', async (ctx) => {
  try {
    const { userId, timeRange = 'month', year, month } = ctx.query;
    if (!userId) {
      ctx.status = 400;
      ctx.body = { message: '缺少用户ID' };
      return;
    }

    const now = new Date();
    let startDate, endDate, label;

    switch (timeRange) {
      case 'year':
        const y = year ? parseInt(year) : now.getFullYear();
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);
        label = `${y}年`;
        break;
      case 'quarter':
        const q = Math.floor(now.getMonth() / 3) + 1;
        const qy = year ? parseInt(year) : now.getFullYear();
        startDate = new Date(qy, (q - 1) * 3, 1);
        endDate = new Date(qy, q * 3, 0, 23, 59, 59);
        label = `${qy}年第${q}季度`;
        break;
      default: // month
        const ym = year ? parseInt(year) : now.getFullYear();
        const mm = month ? parseInt(month) : now.getMonth() + 1;
        startDate = new Date(ym, mm - 1, 1);
        endDate = new Date(ym, mm, 0, 23, 59, 59);
        label = `${ym}年${mm}月`;
    }

    const config = await UserConfig.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    const isYearly = timeRange === 'year'
    const budget = isYearly
      ? (config?.budget?.yearly || config?.budget?.monthly * 12 || 60000)
      : (config?.budget?.monthly || 5000)

    // 按月聚合该用户在时间范围内的数据
    const monthlyStats = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: { year: { $year: '$date' }, month: { $month: '$date' }, type: '$type' },
        total: { $sum: '$amount' },
        count: { $sum: 1 }
      }}
    ]);

    // 整理成月份数组
    const statsByMonth = {};
    monthlyStats.forEach(s => {
      const key = `${s._id.year}-${String(s._id.month).padStart(2, '0')}`;
      if (!statsByMonth[key]) statsByMonth[key] = { income: 0, expense: 0 };
      if (s._id.type === 'income') statsByMonth[key].income = s.total;
      else statsByMonth[key].expense = s.total;
    });

    // 总计
    let totalIncome = 0, totalExpense = 0;
    Object.values(statsByMonth).forEach(s => {
      totalIncome += s.income;
      totalExpense += s.expense;
    });

    // 全部时间范围总计
    const allStats = await Transaction.aggregate([
      { $match: { userId: new mongoose.Types.ObjectId(userId), date: { $gte: startDate, $lte: endDate }, type: { $in: ['income', 'expense'] } } },
      { $group: { _id: '$type', total: { $sum: '$amount' } } }
    ]);

    const incomeAgg = allStats.find(s => s._id === 'income')?.total || 0;
    const expenseAgg = allStats.find(s => s._id === 'expense')?.total || 0;

    ctx.body = {
      success: true,
      userId,
      timeRange,
      label,
      income: incomeAgg,
      expense: expenseAgg,
      balance: incomeAgg - expenseAgg,
      budget,
      usageRate: budget > 0 ? ((expenseAgg / budget) * 100).toFixed(1) : 0,
      monthlyData: Object.entries(statsByMonth)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([key, s]) => ({
          label: key,
          income: s.income,
          expense: s.expense,
          balance: s.income - s.expense
        }))
    };
  } catch (error) {
    console.error('获取用户消费汇总错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 用户排行榜（消费最多/最少、储蓄最多/最少）
router.get('/user-rankings', async (ctx) => {
  try {
    const { timeRange = 'month', year, month, limit = 5 } = ctx.query;
    const now = new Date();
    let startDate, endDate;

    switch (timeRange) {
      case 'year':
        const y = year ? parseInt(year) : now.getFullYear();
        startDate = new Date(y, 0, 1);
        endDate = new Date(y, 11, 31, 23, 59, 59);
        break;
      case 'quarter':
        const q = Math.floor(now.getMonth() / 3) + 1;
        const qy = year ? parseInt(year) : now.getFullYear();
        startDate = new Date(qy, (q - 1) * 3, 1);
        endDate = new Date(qy, q * 3, 0, 23, 59, 59);
        break;
      default: // month
        const ym = year ? parseInt(year) : now.getFullYear();
        const mm = month ? parseInt(month) : now.getMonth() + 1;
        startDate = new Date(ym, mm - 1, 1);
        endDate = new Date(ym, mm, 0, 23, 59, 59);
    }

    const rankings = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: { userId: '$userId', type: '$type' },
        total: { $sum: '$amount' }
      }},
      { $group: {
        _id: '$_id.userId',
        income: { $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] } },
        expense: { $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] } }
      }},
      { $addFields: { balance: { $subtract: ['$income', '$expense'] } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmpty: true } },
      { $project: { _id: 1, income: 1, expense: 1, balance: 1, name: { $ifNull: ['$user.nickname', { $ifNull: ['$user.username', '未知用户'] }] } } }
    ]);

    const sortedByExpense = [...rankings].sort((a, b) => b.expense - a.expense);
    const sortedByBalance = [...rankings].sort((a, b) => b.balance - a.balance);

    ctx.body = {
      success: true,
      topSpenders: sortedByExpense.slice(0, parseInt(limit)).map((r, i) => ({
        rank: i + 1,
        name: r.name,
        expense: r.expense,
        title: i === 0 ? '消费狂魔' : i === 1 ? '败家子' : i === 2 ? '剁手族' : '消费达人'
      })),
      topSavers: sortedByBalance.slice(0, parseInt(limit)).map((r, i) => ({
        rank: i + 1,
        name: r.name,
        balance: r.balance,
        title: i === 0 ? '储蓄巨鳄' : i === 1 ? '理财高手' : i === 2 ? '省钱达人' : '精打细算'
      }))
    };
  } catch (error) {
    console.error('获取排行榜错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// ==================== 系统设置API ====================

// 获取系统设置
router.get('/system-settings', async (ctx) => {
  try {
    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = await SystemSettings.create({});
    }
    ctx.body = {
      success: true,
      settings: {
        systemName: settings.systemName,
        currency: settings.currency,
        defaultBudget: settings.defaultBudget
      }
    };
  } catch (error) {
    console.error('获取系统设置错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 更新系统设置
router.put('/system-settings', async (ctx) => {
  try {
    const { systemName, currency, defaultBudget } = ctx.request.body;

    let settings = await SystemSettings.findOne();
    if (!settings) {
      settings = new SystemSettings({});
    }

    if (systemName !== undefined) settings.systemName = systemName;
    if (currency !== undefined) settings.currency = currency;
    if (defaultBudget !== undefined) settings.defaultBudget = defaultBudget;

    await settings.save();

    ctx.body = {
      success: true,
      message: '系统设置已保存',
      settings: {
        systemName: settings.systemName,
        currency: settings.currency,
        defaultBudget: settings.defaultBudget
      }
    };
  } catch (error) {
    console.error('更新系统设置错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// ==================== 分类管理API ====================

// 获取分类列表
router.get('/categories', async (ctx) => {
  try {
    const { type } = ctx.query;
    const query = {};
    if (type) query.type = type;

    let categories = await Category.find(query).sort({ sortOrder: 1, type: 1, createdAt: 1 });

    // 如果没有分类，插入默认分类
    if (categories.length === 0) {
      const defaultCategories = [
        { name: '工资', iconId: 'salary', color: '#10B981', type: 'income', isDefault: true },
        { name: '奖金', iconId: 'bonus', color: '#34D399', type: 'income', isDefault: true },
        { name: '理财', iconId: 'investment', color: '#6EE7D0', type: 'income', isDefault: true },
        { name: '兼职', iconId: 'parttime', color: '#A7F3D0', type: 'income', isDefault: true },
        { name: '其他收入', iconId: 'other_income', color: '#34D399', type: 'income', isDefault: true },
        { name: '餐饮', iconId: 'food', color: '#EF4444', type: 'expense', isDefault: true },
        { name: '交通', iconId: 'transport', color: '#F97316', type: 'expense', isDefault: true },
        { name: '购物', iconId: 'shopping', color: '#6366F1', type: 'expense', isDefault: true },
        { name: '娱乐', iconId: 'entertainment', color: '#8B5CF6', type: 'expense', isDefault: true },
        { name: '住房', iconId: 'housing', color: '#EC4899', type: 'expense', isDefault: true },
        { name: '医疗', iconId: 'medical', color: '#F43F5E', type: 'expense', isDefault: true },
        { name: '教育', iconId: 'education', color: '#5856D6', type: 'expense', isDefault: true },
        { name: '通讯', iconId: 'communication', color: '#14B8A6', type: 'expense', isDefault: true },
        { name: '其他', iconId: 'other', color: '#8E8E93', type: 'expense', isDefault: true }
      ];
      await Category.insertMany(defaultCategories);
      categories = await Category.find(query).sort({ type: 1, createdAt: 1 });
    }

    ctx.body = { success: true, categories };
  } catch (error) {
    console.error('获取分类错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 新增分类
router.post('/categories', async (ctx) => {
  try {
    const { name, iconId, color, type } = ctx.request.body;

    if (!name || !type) {
      ctx.status = 400;
      ctx.body = { message: '分类名称和类型不能为空' };
      return;
    }

    const existing = await Category.findOne({ name, type });
    if (existing) {
      ctx.status = 400;
      ctx.body = { message: '该分类已存在' };
      return;
    }

    const category = new Category({
      name,
      iconId: iconId || name,
      color: color || '#6366F1',
      type
    });
    await category.save();

    // 记录操作日志
    await OperationLog.create({
      userId: ctx.state.adminUser._id,
      action: '新增分类',
      details: `新增${type === 'income' ? '收入' : '支出'}分类：${name}`
    });

    ctx.body = { success: true, message: '分类创建成功', category };
  } catch (error) {
    console.error('创建分类错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 排序分类（必须放在 /categories/:id 前面，koa-router 按注册顺序匹配）
router.put('/categories/reorder', async (ctx) => {
  try {
    const { type, orderedIds } = ctx.request.body;
    if (!type || !Array.isArray(orderedIds)) {
      ctx.status = 400;
      ctx.body = { message: '参数错误' };
      return;
    }
    await Promise.all(orderedIds.map((id, index) =>
      Category.findByIdAndUpdate(id, { sortOrder: index, type })
    ));
    ctx.body = { success: true, message: '排序已更新' };
  } catch (error) {
    console.error('排序分类错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 更新分类
router.put('/categories/:id', async (ctx) => {
  try {
    const { name, iconId, color } = ctx.request.body;
    const category = await Category.findByIdAndUpdate(
      ctx.params.id,
      {
        ...(name && { name }),
        ...(iconId && { iconId }),
        ...(color && { color })
      },
      { new: true }
    );

    if (!category) {
      ctx.status = 404;
      ctx.body = { message: '分类不存在' };
      return;
    }

    await OperationLog.create({
      userId: ctx.state.adminUser._id,
      action: '更新分类',
      details: `更新分类：${category.name}`
    });

    ctx.body = { success: true, message: '分类更新成功', category };
  } catch (error) {
    console.error('更新分类错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 删除分类
router.delete('/categories/:id', async (ctx) => {
  try {
    const category = await Category.findById(ctx.params.id);
    if (!category) {
      ctx.status = 404;
      ctx.body = { message: '分类不存在' };
      return;
    }
    await Category.deleteOne({ _id: ctx.params.id });
    await OperationLog.create({
      userId: ctx.state.adminUser._id,
      action: '删除分类',
      details: `删除分类：${category.name}`
    });
    ctx.body = { success: true, message: '分类已删除' };
  } catch (error) {
    console.error('删除分类错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// ==================== 消息模板API ====================
// 获取消息模板
router.get('/message-templates', async (ctx) => {
  try {
    let templates = await MessageTemplate.findOne();
    if (!templates) {
      templates = await MessageTemplate.create({});
    }
    ctx.body = {
      success: true,
      templates: {
        low: templates.low || '您的消费状况良好，请继续保持理性消费习惯。',
        medium: templates.medium || '本月消费状况可控，但已接近预算阈值，建议适当控制支出。',
        high: templates.high || '本月消费过高，已严重超出预算，请立即调整消费行为，避免财务风险。'
      }
    };
  } catch (error) {
    console.error('获取消息模板错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// 更新消息模板
router.put('/message-templates', async (ctx) => {
  try {
    const { low, medium, high } = ctx.request.body;

    let templates = await MessageTemplate.findOne();
    if (!templates) {
      templates = new MessageTemplate({});
    }

    if (low !== undefined) templates.low = low;
    if (medium !== undefined) templates.medium = medium;
    if (high !== undefined) templates.high = high;

    await templates.save();

    await OperationLog.create({
      userId: ctx.state.adminUser._id,
      action: '更新消息模板',
      details: '修改了风险提醒消息模板'
    });

    ctx.body = { success: true, message: '消息模板已保存', templates };
  } catch (error) {
    console.error('更新消息模板错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// ==================== 操作日志API ====================

// 获取操作日志
router.get('/operation-logs', async (ctx) => {
  try {
    const { page = 1, pageSize = 20 } = ctx.query;
    const skip = (parseInt(page) - 1) * parseInt(pageSize);

    const logs = await OperationLog.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(parseInt(pageSize))
      .populate('userId', 'username nickname');

    const total = await OperationLog.countDocuments();

    ctx.body = {
      success: true,
      logs: logs.map(log => ({
        id: log._id,
        time: log.createdAt.toISOString().replace('T', ' ').substring(0, 16),
        user: log.userId?.nickname || log.userId?.username || '管理员',
        action: log.action,
        details: log.details
      })),
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    console.error('获取操作日志错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// ==================== 数据导出API ====================

router.get('/export', async (ctx) => {
  try {
    const { startDate, endDate, dataTypes, format = 'csv' } = ctx.query;

    // 解析日期范围
    let start = startDate ? new Date(startDate) : new Date(Date.now() - 90 * 24 * 60 * 60 * 1000);
    let end = endDate ? new Date(endDate) : new Date();
    end.setHours(23, 59, 59, 999);

    // 解析数据类型
    const types = dataTypes ? dataTypes.split(',') : ['transactions'];

    const result = {};

    // 交易记录
    if (types.includes('transactions')) {
      const transactions = await Transaction.find({ date: { $gte: start, $lte: end } })
        .populate('userId', 'username nickname')
        .sort({ date: -1 })
        .lean();

      result.transactions = transactions.map(t => ({
        '序号': t._id.toString(),
        '日期': t.date.toISOString().split('T')[0],
        '类型': t.type === 'income' ? '收入' : '支出',
        '分类': t.category,
        '金额': t.amount,
        '备注': t.note || '',
        '用户': t.userId?.nickname || t.userId?.username || '未知',
        '创建时间': t.createdAt.toISOString().replace('T', ' ').substring(0, 19)
      }));
    }

    // 用户数据
    if (types.includes('users')) {
      const users = await User.find({ role: 'user' })
        .select('-password')
        .lean();

      const userIds = users.map(u => u._id);
      const configs = await UserConfig.find({ userId: { $in: userIds } }).lean();
      const configMap = {};
      configs.forEach(c => { configMap[c.userId.toString()] = c; });

      // 本月消费汇总
      const now = new Date();
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyExpense = await Transaction.aggregate([
        { $match: { userId: { $in: userIds }, type: 'expense', date: { $gte: monthStart } } },
        { $group: { _id: '$userId', total: { $sum: '$amount' } } }
      ]);
      const expenseMap = {};
      monthlyExpense.forEach(e => { expenseMap[e._id.toString()] = e.total; });

      result.users = users.map(u => ({
        '序号': u._id.toString(),
        '用户名': u.username,
        '昵称': u.nickname || '',
        '邮箱': u.email || '',
        '月度预算': configMap[u._id.toString()]?.budget?.monthly || '未设置',
        '年度预算': configMap[u._id.toString()]?.budget?.yearly || '未设置',
        '本月消费': expenseMap[u._id.toString()] || 0,
        '风险等级': configMap[u._id.toString()]?.financialHealth?.riskLevel || 'low',
        '注册时间': u.createdAt.toISOString().replace('T', ' ').substring(0, 19),
        '最近活跃': u.updatedAt ? u.updatedAt.toISOString().replace('T', ' ').substring(0, 19) : ''
      }));
    }

    // 统计数据
    if (types.includes('stats')) {
      const transactions = await Transaction.find({ date: { $gte: start, $lte: end } }).lean();
      const totalIncome = transactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = transactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

      // 按分类统计
      const categoryStats = {};
      transactions.filter(t => t.type === 'expense').forEach(t => {
        if (!categoryStats[t.category]) categoryStats[t.category] = 0;
        categoryStats[t.category] += t.amount;
      });

      result.stats = {
        '汇总': [{
          '统计周期开始': start.toISOString().split('T')[0],
          '统计周期结束': end.toISOString().split('T')[0],
          '总收入': totalIncome,
          '总支出': totalExpense,
          '结余': totalIncome - totalExpense,
          '交易笔数': transactions.length
        }],
        '支出分类统计': Object.entries(categoryStats).map(([cat, amt]) => ({
          '分类': cat,
          '金额': amt,
          '占比': totalExpense > 0 ? ((amt / totalExpense) * 100).toFixed(2) + '%' : '0%'
        }))
      };
    }

    // 按格式返回
    if (format === 'json') {
      ctx.set('Content-Type', 'application/json');
      ctx.set('Content-Disposition', `attachment; filename="export_${Date.now()}.json"`);
      ctx.body = result;
      return;
    }

    if (format === 'xlsx') {
      const XLSX = require('xlsx');
      const wb = XLSX.utils.book_new();

      if (result.transactions?.length) {
        const ws = XLSX.utils.json_to_sheet(result.transactions);
        XLSX.utils.book_append_sheet(wb, ws, '交易记录');
      }
      if (result.users?.length) {
        const ws = XLSX.utils.json_to_sheet(result.users);
        XLSX.utils.book_append_sheet(wb, ws, '用户数据');
      }
      if (result.stats?.['汇总']?.length) {
        const ws1 = XLSX.utils.json_to_sheet(result.stats['汇总']);
        XLSX.utils.book_append_sheet(wb, ws1, '统计汇总');
        if (result.stats['支出分类统计']?.length) {
          const ws2 = XLSX.utils.json_to_sheet(result.stats['支出分类统计']);
          XLSX.utils.book_append_sheet(wb, ws2, '分类统计');
        }
      }

      const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
      const filename = `财务导出_${end.toISOString().split('T')[0]}.xlsx`;
      ctx.set('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      ctx.set('Content-Disposition', `attachment; filename="${encodeURIComponent(filename)}"`);
      ctx.body = buf;
      return;
    }

    // 默认 CSV（只导出交易记录，其他类型用 JSON）
    if (result.transactions?.length) {
      const csv = arrayToCSV(result.transactions);
      ctx.set('Content-Type', 'text/csv;charset=utf-8');
      ctx.set('Content-Disposition', `attachment; filename="transactions_${end.toISOString().split('T')[0]}.csv"`);
      ctx.body = '\ufeff' + csv; // BOM for Excel
    } else {
      ctx.status = 400;
      ctx.body = { message: '当前日期范围内没有可导出的交易数据' };
    }
  } catch (error) {
    console.error('[Export] 导出失败:', error);
    ctx.status = 500;
    ctx.body = { message: '导出失败', error: error.message };
  }
});

// CSV 工具函数
function arrayToCSV(data) {
  if (!data || data.length === 0) return '';
  const headers = Object.keys(data[0]);
  const rows = data.map(row =>
    headers.map(h => {
      const val = row[h] == null ? '' : String(row[h]);
      // 包含逗号、引号或换行的字段需要加引号
      return /[,"\n]/.test(val) ? `"${val.replace(/"/g, '""')}"` : val;
    }).join(',')
  );
  return [headers.join(','), ...rows].join('\n');
}

// ==================== 辅助函数 ====================
function getCategoryColor(category) {
  const colorMap = {
    '餐饮': '#FF6B6B',
    '交通': '#4ECDC4',
    '购物': '#FFE66D',
    '娱乐': '#95E1D3',
    '医疗': '#F38181',
    '教育': '#AA96DA',
    '居住': '#FCBAD3',
    '通讯': '#A8D8EA',
    '其他支出': '#C9B1FF'
  };
  return colorMap[category] || '#6C5CE7';
}

module.exports = router;
