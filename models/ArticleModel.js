// 1.引入mongoose
const mongoose = require('mongoose')

// 2.字义Schema(描述文档结构)
const ArticleSchema = new mongoose.Schema({
  title: { type: String, require: true },//文章标题
  author: { type: String, required: true }, // 作者
  description: { type: String, required: true }, // 文章简介
  keyword: { type: String, required: true }, // 文章内容
  content: { type: String, required: true }, // 文章关键字
  cover: { type: String, required: true }, // 文章封面
  browse:{type:Number,default:0}, //文章浏览数
  // category_id: { type: String, required: true}, //文章分类
  // 文章关联分类
  category_id:{
    type:mongoose.Schema.Types.ObjectId,
    ref:'Category'
  }
}, { timestamps: { createdAt: 'created', updatedAt: 'updated' }})

// 3.定义Model(与几何对应,可以操作集合)
const ArticleModel = mongoose.model('Article', ArticleSchema);

// 4.向外暴露model
module.exports = ArticleModel;