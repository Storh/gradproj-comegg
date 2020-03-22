'use strict';

const Controller = require('egg').Controller;

class HomeController extends Controller {
  async bindPhone() {
    const { ctx } = this;
    const phone_passw = ctx.request.body;
    // 处理密码
    const getpass = phone_passw.passWord + '12m26zd19az904f5ad3ab77d';
    const md5pass = ctx.crypto.MD5(getpass).toString();
    phone_passw.passWord = md5pass;
    // 判断注册
    const is_login_in = await this.app.mysql.get('login', { phone: phone_passw.phone });
    if (is_login_in) {
      const user_login = JSON.parse(JSON.stringify(is_login_in));
      if (user_login.password === phone_passw.passWord) {
        console.log(user_login.uid);

      } else {
        //   密码错误
      }
    } else {
      const login_user = await this.app.mysql.insert('login', {
        phone: phone_passw.phone,
        password: phone_passw.passWord,
      });
      const user_id = login_user.insertId;
      await this.app.mysql.insert('userinfo', {
        user_id,
        phone: phone_passw.phone,
      });
    }
    ctx.body = {
      code: 20,
    };
  }
}

module.exports = HomeController;
