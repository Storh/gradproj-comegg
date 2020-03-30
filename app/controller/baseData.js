'use strict';

const Controller = require('egg').Controller;

class BaseDataController extends Controller {
  async distList() {
    const { ctx } = this;
    const distList = await this.app.mysql.select('estate', {
      where: { visible: 1 },
      columns: [ 'id', 'name' ],
    });
    ctx.body = {
      data: { list: distList },
    };
  }
}

module.exports = BaseDataController;
