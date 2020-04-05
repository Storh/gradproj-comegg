'use strict';

const Controller = require('egg').Controller;

class BaseDataController extends Controller {
  async distList() {
    const { ctx } = this;
    const list = await ctx.service.common.district.getListByType('estate');
    ctx.body = {
      data: { list },
    };
  }
}

module.exports = BaseDataController;
