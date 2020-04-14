'use strict';

const Controller = require('egg').Controller;

class RegistController extends Controller {
  //    为参与内容点赞
  async setLike() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.regist_id) {
      this.ctx.throw('评论记录ID不能为空');
    }
    if (!reqData.content_type_id) {
      this.ctx.throw('内容类型不能为空');
    } else {
      const content_type = Number(reqData.content_type_id);
      const typearr = [ 1, 2, 3, 6 ];
      const righttype = typearr.indexOf(content_type);
      if (righttype === -1) this.ctx.throw('内容类型错误');
    }

    if (!('like_state' in reqData)) {
      this.ctx.throw('点赞状态不能为空');
    }
    const results = await ctx.service.content.regist.setLike(user_id, reqData.regist_id, Number(reqData.like_state), reqData.content_type_id);
    if (results) {
      ctx.body = {
        data: {},
      };
    }
  }
}

module.exports = RegistController;

