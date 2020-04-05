'use strict';

const Service = require('egg').Service;

class MainService extends Service {
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
    const limitrow = await this.getPageStyle(reqData);

    const limit = limitrow.limit;

    const likeType = 1;// 动态内容
    const photoType = 2;// 动态内容图片

    // 执行查找
    const list = await this.duSearchList(user_id, photoType, likeType, sql_event_type, sql_district_type, sql_search_key, limit);
    return list;
  }
  async duSearchList(user_id, photoType, likeType, sql_event_type, sql_district_type, sql_search_key, limit) {
    const sqlstr = ' SELECT t.content_id,t.type_id,t.title,t.image,t.content,t.visit_num,t.like_num,t.user_id,t.nickname,t.headimgurl, '
            + ' if(t.like_state = 1,1,0) AS like_state '

            + ' FROM( '
            + ' SELECT a.content_id,a.type_id,a.title,a.content,a.visit_num,a.like_num,a.user_id,a.sort, '
            + ' b.nickname, b.headimgurl, '
            + " (SELECT CONCAT(src,',',img_width,',',img_height) FROM " + this.app.config.dbprefix + 'upload_file_record WHERE type_id = ' + photoType + ' AND rel_id = a.content_id ORDER BY file_id ASC LIMIT 1) AS image, '
            + ' (SELECT like_state FROM ' + this.app.config.dbprefix + 'like_record WHERE type_id = ' + likeType + ' AND rel_id = a.content_id AND user_id = ' + user_id + ' ) AS like_state, '
            + ' CONCAT(a.title,a.content) as keywords '

            + ' FROM ' + this.app.config.dbprefix + 'content_record a '
            + ' INNER JOIN ' + this.app.config.dbprefix + 'user_profile b ON b.user_id = a.user_id '

            + ' WHERE 1 AND a.is_delete = 0 AND a.state = 1 '

            + sql_event_type

            + sql_district_type
            + ' ) t WHERE 1 '
            + sql_search_key

            + ' ORDER BY t.sort DESC, t.content_id DESC '

            + limit;
    const results = await this.app.mysql.query(sqlstr);
    return JSON.parse(JSON.stringify(results));
  }

  //   对搜索中like关键字符进行替换
  async escape_like_str(str) {
    str.replace(/%/g, '/%');
    str.replace(/_/g, '/_');
    return str;
  }
  //   分页控制
  async getPageStyle(pageData) {
    const def_per_page = 30;// 默认每页条数
    // const def_page_top_row = 5;// 默认最多显示多少行数
    if (!pageData.page) {
      //   if (!page_default_num) {
      return {
        // 'type' => Base_data::PAGE_TYPE_ALL,
        limit: '',
      };
      //   }
      //   const num = page_default_num === -1 ? def_page_top_row : page_default_num;
      //   return {
      //     // 'type' => Base_data::PAGE_TYPE_DEFAULT_NUM,
      //     num,
      //     limit: 'LIMIT ' + num,
      //   };
    }
    const per_page = !pageData.page_num ? def_per_page : pageData.page_num;

    const offset = per_page * (pageData.page - 1);
    const page = pageData.page;
    return {
      // 'type' => Base_data::PAGE_TYPE_PAGING,
      page,
      per_page,
      offset,
      limit: 'LIMIT ' + offset + ', ' + per_page,
    };
  }
}

module.exports = MainService;
