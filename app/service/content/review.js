'use strict';

const Service = require('egg').Service;

class ReviewService extends Service {
  async getListById(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    //  用户的点赞类型 动态内容(1)'SET_LIKE_CONTENT'; 用户参与(2)'SET_LIKE_REGIST';评论(3)'SET_LIKE_REVIEW'
    const likeType = 3;

    const sqlstr = `SELECT
    a.review_id,a.user_id,a.review_text,a.reply_text,a.add_time,a.reply_time,a.like_num,
    b.nickname,b.headimgurl,
    if((SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND rel_id = a.review_id AND user_id = ${user_id}) = 1, 1, 0) AS like_state

    FROM ${this.app.config.dbprefix}review_record a
    INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id

    WHERE a.content_id = ${reqData.content_id}
    AND a.is_delete = 0
    AND a.state = 1

    ORDER BY a.review_id DESC
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
}

module.exports = ReviewService;
