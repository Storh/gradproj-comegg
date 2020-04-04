'use strict';

const Controller = require('egg').Controller;

class PhoneLoginController extends Controller {
  async bindPhone() {
    const { ctx } = this;
    const phone_passw = ctx.request.body;
    if (phone_passw.passWord && phone_passw.phone) {
      const data = await ctx.service.login.authUserInfoLogin(phone_passw);
      ctx.body = { data };
    } else {
      this.ctx.throw('登录数据不完整');
    }
  }
  async gerReturnData(user_id) {
    const raw_info = await this.app.mysql.get('userinfo', { user_id });
    const user_info = JSON.parse(JSON.stringify(raw_info));
    const sign_user_info = {};
    sign_user_info.user_id = user_info.user_id;
    sign_user_info.nickname = user_info.nickname;
    sign_user_info.headimgurl = user_info.headimgurl;
    sign_user_info.need_info = 1;// 需要完善信息
    if (user_info.districts) {
      sign_user_info.need_info = 0;// 不需要完善信息
    }
    return sign_user_info;
  }
  async jwttest() {
    const { ctx, app } = this;
    const abody = ctx.state.user;
    console.log(abody);
    const token = app.jwt.sign({ foo: 'bar' }, app.config.jwt.secret, { expiresIn: '3 days' });
    // const token = app.jwt.sign({ foo: 'bar' }, app.config.jwt.secret, { expiresIn: 10 });
    ctx.body = {
      token,
      abody,
    };
  }
  async login() {
    const { ctx, app } = this;
    // const abody = ctx.state.user;
    console.log(app.config.dbprefix);
    const token = app.jwt.sign({ foo: 'bar' }, app.config.jwt.secret, { expiresIn: '3 days' });
    // const token = app.jwt.sign({ foo: 'bar' }, app.config.jwt.secret, { expiresIn: 10 });
    // this.ctx.throw('有猫饼', { data: { token }, myErrType: 255 });
    // this.ctx.throw('有猫饼', { data: { token } });
    const abody = await ctx.service.helper.getNameFirstCharter('W');
    ctx.body = {
      token,
      abody,
    };
  }
}

module.exports = PhoneLoginController;
