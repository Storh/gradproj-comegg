'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.get('/', controller.member.phoneLogin.login);// 测试接口

  router.post('/app/member/phoneLogin/bindPhone', controller.member.phoneLogin.bindPhone);// 1.1.3、 微信绑定手机号
  router.post('/app/member/info/reg', app.jwt, controller.member.info.reg);// 1.1.6、 注册后完善用户信息

  router.post('/app/member/info/getInfo', app.jwt, controller.member.info.getInfo);// 1.5.1、 获取用户基本信息

  router.post('/app/baseData/distList', app.jwt, controller.baseData.distList);// 1.6.1、 获取街道小区列表
};
