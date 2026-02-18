const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { JWT_SECRET } = require('../middleware/jwt');

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

// 获取统计数据
router.get('/statistics', async (ctx) => {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: { $ne: false } });
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const newUsersToday = await User.countDocuments({ createdAt: { $gte: today } });
    
    // 风险用户（暂时设为固定的模拟数据）
    const riskUsers = Math.ceil(totalUsers * 0.1);
    
    ctx.body = {
      totalUsers,
      activeUsers,
      riskUsers,
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
    
    ctx.body = {
      users,
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
    ctx.body = user;
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
    
    const user = new User({ username, password, email, role });
    await user.save();
    
    ctx.body = { message: '用户创建成功', userId: user._id };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '创建用户失败' };
  }
});

// 更新用户
router.put('/users/:id', async (ctx) => {
  try {
    const { username, email, role, isActive } = ctx.request.body;
    
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

// 获取风险分布
router.get('/risk-distribution', async (ctx) => {
  try {
    const total = await User.countDocuments();
    // 模拟数据
    const low = Math.ceil(total * 0.6);
    const medium = Math.ceil(total * 0.25);
    const high = total - low - medium;
    
    ctx.body = {
      distribution: { low, medium, high },
      highRiskUsers: []
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取风险数据失败' };
  }
});

// 发送提醒
router.post('/send-alert', async (ctx) => {
  try {
    const { userId, message } = ctx.request.body;
    // 这里可以添加发送邮件或站内通知的逻辑
    console.log(`发送提醒给用户 ${userId}: ${message}`);
    ctx.body = { message: '提醒发送成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '发送提醒失败' };
  }
});

module.exports = router;
