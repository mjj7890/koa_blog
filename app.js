const Koa = require('koa')
const Router = require('koa-router')
const app = new Koa()

const views = require('koa-views')
const co = require('co')
const convert = require('koa-convert')
const json = require('koa-json')
const onerror = require('koa-onerror')
const bodyparser = require('koa-bodyparser')
const logger = require('koa-logger')
const debug = require('debug')('koa2:server')
const path = require('path')
const config = require('./config')

const index = require('./routes')
const users = require('./routes/users')
const article = require('./routes/article')
const admin = require('./routes/admin')
const category = require('./routes/category')
const comment = require('./routes/comment')
const reply = require('./routes/reply')
const advertise = require('./routes/advertise')
const cors = require('koa2-cors');
const bouncer = require('koa-bouncer');
const hbs = require('koa-hbs')
const helpers = require('handlebars-helpers');
const static = require('koa-static')
const port = process.env.PORT || config.port

const errors = require('./core/http-exception')

global.errs = errors
// error handler
onerror(app)
app.use(cors())
// handlebars-helpers这个库中所有的方法都能使用
helpers.comparison({handlebars:hbs.handlebars});

// 401未授权
app.use(function (ctx, next) {

  // 当用户未传token值的时候的错误处理
  return next().catch((err) => {

    if (err instanceof bouncer.ValidationError) {
      ctx.body = {
        name: err.name,
        message: err.message
      };
      return;
    }
    if (err.status === 401) {
      ctx.status = 401;
      ctx.body = {
        error: err.originalError ? err.originalError.message : err.message
      };
    } else {
      // throw err;
      ctx.body = {
        msg: err.msg,
        error_code: err.errorCode,
        request: `${ctx.method} ${ctx.path}`
      }
    }
  });
});

// middlewares
console.log(__dirname);

app.use(bodyparser())
  .use(json())
  .use(logger())
  .use(bouncer.middleware())
  .use(static(__dirname + '/public'))
  .use(hbs.middleware({
    viewPath: __dirname + '/views',
    defaultLayout: 'layout',
    partialsPath: __dirname + '/views/partials',
    disableCache: true
  }))
  
// 注册模板引擎的中间件

// .use(views(path.join(__dirname, '/views'), {
//   options: {
//     settings: {
//       views: path.join(__dirname, 'views')
//     },

//   },

//   // 修改位置
//   map: { 'hbs': 'handlebars' },
//   extension: 'hbs',
// }))

// logger
app.use(async (ctx, next) => {
  const start = new Date()
  await next()
  const ms = new Date() - start
  console.log(`${ctx.method} ${ctx.url} - $ms`)
})

// router.get('/', async (ctx, next) => {
//   // ctx.body = 'Hello World'
//   ctx.state = {
//     title: 'Koa2'
//   }
//   await ctx.render('index', ctx.state)
// })

// 注册路由
app.use(index.routes(), index.allowedMethods());
app.use(users.routes(), users.allowedMethods());
app.use(admin.routes(), admin.allowedMethods());
app.use(category.routes(), category.allowedMethods());
app.use(article.routes(), article.allowedMethods());
app.use(comment.routes(), comment.allowedMethods());
app.use(reply.routes(), reply.allowedMethods());
app.use(advertise.routes(), advertise.allowedMethods());


//通过mongoose链接数据库
const db = require('./db');

app.on('error', function (err, ctx) {
  console.log(err);

  logger.error('server error', err, ctx)
})

module.exports = app.listen(config.port, () => {
  console.log(`Listening on http://localhost:${config.port}`)
})
