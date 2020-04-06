'use strict';

const Service = require('egg').Service;

class CommonService extends Service {
  // 获取地区列表
  async getListByType(type) {
    const { app } = this;
    // 'dist'行政区(1),'street'街道(2),'estate'小区(3)
    let type_id = 0;
    switch (type) {
      case 'dist':
        type_id = 1;
        break;
      case 'street':
        type_id = 2;
        break;
      case 'estate':
        type_id = 3;
        break;
      default:
        this.ctx.throw('地区列表调用错误');
    }
    const resultstr = await this.app.mysql.select(app.config.dbprefix + 'district', {
      where: { type_id, is_delete: 0, state: 1 },
      columns: [ 'district_id', 'name' ],
      orders: [[ 'sort', 'desc' ], [ 'district_id', 'desc' ]],
    });
    const results = JSON.parse(JSON.stringify(resultstr));
    const list = [];
    results.forEach(element => {
      list.push({
        id: element.district_id,
        name: element.name,
      });
    });
    return list;
  }

  //   根据id获取某条小区数据
  async getDistById(district_id) {
    const result = await this.app.mysql.get(this.app.config.dbprefix + 'district', { district_id });
    return JSON.parse(JSON.stringify(result));
  }

  //   获取用户的爱好或者特长列表
  async getUserSpecHobyById(user_id, type) {
    let type_id;
    if (type === 'speciality') { type_id = 1; }
    if (type === 'hobby') { type_id = 1; }
    const resultstr = await this.app.mysql.select(this.app.config.dbprefix + 'kind_relation', {
      where: { rel_id: user_id, type_id },
      columns: [ 'kind_id', 'kind_name' ],
    });
    const resultlist = JSON.parse(JSON.stringify(resultstr));
    return resultlist;
  }

  // 添加通知
  async noticeRecordAdd(options) {
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());
    // const data = {
    //   type_id: options.type_id,
    //   receive_user_id: options.receive_user_id,
    //   title: options.title,
    //   desc: options.desc ? options.desc : '',
    //   add_time: date_now,
    // };
    // if (options.start_user_id) data.start_user_id = options.start_user_id;
    // if (options.rel_id) data.rel_id = options.rel_id;
    // if (options.content_id) data.content_id = options.content_id;
    // if (options.regist_id) data.regist_id = options.regist_id;
    // if (options.content_type) data.content_type = options.content_type;
    const data = { ...options };
    data.desc = options.desc ? options.desc : '';
    data.add_time = date_now;

    const addNotice = await this.app.mysql.insert(this.app.config.dbprefix + 'notice_record', data);
    if (addNotice) {
      return true;
    }
    return false;
  }

  //   观看数记录
  async visitRecordAdd(user_id, content_id) {
    const { ctx, app } = this;

    const date_now = ctx.service.base.fromatDate(new Date().getTime());

    const visit_success = await app.mysql.beginTransactionScope(async sqlvisit => {
      // don't commit or rollback by yourself
      const visit_log = await sqlvisit.insert(this.app.config.dbprefix + 'visit_record', {
        user_id,
        rel_id: content_id,
        add_time: date_now,
      });
      if (visit_log) {
        const sqlstr = 'UPDATE ' + app.config.dbprefix + 'content_record '
        + 'SET visit_num = visit_num + 1'
        + 'WHERE content_id = ' + content_id;
        await sqlvisit.query(sqlstr);
      }
      return { success: true };
    }, ctx);
    return !!visit_success;
  }

}

module.exports = CommonService;
