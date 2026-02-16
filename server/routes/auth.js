const Router = require('koa-router');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const { jwtMiddleware, JWT_SECRET } = require('../middleware/jwt');

const router = new Router();

// 注册
router.post('/register', async (ctx) => {
  const { username, password, email, nickname } = ctx.request.body;
  
  if (!username || !password || !email) {
    ctx.status = 400;
    ctx.body = { message: '请填写完整信息' };
    return;
  }

  // 检查用户名或邮箱是否已存在
  const existingUser = await User.findOne({ 
    $or: [{ username }, { email }] 
  });
  
  if (existingUser) {
    ctx.status = 400;
    ctx.body = { message: '用户名或邮箱已存在' };
    return;
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 创建用户（默认 role 为 'user'）
  const newUser = new User({
    username,
    password: hashedPassword,
    email,
    nickname: nickname || username,
    role: 'user'
  });
  
  await newUser.save();

  ctx.status = 201;
  ctx.body = { message: '注册成功', userId: newUser._id };
});

// 登录
router.post('/login', async (ctx) => {
  const { username, password } = ctx.request.body;
  
  if (!username || !password) {
    ctx.status = 400;
    ctx.body = { message: '请输入用户名和密码' };
    return;
  }

  // 查找用户
  const user = await User.findOne({ username });
  if (!user) {
    ctx.status = 401;
    ctx.body = { message: '用户名或密码错误' };
    return;
  }

  // 验证密码
  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    ctx.status = 401;
    ctx.body = { message: '用户名或密码错误' };
    return;
  }

  // 生成 JWT token
  const token = jwt.sign(
    { 
      id: user._id, 
      username: user.username, 
      email: user.email,
      role: user.role 
    },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  ctx.body = {
    message: '登录成功',
    token,
    user: {
      id: user._id,
      username: user.username,
      email: user.email,
      nickname: user.nickname,
      role: user.role
    }
  };
});

// 创建超级管理员（首次运行使用）
router.post('/init-admin', async (ctx) => {
  const { username, password, email, secretKey } = ctx.request.body;
  
  // 秘钥验证（只有知道秘钥才能创建管理员）
  if (secretKey !== 'admin-secret-key-2024') {
    ctx.status = 403;
    ctx.body = { message: '秘钥错误' };
    return;
  }

  // 检查是否已存在管理员
  const existingAdmin = await User.findOne({ role: 'admin' });
  if (existingAdmin) {
    ctx.status = 400;
    ctx.body = { message: '管理员已存在' };
    return;
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 创建管理员
  const admin = new User({
    username,
    password: hashedPassword,
    email,
    nickname: nickname || '管理员',
    role: 'admin'
  });
  
  await admin.save();

  ctx.status = 201;
  ctx.body = { message: '管理员创建成功' };
});

// 验证 token（受保护路由示例）
router.get('/verify', jwtMiddleware, async (ctx) => {
  ctx.body = {
    message: 'Token 验证成功',
    user: ctx.state.user
  };
});

// 获取当前用户信息
router.get('/me', jwtMiddleware, async (ctx) => {
  const user = await User.findById(ctx.state.user.id).select('-password');
  if (!user) {
    ctx.status = 404;
    ctx.body = { message: '用户不存在' };
    return;
  }
  ctx.body = { user };
});

module.exports = router;
