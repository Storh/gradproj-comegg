'use strict';

const Service = require('egg').Service;
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};
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

  // 获取特长爱好列表
  async getKindList(type_id) {
    const results = await this.app.mysql.select(this.app.config.dbprefix + 'kind', {
      where: { type_id, state: 1 },
      columns: [ 'kind_id', 'kind_name' ],
      orders: [[ 'sort', 'desc' ], [ 'kind_id', 'ASC' ]],
    });
    return results;
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
    if (type === 'hobby') { type_id = 2; }
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
    const visit_log = await app.mysql.insert(this.app.config.dbprefix + 'visit_record', {
      user_id,
      rel_id: content_id,
      add_time: date_now,
    });
    if (visit_log) {
      const sqlstr = 'UPDATE ' + app.config.dbprefix + 'content_record '
      + 'SET visit_num = visit_num + 1 '
      + 'WHERE content_id = ' + content_id;
      app.mysql.query(sqlstr);
    }
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

  // 通过id获得动态内容详情
  async getContentInfoById(content_id) {
    const result = await this.app.mysql.get(this.app.config.dbprefix + 'content_record', { content_id, is_delete: 0, state: 1 });
    return JSON.parse(JSON.stringify(result));
  }

  getOrderNoById(order_id) {
    // 订单号order_id的随机数组
    const arr = [ 3, 5, 8, 1, 9, 7, 0, 4, 2, 6 ];
    // 订单号order_id的随机数组位数
    const arrLen = 3;

    let orderIdStr = '000' + order_id;
    orderIdStr = orderIdStr.substr(-arrLen);

    const orderIdArr = orderIdStr.split(',');
    const orderArr = orderIdArr.map(v => { return arr[v]; });
    const order = orderArr.toString();
    const rand = Math.floor(Math.random() * (999 - 111 + 1) + 111).toString();

    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const formatArr = [ year, month, day, hour, minute, second ];
    const order_no = formatArr.map(formatNumber).toString().replace(/,/g, '') + rand + order;
    return order_no;
  }

  async upload(user_id, src, imgsize) {
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());

    const uploadImg = await this.app.mysql.insert(this.app.config.dbprefix + 'upload_file_record', {
      type_id: 2,
      user_id,
      src,
      img_width: imgsize.width,
      img_height: imgsize.height,
      add_time: date_now,
    });
    if (uploadImg) {
      return {
        id: uploadImg.insertId,
        src: this.app.config.publicAdd + src,
      };
    }
    this.ctx.throw('添加失败');
  }
}

module.exports = CommonService;
