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
    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(item => {
      if (item.headimgurl.length < 100) item.headimgurl = this.app.config.publicAdd + item.headimgurl;
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      if (item.reply_time) item.reply_time = this.ctx.service.base.fromatDate(new Date(item.reply_time).getTime());
      return item;
    });
    return list;
  }
  // 获取动态内容
  async getDetailById(user_id, content_id) {
    // 动态内容(1)用户参与(2)评论(3)
    // 点赞类型
    const likeType = 1;
    const sqlstr =
    `SELECT a.content_id,a.type_id,a.title,a.content,a.keyword,a.show_type,a.visit_num,a.like_num,a.collect_num,a.add_time,a.link_external_name,a.link_external_url,
    b.user_id,b.phone,b.nickname,b.headimgurl,b.personal_signature,
    c.closing_date,c.num_upper_limit,

    if((SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND rel_id = a.content_id AND user_id = ${user_id}) = 1, 1, 0) AS like_state,
    if((SELECT collect_state FROM ${this.app.config.dbprefix}collect_record WHERE rel_id = a.content_id AND user_id = ${user_id}) = 1, 1, 0) AS collect_state

    FROM ${this.app.config.dbprefix}content_record a
    INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id
    LEFT JOIN ${this.app.config.dbprefix}activity_content c ON c.content_id = a.content_id

    WHERE a.content_id = ${content_id}
    AND a.is_delete = 0
    AND a.state = 1`;
    const results = await this.app.mysql.query(sqlstr);

    const data = JSON.parse(JSON.stringify(results[0]));
    if (data.headimgurl.length < 100) { data.headimgurl = this.app.config.publicAdd + data.headimgurl; }
    return data;
  }

  async add(user_id, reqData) {
    const { ctx, app } = this;
    const date_now = ctx.service.base.fromatDate(new Date().getTime());
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);

    const title = reqData.title;
    const images = reqData.images;
    const content = reqData.content;
    const show_type = reqData.show_type;
    const keyword = reqData.keyword;
    const link_external_name = reqData.link_external_name;
    const link_external_url = reqData.link_external_url;
    const closing_date = new Date(reqData.closing_date);
    const num_upper_limit = reqData.num_upper_limit;
    const district_id = userInfo.district_id;

    let content_id;

    const trans_success = await app.mysql.beginTransactionScope(async addmain => {

      const add_main_log = await addmain.insert(app.config.dbprefix + 'content_record', {
        type_id: 4,
        user_id,
        district_id,
        title,
        content,
        show_type,
        keyword,
        link_external_name,
        link_external_url,
        add_time: date_now,
      });
      content_id = add_main_log.insertId;

      // 插入活动内容表
      addmain.insert(app.config.dbprefix + 'activity_content', {
        content_id,
        closing_date,
        num_upper_limit,
      });


      // 关键字
      if (keyword) {
        const keywordArr = keyword.split(',');
        keywordArr.forEach(aword => {
          addmain.insert(app.config.dbprefix + 'content_keyword', {
            content_id,
            keyword: aword,
          });
        });
      }

      // 图片
      if (images) {
        const uploadType = 2;// 动态内容图片
        const photoIdArr = images.map(item => {
          return item.id;
        });
        await addmain.update(app.config.dbprefix + 'upload_file_record',
          {
            rel_id: content_id,
          },
          {
            where: {
              type_id: uploadType,
              user_id,
              file_id: photoIdArr,
            },
          });
      }
      return true;
    }, ctx);

    if (!trans_success) {
      ctx.throw('提交失败，请重试');
    }
    return content_id;
  }

  async edit(user_id, reqData) {
    const { ctx, app } = this;
    const date_now = ctx.service.base.fromatDate(new Date().getTime());

    const content_id = reqData.content_id;
    const title = reqData.title;
    const images = reqData.images;
    const content = reqData.content;
    const show_type = reqData.show_type;
    const keyword = reqData.keyword;
    const link_external_name = reqData.link_external_name;
    const link_external_url = reqData.link_external_url;
    const closing_date = new Date(reqData.closing_date);
    const num_upper_limit = reqData.num_upper_limit;

    const trans_success = await app.mysql.beginTransactionScope(async addmain => {

      // 更新动态内容表
      addmain.update(app.config.dbprefix + 'content_record', {
        title,
        content,
        show_type,
        keyword,
        link_external_name,
        link_external_url,
        modify_time: date_now,
      },
      {
        where: {
          content_id,
          user_id,
        },
      });
      // 更新活动内容表
      addmain.update(app.config.dbprefix + 'activity_content', {
        closing_date,
        num_upper_limit,
      },
      {
        where: {
          content_id,
        },
      });


      // 关键字
      await addmain.delete(app.config.dbprefix + 'content_keyword', {
        content_id,
      });

      if (keyword) {
        const keywordArr = keyword.split(',');
        keywordArr.forEach(aword => {
          addmain.insert(app.config.dbprefix + 'content_keyword', {
            content_id,
            keyword: aword,
          });
        });
      }

      // 图片
      if (images) {
        const uploadType = 2;// 动态内容图片
        const photoIdArr = images.map(item => {
          return item.id;
        });
        // 删除原来存储的图片
        const delstr =
          `SELECT *
FROM ${app.config.dbprefix}upload_file_record
WHERE type_id=${uploadType}
AND user_id=${user_id}
AND rel_id=${content_id}
AND file_id NOT IN (${photoIdArr.toString()})`;
        const dellist = await addmain.query(delstr);

        dellist.forEach(item => {
          addmain.delete(app.config.dbprefix + 'upload_file_record', {
            file_id: item.file_id,
          });
        });

        await addmain.update(app.config.dbprefix + 'upload_file_record',
          {
            rel_id: content_id,
          },
          {
            where: {
              type_id: uploadType,
              user_id,
              file_id: photoIdArr,
            },
          });
      }
      return true;
    }, ctx);

    if (!trans_success) {
      ctx.throw('提交失败，请重试');
    }
    return true;
  }

  async registAdd(user_id, reqData) {
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());
    const is_regist = await this.app.mysql.get(this.app.config.dbprefix + 'activity_regist',
      {
        user_id,
        content_id: reqData.content_id,
        is_delete: 0,
        state: 1,
      });
    if (is_regist) this.ctx.throw('您已参与过了这次活动了');

    const active_info = await this.app.mysql.get(this.app.config.dbprefix + 'activity_content',
      {
        content_id: reqData.content_id,
      });
    const activity_content = JSON.parse(JSON.stringify(active_info));
    const closing_date = activity_content.closing_date;
    const num_upper_limit = activity_content.num_upper_limit;
    if (new Date(closing_date).getTime() - new Date().getTime() <= 0) this.ctx.throw('很抱歉，该活动已结束，请关注下次活动');

    const limirsql =
