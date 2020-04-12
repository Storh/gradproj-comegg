'use strict';

const Service = require('egg').Service;

class InfoService extends Service {
  async reg(user_id, reqData) {
    const { ctx, app } = this;

    const name_first_letter = await ctx.service.login.getNameFirstCharter(reqData.nickname);
    const info_last_modify_time = await ctx.service.base.fromatDate(new Date().getTime());
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

  async getInfo(user_id) {
    const result = await this.app.mysql.select(this.app.config.dbprefix + 'user_profile', {
      where: { user_id, state: 1 },
      columns: [ 'user_id', 'phone', 'nickname', 'headimgurl', 'sex', 'district_id', 'personal_signature', 'is_manage' ], // 要查询的表字段
    });
    return JSON.parse(JSON.stringify(result))[0];
  }

  async edit(user_id, reqData) {
    const { ctx, app } = this;
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());
    const nickname = reqData.nickname;
    const sex = reqData.sex;
    const personal_signature = reqData.personal_signature;
    const speciality = reqData.speciality;
    const hobby = reqData.hobby;

    const trans_success = await app.mysql.beginTransactionScope(async editInfo => {

      // 更新职业特长关联表
      const specialityTypeId = 1;
      await editInfo.delete(app.config.dbprefix + 'kind_relation', {
        type_id: specialityTypeId, // 职业特长
        rel_id: user_id,
      });
      const specialityArr = speciality.map(async item => {
        editInfo.insert(app.config.dbprefix + 'kind_relation', {
          type_id: specialityTypeId,
          rel_id: user_id,
          kind_id: item.kind_id,
          kind_name: item.kind_name,
        });
        return item.kind_name;
      });

      // 更新业余爱好关联表
      const hobbyTypeId = 2;
      await editInfo.delete(app.config.dbprefix + 'kind_relation', {
        type_id: hobbyTypeId, // 职业特长
        rel_id: user_id,
      });
      const hobbyArr = hobby.map(async item => {
        editInfo.insert(app.config.dbprefix + 'kind_relation', {
          type_id: hobbyTypeId,
          rel_id: user_id,
          kind_id: item.kind_id,
          kind_name: item.kind_name,
        });
        return item.kind_name;
      });

      // 更新用户表
      const result = await editInfo.update(this.app.config.dbprefix + 'user_profile',
        {
          nickname,
          name_first_letter: await ctx.service.login.getNameFirstCharter(nickname),
          sex,
          personal_signature,
          speciality: specialityArr.toString(),
          hobby: hobbyArr.toString(),
          info_last_modify_time: date_now,
        },
        {
          where: {
            user_id,
            state: 1,
          } });
      if (result.affectedRows === 1) return true;
      return false;
    }, ctx);

    if (!trans_success) {
      ctx.throw('操作失败，请重试');
    }
    return trans_success;
  }

  async getAddressList(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);

    const sql =
    `SELECT user_id,nickname,headimgurl,personal_signature,name_first_letter

    FROM ${this.app.config.dbprefix}user_profile

    WHERE state = 1
    AND user_id != ${user_id}
    AND district_id = ${userInfo.district_id}

    ORDER BY REPLACE(name_first_letter, '#', 'ZZZ') ASC, user_id DESC
    ${limit}`;
    const results = await this.app.mysql.query(sql);
    const list = results.map(item => {
      if (item.headimgurl.length < 100) item.headimgurl = this.app.config.publicAdd + item.headimgurl;
      return item;
    });
    return list;
  }
}

module.exports = InfoService;
