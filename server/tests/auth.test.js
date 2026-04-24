const request = require('supertest');
const mongoose = require('mongoose');

// 模拟Koa应用
const Koa = require('koa');
const bodyParser = require('koa-bodyparser');
const authRouter = require('../routes/auth');

// 测试数据库连接
const TEST_DB_URI = 'mongodb://127.0.0.1:27017/finance_test';

// 创建测试应用
function createApp() {
  const app = new Koa();
  app.use(bodyParser());
  app.use(authRouter.routes());
  app.use(authRouter.allowedMethods());
  return app;
}

describe('用户认证模块测试', () => {
  let app;
  let testUser = {
    username: 'testuser',
    password: 'testpass123',
    email: 'test@example.com'
  };

  beforeAll(async () => {
    // 连接测试数据库
    await mongoose.connect(TEST_DB_URI);
    app = createApp();
  });

  afterAll(async () => {
    // 清理测试数据
    await mongoose.connection.dropDatabase();
    await mongoose.connection.close();
  });

  beforeEach(async () => {
    // 清理用户数据
    const User = require('../models/User');
    await User.deleteMany({});
  });

  describe('POST /register - 用户注册', () => {
    it('应该成功注册新用户', async () => {
      const res = await request(app.callback())
        .post('/register')
        .send(testUser);

      expect(res.status).toBe(201);
      expect(res.body.message).toBe('注册成功');
      expect(res.body.userId).toBeDefined();
    });

    it('应该拒绝重复用户名', async () => {
      // 先注册一个用户
      await request(app.callback())
        .post('/register')
        .send(testUser);

      // 再次使用相同用户名注册
      const res = await request(app.callback())
        .post('/register')
        .send(testUser);

      expect(res.status).toBe(400);
      expect(res.body.message).toBe('用户名已存在');
    });

    it('应该拒绝缺少必要字段的请求', async () => {
      const res = await request(app.callback())
        .post('/register')
        .send({ username: 'testuser' });

      expect(res.status).toBe(400);
    });

    it('应该拒绝密码太短的请求', async () => {
      const res = await request(app.callback())
        .post('/register')
        .send({
          ...testUser,
          username: 'testuser2',
          password: '123'
        });

      expect(res.status).toBe(400);
    });
  });

  describe('POST /login - 用户登录', () => {
    beforeEach(async () => {
      // 先注册一个用户
      await request(app.callback())
        .post('/register')
        .send(testUser);
    });

    it('应该成功登录', async () => {
      const res = await request(app.callback())
        .post('/login')
        .send({
          username: testUser.username,
          password: testUser.password
        });

      expect(res.status).toBe(200);
      expect(res.body.message).toBe('登录成功');
      expect(res.body.token).toBeDefined();
      expect(res.body.user).toBeDefined();
    });

    it('应该拒绝错误的密码', async () => {
      const res = await request(app.callback())
        .post('/login')
        .send({
          username: testUser.username,
          password: 'wrongpassword'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('用户名或密码错误');
    });

    it('应该拒绝不存在的用户', async () => {
      const res = await request(app.callback())
        .post('/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(res.status).toBe(401);
      expect(res.body.message).toBe('用户名或密码错误');
    });
  });
});
