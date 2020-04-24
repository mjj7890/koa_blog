const Router = require('koa-router');
const jwtAuth = require('koa-jwt')
const config = require('../config')
const CategoryModle = require('../models/CategoryModel')
const { getRedis, setRedis } = require('../cache/_redis')
const REDIS_KEY_API_PREFIX = 'boblog_api'
const router = new Router({
  prefix: '/api/v1'
})
const {categoryValidator} = require('../validators/category')
// 添加分类
router.post('/category', jwtAuth({ secret: config.security.secretKey }), async ctx => {
  // 验证参数是否通过
  categoryValidator(ctx);
  const { name, keyword } = ctx.request.body;
  await CategoryModle.create({ name, keyword });
  ctx.status = 200;
  ctx.body = {
    ok: 1,
    msg: '创建分类成功'
  }
})

// 删除分类
router.delete('/category/:id', jwtAuth({ secret: config.security.secretKey }), async ctx => {
  try {
    const category = await CategoryModle.findByIdAndDelete({ _id: ctx.params.id });
    if (category) {
      ctx.status = 200;
      ctx.body = {
        ok: 1,
        msg: '删除分类成功'
      }
    } else {
      ctx.body = {
        ok: 0,
        msg: '请检查分类id'
      }
    }

  } catch (error) {

    throw error;
  }
})
// 更新分类
router.put('/category/:id', jwtAuth({ secret: config.security.secretKey }), async ctx => {
  const id = ctx.params.id;
  const { name, keyword } = ctx.request.body;
  try {
    const category = await CategoryModle.findByIdAndUpdate({ _id: id }, {
      name: name,
      keyword: keyword
    })
    if (!category) {
      ctx.body = {
        ok: 0,
        msg: '没有找到相关分类'
      }
    } else {
      ctx.body = {
        ok: 1,
        msg: "更新分类成功"
      }
    }
  } catch (error) {
    throw error;
  }
})
// 获取所有分类列表
router.get('/category', async ctx => {
  const key = `${REDIS_KEY_API_PREFIX}_category_list`
  const cacheCategoryListData = await getRedis(key)
  if (cacheCategoryListData) {
    // 返回结果
    ctx.body = {
      ok: 1,
      data: cacheCategoryListData
    }
  } else {
    try {
      const categoryList = await CategoryModle.find();
      setRedis(key, categoryList, 60)
      // 返回结果
      ctx.response.status = 200;
      ctx.body = {
        ok: 1,
        data: categoryList
      }
    } catch (error) {
      ctx.throw(error);
    }
  }
})

// 获取分类详情
router.get('/category/:id', async ctx => {
  const _id = ctx.params.id;
  try {
    const categoryDetail = await CategoryModle.findById({ _id })
    if (!categoryDetail) {
      ctx.body = {
        ok: 0,
        msg: "需要分类的ID"
      }
    } else {
      ctx.body = {
        ok: 1,
        data: categoryDetail
      }
    }
  } catch (error) {
    ctx.throw(error);
  }

})

module.exports = router;