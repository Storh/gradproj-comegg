'use strict';

/**
 * @param {Egg.Application} app - egg application
 */
module.exports = app => {
  const { router, controller } = app;
  router.prefix('/app');
  router.post('/', controller.member.phoneLogin.login);// 测试接口

  router.post('/member/phoneLogin/bindPhone', controller.member.phoneLogin.bindPhone);// 1.1.3、 手机号注册登录
  router.post('/member/info/reg', app.jwt, controller.member.info.reg);// 1.1.6、 注册后完善用户信息

  router.post('/content/main/getList', app.jwt, controller.content.main.getList);// 1.2.1、 获取动态记录列表
  router.post('/content/main/getDetailById', app.jwt, controller.content.main.getDetailById);// 1.2.2、 获取动态记录详情
  router.post('/content/activity/getDetailById', app.jwt, controller.content.activity.getDetailById);// 1.2.3、 获取动态记录详情（活动）
  router.post('/content/activity/getListById', app.jwt, controller.content.activity.getListById);// 1.2.4、 获取活动参与列表（活动-用户）
  router.post('/content/pack/getDetailById', app.jwt, controller.content.pack.getDetailById);// 1.2.5、 获取动态记录详情（拼团）
  router.post('/content/pack/getListById', app.jwt, controller.content.pack.getListById);// 1.2.6、 获取拼团参与列表（拼团-用户）
  router.post('/content/help/getListById', app.jwt, controller.content.help.getListById);// 1.2.10、 获取互助参与详情列表
  router.post('/content/question/getListById', app.jwt, controller.content.question.getListById);// 1.2.11、 获取问答参与详情列表
  router.post('/content/unused/getListById', app.jwt, controller.content.unused.getListById);// 1.2.12、 获取闲置参与详情列表
  router.post('/content/topic/getListById', app.jwt, controller.content.topic.getListById);// 1.2.13、 获取话题参与详情列表

  router.post('/content/review/getListById', app.jwt, controller.content.review.getListById);// 1.2.21、 获取动态记录评论列表
  router.post('/content/review/add', app.jwt, controller.content.review.add);// 1.2.22、 为动态添加评论接口

  router.post('/content/review/delete', app.jwt, controller.content.review.delete);// 1.2.24、 删除评论接口

  router.post('/content/help/registAdd', app.jwt, controller.content.help.registAdd);// 1.2.26、 会员参与互助接口
  router.post('/content/help/registReply', app.jwt, controller.content.help.registReply);// 1.2.27、 会员参与互助回复接口


  router.post('/content/question/registAdd', app.jwt, controller.content.question.registAdd);// 1.2.30、 会员参与问答接口
  router.post('/content/question/registReply', app.jwt, controller.content.question.registReply);// 1.2.31、 会员参与问答回复接口


  router.post('/content/unused/registAdd', app.jwt, controller.content.unused.registAdd);// 1.2.34、 会员参与闲置接口
  router.post('/content/unused/registReply', app.jwt, controller.content.unused.registReply);// 1.2.35、 会员参与闲置回复接口


  router.post('/content/topic/registAdd', app.jwt, controller.content.topic.registAdd);// 1.2.40、 会员参与话题接口


  router.post('/content/main/setLike', app.jwt, controller.content.main.setLike);// 1.2.44、 为动态点赞
  router.post('/content/regist/setLike', app.jwt, controller.content.regist.setLike);// 1.2.45、 为参与内容点赞
  router.post('/content/review/setLike', app.jwt, controller.content.review.setLike);// 1.2.46、 为评论点赞
  router.post('/content/main/setCollect', app.jwt, controller.content.main.setCollect);// 1.2.47、 收藏动态


  router.post('/member/info/getInfo', app.jwt, controller.member.info.getInfo);// 1.5.1、 获取用户基本信息

  router.post('/baseData/distList', app.jwt, controller.baseData.distList);// 1.6.1、 获取街道小区列表
};
