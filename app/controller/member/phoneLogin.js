'use strict';

const Controller = require('egg').Controller;

class PhoneLoginController extends Controller {
  async bindPhone() {
    const { ctx, app } = this;
    const phone_passw = ctx.request.body;
    // 处理密码
    const getpass = phone_passw.passWord + '12m26zd19az904f5ad3ab77d';
    const md5pass = ctx.crypto.MD5(getpass).toString();
    phone_passw.passWord = md5pass;
    // 判断注册
    const is_login_in = await app.mysql.get('login', { phone: phone_passw.phone });
    let return_data = {};// 需要返回的data主体
    let error_code = 0;// 错误代码
    let error_message = '';// 错误信息
    if (is_login_in) {
      const user_login = JSON.parse(JSON.stringify(is_login_in));
      if (user_login.password === phone_passw.passWord) {
        //   登录成功
        const user_id = user_login.user_id;
        return_data = await this.gerReturnData(user_id);
        const token = app.jwt.sign({ user_id }, app.config.jwt.secret, { expiresIn: '3 days' });
        return_data.token = token;
      } else {
        //   密码错误
        error_code = 1001;
        error_message = '密码错误';
      }
    } else {
      const login_user = await this.app.mysql.insert('login', {
        phone: phone_passw.phone,
        password: phone_passw.passWord,
      });
      const user_id = login_user.insertId;
      const token = app.jwt.sign({ user_id }, app.config.jwt.secret, { expiresIn: '3 days' });
      const headimgurl = '/defhead/' + parseInt(Math.random() * (29), 10) + '.png';
      await this.app.mysql.insert('userinfo', {
        user_id,
        phone: phone_passw.phone,
        headimgurl,
      });
      return_data.user_id = user_id;
      return_data.nickname = '';
      return_data.headimgurl = headimgurl;
      return_data.token = token;
      return_data.need_info = 1;// 需要完善信息
    }
    ctx.body = {
      error: error_code,
      message: error_message,
      data: return_data,
    };
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
    ctx.body = {
      token,
    //   abody,
    };
  }
}

module.exports = PhoneLoginController;
