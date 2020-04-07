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
    const token = app.jwt.sign({ user_id: 1 }, app.config.jwt.secret, { expiresIn: '3 days' });
    // app.jwt.sign({ foo: 'bar' }, app.config.jwt.secret, { expiresIn: '3 days' });
    // const token = app.jwt.sign({ foo: 'bar' }, app.config.jwt.secret, { expiresIn: 10 });
    // this.ctx.throw('有猫饼', { data: { token }, myErrType: 255 });
    // this.ctx.throw('有猫饼', { data: { token } });

    // const result = await this.app.mysql.get(this.app.config.dbprefix + 'user_profile', { user_id: 369, state: 1 });
    // const resultarr = [ result ];
    const resultarr = await this.app.mysql.select(app.config.dbprefix + 'upload_file_record', {
      columns: [ 'src' ],
    });
    const resultmap = resultarr.map(item => {
      if (item.src) {
        item.src = 'http://www.chinaclick.com.cn/ailin/' + item.src;
      }
      return item.src;
    });
    const str = resultmap.toString();
    const link = str.replace(/,/g, `
    `);

    // const resultmap = resultarr.map(item => {
    //   if (item.add_time) {
    //     item.add_time = new Date(item.add_time).toLocaleString();
    //   }
    //   return item;
    // });

    // console.log(result);
    const abody = await ctx.service.helper.getNameFirstCharter('W');
    ctx.body = {
      token,
      abody,
      // resultmap,
      link,
    };
  }
}

module.exports = PhoneLoginController;
