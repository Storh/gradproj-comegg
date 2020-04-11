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
    const list = await ctx.service.common.specialityList(1);
    ctx.body = {
      data: { list },
    };
  }
  async hobbyList() {
    const { ctx } = this;
    const list = await ctx.service.common.specialityList(2);
    ctx.body = {
      data: { list },
    };
  }
}

module.exports = BaseDataController;
