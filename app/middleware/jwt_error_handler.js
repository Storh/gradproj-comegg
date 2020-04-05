'use strict';

module.exports = (options, app) => {
  return async (ctx, next) => {
    try {
      await next();
      if (ctx.body && !ctx.body.error) {
        ctx.body.error = 0;
        ctx.body.message = '';
      }
    } catch (err) {
      ctx.app.emit('error', err, ctx);
      ctx.status = 200;
      if (
        ctx.path.includes('/') &&
        err instanceof app.jwt.UnauthorizedError
      ) {
        ctx.body = {
          error: -1, // 无权限
        };
      } else {
        // 自定义错误返回的data内容
        const data = err.data ? err.data : {};
        const myErrType = err.myErrType ? err.myErrType : 1;
        ctx.body = {
          error: myErrType,
          message: err.message, // 根据抛出内容返回message
          data,
        };
      }
    }
  };
};
