// 对秘密加盐模块
const bcrypt  = require('bcrypt');
// 配置加盐的位数
const SALT_WORK_FACTOR = 10 //配置加盐的位数
// 1.引入mongoose
const mongoose = require('mongoose')

// 2.字义Schema(描述文档结构)
const adminSchema = new mongoose.Schema({
  nickname: { type: String, require: true },//角色名称
  password: {
    type: String,
    required: true,
    set:(val)=>{
      // 加密
      const salt = bcrypt.genSaltSync(SALT_WORK_FACTOR);
      // 生成加密密码
      const psw = bcrypt.hashSync(val, salt);
      return psw;
    }
  }, // 密码
})

// 3.定义Model(与几何对应,可以操作集合)
const AdminModel = mongoose.model('Admin', adminSchema);

// 4.向外暴露model
module.exports = AdminModel;