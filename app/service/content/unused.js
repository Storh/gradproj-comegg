'use strict';

const Service = require('egg').Service;

class UnusedService extends Service {
  async getListById(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    //  用户的点赞类型 动态内容(1)'SET_LIKE_CONTENT'; 用户参与(2)'SET_LIKE_REGIST';评论(3)'SET_LIKE_REVIEW'
    const likeType = 2;
    const contentType = this.app.config.contentTypeIdByName.UNUSED;

    const sqlstr = `SELECT
                        a.regist_id,a.user_id,a.add_text,a.reply_text,a.add_time,a.reply_time,a.like_num,
                        b.nickname,b.headimgurl,
                        if((SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND content_type = ${contentType} AND rel_id = a.regist_id AND user_id = ${user_id}) = 1, 1, 0) AS like_state
        
                        FROM ${this.app.config.dbprefix}unused_regist a
                        INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id
        
                        WHERE a.content_id = ${reqData.content_id}
                        AND a.is_delete = 0
                        AND a.state = 1
        
                        ORDER BY a.regist_id DESC
                        ${limit}`;
    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(item => {
      if (item.headimgurl.length < 100) item.headimgurl = this.app.config.publicAdd + item.headimgurl;
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      if (item.reply_time) item.reply_time = this.ctx.service.base.fromatDate(new Date(item.reply_time).getTime());
      return item;
    });
    return list;
  }

  async registAdd(user_id, reqData) {
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());
    const regist_log = await this.app.mysql.insert(this.app.config.dbprefix + 'unused_regist', {
      user_id,
      content_id: reqData.content_id,
      add_text: reqData.add_text,
      add_time: date_now,
    });
    if (regist_log) {
      // 通知
      this.ctx.service.content.help.registAddPostNotice(user_id, reqData.content_id, regist_log.insertId, reqData.add_text);
      return regist_log.insertId;
    }
    this.ctx.throw('提交失败');
  }
}

module.exports = UnusedService;
