'use strict';

const Controller = require('egg').Controller;

class HelpController extends Controller {
  async getListById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) {
      this.ctx.throw('动态ID不能为空');
    }
    const list = await ctx.service.content.help.getListById(user_id, reqData);
    ctx.body = {
      data: { list },
    };
  }

  // 用户参与互助
  async registAdd() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }
    if (!reqData.add_text) { this.ctx.throw('参与内容不能为空'); }
    const regist_id = await ctx.service.content.help.registAdd(user_id, reqData);
    ctx.body = {
      data: { regist_id },
    };
  }

  // 用户参与互助回复
  async registReply() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.regist_id) { this.ctx.throw('动态ID不能为空'); }
    if (!reqData.reply_tex) { this.ctx.throw('参与内容不能为空'); }
    const replySuccess = await ctx.service.content.help.registAdd(user_id, reqData);
    if (replySuccess) {
      ctx.body = {
        data: {},
      };
    }
  }
}

module.exports = HelpController;
