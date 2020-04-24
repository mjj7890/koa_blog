const basicAuth = require('basic-auth');
const jwt = require('jsonwebtoken');
const config = require('../config')
class Auth {
  constructor() {

  }
  get auth() {
    return async (ctx, next) => {
      const tokenToken = basicAuth(ctx.req);
      console.log(tokenToken);
      
      let errMsg = '无效的token';
      // 无带token
      if (!tokenToken || !tokenToken.name) {
        console.log(111);
        
        errMsg = '需要携带token值';
        ctx.status = 403;
        ctx.body = {
          msg: errMsg,
          errCode: 10006,
        }
      }
      try {
        // 核实token是否正确
        console.log(2222);
        
        var decoded = jwt.verify(tokenToken.name, config.security.secretKey)
        console.log(decoded);
        
      } catch (error) {
        // token不合法 过期
        if (error.name === 'TokenExpiredError') {
          errMsg = 'token已过期'
        }
        ctx.status = 403;
        ctx.body = {
          msg: errMsg,
          errCode: 10006,
        }

      }

      ctx.auth = {
        uid:decoded.uid,
        scope:decoded.scope
      }
      await next();
    }
  }
}
module.exports = {
  Auth
}
