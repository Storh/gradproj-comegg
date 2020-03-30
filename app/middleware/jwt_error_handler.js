'use strict';

module.exports = (options, app) => {
  return async (ctx, next) => {
    try {
      await next();
      ctx.body = {
        error: 0,
        message: '',
      };
    } catch (err) {
      ctx.app.emit('error', err, ctx);
      // console.log(err);
      if (
        ctx.path.includes('/') &&
        err instanceof app.jwt.UnauthorizedError
      ) {
        ctx.status = 200;
        ctx.body = {
          error: -1, // 无权限
        };
        // return;
      } else {
        ctx.status = 200;
        ctx.body = {
          error: 1,
          message: '数据更新错误',
          data: {},
        };
      }
      // return;
      // throw err;
    }
  };
};
