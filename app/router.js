'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.home.index);
  router.post('/jwttest', app.jwt, controller.member.phoneLogin.jwttest);

  router.post('/app/member/phoneLogin/bindPhone', controller.member.phoneLogin.bindPhone);
  router.post('/app/member/info/reg', app.jwt, controller.member.info.reg);// 注册后完善用户信息
  router.post('/login', controller.member.phoneLogin.login);
  router.post('/app/baseData/distList', app.jwt, controller.baseData.distList);// 获取小区列表
};
