'use strict';

const Controller = require('egg').Controller;

class MainController extends Controller {
  async getList() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.event_type) {
      this.ctx.throw('页面类型不能为空');
    }
    if (Number.isInteger(reqData.event_type)) {
      this.ctx.throw('无效页面类型');
    }
    if (!reqData.district_type) {
      this.ctx.throw('社区筛选类型不能为空');
    }
    if (Number.isInteger(reqData.district_type)) {
      this.ctx.throw('无效社区筛选类型');
    }

    const results = await ctx.service.content.main.getList(user_id, reqData);

    ctx.body = {
      data: { results },
    };

  }
}

module.exports = MainController;