`SELECT count(*) as nums
FROM ${this.app.config.dbprefix}activity_regist
WHERE 1
AND is_delete = 0
AND state = 1
AND content_id = ${reqData.content_id}`;
    const row = await this.app.mysql.query(limirsql);
    const limitusernum = JSON.parse(JSON.stringify(row[0]));
    if (limitusernum.nums + 1 > num_upper_limit) this.ctx.throw('很抱歉，该活动已达参与人数上限，谢谢您的参与，请关注下次活动');

    const remark = reqData.remark;

    const regist_log = await this.app.mysql.insert(this.app.config.dbprefix + 'activity_regist', {
      user_id,
      content_id: reqData.content_id,
      remark,
      add_time: date_now,
    });
    if (regist_log) {
      // 通知
      this.registAddPostNotice(user_id, reqData.content_id, regist_log.insertId);
      return regist_log.insertId;
    }
    this.ctx.throw('提交失败');
  }

  async registAddPostNotice(user_id, content_id, regist_id) {
    // SYSTEM系统通知(1);CONTENT_REGIST内容参与记录(2);CONTENT_REVIEW内容评论记录(3);TYPE_LIKE点赞(4);
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);
    const contentInfo = await this.ctx.service.common.getContentInfoById(content_id);

    const noticedata = {
      type_id: 2,
      receive_user_id: contentInfo.user_id,
      start_user_id: user_id,
      rel_id: regist_id,
      content_id,
      regist_id,
      content_type: contentInfo.type_id,
      title: userInfo.nickname + '参与了你的' + this.app.config.contentType[contentInfo.type_id - 1].name,
      desc: contentInfo.content,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }
}

module.exports = ActivityService;
