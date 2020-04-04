'use strict';

const Service = require('egg').Service;
class HelperService extends Service {
  async getNameFirstCharter(name) {
    const pinyin = require('pinyin');
    const fchar = pinyin(name, { style: pinyin.STYLE_NORMAL })[0][0][0];
    console.log(fchar);
    // if (fchar >= 'A' && fchar <= 'z') { return fchar.toUpperCase(); }
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());
    return date_now;

  }
}
module.exports = HelperService;
