const Router = require('koa-router');
const router = new Router({
  prefix: "/api/v1"
})
const { replyValidator } = require('../validators/reply')
const ReplyModel = require('../models/ReplyModel');
const CommentModel = require('../models/CommentModel');
const jwt = require('koa-jwt');
const config = require('../config')
// 创建回复
router.post('/reply', async ctx => {
  // 通过验证器校验参数是否通过
  replyValidator(ctx);
  const { nickname, content, comment_id } = ctx.request.body
  console.log(nickname, content, comment_id);

  // 创建回复
  const comment = await CommentModel.findById({ _id: comment_id })

  if (!comment) {
    throw new global.errs.NotFound('没有找到相关评论');
  }
  let reply = await ReplyModel.create({
    nickname: nickname,
    content: content,
    comment_id: comment_id
  })
  console.log(reply);

  // 要想调用get方法 必须将数据转成json
  reply = reply.toJSON({ getters: true });
  // console.log(reply);

  ctx.body = {
    ok: 1,
    data: reply
  }
})

// 回复评论详情
router.get('/reply/:id', async ctx => {
  const _id = ctx.params.id;
  let reply = await ReplyModel.findById({ _id })
  ctx.status = 200;
  ctx.body = {
    ok: 1,
    data: reply
  }
})

// 获取评论列表
router.get('/reply', async ctx => {
  const comment_id = ctx.query.comment_id;
  let replyList = await ReplyModel.find({ comment_id }).sort({ createAt: 'desc' });
  ctx.status = 200;
  ctx.body = {
    ok: 1,
    data: replyList
  }
})
// 更新单个回复评论
router.put('/reply/:id', jwt({ secret: config.security.secretKey }), async ctx => {
  const _id = ctx.params.id;
  const { nickname, content, comment_id } = ctx.request.body;
  let reply = await ReplyModel.findByIdAndUpdate({ _id }, {
    nickname,
    content,
    comment_id
  })
  if (!reply) {
    throw new global.errs.NotFound('没有找到相关评论回复信息')
  }
  ctx.body = {
    ok: 1,
    msg: "更新评论成功"
  }
})

// 删除单篇回复评论
router.delete('/reply/:id', jwt({ secret: config.security.secretKey }), async ctx => {
  const _id = ctx.params.id;
  const reply = await ReplyModel.findByIdAndDelete({ _id });
  if (!reply) {
    throw new global.errs.NotFound('没有找到相关评论')
  }
  ctx.status = 200;
  ctx.body = {
    ok: 1,
    msg: '删除评论成功'
  }
})
module.exports = router;