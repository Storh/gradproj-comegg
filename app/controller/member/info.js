'use strict';

const Controller = require('egg').Controller;

class InfoController extends Controller {
  async reg() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;// 获取post数据

    if (!reqData.nickname) {
      this.ctx.throw('姓名不能为空');
    }
    if (!reqData.district_id) {
      this.ctx.throw('所在小区ID不能为空');
    }
    if (Number.isInteger(reqData.district_id)) {
      this.ctx.throw('无效小区ID');
    }

    const updateSuccess = await ctx.service.member.info.reg(user_id, reqData);
    if (updateSuccess) {
      ctx.body = {
        data: {},
      };
    } else {
      this.ctx.throw('提交失败');
    }
  }

  async getInfo() {
    const { ctx } = this;
    const user_id = ctx.request.body.user_id;// 获取post数据
    const userInfo = await ctx.service.user.userInfo(user_id);
    ctx.body = {
      data: userInfo,
    };
  }
}

module.exports = InfoController;
