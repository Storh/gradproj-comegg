'use strict';

const Service = require('egg').Service;
class UserService extends Service {
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
module.exports = UserService;
