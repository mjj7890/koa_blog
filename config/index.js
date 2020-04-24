module.exports = {
  port: 3001,
  db:{
    port:27017,
    host:'localhost',
    dbName:'dbblog1'
  },
  security: {
    secretKey: "secretKey",
    // 过期时间 1小时
    expiresIn: Math.floor(Date.now() / 1000) + (60 * 60) * 60
  },
}
