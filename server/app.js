const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors');
const mongoose = require('mongoose');
const authRouter = require('./routes/auth');

const app = new Koa();
const router = new Router();

// MongoDB 连接
const MONGO_URI = 'mongodb://127.0.0.1:27017/finance_db';

mongoose.connect(MONGO_URI)
  .then(() => {
    console.log('✅ MongoDB 连接成功');
  })
  .catch(err => {
    console.error('❌ MongoDB 连接失败:', err);
  });

// 中间件
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser());

// 路由
router.get('/', (ctx) => {
  ctx.body = { message: '财务记账系统 API 运行中', mongodb: mongoose.connection.readyState === 1 ? '已连接' : '未连接' };
});

router.use('/api/auth', authRouter.routes(), authRouter.allowedMethods());

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
