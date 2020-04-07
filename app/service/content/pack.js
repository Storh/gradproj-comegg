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
      if (item.headimgurl.length < 100) item.headimgurl = this.app.config.publicAdd + item.headimgurl;
      if (item.add_time) item.add_time = new Date(item.add_time).toLocaleString();
      if (item.reply_time) item.reply_time = new Date(item.reply_time).toLocaleString();
      return item;
    });
    return list;
  }

  // 获取拼团内容
  async getDetailById(user_id, content_id) {
    // 动态内容(1)用户参与(2)评论(3)
    // 点赞类型
    const likeType = 1;
    const sqlstr =
    `SELECT a.content_id,a.type_id,a.title,a.content,a.keyword,a.show_type,a.visit_num,a.like_num,a.collect_num,a.add_time,a.link_external_name,a.link_external_url,
    b.user_id,b.phone,b.nickname,b.headimgurl,b.personal_signature,
    c.closing_date,

    if((SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND rel_id = a.content_id AND user_id = ${user_id}) = 1, 1, 0) AS like_state,
    if((SELECT collect_state FROM ${this.app.config.dbprefix}collect_record WHERE rel_id = a.content_id AND user_id = ${user_id}) = 1, 1, 0) AS collect_state

    FROM ${this.app.config.dbprefix}content_record a
    INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id
    LEFT JOIN ${this.app.config.dbprefix}pack_content c ON c.content_id = a.content_id

    WHERE a.content_id = ${content_id}
    AND a.is_delete = 0
    AND a.state = 1`;

    const results = await this.app.mysql.query(sqlstr);

    const data = JSON.parse(JSON.stringify(results[0]));
    if (data.headimgurl.length < 100) { data.headimgurl = this.app.config.publicAdd + data.headimgurl; }
    return data;
  }
}

module.exports = PackService;
