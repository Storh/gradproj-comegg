'use strict';

const Controller = require('egg').Controller;

class TopicController extends Controller {
  async getListById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) {
      this.ctx.throw('动态ID不能为空');
    }
    const list = await ctx.service.content.topic.getListById(user_id, reqData);
    ctx.body = {
      data: { list },
    };
  }
}

module.exports = TopicController;
