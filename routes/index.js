const Router = require('koa-router');
const router = new Router();

const { getRedis, setRedis } = require('../cache/_redis')
const ArticleModel = require('../models/ArticleModel')
const CategoryModel = require('../models/CategoryModel')
const AdvertiseModel = require('../models/AdvertiseModel')
const CommentModel = require('../models/CommentModel')
const ReplyModel = require('../models/ReplyModel')
const { PositiveIdParamsValidator } = require('../validators/article')
const REDIS_KEY_PREFIX = 'xiaomagebolog';



/*
首页-文章列表页
*/
router.get('/', async (ctx, next) => {
  ctx.state = {
    title: '小马哥博客'
  };
  // 获取参数
  const { category_id = 0, pageIndex = 1, pageSize = 4, keyword } = ctx.query;
  // 如果用户是第一次访问网页,则获取首页中相关数据直接渲染
  // 如果不是,从redis中获取缓存的热点数据渲染
  // 设置redis的key
  let key = `${REDIS_KEY_PREFIX}_article_list_category_id${category_id}_page${pageIndex}_pageSize${pageSize}`;
  if (keyword) {
    key += 'keyword';
  }
  console.log(key);

  // 读取Redis中的数据 缓存热点数据
  const cacheArticleData = await getRedis(key);
  console.log(cacheArticleData);


  if (cacheArticleData && !keyword) {

    ctx.response.status = 304;
    await ctx.render('index', cacheArticleData);
  } else {
    // 如果没有缓存数据,则读取数据库数据
    // 筛选方式
    let filter = {};
    // 筛选方式：存在分类ID
    if (category_id) {
      filter.category_id = category_id;
    }
    // 文章
    const reg = new RegExp(keyword, 'i');//不区分大小写
    let article = await ArticleModel.find().where(filter).skip(
      (parseInt(pageIndex) - 1) * parseInt(pageSize)
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

    // 使用lean()方法 来获取json对象
    // article = article.map(item=>{
    //   return {
    //     title:item.title
    //   }
    // })
    console.log(article);

    // 分类
    let category = await CategoryModel.find().lean();

    // 广告
    let advertise = await AdvertiseModel.find().lean();

    // ctx.body = { article };

    const data = {
      title: '马哥博客',
      description: '',
      keyword: '',
      isArticleList: true,
      navActiveTag: 'article',
      isArticleDetail: false,
      needHighlighting: false,
      isComment: true,
      article,
      advertise,
      category
    }
    // 设置缓存 过期时间
    setRedis(key, data, 60);
    // 响应返回页面
    ctx.status = 200;
    const LAST_MODIFIED_TIME = '123'
    ctx.response.set('Content-Type', 'text/html charset=utf-8')
    // 设置缓存控制
    ctx.response.set('Cache-Control', 'max-age=60, s-maxage=90')
    // 如果服务器端的资源没有变化，则自动返回 HTTP 304（Not Changed.）状态码，内容为空，这样就节省了传输数据量。
    // 当服务器端代码发生改变或者重启服务器时，则重新发出资源，返回和第一次请求时类似。从而保证不向客户端重复发出资源，也保证当服务器有变化时，客户端能够得到最新的资源。
    ctx.response.set('Last-Modified', LAST_MODIFIED_TIME)
    await ctx.render('index', data);
  }
})

// 文章详情页面
router.get('/article/detail/:id', async ctx => {

  // 尝试获文章取缓存
  const key = `${REDIS_KEY_PREFIX}_article_detail_${ctx.params.id}`
  const cacheArticleDetail = await getRedis(key);
  if (cacheArticleDetail) {
    console.log('读取缓存详情数据');
    ctx.status = 304;
  } else {
    // 通过验证器校验参数是否通过
    PositiveIdParamsValidator(ctx);
    const _id = ctx.params.id

    // 查询文章
    const article = await ArticleModel.findById({ _id }).lean();

    // 分类
    const category = await CategoryModel.find().lean();
    // 广告
    const advertise = await AdvertiseModel.find().lean();
    // 获取关联此文章的评论列表
    const target_id = article._id;
    // 
    const commentList = await CommentModel.find({ target_id }).lean();
    // console.log(_id, category, advertise, target_id, commentList);
    // const reply = await ReplyModel.find({ comment_id: commentList[0]._id})
    // console.log(reply);
    
    // 获取该评论下的回复
    let replyList = []
    for(let i = 0;i < commentList.length;i++){
      console.log(commentList[i]._id);
      
        replyList = await ReplyModel.find({ comment_id: commentList[i]._id }).lean()
      
    }
   
    

    // 更新文章浏览
    await ArticleModel.findByIdAndUpdate({_id},{browse:++article.browse});

    const data = {
      article,
      category,
      advertise,
      commentList,
      replyList
    }
    // console.log(data);
    
    // 设置Redis 缓存 过期时间1分钟

    ctx.status = 200;
    // 返回结果
    await ctx.render('article-detail',data);
  }

})

router.get('/about', async ctx => {
  ctx.response.status = 200
  ctx.response.set('Content-Type', 'text/html charset=utf-8')
  await ctx.render('about')
})

module.exports = router;