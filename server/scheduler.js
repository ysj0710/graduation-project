const cron = require('node-cron');
const mongoose = require('mongoose');
const UserConfig = require('./models/UserConfig');
const Notification = require('./models/Notification');
const Transaction = require('./models/Transaction');
const User = require('./models/User');

async function checkBudgetAlerts() {
  console.log('[Scheduler] 开始检查预算预警...');
  try {
    const configs = await UserConfig.find({});

    for (const config of configs) {
      const budget = config.budget?.monthly || 5000;
      const threshold = config.budget?.alertThreshold || 80;

      // 获取本月支出
      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

      const result = await Transaction.aggregate([
        {
          $match: {
            userId: config.userId,
            type: 'expense',
            date: { $gte: startOfMonth }
          }
        },
        {
          $group: { _id: null, total: { $sum: '$amount' } }
        }
      ]);

      const spent = result[0]?.total || 0;
      const usageRate = budget > 0 ? (spent / budget * 100) : 0;

      // 超过阈值才发预警
      if (usageRate < threshold) continue;

      // 检查今天是否已发过该阈值预警（避免重复）
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      const alreadySent = await Notification.findOne({
        userId: config.userId,
        type: 'budget_alert',
        createdAt: { $gte: todayStart }
      });

      if (alreadySent) {
        console.log(`[Scheduler] 用户 ${config.userId} 今日已发预警，跳过`);
        continue;
      }

      // 构造预警内容
      let title = '预算预警提醒';
      let content = '';

      if (usageRate >= 100) {
        title = '预算已超支！';
        content = `您本月的支出已达 ¥${spent.toFixed(2)}，已超出预算 ¥${(spent - budget).toFixed(2)}，请立即控制消费！`;
      } else if (usageRate >= 90) {
        content = `您本月支出已达预算的 ${usageRate.toFixed(1)}%（¥${spent.toFixed(2)} / ¥${budget.toFixed(2)}），即将超支！`;
      } else {
        content = `您本月支出已达预算的 ${usageRate.toFixed(1)}%（¥${spent.toFixed(2)} / ¥${budget.toFixed(2)}），请注意控制支出。`;
      }

      const notification = new Notification({
        userId: config.userId,
        type: 'budget_alert',
        title,
        content,
        data: { spent, budget, usageRate: usageRate.toFixed(2) }
      });

      await notification.save();
      console.log(`[Scheduler] 已向用户 ${config.userId} 发送预算预警（${usageRate.toFixed(1)}%）`);
    }

    console.log('[Scheduler] 预算预警检查完成');
  } catch (error) {
    console.error('[Scheduler] 预算预警检查失败:', error.message);
  }
}

