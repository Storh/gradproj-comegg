'use strict';

const Controller = require('egg').Controller;

class InfoController extends Controller {
  async reg() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;// 获取post数据

    if (!reqData.nickname) {
      this.ctx.throw('姓名不能为空');
    }
    if (!reqData.district_id) {
      this.ctx.throw('所在小区ID不能为空');
    }
    // if (!Number.isInteger(reqData.district_id)) {
    //   this.ctx.throw('无效小区ID');
    // }

    const updateSuccess = await ctx.service.member.info.reg(user_id, reqData);
    if (updateSuccess) {
      ctx.body = {
        data: {},
      };
    } else {
      this.ctx.throw('提交失败');
    }
  }

  async getInfo() {
    const { ctx } = this;
    const user_id = ctx.request.body.user_id;// 获取post数据
    console.log(ctx.request.body);
    // if (!Number.isInteger(user_id)) {
    //   this.ctx.throw('无效用户ID');
    // }
    // 基础数据
    const userInfo = await ctx.service.member.info.getInfo(user_id);
    if (userInfo.headimgurl.length < 20) { userInfo.headimgurl = this.app.config.publicAdd + userInfo.headimgurl; }
    // 地址信息
    console.log(userInfo);
    const estaterow = await ctx.service.common.getDistById(userInfo.district_id);
    const streetrow = await ctx.service.common.getDistById(estaterow.parent_id);
    userInfo.districts = {
      estate: {
        id: estaterow.district_id,
        name: estaterow.name,
      },
      street: {
        id: streetrow.district_id,
        name: streetrow.name,
      },
    };
    // 职业特长
    userInfo.speciality = await ctx.service.common.getUserSpecHobyById(user_id, 'speciality');
    // 业余爱好
    userInfo.hobby = await ctx.service.common.getUserSpecHobyById(user_id, 'hobby');
    ctx.body = {
      data: userInfo,
    };
  }
}

module.exports = InfoController;
