const Router = require('koa-router');
const AdminModel = require('../models/AdminModel')
const bouncer = require('koa-bouncer');
// 生成token的模块
const jwt = require('jsonwebtoken');
// 对前端传入的token进行验证模块
const jwtAuth = require('koa-jwt');
const config = require('../config')
const { registerValidator, adminValidator } = require('../validators/admin')



const router = new Router({
  prefix: '/api/v1/admin'
})

// 注册管理员
router.post('/register', async function (ctx, next) {
  // 注册参数校验
  registerValidator(ctx);

  const { nickname, password2 } = ctx.request.body;
  const adminUser = await AdminModel.findOne({ nickname: ctx.vals.nickname })
  if (adminUser) {
    throw new global.errs.Existing('管理员已存在');
  }
  const admin = await AdminModel.create({
    nickname: nickname,
    password: password2,
  })
  // 返回结果
  ctx.response.status = 200;
  ctx.body = {
    ok: 1,
    data: admin
  }
})

// 管理员登录
router.post('/login', async (ctx, next) => {
  adminValidator(ctx);
  const { nickname, password } = ctx.request.body;

  const admin = await AdminModel.findOne({ nickname })
  if (!admin) {
    throw new global.errs.AuthFailed('账号不存在或者密码不正确')
  } else {
    ctx.body = {
      ok: 1,
      code: 200,
      message: "登录成功",
      token: jwt.sign(
        {
          data: admin._id, //由于签名不是加密,令牌不要存放敏感数据
          exp: config.security.expiresIn//过期时间一分钟
        }, config.security.secretKey
      )
    }
  }
})
// 获取用户信息
router.get('/auth', jwtAuth({ secret: config.security.secretKey }), async (ctx, next) => {

  // 可以通过ctx.state命名空间获取用户数据
  const _id = ctx.state.user.data;
  // 查询用户信息
  let userInfo = await AdminModel.findById(_id)
  if (!userInfo) {
    throw new global.errs.AuthFailed('账号不存在或者密码不正确')
  }
  ctx.status = 200;
  ctx.body = {
    ok: 1,
    data: {
      id: userInfo._id,
      nickname: userInfo.nickname,
      email: userInfo.email
    }
  }
})

// 退出操作 后端不需要写接口,前端只需要将token清除即可
module.exports = router;
