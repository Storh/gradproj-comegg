'use strict';

module.exports = (options, app) => {
  return async (ctx, next) => {
    try {
      await next();
    } catch (err) {
      // console.log(err);
      if (
        ctx.path.includes('/') &&
        err instanceof app.jwt.UnauthorizedError
      ) {
        ctx.status = 200;
        ctx.body = {
          error: -1, // 无权限
        };
        return;
      }
      throw err;
    }

  };
};
