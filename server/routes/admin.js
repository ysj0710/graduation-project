const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const User = require('../models/User');
const Transaction = require('../models/Transaction');
const UserConfig = require('../models/UserConfig');
const Notification = require('../models/Notification');
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
    
    // 用户统计
    const totalUsers = await User.countDocuments({ role: 'user' });
    const newUsersToday = await User.countDocuments({ 
      role: 'user',
      createdAt: { $gte: startOfToday } 
    });
    const activeUsers = await User.countDocuments({ 
      role: 'user',
      updatedAt: { $gte: new Date(now - 7 * 24 * 60 * 60 * 1000) }  // 7天内活跃
    });
    
    // 交易统计（本月）
    const monthlyTransactions = await Transaction.countDocuments({
      date: { $gte: startOfMonth, $lte: endOfMonth }
    });
    
    const monthlyAmount = await Transaction.aggregate([
      {
        $match: {
          date: { $gte: startOfMonth, $lte: endOfMonth }
        }
      },
      {
        $group: {
          _id: null,
          total: { $sum: '$amount' }
        }
      }
    ]);
    const monthlyTotal = monthlyAmount[0]?.total || 0;
    
    // 计算风险用户
    const riskStats = await calculateRiskUsers();
    
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

// 获取消费趋势数据（用于图表）
router.get('/trend-data', async (ctx) => {
  try {
    const { months = 6 } = ctx.query;
    const now = new Date();
    const result = [];
    
    for (let i = months - 1; i >= 0; i--) {
      const year = now.getFullYear();
      const month = now.getMonth() - i;
      const startDate = new Date(year, month, 1);
      const endDate = new Date(year, month + 1, 0, 23, 59, 59);
      
      const monthStats = await Transaction.aggregate([
        {
          $match: {
            date: { $gte: startDate, $lte: endDate }
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
      
      const income = monthStats.find(s => s._id === 'income')?.total || 0;
      const expense = monthStats.find(s => s._id === 'expense')?.total || 0;
      
      result.push({
        month: `${startDate.getFullYear()}年${startDate.getMonth() + 1}月`,
        income,
        expense,
        balance: income - expense
      });
    }
    
    ctx.body = result;
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取趋势数据失败', error: error.message };
  }
});

// 获取风险用户列表
router.get('/risk-users', async (ctx) => {
  try {
    const { page = 1, pageSize = 10, level = 'all' } = ctx.query;
    
    // 获取所有用户配置
    let query = {};
    if (level !== 'all') {
      query['financialHealth.riskLevel'] = level;
    }
    
    const configs = await UserConfig.find(query)
      .populate('userId', 'username nickname email createdAt')
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    const total = await UserConfig.countDocuments(query);
    
    // 获取用户的预算使用情况
    const riskUsers = await Promise.all(configs.map(async (config) => {
      const user = config.userId;
      if (!user) return null;
      
      // 获取本月支出
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const monthlyExpense = await Transaction.aggregate([
        {
          $match: {
            userId: user._id,
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
      
      const spent = monthlyExpense[0]?.total || 0;
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
    }));
    
    // 过滤掉null值，并按风险等级排序
    const filteredUsers = riskUsers.filter(u => u !== null).sort((a, b) => {
      const riskOrder = { high: 0, medium: 1, low: 2 };
      return riskOrder[a.riskLevel] - riskOrder[b.riskLevel];
    });
    
    ctx.body = {
      users: filteredUsers,
      total,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取风险用户失败', error: error.message };
  }
});

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

// 获取统计数据
router.get('/statistics', async (ctx) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    
    // 风险用户统计
    const riskStats = await calculateRiskUsers();
    
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

// 获取用户列表
router.get('/users', async (ctx) => {
  try {
    const { page = 1, pageSize = 10, search = '', status = '' } = ctx.query;
    
    const query = {};
    
    // 搜索
    if (search) {
      query.$or = [
        { username: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }
    
    // 状态筛选
    if (status === 'inactive') {
      query.isActive = false;
    } else if (status === 'normal') {
      query.isActive = { $ne: false };
    }
    
    const total = await User.countDocuments(query);
    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    // 获取用户的配置信息
    const usersWithConfig = await Promise.all(users.map(async (user) => {
      const config = await UserConfig.findOne({ userId: user._id });
      return {
        ...user.toObject(),
        config: config || {}
      };
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

// ==================== 辅助函数 ====================

// 计算风险用户数量
async function calculateRiskUsers() {
  const configs = await UserConfig.find();
  
  let highRiskCount = 0;
  let mediumRiskCount = 0;
  let lowRiskCount = 0;
  
  for (const config of configs) {
    await updateUserFinancialHealth(config.userId);
    
    const updatedConfig = await UserConfig.findOne({ userId: config.userId });
    const riskLevel = updatedConfig?.financialHealth?.riskLevel || 'low';
    
    if (riskLevel === 'high') highRiskCount++;
    else if (riskLevel === 'medium') mediumRiskCount++;
    else lowRiskCount++;
  }
  
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

module.exports = router;
