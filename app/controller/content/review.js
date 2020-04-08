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

  // 评论点赞
  async setLike() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.review_id) {
      this.ctx.throw('评论记录ID不能为空');
    }
    if (!reqData.like_state) {
      this.ctx.throw('点赞状态不能为空');
    }
    const results = await ctx.service.content.review.setLike(user_id, reqData);
    if (results) {
      ctx.body = {
        data: {},
      };
    }
  }

  // 评论删除
  async delete() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.review_id) {
      this.ctx.throw('评论记录ID不能为空');
    }

    const results = await ctx.service.content.review.delete(user_id, reqData.review_id);
    if (results) {
      ctx.body = {
        data: {},
      };
    }
  }

  // 回复评论
  async reply() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.review_id) { this.ctx.throw('评论记录ID不能为空'); }
    if (!reqData.reply_text) { this.ctx.throw('回复内容不能为空'); }
    const replySuccess = await ctx.service.content.review.reply(user_id, reqData);
    if (replySuccess) {
      ctx.body = {
        data: {},
      };
    }
  }
}

module.exports = ReviewController;
