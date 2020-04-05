'use strict';

const Service = require('egg').Service;

class CommonService extends Service {
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
  async getDistById(district_id) {
    const result = await this.app.mysql.get(this.app.config.dbprefix + 'district', { district_id });
    return JSON.parse(JSON.stringify(result));
  }
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
}

module.exports = CommonService;
