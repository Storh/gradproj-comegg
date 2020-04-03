'use strict';

module.exports = (options, app) => {
  return async (ctx, next) => {
    try {
      await next();
      if (!ctx.body.error) {
        ctx.body.error = 0;
        ctx.body.message = '';
      }
    } catch (err) {
      ctx.app.emit('error', err, ctx);
      if (
        ctx.path.includes('/') &&
        err instanceof app.jwt.UnauthorizedError
      ) {
        ctx.status = 200;
        ctx.body = {
          error: -1, // 无权限
        };
      } else {
        // 自定义错误返回的data内容
        const data = err.data ? err.data : {};
        ctx.status = 200;
        ctx.body = {
          error: 1,
          message: err.message, // 根据抛出内容返回message
          data,
        };
      }
    }
  };
};
