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
      if (item.add_time) item.add_time = new Date(item.add_time).toLocaleString();
      if (item.reply_time) item.reply_time = new Date(item.reply_time).toLocaleString();
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
        keywordArr.map(async aword => {
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
              rel_id: 0,
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
}

module.exports = ActivityService;
