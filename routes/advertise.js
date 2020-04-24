const Router = require('koa-router')
const router = new Router();
const AdvertiseModel = require('../models/AdvertiseModel');
const { advertiseValidator } = require('../validators/advertise')
const jwt = require('koa-jwt')
const config = require('../config')
router.prefix('/api/v1')

// 创建广告
router.post('/advertise', async ctx => {
  advertiseValidator(ctx);
  const { title, link } = ctx.request.body;
  console.log(title, link);
  const hasAdvertise = await AdvertiseModel.findOne({ title: title });
  // 如果存在 抛出存在信息
  if (hasAdvertise) {
    throw new global.errs.Existing('广告已存在')
  }
  let advertise = await AdvertiseModel.create({ title: title, link: link })

  advertise = advertise.toJSON({ getters: true });
  console.log(advertise);

  ctx.body = {
    ok: 1,
    msg: advertise
  }
})

// 获取广告详情
router.get('/advertise/:id', async ctx => {
  const _id = ctx.params.id
  console.log(_id);
  
  const advertise = await AdvertiseModel.findById({_id});
  if(!advertise){
    throw new global.errs.NotFound('广告不存在')
  }
  ctx.status = 200;
  ctx.body = {
    ok:1,
    data:advertise
  }
})
// 获取广告列表
router.get('/advertise',async ctx=>{
  const {pageIndex,pageSize} = ctx.query;
  const list = await AdvertiseModel.find({},'title link').skip((parseInt(pageIndex) - 1) * parseInt(pageSize)).limit(parseInt(pageSize))
  ctx.status = 200;
  ctx.body = {
    ok:1,
    data: {
      list,
      currentPage: parseInt(pageIndex),
      total: list.length,
      pageSize: parseInt(pageSize),
    }
  }
})
// 更新广告
router.put('/advertise/:id',jwt({secret:config.security.secretKey}),async ctx=>{
  const _id = ctx.params.id;
  const { title, link } = ctx.request.body;
  const advertise = await AdvertiseModel.findByIdAndUpdate({_id},{
    title,link
  })
  if(!advertise){
    throw new global.errs.NotFound('没有找到相关广告信息');
  }  
  ctx.status = 200;
  ctx.body = {
    ok:1,
    msg:"更新广告成功"
  }
})
router.delete('/advertise/:id',jwt({secret:config.security.secretKey}),async ctx=>{
  const _id = ctx.params.id;
  const advertise = await AdvertiseModel.findByIdAndDelete({_id});
  if(!advertise){
    throw new global.errs.NotFound('没有找到相广告');
  }
  ctx.body = {
    ok:1,
    msg:"删除广告成功"
  }
})

module.exports = router;