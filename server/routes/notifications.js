const Router = require('koa-router');
const jwt = require('jsonwebtoken');
const mongoose = require('mongoose');
const Notification = require('../models/Notification');
const UserConfig = require('../models/UserConfig');
const Transaction = require('../models/Transaction');
const { JWT_SECRET } = require('../middleware/jwt');

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
    ctx.state.userRole = decoded.role;
    await next();
  } catch (error) {
    ctx.status = 401;
    ctx.body = { message: '无效的令牌' };
  }
};

router.use(requireAuth);

// 获取用户通知列表
router.get('/', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const { page = 1, pageSize = 10, type, isRead } = ctx.query;
    
    const query = { userId: new mongoose.Types.ObjectId(userId) };
    
    if (type) {
      query.type = type;
    }
    
    if (isRead !== undefined) {
      query.isRead = isRead === 'true';
    }
    
    const total = await Notification.countDocuments(query);
    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * pageSize)
      .limit(parseInt(pageSize));
    
    // 获取未读数量
    const unreadCount = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false
    });
    
    ctx.body = {
      notifications,
      total,
      unreadCount,
      page: parseInt(page),
      pageSize: parseInt(pageSize)
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取通知失败', error: error.message };
  }
});

// 获取未读通知数量
router.get('/unread-count', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const count = await Notification.countDocuments({
      userId: new mongoose.Types.ObjectId(userId),
      isRead: false
    });
    
    ctx.body = { count };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '获取未读数量失败', error: error.message };
  }
});

// 标记通知为已读
router.put('/:id/read', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const notification = await Notification.findOneAndUpdate(
      { _id: ctx.params.id, userId: new mongoose.Types.ObjectId(userId) },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) {
      ctx.status = 404;
      ctx.body = { message: '通知不存在' };
      return;
    }
    
    ctx.body = { message: '已标记为已读', notification };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '操作失败', error: error.message };
  }
});

// 标记所有通知为已读
router.put('/read-all', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    
    const result = await Notification.updateMany(
      { userId: new mongoose.Types.ObjectId(userId), isRead: false },
      { isRead: true }
    );
    
    ctx.body = { 
      message: '已全部标记为已读',
      modifiedCount: result.modifiedCount
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '操作失败', error: error.message };
  }
});

// 删除通知
router.delete('/:id', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const notification = await Notification.findOneAndDelete({
      _id: ctx.params.id,
      userId: new mongoose.Types.ObjectId(userId)
    });
    
    if (!notification) {
      ctx.status = 404;
      ctx.body = { message: '通知不存在' };
      return;
    }
    
    ctx.body = { message: '删除成功' };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '删除失败', error: error.message };
  }
});

// 批量删除通知
router.post('/batch-delete', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    const { ids } = ctx.request.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      ctx.status = 400;
      ctx.body = { message: '请提供要删除的通知ID' };
      return;
    }
    
    const result = await Notification.deleteMany({
      _id: { $in: ids },
      userId: new mongoose.Types.ObjectId(userId)
    });
    
    ctx.body = { 
      message: `成功删除 ${result.deletedCount} 条通知`,
      count: result.deletedCount
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '删除失败', error: error.message };
  }
});

// ==================== 自动通知功能 ====================

// 检查预算预警（定时任务调用或交易后调用）
router.post('/check-budget-alert', async (ctx) => {
  try {
    const userId = ctx.state.userId;
    
    // 获取用户配置
    const config = await UserConfig.findOne({ userId: new mongoose.Types.ObjectId(userId) });
    if (!config || !config.notification?.budgetAlert) {
      ctx.body = { message: '用户未开启预算预警' };
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
        
        ctx.body = { 
          message: '预算预警通知已创建',
          alert: true,
          usageRate: usageRate.toFixed(2)
        };
        return;
      }
    }
    
    ctx.body = { 
      message: '未达到预警阈值',
      alert: false,
      usageRate: usageRate.toFixed(2)
    };
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '检查失败', error: error.message };
  }
});

// 管理员发送系统通知（仅管理员）
router.post('/system', async (ctx) => {
  try {
    // 检查是否为管理员
    if (ctx.state.userRole !== 'admin') {
      ctx.status = 403;
      ctx.body = { message: '权限不足' };
      return;
    }
    
    const { userIds, title, content } = ctx.request.body;
    
    if (!title || !content) {
      ctx.status = 400;
      ctx.body = { message: '请提供标题和内容' };
      return;
    }
    
    // 发送给指定用户或所有用户
    if (userIds && Array.isArray(userIds) && userIds.length > 0) {
      const notifications = userIds.map(userId => ({
        userId: new mongoose.Types.ObjectId(userId),
        type: 'system',
        title,
        content,
        data: { sentBy: ctx.state.userId }
      }));
      
      await Notification.insertMany(notifications);
      ctx.body = { message: `成功发送给 ${userIds.length} 位用户` };
    } else {
      // 发送给所有用户
      const users = await mongoose.model('User').find({ role: 'user' }).select('_id');
      const notifications = users.map(user => ({
        userId: user._id,
        type: 'system',
        title,
        content,
        data: { sentBy: ctx.state.userId }
      }));
      
      await Notification.insertMany(notifications);
      ctx.body = { message: `成功发送给 ${users.length} 位用户` };
    }
  } catch (error) {
    ctx.status = 500;
    ctx.body = { message: '发送失败', error: error.message };
  }
});

module.exports = router;
