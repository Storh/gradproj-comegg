'use strict';

const Service = require('egg').Service;

class ActivityService extends Service {
  async getListById(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    const sqlstr = `SELECT
    a.regist_id,a.user_id,a.add_time,a.remark,
    b.nickname,b.headimgurl

    FROM ${this.app.config.dbprefix}activity_regist a
    INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id

    WHERE a.content_id = ${reqData.content_id}
    AND a.is_delete = 0
    AND a.state = 1

    ORDER BY a.regist_id DESC
    ${limit}`;
    const resultstr = await this.app.mysql.query(sqlstr);
    const results = JSON.parse(JSON.stringify(resultstr));
    const list = [];
    results.forEach(element => {
      if (element.headimgurl.length < 20) { element.headimgurl = this.app.config.publicAdd + element.headimgurl; }
      if (element.add_time) { element.add_time = new Date(element.add_time).toLocaleString(); }
      if (element.reply_time) { element.reply_time = new Date(element.reply_time).toLocaleString(); }
      list.push(element);
    });
    return list;
  }
}

module.exports = ActivityService;
