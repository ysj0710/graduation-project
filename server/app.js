const Koa = require('koa');
const Router = require('koa-router');
const bodyParser = require('koa-bodyparser');
const cors = require('koa-cors');
const authRouter = require('./routes/auth');

const app = new Koa();
const router = new Router();

// 中间件
app.use(cors({
  origin: 'http://localhost:5173',
  credentials: true
}));
app.use(bodyParser());

// 路由
router.get('/', (ctx) => {
  ctx.body = { message: '财务记账系统 API 运行中' };
});

router.use('/api', authRouter.routes(), authRouter.allowedMethods());

app.use(router.routes());
app.use(router.allowedMethods());

const PORT = 3000;
app.listen(PORT, () => {
  console.log(`服务器运行在 http://localhost:${PORT}`);
});
