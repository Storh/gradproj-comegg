'use strict';

const Service = require('egg').Service;
class LoginService extends Service {
  async authUserInfoLogin(phone_passw) {
    // 处理密码
    const { ctx, app } = this;
    const getpass = phone_passw.passWord + '12m26zd19az904f5ad3ab77d';
    const md5pass = ctx.crypto.MD5(getpass).toString();
    phone_passw.passWord = md5pass;
    // 判断注册
    const is_login_in = await app.mysql.get(app.config.dbprefix + 'user_profile', { phone: phone_passw.phone });
    const date_now = ctx.service.base.fromatDate(new Date().getTime());
    if (is_login_in) {
      // 登录行为
      const user_login = JSON.parse(JSON.stringify(is_login_in));
      if (user_login.password === phone_passw.passWord) {
        // 登录成功
        if (user_login.state === 0) {
          this.ctx.throw('用户已禁用');
        } else {
          const user_id = user_login.user_id;
          const need_info = user_login.district_id ? 0 : 1;
          const nickname = user_login.nickname;
          const headimgurl = user_login.headimgurl;
          const token = app.jwt.sign({ user_id }, app.config.jwt.secret, { expiresIn: '3 days' });
          const last_login_time = date_now;
          await this.app.mysql.update(app.config.dbprefix + 'user_profile', { last_login_time }, {
            where: {
              user_id,
            },
          });
          return {
            user_id,
            nickname,
            headimgurl,
            token,
            need_info,
          };
        }
      } else {
        // 密码错误
        this.ctx.throw('密码错误', { myErrType: 1001 });
      }
    } else {
      // 注册行为
      // 生成默认头像
      const headimgurl = 'defhead/' + parseInt(Math.random() * (29), 10) + '.png';
      // 默认昵称为手机号
      const nickname = phone_passw.phone;
      const name_first_letter = await this.getNameFirstCharter(nickname);
      const login_user = await this.app.mysql.insert(app.config.dbprefix + 'user_profile', {
        phone: phone_passw.phone,
        password: phone_passw.passWord,
        headimgurl,
        nickname,
        name_first_letter,
        add_time: date_now,
      });
      if (login_user) {
        const user_id = login_user.insertId;
        const token = app.jwt.sign({ user_id }, app.config.jwt.secret, { expiresIn: '3 days' });
        return {
          user_id,
          nickname,
          headimgurl,
          token,
          need_info: 1, // 需要完善信息
        };
      }
      this.ctx.throw('注册失败');
    }
  }

  async getNameFirstCharter(name) {
    const pinyin = require('pinyin');
    const fchar = pinyin(name, { style: pinyin.STYLE_NORMAL })[0][0][0];
    if (fchar >= 'A' && fchar <= 'z') { return fchar.toUpperCase(); }
    if (fchar >= '0' && fchar <= '9') { return fchar.toUpperCase(); }
    return '#';
  }

  async userInfo(user_id) {
    const userInfo = await this.getUserInfo(user_id);
    if (userInfo.districts) {
      // 获取所在小区的详细信息
      userInfo.districts = await this.getUserDistricts(userInfo.districts);
    }
    // 获取职业特长
    userInfo.speciality = await this.getUserSpeciality(userInfo.speciality);
    // 获取业余爱好
    userInfo.hobby = await this.getUserHobby(userInfo.hobby);
    return userInfo;
  }

  async getUserInfo(user_id) {
    const result = await this.app.mysql.get('userinfo', { user_id });
    return JSON.parse(JSON.stringify(result));
  }
  async getUserDistricts(set_id) {
    const estresult = await this.app.mysql.get('estate', { id: set_id });
    const estinfo = JSON.parse(JSON.stringify(estresult));
    const strresult = await this.app.mysql.get('street', { id: estinfo.sid });
    const strinfo = JSON.parse(JSON.stringify(strresult));
    return {
      estate: {
        id: estinfo.id,
        name: estinfo.name,
      },
      street: {
        id: strinfo.id,
        name: strinfo.name,
      },
    };
  }
  async getUserSpeciality(specialityList) {
    const specialityLength = specialityList.length;
    const speciality = [];
    for (let i = 0; i < specialityLength; i++) {
      const speresult = await this.app.mysql.get('speciality', { kind_id: specialityList[i] });
      speciality.push(JSON.parse(JSON.stringify(speresult)));
    }
    return speciality;
  }
  async getUserHobby(hobbyList) {
    const hobbyLength = hobbyList.length;
    const hobby = [];
    for (let i = 0; i < hobbyLength; i++) {
      const hobresult = await this.app.mysql.get('hobby', { kind_id: hobbyList[i] });
      hobby.push(JSON.parse(JSON.stringify(hobresult)));
    }
    return hobby;
  }
}
module.exports = LoginService;
