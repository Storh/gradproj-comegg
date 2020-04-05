'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.prefix('/app');
  router.post('/', controller.member.phoneLogin.login);// 测试接口

  router.post('/member/phoneLogin/bindPhone', controller.member.phoneLogin.bindPhone);// 1.1.3、 微信绑定手机号
  router.post('/member/info/reg', app.jwt, controller.member.info.reg);// 1.1.6、 注册后完善用户信息

  router.post('/content/main/getList', app.jwt, controller.content.main.getList);// 1.2.1、 获取动态记录列表
  router.post('/member/info/getInfo', app.jwt, controller.member.info.getInfo);// 1.5.1、 获取用户基本信息

  router.post('/baseData/distList', app.jwt, controller.baseData.distList);// 1.6.1、 获取街道小区列表
};
