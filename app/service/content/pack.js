'use strict';

const Service = require('egg').Service;

class PackService extends Service {
  async getListById(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    const sqlstr = `SELECT
        a.regist_id,a.user_id,a.add_time,
        b.nickname,b.headimgurl

        FROM ${this.app.config.dbprefix}pack_regist a
        INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id

        WHERE a.content_id = ${reqData.content_id}
        AND a.is_delete = 0
        AND a.state = 1

        GROUP BY a.user_id

        ORDER BY a.regist_id DESC
        ${limit}`;
    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(item => {
      if (item.headimgurl.length < 100) { item.headimgurl = this.app.config.publicAdd + item.headimgurl; }
      if (item.add_time) { item.add_time = new Date(item.add_time).toLocaleString(); }
      if (item.reply_time) { item.reply_time = new Date(item.reply_time).toLocaleString(); }
      return item;
    });
    return list;
  }
}

module.exports = PackService;
