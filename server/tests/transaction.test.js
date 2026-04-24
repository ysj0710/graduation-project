const request = require('supertest');
const mongoose = require('mongoose');
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const transactionRouter = require('../routes/transactions');

const TEST_DB_URI = 'mongodb://127.0.0.1:27017/finance_test';

// 模拟JWT中间件
function mockAuthMiddleware(userId) {
  return async (ctx, next) => {
    ctx.state.userId = userId;
    await next();
  };
}

function createApp(userId) {
  const app = new Koa();
  app.use(bodyParser());
  app.use(mockAuthMiddleware(userId));
  app.use(transactionRouter.routes());
  app.use(transactionRouter.allowedMethods());
  return app;
}

describe('交易记录模块测试', () => {
  let app;
  let testUserId = new mongoose.Types.ObjectId();

  beforeAll(async () => {
    await mongoose.connect(TEST_DB_URI);
    app = createApp(testUserId.toString());
  });

  afterAll(async () => {
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    const Transaction = require('../models/Transaction');
    await Transaction.deleteMany({});
  });

  describe('POST / - 添加交易记录', () => {
    it('应该成功添加支出记录', async () => {
      const res = await request(app.callback())
        .post('/')
        .send({
          type: 'expense',
          amount: 100,
          category: '餐饮',
          note: '午餐',
          date: new Date().toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('记账成功');
      expect(res.body.transaction.amount).toBe(100);
    });

    it('应该成功添加收入记录', async () => {
      const res = await request(app.callback())
        .post('/')
        .send({
          type: 'income',
          amount: 5000,
          category: '工资',
          note: '月薪',
          date: new Date().toISOString()
        });

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('记账成功');
    });

    it('应该拒绝缺少必要字段的请求', async () => {
      const res = await request(app.callback())
        .post('/')
        .send({
          type: 'expense'
        });

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('缺少必要参数');
    });

    it('应该拒绝无效的金额', async () => {
      const res = await request(app.callback())
        .post('/')
        .send({
          type: 'expense',
          amount: -100,
          category: '餐饮'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('GET / - 获取交易列表', () => {
    beforeEach(async () => {
      const Transaction = require('../models/Transaction');
      // 创建测试数据
      await Transaction.create([
        {
          userId: testUserId,
          type: 'expense',
          amount: 100,
          category: '餐饮',
          date: new Date()
        },
        {
          userId: testUserId,
          type: 'income',
          amount: 5000,
          category: '工资',
          date: new Date()
        }
      ]);
    });

    it('应该返回交易列表', async () => {
      const res = await request(app.callback())
        .get('/')
        .query({ page: 1, pageSize: 10 });

      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(2);
      expect(res.body.total).toBe(2);
    });

    it('应该支持类型筛选', async () => {
      const res = await request(app.callback())
        .get('/')
        .query({ type: 'expense' });

      expect(res.status).toBe(200);
      expect(res.body.transactions).toHaveLength(1);
      expect(res.body.transactions[0].type).toBe('expense');
    });
  });

  describe('GET /statistics - 获取统计数据', () => {
    beforeEach(async () => {
      const Transaction = require('../models/Transaction');
      await Transaction.create([
        {
          userId: testUserId,
          type: 'expense',
          amount: 300,
          category: '餐饮',
          date: new Date()
        },
        {
          userId: testUserId,
          type: 'expense',
          amount: 200,
          category: '交通',
          date: new Date()
        },
        {
          userId: testUserId,
          type: 'income',
          amount: 5000,
          category: '工资',
          date: new Date()
        }
      ]);
    });

    it('应该返回正确的统计数据', async () => {
      const res = await request(app.callback())
        .get('/statistics');

      expect(res.status).toBe(200);
      expect(res.body.income.total).toBe(5000);
      expect(res.body.expense.total).toBe(500);
      expect(res.body.balance).toBe(4500);
    });
  });

  describe('DELETE /:id - 删除交易记录', () => {
    let transactionId;

    beforeEach(async () => {
      const Transaction = require('../models/Transaction');
      const transaction = await Transaction.create({
        userId: testUserId,
        type: 'expense',
        amount: 100,
        category: '餐饮',
        date: new Date()
      });
      transactionId = transaction._id;
    });

    it('应该成功删除记录', async () => {
      const res = await request(app.callback())
        .delete(`/${transactionId}`);

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('删除成功');
    });

    it('应该拒绝删除不存在的记录', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const res = await request(app.callback())
        .delete(`/${fakeId}`);

      expect(res.status).toBe(404);
      expect(res.body.message).toBe('记录不存在');
    });
  });
});
