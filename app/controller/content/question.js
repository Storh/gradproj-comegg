'use strict';

const Controller = require('egg').Controller;

class QuestionController extends Controller {
  async getListById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) {
      this.ctx.throw('动态ID不能为空');
    }
    const list = await ctx.service.content.question.getListById(user_id, reqData);
    ctx.body = {
      data: { list },
    };
  }

  // 会员参与问答接口
  async registAdd() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }
    if (!reqData.add_text) { this.ctx.throw('参与内容不能为空'); }
    const regist_id = await ctx.service.content.question.registAdd(user_id, reqData);
    ctx.body = {
      data: { regist_id },
    };
  }

  // 参与问答回复接口
  async registReply() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.regist_id) { this.ctx.throw('动态ID不能为空'); }
    if (!reqData.reply_text) { this.ctx.throw('参与内容不能为空'); }
    const replySuccess = await ctx.service.content.help.registReply(user_id, reqData, 'question_regist');
    if (replySuccess) {
      ctx.body = {
        data: {},
      };
    }
  }
}

module.exports = QuestionController;
