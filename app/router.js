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
  router.post('/content/main/getDetailById', app.jwt, controller.content.main.getDetailById);// 1.2.2、 获取动态记录详情
  router.post('/content/help/getListById', app.jwt, controller.content.help.getListById);// 1.2.4、 获取互助参与详情列表
  router.post('/content/question/getListById', app.jwt, controller.content.question.getListById);// 1.2.5、 获取问答参与详情列表
  router.post('/content/unused/getListById', app.jwt, controller.content.unused.getListById);// 1.2.6、 获取闲置参与详情列表
  router.post('/content/activity/getListById', app.jwt, controller.content.activity.getListById);// 1.2.7、 获取活动参与详情列表
  router.post('/content/pack/getListById', app.jwt, controller.content.pack.getListById);// 1.2.8、 获取拼团参与详情列表
  router.post('/content/topic/getListById', app.jwt, controller.content.topic.getListById);// 1.2.9、 获取话题参与详情列表
  router.post('/content/review/getListById', app.jwt, controller.content.review.getListById);// 1.2.15、 获取动态记录评论列表


  router.post('/content/main/setLike', app.jwt, controller.content.main.setLike);// 1.2.38、 为动态点赞


  router.post('/member/info/getInfo', app.jwt, controller.member.info.getInfo);// 1.5.1、 获取用户基本信息

  router.post('/baseData/distList', app.jwt, controller.baseData.distList);// 1.6.1、 获取街道小区列表
};