// 月度成就通知
async function checkMonthlyAchievements() {
  console.log('[Achievement] 开始计算上月成就...');
  try {
    const now = new Date();
    // 上个月
    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const year = lastMonthDate.getFullYear();
    const month = lastMonthDate.getMonth() + 1;
    const startDate = new Date(year, month - 1, 1);
    const endDate = new Date(year, month, 0, 23, 59, 59);

    // 聚合所有用户上月消费
    const rankings = await Transaction.aggregate([
      { $match: { date: { $gte: startDate, $lte: endDate } } },
      { $group: {
        _id: { userId: '$userId', type: '$type' },
        total: { $sum: '$amount' }
      }},
      { $group: {
        _id: '$_id.userId',
        income: { $sum: { $cond: [{ $eq: ['$_id.type', 'income'] }, '$total', 0] } },
        expense: { $sum: { $cond: [{ $eq: ['$_id.type', 'expense'] }, '$total', 0] } }
      }},
      { $addFields: { balance: { $subtract: ['$income', '$expense'] } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'user' } },
      { $unwind: { path: '$user', preserveNullAndEmpty: true } },
      { $project: { _id: 1, income: 1, expense: 1, balance: 1, name: { $ifNull: ['$user.nickname', { $ifNull: ['$user.username', '未知用户'] }] } } }
    ]);

    if (rankings.length === 0) {
      console.log('[Achievement] 上月无交易数据，跳过成就通知');
      return;
    }

    const totalUsers = rankings.length;
    const sortedByExpense = [...rankings].sort((a, b) => b.expense - a.expense);
    const sortedByBalance = [...rankings].sort((a, b) => b.balance - a.balance);
    const sortedBySaving = [...rankings].sort((a, b) => {
      const savingRateA = a.income > 0 ? ((a.income - a.expense) / a.income) : 0;
      const savingRateB = b.income > 0 ? ((b.income - b.expense) / b.income) : 0;
      return savingRateB - savingRateA;
    });

    const SPENDER_TITLES = ['消费狂魔', '败家子', '剁手族', '购物达人', '消费先锋'];
    const SAVER_TITLES = ['储蓄巨鳄', '理财高手', '省钱达人', '精打细算', '持家能手'];
    const LABEL = `${year}年${month}月`;

    const sentTitles = new Set();

    // 发送成就通知：消费排行榜（TOP 5）
    for (let i = 0; i < Math.min(5, sortedByExpense.length); i++) {
      const user = sortedByExpense[i];
      if (!user._id) continue;
      const rank = i + 1;
      const percent = Math.round((1 - rankings.findIndex(r => r._id.toString() === user._id.toString()) / totalUsers) * 100);
      const title = SPENDER_TITLES[i] || '消费达人';
      const key = `${user._id}-${title}`;
      if (sentTitles.has(key)) continue;
      sentTitles.add(key);

      const notification = new Notification({
        userId: user._id,
        type: 'achievement',
        title: `${LABEL}成就解锁！`,
        content: `恭喜！您获得了「${title}」称号！上月光消费 ¥${user.expense.toFixed(2)}，超过了 ${percent}% 的用户，继续保持！`,
        data: { title, rank, label: LABEL, expense: user.expense, percent }
      });
      await notification.save();
      console.log(`[Achievement] 已向用户 ${user._id} 发送「${title}」称号`);
    }

    // 发送成就通知：储蓄排行榜（TOP 5）
    for (let i = 0; i < Math.min(5, sortedByBalance.length); i++) {
      const user = sortedByBalance[i];
      if (!user._id || user.balance <= 0) continue;
      const rank = i + 1;
      const title = SAVER_TITLES[i] || '精打细算';
      const key = `${user._id}-${title}`;
      if (sentTitles.has(key)) continue;
      sentTitles.add(key);

      const notification = new Notification({
        userId: user._id,
        type: 'achievement',
        title: `${LABEL}成就解锁！`,
        content: `恭喜！您获得了「${title}」称号！上月底余 ¥${user.balance.toFixed(2)}，财务状况健康，继续保持理性消费！`,
        data: { title, rank, label: LABEL, balance: user.balance }
      });
      await notification.save();
      console.log(`[Achievement] 已向用户 ${user._id} 发送「${title}」称号`);
    }

    console.log(`[Achievement] 月度成就通知发送完成，共 ${sentTitles.size} 条`);
  } catch (error) {
    console.error('[Achievement] 月度成就计算失败:', error.message);
  }
}

function startScheduler() {
  // 每天早上 9 点检查一次
  cron.schedule('0 9 * * *', async () => {
    console.log('[Scheduler] 每日定时任务触发');
    await checkBudgetAlerts();
  });

  // 同时每小时快速检查一次高消费用户（阈值 >= 100% 的优先提醒）
  cron.schedule('0 * * * *', async () => {
    console.log('[Scheduler] 每小时检查（高消费用户）');
    try {
      const configs = await UserConfig.find({
        'budget.monthly': { $gt: 0 },
        'budget.alertThreshold': { $lte: 100 }
      });

      const now = new Date();
      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);

      for (const config of configs) {
        const budget = config.budget?.monthly || 5000;
        const threshold = config.budget?.alertThreshold || 80;

        const result = await Transaction.aggregate([
          {
            $match: {
              userId: config.userId,
              type: 'expense',
              date: { $gte: startOfMonth }
            }
          },
          { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const spent = result[0]?.total || 0;
        const usageRate = budget > 0 ? (spent / budget * 100) : 0;

        if (usageRate < threshold) continue;

        // 已超支（>= 100%）每小时检查一次，避免漏发
        if (usageRate >= 100) {
          const sentToday = await Notification.findOne({
            userId: config.userId,
            type: 'budget_alert',
            createdAt: { $gte: todayStart }
          });
          if (!sentToday) {
            const notification = new Notification({
              userId: config.userId,
              type: 'budget_alert',
              title: '预算已超支！',
              content: `您本月支出已达 ¥${spent.toFixed(2)}，已超出预算，请立即控制消费！`,
              data: { spent, budget, usageRate: usageRate.toFixed(2) }
            });
            await notification.save();
            console.log(`[Scheduler] 超支预警已发送至用户 ${config.userId}`);
          }
        }
      }
    } catch (error) {
      console.error('[Scheduler] 每小时检查失败:', error.message);
    }
  });

  // 每月1号早上10点，发送上月成就通知
  cron.schedule('0 10 1 * *', async () => {
    console.log('[Scheduler] 月度成就统计触发');
    await checkMonthlyAchievements();
  });

  console.log('[Scheduler] 定时任务已启动（每天9:00 + 每小时检查超支用户 + 每月1号10:00成就通知）');
}

module.exports = { startScheduler, checkBudgetAlerts, checkMonthlyAchievements };
