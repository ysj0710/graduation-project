const Router = require('koa-router');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const proxyAgent = require('proxy-agent');
const User = require('../models/User');
const VerificationCode = require('../models/VerificationCode');
const { jwtMiddleware, JWT_SECRET } = require('../middleware/jwt');
const emailConfig = require('../config/email');

const router = new Router();

// 创建邮件发送器
const transporter = nodemailer.createTransport({
  host: emailConfig.email.host,
  port: emailConfig.email.port,
  secure: emailConfig.email.secure,
  auth: {
    user: emailConfig.email.auth.user,
    pass: emailConfig.email.auth.pass
  },
  tls: {
    rejectUnauthorized: false,
    servername: 'smtp.qq.com'
  },
  socketTimeout: 30000,
  connectionTimeout: 30000
});

console.log('📧 邮件配置:', {
  host: emailConfig.email.host,
  port: emailConfig.email.port
});

// 移除全局代理设置
process.env.HTTP_PROXY = '';
process.env.HTTPS_PROXY = '';
process.env.ALL_PROXY = '';

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

  // 发送邮件
  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: '注册验证码 - 财务记账系统',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">财务记账系统</h2>
          <p>您好，您正在进行注册操作。</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">
            验证码有效期为 5 分钟，请尽快完成注册。<br>
            如果这不是您的操作，请忽略此邮件。
          </p>
        </div>
      `
    });
    console.log(`📧 验证码已发送到 ${email}: ${code}`);
  } catch (mailErr) {
    console.error('📧 邮件发送失败:', mailErr.message);
    // 邮件发送失败，但验证码已生成，返回给客户端（开发环境）
  }

  ctx.body = { 
    message: '验证码已发送到您的邮箱'
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

// 忘记密码 - 发送验证码
router.post('/forgot-password/send-code', async (ctx) => {
  const { email } = ctx.request.body;
  
  if (!email) {
    ctx.status = 400;
    ctx.body = { message: '请输入邮箱地址' };
    return;
  }

  // 检查邮箱是否已注册
  const user = await User.findOne({ email });
  if (!user) {
    ctx.status = 400;
    ctx.body = { message: '该邮箱未注册' };
    return;
  }

  // 生成验证码
  const code = generateCode();
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);

  // 删除该邮箱之前的验证码
  await VerificationCode.deleteMany({ email });

  // 存储新验证码
  await VerificationCode.create({
    email,
    code,
    type: 'resetPassword',
    expiresAt
  });

  // 发送邮件
  try {
    await transporter.sendMail({
      from: emailConfig.from,
      to: email,
      subject: '找回密码 - 财务记账系统',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #667eea;">财务记账系统</h2>
          <p>您好，您正在进行找回密码操作。</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 10px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #667eea;">${code}</span>
          </div>
          <p style="color: #666; font-size: 14px;">
            验证码有效期为 5 分钟，请尽快完成密码重置。<br>
            如果这不是您的操作，请忽略此邮件。
          </p>
        </div>
      `
    });
    console.log(`📧 找回密码验证码已发送到 ${email}: ${code}`);
  } catch (mailErr) {
    console.error('📧 邮件发送失败:', mailErr.message);
  }

  ctx.body = { message: '验证码已发送到您的邮箱' };
});

// 忘记密码 - 重置密码
router.post('/forgot-password/reset', async (ctx) => {
  const { email, code, newPassword } = ctx.request.body;
  
  if (!email || !code || !newPassword) {
    ctx.status = 400;
    ctx.body = { message: '请填写完整信息' };
    return;
  }

  // 查找验证码
  const verification = await VerificationCode.findOne({ email, code, type: 'resetPassword' });
  
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

  // 查找用户并更新密码
  const user = await User.findOne({ email });
  if (!user) {
    ctx.status = 400;
    ctx.body = { message: '用户不存在' };
    return;
  }

  // 加密新密码
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  user.password = hashedPassword;
  await user.save();

  // 删除已使用的验证码
  await VerificationCode.deleteOne({ _id: verification._id });

  ctx.body = { message: '密码重置成功，请使用新密码登录' };
});

module.exports = router;
