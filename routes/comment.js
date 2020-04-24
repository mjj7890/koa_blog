const Router = require('koa-router');
const CommentModel = require('../models/CommentModel')
const ReplyModel = require('../models/ReplyModel')
const { commentValidator } = require('../validators/comment');

const { setRedis} = require('../cache/_redis')
const jwt = require('koa-jwt')
const config = require('../config')
const router = new Router({
  prefix: '/api/v1'
})
// 创建评论
router.post('/comment', async ctx => {
  // 验证参数
  commentValidator(ctx);
  const comment = await CommentModel.create(ctx.request.body);
  // console.log(comment);
  
  ctx.body = {
    ok: 1,
    data: comment
  }
})
// 删除评论 
router.delete('/comment/:id', jwt({ secret: config.security.secretKey}),async ctx=>{
  // 获取分类ID参数
  const id = ctx.params.id
  const comment = await CommentModel.deleteOne({_id:id});
  if(comment.n===0){
    throw new global.errs.NotFound('没有找到相关评论');
  }
  ctx.status = 200;
  ctx.body = {
    ok:1,
    msg:'删除评论成功'
  }
})
// 更新单个评论
router.put('/comment/:id',jwt({secret:config.security.secretKey}),async ctx=>{
  const {nickname,content,target_id,target_type} = ctx.request.body;
  // console.log(nickname, content, target_id, target_type, ctx.params.id);
  
  const comment = await CommentModel.findByIdAndUpdate({_id:ctx.params.id},{
    nickname:nickname,
    content:content,
    target_id:target_id,
    target_type:target_type
  })
  // console.log(comment);
  if(!comment){
    throw new global.errs.NotFound('没有找到相关评论信息')
  }
  
  ctx.body = {
    ok:1,
    msg:'更新评论成功'
  }
})

// 获取评论列表
router.get('/comment',async ctx=>{
  const {pageIndex,pageSize} = ctx.query;
  const comments = await CommentModel.find()
  const commentList = await CommentModel.find().skip((parseInt(pageIndex) - 1) * parseInt(pageSize)).sort([['_id', -1]]).limit(parseInt(pageSize))
  ctx.status = 200;
  ctx.body = {
    ok: 1,
    data: {
      commentList,
      currentPage: parseInt(pageIndex),
      total: comments.length,
      pageSize: parseInt(pageSize),
    }
  }
})

// 获取评论详情
router.get('/comment/:id',async ctx=>{
  const id = ctx.params.id

  const comment = await CommentModel.findById({ _id: id })
  console.log(comment);
  
  const reply = await ReplyModel.find({comment_id:id},'nickname _id content comment_id created_at');
  // console.log(comment);
  ctx.body = {
    ok:1,
    data:{
      comment,
      reply
    }
  }

})

// router.get('/comment/target/list',async ctx=>{
//   // const commentList = await CommentModel.find().skip((parseInt(pageIndex) - 1) * parseInt(pageSize)).limit(parseInt(pageSize))
// })

module.exports = router;