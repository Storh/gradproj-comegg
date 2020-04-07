'use strict';

const Controller = require('egg').Controller;

class ReviewController extends Controller {
  async getListById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) {
      this.ctx.throw('动态ID不能为空');
    }
    const list = await ctx.service.content.review.getListById(user_id, reqData);
    ctx.body = {
      data: { list },
    };
  }

  // 动态添加评论
  async add() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }
    if (!reqData.review_text) { this.ctx.throw('评论内容不能为空'); }
    const review_id = await ctx.service.content.review.add(user_id, reqData);
    ctx.body = {
      data: { review_id },
    };
  }
}

module.exports = ReviewController;
