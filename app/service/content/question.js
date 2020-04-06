'use strict';

const Service = require('egg').Service;

class QuestionService extends Service {
  async getListById(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    //  用户的点赞类型 动态内容(1)'SET_LIKE_CONTENT'; 用户参与(2)'SET_LIKE_REGIST';评论(3)'SET_LIKE_REVIEW'
    const likeType = 2;
    const contentType = this.app.config.contentTypeIdByName.QUESTION;

    const sqlstr = `SELECT
                    a.regist_id,a.user_id,a.add_text,a.reply_text,a.add_time,a.reply_time,a.like_num,
                    b.nickname,b.headimgurl,
                    if((SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND content_type = ${contentType} AND rel_id = a.regist_id AND user_id = ${user_id}) = 1, 1, 0) AS like_state
    
                    FROM ${this.app.config.dbprefix}question_regist a
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

module.exports = QuestionService;
