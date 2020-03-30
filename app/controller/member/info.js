'use strict';

const Controller = require('egg').Controller;

class InfoController extends Controller {
  async reg() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;// 获取post数据
    const upDataInfo = {
      nickname: reqData.nickname,
      districts: reqData.district_id,
    };
    await this.app.mysql.update('userinfo', upDataInfo, { where: { user_id } });
    ctx.body = {
      data: {},
    };
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
