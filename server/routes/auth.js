const Router = require('koa-router');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { JWT_SECRET } = require('../middleware/jwt');

const router = new Router({ prefix: '/auth' });

// 模拟用户数据（实际项目中应该从数据库读取）
const users = [
  {
    id: 1,
    username: 'admin',
    // 密码是 '123456'
    password: '$2a$10$rXnLzFKCp6pV7KzQN5Y3OeXQqhVxZ5QN5Y3OeXQqhVxZ5QN5Y3Oe', 
    email: 'admin@example.com'
  }
];

// 注册
router.post('/register', async (ctx) => {
  const { username, password, email } = ctx.request.body;
  
  if (!username || !password || !email) {
    ctx.status = 400;
    ctx.body = { message: '请填写完整信息' };
    return;
  }

  // 检查用户是否已存在
  const existingUser = users.find(u => u.username === username || u.email === email);
  if (existingUser) {
    ctx.status = 400;
    ctx.body = { message: '用户名或邮箱已存在' };
    return;
  }

  // 加密密码
  const hashedPassword = await bcrypt.hash(password, 10);
  
  // 添加用户
  const newUser = {
    id: users.length + 1,
    username,
    password: hashedPassword,
    email
  };
  users.push(newUser);

  ctx.status = 201;
  ctx.body = { message: '注册成功', userId: newUser.id };
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
  const user = users.find(u => u.username === username);
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
    { id: user.id, username: user.username, email: user.email },
    JWT_SECRET,
    { expiresIn: '24h' }
  );

  ctx.body = {
    message: '登录成功',
    token,
    user: {
      id: user.id,
      username: user.username,
      email: user.email
    }
  };
});

// 验证 token（受保护路由示例）
router.get('/verify', require('../middleware/jwt').jwtMiddleware, async (ctx) => {
  ctx.body = {
    message: 'Token 验证成功',
    user: ctx.state.user
  };
});

module.exports = router;
