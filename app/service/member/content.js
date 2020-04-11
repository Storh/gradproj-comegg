'use strict';

const Service = require('egg').Service;

class ContentService extends Service {
  async getListBySelf(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;
    const sql_content_type = reqData.content_type ? ` AND type_id = ${reqData.content_type}` : '';
    const sqlstr =
    `SELECT content_id,type_id,title,content,add_time

    FROM ${this.app.config.dbprefix}content_record

    WHERE 1
    AND is_delete = 0
    AND state = 1
    AND user_id = ${user_id}
    ${sql_content_type}

    ORDER BY content_id DESC
    ${limit}`;
    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(item => {
      if (item.add_time) item.add_time = new Date(item.add_time).toLocaleString();
      return item;
    });
    return list;
  }
}

module.exports = ContentService;
