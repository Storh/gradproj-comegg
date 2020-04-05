'use strict';

const Service = require('egg').Service;

class SphobService extends Service {
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

module.exports = SphobService;
