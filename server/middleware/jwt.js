const jwt = require('jsonwebtoken');

const JWT_SECRET = 'your-secret-key-change-in-production';

const jwtMiddleware = async (ctx, next) => {
  const token = ctx.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    ctx.status = 401;
    ctx.body = { message: '未提供 token' };
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    ctx.state.user = decoded;
    await next();
  } catch (err) {
    ctx.status = 401;
    ctx.body = { message: '无效的 token' };
  }
};

module.exports = { jwtMiddleware, JWT_SECRET };
