'use strict';

const Service = require('egg').Service;

class InfoService extends Service {
  async reg(user_id, reqData) {
    const { ctx, app } = this;

    const name_first_letter = ctx.service.login.getNameFirstCharter(reqData.nickname);
    const info_last_modify_time = ctx.service.base.fromatDate(new Date().getTime());
    const upDataInfo = {
      nickname: reqData.nickname,
      district_id: reqData.district_id,
      name_first_letter,
      info_last_modify_time,
    };
    const result = await this.app.mysql.update(app.config.dbprefix + 'user_profile', upDataInfo, { where: { user_id } });
    const updateSuccess = result.affectedRows === 1;
    return updateSuccess;
  }
}

module.exports = InfoService;
