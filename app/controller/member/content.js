'use strict';

const Controller = require('egg').Controller;

class ContentController extends Controller {
//    用户发起的动态列表
  async getListBySelf() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.user_id) { this.ctx.throw('无效用户ID类型'); }

    const list = await ctx.service.content.main.getListBySelf(user_id, reqData);

    ctx.body = {
      data: { list },
    };
  }
}

module.exports = ContentController;
