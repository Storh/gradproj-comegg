'use strict';

const Controller = require('egg').Controller;

class BaseDataController extends Controller {
  async distList() {
    const { ctx } = this;
    const list = await ctx.service.common.getListByType('estate');
    ctx.body = {
      data: { list },
    };
  }
  async specialityList() {
    const { ctx } = this;
    const list = await ctx.service.baseData.specialityList(1);
    ctx.body = {
      data: { list },
    };
  }
}

module.exports = BaseDataController;
