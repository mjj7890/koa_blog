const ArticleModel = require('../models/ArticleModel')
const CommentModel = require('../models/CommentModel')
const ReplyModel = require('../models/ReplyModel')
const Router = require('koa-router');
const router = new Router();
const jwtAuth = require('koa-jwt');
const config = require('../config')
const { getRedis, setRedis } = require('../cache/_redis')
const { articleValidator } = require('../validators/article')
// const mongoose = require('mongoose');
// redis key 前缀
const REDIS_KEY_API_PREFIX = 'xiaomage_api'

// 设置路由前缀
router.prefix('/api/v1')
// (这个时候要注意,是否用户登录过,判断token是否存在,路由守卫)
// 添加文章(必须需用用户的token)
router.post('/article', jwtAuth({ secret: config.security.secretKey }), async function (ctx, next) {
  // 通过验证器校验参数是否通过
  articleValidator(ctx);
  // 获取文章标题,查找数据库是否有相同的标题,如果有返回文章已存在,如果没有则添加文章
  const { title } = ctx.request.body
  try {
    const hasArticle = await ArticleModel.findOne({ title: title })
    if (hasArticle) {
      // throw new Error('文章已存在');
      ctx.body = { ok: 0, msg: '文章已存在' }
    } else {
      // 创建文章 添加一条数据 使用create
      await ArticleModel.create(ctx.request.body)
      // console.log(article);
      ctx.body = { ok: 1, msg: "创建文章成功" }
    }
  } catch (error) {
    throw error;
  }
})

// 删除文章
router.delete('/article/:id', jwtAuth({ secret: config.security.secretKey }), async ctx => {

  // 获取文章ID参数
  // console.log(ctx.params.id);
  let article = await ArticleModel.findByIdAndDelete({
    _id: ctx.params.id
  })
  if (!article) {
    throw new global.errs.NotFound('没有找到相关文章')
  }
  ctx.status = 200;
  ctx.body = { ok: 1, msg: "删除文章成功" }
})
// 更新文章
router.put('/article/:id', jwtAuth({ secret: config.security.secretKey }), async ctx => {

  // 获取文章ID参数
  // console.log(ctx.params.id);
  // console.log(ctx.request.body);
  const { title, author, description, keyword, content, cover, category_id, browse } = ctx.request.body
  try {
    let article = await ArticleModel.findOneAndUpdate({ _id: ctx.params.id }, {
      title,
      author,
      description,
      keyword,
      content,
      cover,
      category_id,
      browse
    })
    if (!article) {
      throw new global.errs.NotFound('没有找到相关文章');
    }
    ctx.body = { ok: 1, msg: "更新文章成功" }
  } catch (error) {
    ctx.body = { ok: 0, msg: '更新商品字段异常,请重新尝试' };
  }

})

// 获取文章
router.get('/article', async ctx => {
  // 获取文章缓存数据
  const { category_id = 0, pageNum = 1, pageSize = 10,keyword } = ctx.query;
  const key = `${REDIS_KEY_API_PREFIX}_article_list_category_id${category_id}_page${pageNum}`
  const cacheArticleData = await getRedis(key);

  if (cacheArticleData) {

    ctx.body = {
      ok: 1,
      data: cacheArticleData
    }
  } else {

    try {
      // 没有缓存,则读取数据库
      //  const articles = await ArticleModel.find()
      //  let category_id_obj = mongoose.Types.ObjectId(category_id);

      // if (category_id) {
      //   articleList = await ArticleModel.find({ category_id: category_id }).skip((parseInt(pageNum) - 1) * parseInt(pageSize)).limit(parseInt(pageSize)).populate('category_id')
      // } else {
      //   // 文章
      //   const reg = new RegExp(keyword, 'i');//不区分大小写
      //   articleList = await ArticleModel.find().skip((parseInt(pageNum) - 1) * parseInt(pageSize)).limit(parseInt(pageSize)).populate('category_id')
      // }
      let filter = {};
      // 筛选方式：存在分类ID
      if (category_id) {
        filter.category_id = category_id;
      }
      // 文章
      const reg = new RegExp(keyword, 'i');//不区分大小写
      let articleList = await ArticleModel.find().where(filter).skip(
        (parseInt(pageNum) - 1) * parseInt(pageSize)
      ).limit(
        parseInt(pageSize)
      ).or([
        // 模糊查询  query.or([{条件1},{条件2}])
        {
          keyword: {
            $regex: reg
          }
        }
      ]).sort({ _id: -1 }).populate('category_id').lean();
      const data = {
        articleList,
        currentPage: parseInt(pageNum),
        total: articleList.length,
        pageSize: parseInt(pageSize),
      }
      // 设置redis中缓存的数据
      //  setRedis(key, data, 60)
      ctx.status = 200;
      ctx.body = {
        ok: 1,
        data
      }
    } catch (error) {
      throw error
    }
  }
})

// 查询文章详情
router.get('/article/:id', async ctx => {
  // console.log(ctx.params.id);
  // 尝试获文章取缓存
  const key = `${REDIS_KEY_API_PREFIX}_article_detail_${ctx.params.id}`
  // console.log(key);

  const cacheArticleDetail = await getRedis(key)
  // console.log(cacheArticleDetail);

  if (cacheArticleDetail) {
    ctx.body = {
      ok: 1,
      data: cacheArticleDetail
    };
  } else {
    // 查询文章ID参数
    const _id = ctx.params.id;


    // 查询文章
    const articleById = await ArticleModel.findById({ _id }).populate('category_id')
    // 更新文章浏览数
    const article = await ArticleModel.findByIdAndUpdate({ _id }, { browse: ++articleById.browse })
    // 获取目标下的评论列表
    const commentList = await CommentModel.find({ target_id: _id }).sort({'_id':-1}).lean();
    // console.log(commentList);
    
    // 获取目标下的回复列表
    let newCommentList = await Promise.all(commentList.map(async (comment) => {
      return (async () => {

        let replyList = await ReplyModel.find({ comment_id: comment._id }).lean();
        // console.log(replyList);
        
        comment.replyList = replyList;
        // console.log(comment)
        return comment;
      })()
    }))
   

    const data = { articleDetail: articleById, commentList: newCommentList }


    if (!article) {
      throw new global.errs.NotFound('没有找到相关文章');
    }

    // 未来要做的事情????
    // 获取关联此文章的评论列表


    // 更新文章浏览
    // 设置缓存
    // setRedis(key,articleById,60);
    ctx.status = 200;
    ctx.body = {
      ok: 1,
      data
    }
  }
})


module.exports = router;

