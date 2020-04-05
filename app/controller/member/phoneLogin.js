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

  async login() {
    const { ctx, app } = this;
    // const abody = ctx.state.user;
    // console.log(app.config.dbprefix);
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
