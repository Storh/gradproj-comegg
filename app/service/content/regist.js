'use strict';

const Service = require('egg').Service;

class RegistService extends Service {
  async setLike(user_id, regist_id, like_state, content_type) {

    const { ctx, app } = this;
    // 获取表名
    const registTable = app.config.contentType[content_type - 1].registTable;
    // 获取参与内容
    const registBaseInfoRow = await this.app.mysql.get(this.app.config.dbprefix + registTable, {
      regist_id,
      state: 1,
      is_delete: 0,
    });

    const registBaseInfo = JSON.parse(JSON.stringify(registBaseInfoRow));
    const content_id = registBaseInfo.content_id;
    const receive_user_id = registBaseInfo.user_id;
    const desc = registBaseInfo.review_text;
    const like_num_ori = registBaseInfo.like_num;
    const date_now = ctx.service.base.fromatDate(new Date().getTime());

    // 自动事务
    let like_state_ori;
    let like_id;
    const trans_success = await app.mysql.beginTransactionScope(async sqlrevsetlike => {
      // 读取点赞记录
      //   (1)SET_LIKE_CONTENT动态内容; (2)SET_LIKE_REGIST用户参与;(3)SET_LIKE_REVIEW评论
      const type = 2;
      const is_setlike_log = await sqlrevsetlike.get(this.app.config.dbprefix + 'like_record', {
        type_id: type,
        user_id,
        rel_id: regist_id,
        content_type,
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
            rel_id: regist_id,
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
              `UPDATE ${app.config.dbprefix + registTable}
              SET like_num = like_num + (${like_num_offset})
              WHERE regist_id = ${regist_id}`;
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
      this.setLikePostNotice(user_id, like_id, content_id, regist_id, receive_user_id, content_type, desc);
    }
    return true;
  }

  async setLikePostNotice(user_id, rel_id, content_id, regist_id, receive_user_id, content_type, desc) {
    // (1)NOTICE_RECORD_TYPE_SYSTEM系统通知;(2)NOTICE_RECORD_TYPE_CONTENT_REGIST内容参与记录;
    // (3)NOTICE_RECORD_TYPE_CONTENT_REVIEW内容评论记录;(4)NOTICE_RECORD_TYPE_LIKE点赞;
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);
    const noticedata = {
      type_id: 4,
      receive_user_id,
      start_user_id: user_id,
      rel_id,
      content_id,
      regist_id,
      content_type,
      title: userInfo.nickname + '点赞了你参与的' + this.app.config.contentType[content_type - 1].name,
      desc,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }
}

module.exports = RegistService;
