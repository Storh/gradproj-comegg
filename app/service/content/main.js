'use strict';

const Service = require('egg').Service;

class MainService extends Service {

  async add(user_id, reqData) {
    const { ctx, app } = this;
    const date_now = ctx.service.base.fromatDate(new Date().getTime());
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);

    const type_id = reqData.type_id;
    const title = reqData.title;
    const images = reqData.images;
    const content = reqData.content;
    const show_type = reqData.show_type;
    const keyword = reqData.keyword;
    const link_external_name = reqData.link_external_name;
    const link_external_url = reqData.link_external_url;
    const district_id = userInfo.district_id;
    let content_id;

    const trans_success = await app.mysql.beginTransactionScope(async addmain => {

      const add_main_log = await addmain.insert(app.config.dbprefix + 'content_record', {
        type_id,
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

    const trans_success = await app.mysql.beginTransactionScope(async addmain => {

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

      // 关键字
      await addmain.delete(app.config.dbprefix + 'content_keyword', {
        content_id,
      });

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
        // 删除原来存储的图片
        const delstr =
          `SELECT *
FROM ${app.config.dbprefix}upload_file_record
WHERE type_id=${uploadType}
AND user_id=${user_id}
AND rel_id=${content_id}
AND file_id NOT IN (${photoIdArr.toString()})`;
        const dellist = await addmain.query(delstr);

        dellist.map(async item => {
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
    return true;
  }

  // 喜欢或不喜欢
  async setLike(user_id, reqData) {
    const like_state = Number(reqData.like_state);
    // 获取动态内容
    const { ctx, app } = this;
    const contentBaseInfoRow = await this.app.mysql.select(this.app.config.dbprefix + 'content_record', {
      where: { content_id: reqData.content_id, state: 1, is_delete: 0 },
      columns: [ 'content_id', 'type_id', 'user_id', 'content', 'like_num' ],
    });

    const contentBaseInfo = JSON.parse(JSON.stringify(contentBaseInfoRow))[0];
    const receive_user_id = contentBaseInfo.user_id;
    const content_type = contentBaseInfo.type_id;
    const desc = contentBaseInfo.content;
    const like_num_ori = contentBaseInfo.like_num;

    const date_now = ctx.service.base.fromatDate(new Date().getTime());
    // 自动事务
    let like_state_ori;
    let like_id;
    const trans_success = await app.mysql.beginTransactionScope(async sqlsetlike => {
      // 读取点赞记录
      //   动态内容(1); 用户参与(2);评论(3)
      const type = 1;
      const is_setlike_log = await sqlsetlike.get(this.app.config.dbprefix + 'like_record', {
        type_id: type,
        user_id,
        rel_id: reqData.content_id,
      });
      if (!is_setlike_log) {
        // 未设置喜欢
        if (like_state === 0) {
          ctx.throw('您还未点赞');
        } else {
          like_state_ori = -1;
          const set_like_log = await sqlsetlike.insert(app.config.dbprefix + 'like_record', {
            type_id: type,
            user_id,
            rel_id: reqData.content_id,
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
        await sqlsetlike.update(app.config.dbprefix + 'like_record',
          {
            like_state,
            modify_time: date_now,
          },
          { where: { like_id } });
      }
      // 更新动态内容表
      if (like_state_ori !== like_state) {
        const like_num_offset = like_state === 1 ? 1 : -1;

        if (like_num_ori === 0 && like_num_offset < 0) {
          console.log('中奖了');
        } else {
          const sqlstr = 'UPDATE ' + app.config.dbprefix + 'content_record '
            + 'SET like_num = like_num + (' + like_num_offset + ') '
            + 'WHERE content_id = ' + reqData.content_id;
          await sqlsetlike.query(sqlstr);
        }
      }
      return true;
    }, ctx);

    if (!trans_success) {
      ctx.throw('操作失败，请重试');
    }

    if (like_state === 1 && like_state_ori !== like_state) {
      // 添加通知
      this.setLikePostNotice(user_id, like_id, reqData.content_id, receive_user_id, content_type, desc);
    }

    return true;
  }

  //   点赞后发送系统通知
  async setLikePostNotice(user_id, rel_id, content_id, receive_user_id, content_type, desc) {
    // 系统通知(1)内容参与记录(2)内容评论记录(3)点赞(4)
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);
    const noticedata = {
      type_id: 4,
      receive_user_id,
      start_user_id: user_id,
      rel_id,
      content_id,
      content_type,
      title: userInfo.nickname + '点赞了你的' + this.app.config.contentType[content_type - 1].name,
      desc,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }

  //   获取首页列表
  async getList(user_id, reqData) {
    // [1,2,3,4,5,6]
    // ['互助','问答','乐享','活动','团购','话题']
    let sql_event_type = '';// 类型检索

    switch (reqData.event_type) {
      case 1:
        sql_event_type = 'AND a.type_id IN (1, 2, 6)';
        break;
      case 2:
        sql_event_type = 'AND a.type_id IN (3, 4, 5)';
        break;
      default:
        sql_event_type = '';
    }

    let sql_district_type = '';// 社区检索

    switch (reqData.district_type) {
      case 1:
        sql_district_type = ' AND a.district_id = (SELECT district_id FROM ' + this.app.config.dbprefix + 'user_profile WHERE user_id = ' + user_id + ')';
        break;
      case 2:
        sql_district_type = 'AND FIND_IN_SET(a.district_id' +
          '(SELECT GROUP_CONCAT(district_id) FROM ' + this.app.config.dbprefix + 'district WHERE is_delete = 0 AND state = 1' +
          'AND parent_id = (SELECT parent_id FROM ' + this.app.config.dbprefix + 'district WHERE district_id = (SELECT district_id FROM ' + this.app.config.dbprefix + 'user_profile WHERE user_id = ' + user_id + '))))' +
          'AND a.show_type = 2';
        break;
      default:
        sql_district_type = '';
    }
    let sql_search_key;
    if (reqData.search_key) {
      sql_search_key = "AND t.keywords LIKE '%" + await this.escape_like_str(reqData.search_key) + "%'";
    } else {
      sql_search_key = '';
    }

    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    const likeType = 1;// 动态内容
    const photoType = 2;// 动态内容图片

    // 执行查找
    const list = await this.duSearchList(user_id, photoType, likeType, sql_event_type, sql_district_type, sql_search_key, limit);
    return list;
  }

  //   进行首页列表实际内容的检索
  async duSearchList(user_id, photoType, likeType, sql_event_type, sql_district_type, sql_search_key, limit) {
    const sqlstr = `SELECT t.content_id,t.type_id,t.title,t.image,t.content,t.visit_num,t.like_num,t.user_id,t.nickname,t.headimgurl,
                if(t.like_state = 1,1,0) AS like_state

                FROM(
                SELECT a.content_id,a.type_id,a.title,a.content,a.visit_num,a.like_num,a.user_id,a.sort,
                b.nickname, b.headimgurl,
                (SELECT CONCAT(src,',',img_width,',',img_height) FROM ${this.app.config.dbprefix}upload_file_record WHERE type_id = ${photoType} AND rel_id = a.content_id ORDER BY file_id ASC LIMIT 1) AS image,
                (SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND rel_id = a.content_id AND user_id = ${user_id}) AS like_state,
                
                CONCAT(
                    a.title,
                    a.content
                ) as keywords
                
                FROM ${this.app.config.dbprefix}content_record a
                INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id
                
                WHERE 1
                AND a.is_delete = 0
                AND a.state = 1

                ${sql_event_type}
                
                ${sql_district_type}
                ) t
                
                WHERE 1
                ${sql_search_key}
                
                ORDER BY t.sort DESC, t.content_id DESC
                
                ${limit}
                `;
    const results = await this.app.mysql.query(sqlstr);
    return JSON.parse(JSON.stringify(results));
  }

  //   对搜索中like关键字符进行替换
  async escape_like_str(str) {
    str.replace(/%/g, '/%');
    str.replace(/_/g, '/_');
    return str;
  }

  // 获取动态内容
  async getDetailById(user_id, content_id) {
    // 动态内容(1)用户参与(2)评论(3)
    // 点赞类型
    const likeType = 1;
    const sqlstr = `SELECT a.content_id,a.type_id,a.title,a.content,a.keyword,a.show_type,a.visit_num,a.like_num,a.collect_num,a.add_time,a.link_external_name,a.link_external_url,
    b.user_id,b.phone,b.nickname,b.headimgurl,b.personal_signature,

    if((SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND rel_id = a.content_id AND user_id = ${user_id}) = 1, 1, 0) AS like_state,
    if((SELECT collect_state FROM ${this.app.config.dbprefix}collect_record WHERE rel_id = a.content_id AND user_id = ${user_id}) = 1, 1, 0) AS collect_state

    FROM ${this.app.config.dbprefix}content_record a
    INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id

    WHERE a.content_id = ${content_id}
    AND a.is_delete = 0
    AND a.state = 1`;
    const results = await this.app.mysql.query(sqlstr);

    const data = JSON.parse(JSON.stringify(results[0]));
    if (data.headimgurl.length < 100) { data.headimgurl = this.app.config.publicAdd + data.headimgurl; }
    return data;
  }

  //   获取动态的图片列表
  async getPhotos(content_id) {
    // 用户头像(1)动态内容图片(2)
    const type_id = 2;
    const photoListRow = await this.app.mysql.select(this.app.config.dbprefix + 'upload_file_record', {
      where: { type_id, rel_id: content_id },
      columns: [ 'file_id', 'src' ],
    });
    const photoList = JSON.parse(JSON.stringify(photoListRow));
    const images = [];
    photoList.forEach(element => {
      images.push({
        id: element.file_id,
        src: this.app.config.publicAdd + element.src,
      });
    });
    return images;
  }

  async setCollect(user_id, reqData) {
    const collect_state = Number(reqData.collect_state);
    // 获取动态内容
    const { ctx, app } = this;
    const contentBaseInfoRow = await this.app.mysql.get(this.app.config.dbprefix + 'content_record', {
      content_id: reqData.content_id,
      state: 1,
      is_delete: 0,
    });

    const contentBaseInfo = JSON.parse(JSON.stringify(contentBaseInfoRow));
    const collect_num_ori = contentBaseInfo.collect_num;
    const date_now = ctx.service.base.fromatDate(new Date().getTime());
    // 自动事务
    let collect_state_ori;
    let collect_id;
    const trans_success = await app.mysql.beginTransactionScope(async sqlsetColl => {
      const is_setColl_log = await sqlsetColl.get(this.app.config.dbprefix + 'collect_record', {
        user_id,
        rel_id: reqData.content_id,
      });
      if (!is_setColl_log) {
        // 未设置喜欢
        if (collect_state === 0) {
          ctx.throw('您还未收藏');
        } else {
          collect_state_ori = -1;
          const set_coll_log = await sqlsetColl.insert(app.config.dbprefix + 'collect_record', {
            user_id,
            rel_id: reqData.content_id,
            collect_state,
            add_time: date_now,
          });
          if (set_coll_log) {
            collect_id = set_coll_log.insertId;
          } else {
            ctx.throw('操作失败');
          }
        }
      } else {
        const setColl_log = JSON.parse(JSON.stringify(is_setColl_log));
        collect_id = setColl_log.collect_id;
        collect_state_ori = setColl_log.collect_state;
        await sqlsetColl.update(app.config.dbprefix + 'collect_record',
          {
            collect_state,
            modify_time: date_now,
          },
          { where: { collect_id } });
      }
      // 更新动态内容表
      if (collect_state_ori !== collect_state) {
        const collect_num_offset = collect_state === 1 ? 1 : -1;

        if (collect_num_ori === 0 && collect_num_offset < 0) {
          console.log('中奖了');
        } else {
          const sqlstr =
            `UPDATE ${app.config.dbprefix}content_record
          SET collect_num = collect_num + (${collect_num_offset})
          WHERE content_id = ${reqData.content_id}`;
          await sqlsetColl.query(sqlstr);
        }
      }
      return true;
    }, ctx);

    if (!trans_success) {
      ctx.throw('操作失败，请重试');
    }
    return true;
  }

}

module.exports = MainService;
