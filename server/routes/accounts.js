const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Account = require('../models/Account');

const JWT_SECRET = 'your-secret-key-change-in-production';

const router = new Router();

// 用户鉴权中间件
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

// 获取账户列表
router.get('/', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const accounts = await Account.find({ userId: new mongoose.Types.ObjectId(userId) }).sort({ createdAt: -1 });
    ctx.body = accounts;
  } catch (error) {
    console.error('获取账户列表错误:', error);
    ctx.status = 500;
    ctx.body = { message: '获取账户列表失败', error: error.message };
  }
});

// 添加账户
router.post('/', async (ctx) => {
  try {
    const { name, type, icon, color, balance, remark } = ctx.request.body;
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    
    if (!name) {
      ctx.status = 400;
      ctx.body = { message: '账户名称不能为空' };
      return;
    }
    
    const account = new Account({
      userId,
      name,
      type: type || 'other',
      icon: icon || '💰',
      color: color || '#007AFF',
      balance: parseFloat(balance) || 0,
      remark: remark || ''
    });
    
    await account.save();
    
    ctx.status = 201;
    ctx.body = { message: '账户添加成功', account };
  } catch (error) {
    console.error('添加账户错误:', error);
    ctx.status = 500;
    ctx.body = { message: '添加账户失败', error: error.message };
  }
});

// 更新账户
router.put('/:id', async (ctx) => {
  try {
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    const { name, type, icon, color, balance, remark } = ctx.request.body;
    
    const account = await Account.findOne({ _id: ctx.params.id, userId });
    
    if (!account) {
      ctx.status = 404;
      ctx.body = { message: '账户不存在' };
      return;
    }
    
    if (name) account.name = name;
    if (type) account.type = type;
    if (icon) account.icon = icon;
    if (color) account.color = color;
    if (balance !== undefined) account.balance = parseFloat(balance);
    if (remark !== undefined) account.remark = remark;
    
    await account.save();
    
    ctx.body = { message: '账户更新成功', account };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '更新账户失败', error: error.message };
  }
});

// 删除账户
router.delete('/:id', async (ctx) => {
  try {
    const userId = new mongoose.Types.ObjectId(ctx.state.userId);
    
    const account = await Account.findOneAndDelete({ _id: ctx.params.id, userId });
    
    if (!account) {
      ctx.status = 404;
      ctx.body = { message: '账户不存在' };
      return;
    }
    
    ctx.body = { message: '账户删除成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '删除账户失败', error: error.message };
  }
});

module.exports = router;
