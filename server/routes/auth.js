const Router = require('koa-router');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const { jwtMiddleware, JWT_SECRET } = require('../middleware/jwt');

const router = new Router();

// 生成6位数字验证码
const generateCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 发送验证码
router.post('/send-code', async (ctx) => {
  const { email } = ctx.request.body;
  
  if (!email) {
    ctx.status = 400;
    ctx.body = { message: '请输入邮箱地址' };
    return;
  }

  // 检查邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    ctx.status = 400;
    ctx.body = { message: '邮箱格式不正确' };
    return;
  }

  // 生成验证码
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000); // 5分钟过期

  // 删除该邮箱之前的验证码
  await VerificationCode.deleteMany({ email });

  // 存储新验证码
  await VerificationCode.create({
    email,
    code,
    type: 'register',
    expiresAt
  });

  // TODO: 这里应该发送邮件，实际项目中集成邮件服务
  // 开发环境直接返回验证码（生产环境要删除这行）
  console.log(`📧 验证码 for ${email}: ${code}`);

  ctx.body = { 
    message: '验证码已发送',
    // 开发环境返回验证码，上线生产环境要删除
    devCode: code
  };
});

// 验证验证码
router.post('/verify-code', async (ctx) => {
  const { email, code } = ctx.request.body;
  
  if (!email || !code) {
    ctx.status = 400;
    ctx.body = { message: '请提供邮箱和验证码' };
    return;
  }

  // 查找验证码
  const verification = await VerificationCode.findOne({ email, code });
  
  if (!verification) {
    ctx.status = 400;
    ctx.body = { message: '验证码错误' };
    return;
  }

  // 检查是否过期
  if (verification.expiresAt < new Date()) {
    ctx.status = 400;
    ctx.body = { message: '验证码已过期，请重新获取' };
    return;
  }

  // 验证成功，删除验证码
  await VerificationCode.deleteOne({ _id: verification._id });

  ctx.body = { message: '验证码验证成功' };
});

// 注册（需要验证码）
router.post('/register', async (ctx) => {
  const { username, password, email, code } = ctx.request.body;
  
  if (!username || !password || !email || !code) {
    ctx.status = 400;
    ctx.body = { message: '请填写完整信息' };
    return;
  }

  // 验证验证码
  const verification = await VerificationCode.findOne({ email, code });
  
  if (!verification) {
    ctx.status = 400;
    ctx.body = { message: '验证码错误' };
    return;
  }

  if (verification.expiresAt < new Date()) {
    ctx.status = 400;
    ctx.body = { message: '验证码已过期，请重新获取' };
    return;
  }

  // 检查用户名是否已存在
  const existingUser = await User.findOne({ username });
  
  if (existingUser) {
    ctx.status = 400;
    ctx.body = { message: '用户名已存在' };
    return;
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 创建用户
  const newUser = new User({
    username,
    password: hashedPassword,
    email,
    nickname: username,
    role: 'user'
  });
  
  await newUser.save();

  // 删除已使用的验证码
  await VerificationCode.deleteOne({ _id: verification._id });

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

  const user = await User.findOne({ username });
  if (!user) {
    ctx.status = 401;
    ctx.body = { message: '用户名或密码错误' };
    return;
  }

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) {
    ctx.status = 401;
    ctx.body = { message: '用户名或密码错误' };
    return;
  }

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

// 验证 token
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
