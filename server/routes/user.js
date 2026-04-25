const Router = require('koa-router');
const mongoose = require('mongoose');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const UserConfig = require('../models/UserConfig');
const SystemSettings = require('../models/SystemSettings');
const { JWT_SECRET } = require('../middleware/jwt');

const router = new Router();

// 公开接口：获取系统名称（无需认证）
router.get('/system-name', async (ctx) => {
  try {
    const settings = await SystemSettings.findOne();
    ctx.body = {
      systemName: settings?.systemName || '随手记'
    };
  } catch (error) {
    ctx.body = { systemName: '随手记' };
  }
});

// 认证中间件（内联，避免 router.use 全局应用问题）
const requireAuth = async (ctx, next) => {
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

// PUT /api/user/profile - 更新用户昵称
router.put('/profile', requireAuth, async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { nickname } = ctx.request.body;

    if (!nickname || nickname.trim().length === 0) {
      ctx.status = 400;
      ctx.body = { message: '昵称不能为空' };
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { nickname: nickname.trim(), updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }

    ctx.body = {
      success: true,
      message: '昵称更新成功',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      }
    };
  } catch (error) {
    console.error('更新昵称错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// PUT /api/user/username - 更新用户名
router.put('/username', requireAuth, async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { username } = ctx.request.body;

    if (!username || username.trim().length === 0) {
      ctx.status = 400;
      ctx.body = { message: '用户名不能为空' };
      return;
    }

    if (username.trim().length < 3 || username.trim().length > 20) {
      ctx.status = 400;
      ctx.body = { message: '用户名长度需要在 3-20 个字符之间' };
      return;
    }

    // 检查用户名是否已被使用
    const existing = await User.findOne({ username: username.trim() });
    if (existing && existing._id.toString() !== userId) {
      ctx.status = 400;
      ctx.body = { message: '该用户名已被使用' };
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { username: username.trim(), updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }

    ctx.body = {
      success: true,
      message: '用户名更新成功，下次登录请使用新用户名',
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        nickname: user.nickname,
        role: user.role
      }
    };
  } catch (error) {
    console.error('更新用户名错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// POST /api/user/avatar - 上传头像
router.post('/avatar', requireAuth, async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { avatarUrl } = ctx.request.body;

    if (!avatarUrl) {
      ctx.status = 400;
      ctx.body = { message: '头像URL不能为空' };
      return;
    }

    const user = await User.findByIdAndUpdate(
      userId,
      { avatar: avatarUrl, updatedAt: Date.now() },
      { new: true }
    );

    if (!user) {
      ctx.status = 404;
      ctx.body = { message: '用户不存在' };
      return;
    }

    ctx.body = {
      success: true,
      message: '头像更新成功',
      avatarUrl: user.avatar
    };
  } catch (error) {
    console.error('更新头像错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// GET /api/user/settings - 获取用户设置
router.get('/settings', requireAuth, async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const userObjectId = new mongoose.Types.ObjectId(userId);
    let userConfig = await UserConfig.findOne({ userId: userObjectId });

    if (!userConfig) {
      userConfig = new UserConfig({ userId: userObjectId });
      await userConfig.save();
    }

    ctx.body = {
      success: true,
      settings: {
        theme: {
          background: userConfig.theme?.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          primaryColor: userConfig.theme?.primaryColor || '#667eea',
          pattern: userConfig.theme?.pattern || 'dots',
          presetId: userConfig.theme?.presetId || 'aurora',
          customBgUrl: userConfig.theme?.customBgUrl || ''
        },
        budget: {
          monthly: userConfig.budget?.monthly || 5000,
          yearly: userConfig.budget?.yearly || 60000,
          alertThreshold: userConfig.budget?.alertThreshold || 80
        },
        notification: userConfig.notification || {}
      }
    };
  } catch (error) {
    console.error('获取设置错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// PUT /api/user/settings/theme - 更新主题设置
router.put('/settings/theme', requireAuth, async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { background, primaryColor, pattern, presetId, customBgUrl } = ctx.request.body;

    const userObjectId = new mongoose.Types.ObjectId(userId);
    let userConfig = await UserConfig.findOne({ userId: userObjectId });

    if (!userConfig) {
      userConfig = new UserConfig({
        userId: userObjectId,
        theme: {
          background: background || 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
          primaryColor: primaryColor || '#667eea',
          pattern: pattern || 'dots',
          presetId: presetId || 'aurora',
          customBgUrl: customBgUrl || ''
        }
      });
      await userConfig.save();
    } else {
      userConfig.theme = userConfig.theme || {};
      if (background !== undefined) userConfig.theme.background = background;
      if (primaryColor !== undefined) userConfig.theme.primaryColor = primaryColor;
      if (pattern !== undefined) userConfig.theme.pattern = pattern;
      if (presetId !== undefined) userConfig.theme.presetId = presetId;
      if (customBgUrl !== undefined) userConfig.theme.customBgUrl = customBgUrl;
      userConfig.markModified('theme');
      userConfig.updatedAt = new Date();
      await userConfig.save();
    }

    ctx.body = {
      success: true,
      message: '主题设置更新成功',
      theme: userConfig.theme
    };
  } catch (error) {
    console.error('更新主题错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

// PUT /api/user/settings/budget - 更新预算设置
router.put('/settings/budget', requireAuth, async (ctx) => {
  try {
    const userId = ctx.state.user.id;
    const { monthly, yearly, alertThreshold } = ctx.request.body;

    if (monthly !== undefined && monthly < 0) {
      ctx.status = 400;
      ctx.body = { message: '预算金额不能为负数' };
      return;
    }

    if (yearly !== undefined && yearly < 0) {
      ctx.status = 400;
      ctx.body = { message: '年预算不能为负数' };
      return;
    }

    if (alertThreshold !== undefined && (alertThreshold < 0 || alertThreshold > 100)) {
      ctx.status = 400;
      ctx.body = { message: '预警阈值必须在 0-100 之间' };
      return;
    }

    const userObjectId = new mongoose.Types.ObjectId(userId);
    let userConfig = await UserConfig.findOne({ userId: userObjectId });

    if (!userConfig) {
      userConfig = new UserConfig({
        userId: userObjectId,
        budget: {
          monthly: monthly !== undefined ? monthly : 5000,
          yearly: yearly !== undefined ? yearly : 60000,
          alertThreshold: alertThreshold !== undefined ? alertThreshold : 80
        }
      });
      await userConfig.save();
    } else {
      if (!userConfig.budget) userConfig.budget = {};
      if (monthly !== undefined) userConfig.budget.monthly = monthly;
      if (yearly !== undefined) userConfig.budget.yearly = yearly;
      if (alertThreshold !== undefined) userConfig.budget.alertThreshold = alertThreshold;
      userConfig.markModified('budget');
      userConfig.updatedAt = new Date();
      await userConfig.save();
    }

    ctx.body = {
      success: true,
      message: '预算设置更新成功',
      budget: userConfig.budget
    };
  } catch (error) {
    console.error('更新预算错误:', error);
    ctx.status = 500;
    ctx.body = { message: '服务器错误', error: error.message };
  }
});

module.exports = router;
