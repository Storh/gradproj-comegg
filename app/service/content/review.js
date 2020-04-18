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
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      if (item.reply_time) item.reply_time = this.ctx.service.base.fromatDate(new Date(item.reply_time).getTime());
      return item;
    });
    return list;
  }

  async add(user_id, reqData) {
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());
    const review_log = await this.app.mysql.insert(this.app.config.dbprefix + 'review_record', {
      user_id,
      content_id: reqData.content_id,
      review_text: reqData.review_text,
      add_time: date_now,
    });
    if (review_log) {
      // 通知
      this.addPostNotice(user_id, reqData.content_id, review_log.insertId, reqData.review_text);
      return review_log.insertId;
    }
    this.ctx.throw('提交失败');
  }

  async addPostNotice(user_id, content_id, review_id, review_text) {
    // SYSTEM系统通知(1);CONTENT_REGIST内容参与记录(2);CONTENT_REVIEW内容评论记录(3);TYPE_LIKE点赞(4);
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);
    const contentInfo = await this.ctx.service.common.getContentInfoById(content_id);

    const noticedata = {
      type_id: 3,
      receive_user_id: contentInfo.user_id,
      start_user_id: user_id,
      rel_id: review_id,
      content_id,
      regist_id: review_id,
      title: userInfo.nickname + '评论了你的' + this.app.config.contentType[contentInfo.type_id - 1].name,
      desc: review_text,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }

  async setLike(user_id, reqData) {
    const like_state = Number(reqData.like_state);
    // 获取动态内容
    const { ctx, app } = this;
    const reviewBaseInfoRow = await this.app.mysql.get(this.app.config.dbprefix + 'review_record', {
      review_id: reqData.review_id,
      state: 1,
      is_delete: 0,
    });

    const reviewBaseInfo = JSON.parse(JSON.stringify(reviewBaseInfoRow));
    const content_id = reviewBaseInfo.content_id;
    const receive_user_id = reviewBaseInfo.user_id;
    const desc = reviewBaseInfo.review_text;
    const like_num_ori = reviewBaseInfo.like_num;

    const date_now = ctx.service.base.fromatDate(new Date().getTime());

    const contentInfo = await this.ctx.service.common.getContentInfoById(content_id);
    if (!contentInfo) { this.ctx.throw('该动态记录不存在'); }
    const content_type = contentInfo.type_id;

    // 自动事务
    let like_state_ori;
    let like_id;
    const trans_success = await app.mysql.beginTransactionScope(async sqlrevsetlike => {
      // 读取点赞记录
      //   SET_LIKE_CONTENT动态内容(1); SET_LIKE_REGIST用户参与(2);SET_LIKE_REVIEW评论(3)
      const type = 3;
      const is_setlike_log = await sqlrevsetlike.get(this.app.config.dbprefix + 'like_record', {
        type_id: type,
        user_id,
        rel_id: reqData.review_id,
      });
      if (!is_setlike_log) {
        // 未设置喜欢
        if (like_state === 0) {
          ctx.throw('您还未点赞');
        } else {
          like_state_ori = -1;
          const set_like_log = await sqlrevsetlike.insert(app.config.dbprefix + 'like_record', {
            type_id: type,
            user_id,
            rel_id: reqData.review_id,
            content_type,
            like_state,
            add_time: date_now,
          });
          if (set_like_log) {
            like_id = set_like_log.insertId;
          } else {
            ctx.throw('操作失败');
          }
        }
      } else {
        const setlike_log = JSON.parse(JSON.stringify(is_setlike_log));
        like_id = setlike_log.like_id;
        like_state_ori = setlike_log.like_state;
        await sqlrevsetlike.update(app.config.dbprefix + 'like_record',
          {
            like_state,
            modify_time: date_now,
          },
          { where: { like_id } });
      }
      // 更新动态内容表
      if (like_state_ori !== like_state) {
        // 原始喜欢记录和这次是喜欢状态不同
        // 根据这次的点赞状态设置偏移数
        const like_num_offset = like_state === 1 ? 1 : -1;

        if (like_num_ori === 0 && like_num_offset < 0) {
          console.log('中奖了');
        } else {
          const sqlstr =
            `UPDATE ${app.config.dbprefix}review_record
          SET like_num = like_num + (${like_num_offset})
          WHERE review_id = ${reqData.review_id}`;
          await sqlrevsetlike.query(sqlstr);
        }
      }
      return true;
    }, ctx);

    if (!trans_success) {
      ctx.throw('操作失败，请重试');
    }

    if (like_state === 1 && like_state_ori !== like_state) {
      // 添加通知
      this.setLikePostNotice(user_id, like_id, content_id, reqData.review_id, receive_user_id, content_type, desc);
    }
    return true;
  }

  async setLikePostNotice(user_id, rel_id, content_id, review_id, receive_user_id, content_type, desc) {
    // (1)NOTICE_RECORD_TYPE_SYSTEM系统通知;(2)NOTICE_RECORD_TYPE_CONTENT_REGIST内容参与记录;
    // (3)NOTICE_RECORD_TYPE_CONTENT_REVIEW内容评论记录;(4)NOTICE_RECORD_TYPE_LIKE点赞;
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);
    const noticedata = {
      type_id: 4,
      receive_user_id,
      start_user_id: user_id,
      rel_id,
      content_id,
      regist_id: review_id,
      content_type,
      title: userInfo.nickname + '点赞了你评论的' + this.app.config.contentType[content_type - 1].name,
      desc,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }

  async delete(user_id, review_id) {

    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());

    const delinfo = await this.app.mysql.update(this.app.config.dbprefix + 'user_profile',
      {
        state: 2,
        update_state_user_time: date_now,
      },
      {
        where: {
          user_id,
          review_id,
        },
      });
    if (delinfo) {
      return true;
    }
    this.ctx.throw('删除失败');
  }

  async reply(user_id, reqData) {
    const review_id = reqData.review_id;
    const reply_text = reqData.reply_text;

    // 获取评论人id
    const replyBaseInfoRow = await this.app.mysql.get(this.app.config.dbprefix + 'review_record', {
      review_id,
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

    const replyinfo = await this.app.mysql.update(this.app.config.dbprefix + 'review_record',
      {
        reply_text,
        reply_time: date_now,
      },
      { where: { review_id } });

    if (replyinfo) {
      // 通知
      this.registReplyPostNotice(user_id, content_id, review_id, receive_user_id, content_type, reply_text);
      return replyinfo.affectedRows;
    }
    this.ctx.throw('提交失败');
  }
  async registReplyPostNotice(user_id, content_id, review_id, receive_user_id, content_type, reply_text) {
    // SYSTEM系统通知(1);CONTENT_REGIST内容参与记录(2);CONTENT_REVIEW内容评论记录(3);TYPE_LIKE点赞(4);
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);

    const noticedata = {
      type_id: 3,
      receive_user_id,
      start_user_id: user_id,
      rel_id: review_id,
      content_id,
      regist_id: review_id,
      content_type,
      title: userInfo.nickname + '回复了你评论的' + this.app.config.contentType[content_type - 1].name,
      desc: reply_text,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }
}

module.exports = ReviewService;
