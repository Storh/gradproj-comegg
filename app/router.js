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
  router.post('/content/pack/getGoodsListById', app.jwt, controller.content.pack.getGoodsListById);// 1.2.7、 获取拼团商品列表（拼团-商品）
  router.post('/content/pack/getOrderListById', app.jwt, controller.content.pack.getOrderListById);// 1.2.8、 获取拼团参与列表（拼团-订单）
  router.post('/content/pack/getSelfGoodsInfoById', app.jwt, controller.content.pack.getSelfGoodsInfoById);// 1.2.9、 获取拼团商品列表（拼团-商品明细）
  router.post('/content/help/getListById', app.jwt, controller.content.help.getListById);// 1.2.10、 获取互助参与详情列表
  router.post('/content/question/getListById', app.jwt, controller.content.question.getListById);// 1.2.11、 获取问答参与详情列表
  router.post('/content/unused/getListById', app.jwt, controller.content.unused.getListById);// 1.2.12、 获取闲置参与详情列表
  router.post('/content/topic/getListById', app.jwt, controller.content.topic.getListById);// 1.2.13、 获取话题参与详情列表
  router.post('/content/main/add', app.jwt, controller.content.main.add);// 1.2.14、 提交发布动态接口
  router.post('/content/activity/add', app.jwt, controller.content.activity.add);// 1.2.15、 提交发布动态接口（活动）
  router.post('/content/pack/add', app.jwt, controller.content.pack.add);// 1.2.16、 提交发布动态接口（拼团）
  router.post('/content/main/edit', app.jwt, controller.content.main.edit);// 1.2.17、 编辑动态接口
  router.post('/content/activity/edit', app.jwt, controller.content.activity.edit);// 1.2.18、 编辑动态接口（活动）
  router.post('/content/pack/edit', app.jwt, controller.content.pack.edit);// 1.2.19、 编辑动态接口（拼团）


  router.post('/content/review/getListById', app.jwt, controller.content.review.getListById);// 1.2.21、 获取动态记录评论列表
  router.post('/content/review/add', app.jwt, controller.content.review.add);// 1.2.22、 为动态添加评论接口
  router.post('/content/review/reply', app.jwt, controller.content.review.reply);// 1.2.23、 回复评论接口
  router.post('/content/review/delete', app.jwt, controller.content.review.delete);// 1.2.24、 删除评论接口

  router.post('/content/help/registAdd', app.jwt, controller.content.help.registAdd);// 1.2.26、 会员参与互助接口
  router.post('/content/help/registReply', app.jwt, controller.content.help.registReply);// 1.2.27、 会员参与互助回复接口


  router.post('/content/question/registAdd', app.jwt, controller.content.question.registAdd);// 1.2.30、 会员参与问答接口
  router.post('/content/question/registReply', app.jwt, controller.content.question.registReply);// 1.2.31、 会员参与问答回复接口


  router.post('/content/unused/registAdd', app.jwt, controller.content.unused.registAdd);// 1.2.34、 会员参与闲置接口
  router.post('/content/unused/registReply', app.jwt, controller.content.unused.registReply);// 1.2.35、 会员参与闲置回复接口


  router.post('/content/activity/registAdd', app.jwt, controller.content.activity.registAdd);// 1.2.38、 会员参与活动接口
  router.post('/content/pack/registAdd', app.jwt, controller.content.pack.registAdd);// 1.2.39、 会员参与拼团接口
  router.post('/content/topic/registAdd', app.jwt, controller.content.topic.registAdd);// 1.2.40、 会员参与话题接口
  router.post('/content/topic/registReply', app.jwt, controller.content.topic.registReply);// 1.2.41、 会员参与话题回复接口


  router.post('/content/main/setLike', app.jwt, controller.content.main.setLike);// 1.2.44、 为动态点赞
  router.post('/content/regist/setLike', app.jwt, controller.content.regist.setLike);// 1.2.45、 为参与内容点赞
  router.post('/content/review/setLike', app.jwt, controller.content.review.setLike);// 1.2.46、 为评论点赞
  router.post('/content/main/setCollect', app.jwt, controller.content.main.setCollect);// 1.2.47、 收藏动态

  router.post('/addressBook/main/getList', app.jwt, controller.member.info.addressBookList);// 1.3.1、 获取通讯录列表
  router.post('/notice/main/getList', app.jwt, controller.notice.getList);// 1.4.1、 获取通知列表
  router.post('/notice/main/setRead', app.jwt, controller.notice.setRead);// 1.4.2、 标记通知已读状态
  router.post('/notice/official/getDetailById', app.jwt, controller.notice.getDetailById);// 1.4.3、 获取系统通知详情


  router.post('/member/info/getInfo', app.jwt, controller.member.info.getInfo);// 1.5.1、 获取用户基本信息
  router.post('/member/info/edit', app.jwt, controller.member.info.edit);// 1.5.2、 编辑用户信息
  router.post('/member/content/getListBySelf', app.jwt, controller.member.content.getListBySelf);// 1.5.3、 用户发起的动态列表
  router.post('/member/contentPack/getListBySelf', app.jwt, controller.member.content.getPackListBySelf);// 1.5.4、 用户发起的动态列表（拼团）
  router.post('/member/content/getListByRegist', app.jwt, controller.member.content.getListByRegist);// 1.5.5、 用户参与的动态列表
  router.post('/member/contentPack/getListByRegist', app.jwt, controller.member.content.getPackListByRegist);// 1.5.6、 用户参与的动态列表（拼团）
  router.post('/member/collect/getList', app.jwt, controller.member.content.getCollectList);// 1.5.7、 我收藏的动态列表

  router.post('/baseData/distList', app.jwt, controller.baseData.distList);// 1.6.1、 获取街道小区列表
};
