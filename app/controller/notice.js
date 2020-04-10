'use strict';

const Controller = require('egg').Controller;

class NoticeController extends Controller {
  // 获取通知列表
  async getList() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    const list = await ctx.service.notice.getList(user_id, reqData);
    ctx.body = {
      data: { list },
    };
  }

  //   标记通知已读状态
  async setRead() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const id = ctx.request.body.id;
    if (!id) { this.ctx.throw('动态内容ID不能为空'); }
    const readSuccess = await ctx.service.notice.setRead(user_id, id);
    if (readSuccess) {
      ctx.body = {
        data: {},
      };
    }
  }

  //   获取系统通知详情
  async getDetailById() {
    const { ctx } = this;
    // const user_id = ctx.state.user.user_id;
    const notice_id = ctx.request.body.notice_id;
    if (!notice_id) { this.ctx.throw('系统通知ID不能为空'); }
    const info = await ctx.service.notice.getDetailById(notice_id);
    if (!info) { this.ctx.throw('该通知不存在'); }
    ctx.body = {
      data: info,
    };
  }
}

module.exports = NoticeController;
