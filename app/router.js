'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/app/member/phoneLogin/bindPhone', controller.member.phoneLogin.bindPhone);
  router.post('/jwttest', app.jwt, controller.member.phoneLogin.jwttest);
  router.post('/login', controller.member.phoneLogin.login);
};
