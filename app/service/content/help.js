'use strict';

const Service = require('egg').Service;

class HelpService extends Service {
  async getListById(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    //  用户的点赞类型 动态内容(1)'SET_LIKE_CONTENT'; 用户参与(2)'SET_LIKE_REGIST';评论(3)'SET_LIKE_REVIEW'
    const likeType = 2;
    const contentType = this.app.config.contentTypeIdByName.HELP;

    const sqlstr = `SELECT
                a.regist_id,a.user_id,a.add_text,a.reply_text,a.add_time,a.reply_time,a.like_num,
                b.nickname,b.headimgurl,
                if((SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND content_type = ${contentType} AND rel_id = a.regist_id AND user_id = ${user_id}) = 1, 1, 0) AS like_state

                FROM ${this.app.config.dbprefix}help_regist a
                INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id

                WHERE a.content_id = ${reqData.content_id}
                AND a.is_delete = 0
                AND a.state = 1

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

  async registAdd(user_id, reqData) {
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());
    const regist_log = await this.app.mysql.insert(this.app.config.dbprefix + 'help_regist', {
      user_id,
      content_id: reqData.content_id,
      add_text: reqData.add_text,
      add_time: date_now,
    });
    if (regist_log) {
      // 通知
      this.registAddPostNotice(user_id, reqData.content_id, regist_log.insertId, reqData.add_text);
      return regist_log.insertId;
    }
    this.ctx.throw('提交失败');
  }

  async registAddPostNotice(user_id, content_id, regist_id, add_text) {
    // SYSTEM系统通知(1);CONTENT_REGIST内容参与记录(2);CONTENT_REVIEW内容评论记录(3);TYPE_LIKE点赞(4);
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);
    const contentInfo = await this.ctx.service.common.getContentInfoById(content_id);

    const noticedata = {
      type_id: 2,
      receive_user_id: contentInfo.user_id,
      start_user_id: user_id,
      rel_id: regist_id,
      content_id,
      content_type: contentInfo.type_id,
      title: userInfo.nickname + '参与了你的' + this.app.config.contentType[contentInfo.type_id - 1].name,
      desc: add_text,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }

  async registReply(user_id, reqData, dbName) {
    const regist_id = reqData.regist_id;
    const reply_text = reqData.reply_text;

    // 获取参与人id
    const replyBaseInfoRow = await this.app.mysql.get(this.app.config.dbprefix + dbName, {
      regist_id,
      state: 1,
      is_delete: 0,
    });
    const replyBaseInfo = JSON.parse(JSON.stringify(replyBaseInfoRow));
    const content_id = replyBaseInfo.content_id;
    const receive_user_id = replyBaseInfo.user_id;

    // 获取动态内容类型
    const contentBaseInfoRow = await this.app.mysql.get(this.app.config.dbprefix + 'content_record', {
      content_id,
      user_id,
      state: 1,
      is_delete: 0,
    });
    const contentBaseInfo = JSON.parse(JSON.stringify(contentBaseInfoRow));
    const content_type = contentBaseInfo.type_id;

    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());

    const replyinfo = await this.app.mysql.update(this.app.config.dbprefix + dbName,
      {
        reply_text,
        reply_time: date_now,
      },
      { where: { regist_id } });

    if (replyinfo) {
      // 通知
      this.registReplyPostNotice(user_id, content_id, regist_id, receive_user_id, content_type, reply_text);
      return replyinfo.insertId;
    }
    this.ctx.throw('提交失败');
  }

  async registReplyPostNotice(user_id, content_id, regist_id, receive_user_id, content_type, reply_text) {
    // SYSTEM系统通知(1);CONTENT_REGIST内容参与记录(2);CONTENT_REVIEW内容评论记录(3);TYPE_LIKE点赞(4);
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);

    const noticedata = {
      type_id: 3,
      receive_user_id,
      start_user_id: user_id,
      rel_id: regist_id,
      content_id,
      regist_id,
      content_type,
      title: userInfo.nickname + '回复了你参与的' + this.app.config.contentType[content_type - 1].name,
      desc: reply_text,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }
}

module.exports = HelpService;
