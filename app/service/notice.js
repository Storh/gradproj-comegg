'use strict';

const Service = require('egg').Service;

class NoticeService extends Service {
  async getList(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;
    // const userInfo = await this.ctx.service.member.info.getInfo(user_id);
    const sql =
    `SELECT
    a.id,
    a.type_id AS notice_type,
    a.content_type AS content_type,
    a.content_id,
    a.regist_id,
    a.title,
    a.desc,
    a.read_state,
    a.add_time,
    (SELECT nickname FROM ${this.app.config.dbprefix}user_profile WHERE user_id = a.start_user_id) AS nickname,
    (SELECT headimgurl FROM ${this.app.config.dbprefix}user_profile WHERE user_id = a.start_user_id) AS headimgurl

    FROM ${this.app.config.dbprefix}notice_record a

    WHERE 1
    AND a.is_delete = 0
    AND a.state = 1
    AND a.receive_user_id = ${user_id}

    ORDER BY a.id DESC
    ${limit}`;
    const results = await this.app.mysql.query(sql);
    const list = results.map(item => {
      if (item.headimgurl.length < 100) item.headimgurl = this.app.config.publicAdd + item.headimgurl;
      if (item.add_time) item.add_time = new Date(item.add_time).toLocaleString();
      return item;
    });
    return list;
  }

  async setRead(user_id, id) {
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());
    const result = await this.app.mysql.update(this.app.config.dbprefix + 'notice_record',
      {
        read_state: 1,
        read_time: date_now,
      },
      {
        where: {
          id,
          receive_user_id: user_id,
        } });
    if (result.affectedRows === 1) return true;
  }

  async getDetailById(notice_id) {
    const inforow = await this.app.mysql.get(this.app.config.dbprefix + 'notice_record',
      {
        notice_id,
        is_delete: 0,
        state: 1,
      });
    const info = JSON.parse(JSON.stringify(inforow));
    const data = {
      notice_id: info.notice_id,
      title: info.title,
      content: info.content,
      add_time: new Date(info.add_time).toLocaleString(),
    };
    return data;
  }
}

module.exports = NoticeService;
