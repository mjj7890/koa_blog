const Router = require('koa-router')
const router = new Router({ prefix: '/api/v1' })

router.get('/user', async function (ctx, next) {
  ctx.body = 'this a users response!';
})

module.exports = router;
