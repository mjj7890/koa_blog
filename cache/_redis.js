const redis = require('redis');

// 创建客户端
const redisClient = redis.createClient(6379, 'localhost');

redisClient.on("error", function (error) {
  console.error(error);
});
/* 
 获取 redis
*/
function getRedis(key) {
  return new Promise((resolve, reject) => {
    redisClient.get(key, (err, val) => {
      if (err) {
        reject(err)
        return;
      }
      if (val == null) {
        resolve(null);
        return;
      }
      try {
        resolve(JSON.parse(val));
      } catch (error) {
        resolve(val);
      }
    })
  })
}

/* 
  设置redis
*/
function setRedis(key, val, timeout = 60 * 60) {
  if(typeof val === 'object'){
    val = JSON.stringify(val);
  }
  redisClient.set(key,val);
  // 设置过期时间
  redisClient.expire(key,timeout);
}
module.exports = {
  getRedis,
  setRedis
}