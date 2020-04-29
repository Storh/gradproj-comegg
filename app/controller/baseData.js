'use strict';
const fs = require('fs');
const path = require('path');
const sendToWormhole = require('stream-wormhole');
const awaitWriteStream = require('await-stream-ready').write;
const Controller = require('egg').Controller;
const sizeOf = require('image-size');
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

class BaseDataController extends Controller {
  // 返回微信登陆链接
  async authUserInfo() {
    const { ctx } = this;
    const redirectUrl = ctx.request.query.redirectUrl;
    if (!redirectUrl) { this.ctx.throw('redirect_uri 参数错误'); }
    const url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=' + this.app.config.wx_appid + '&redirect_uri=' + redirectUrl + '&response_type=code&scope=snsapi_userinfo&state=1#wechat_redirect';
    ctx.body = {
      data: url,
    };
  }
  // 获取微信信息和注册登录
  async authUserInfoLogin() {
    const { ctx } = this;
    const code = ctx.request.body.code;
    const get_access_token_url = 'https://api.weixin.qq.com/sns/oauth2/access_token?appid=' + this.app.config.wx_appid + '&secret=' + this.app.config.appSecret + '&code=' + code + '&grant_type=authorization_code';
    const result = await ctx.curl(get_access_token_url);
    const access_token = result.data.access_token;
    const openid = result.data.openid;

    const get_userinfo_url = `https://api.weixin.qq.com/sns/userinfo?access_token=${access_token}&openid=${openid}`;
    const inforesult = await ctx.curl(get_userinfo_url);
    const user_info_data = inforesult.data;
    ctx.body = {
      data: user_info_data,
    };
  }
  async distList() {
    const { ctx } = this;
    const list = await ctx.service.common.getListByType('estate');
    ctx.body = {
      data: { list },
    };
  }
  async specialityList() {
    const { ctx } = this;
    const list = await ctx.service.common.getKindList(1);
    ctx.body = {
      data: { list },
    };
  }
  async hobbyList() {
    const { ctx } = this;
    const list = await ctx.service.common.getKindList(2);
    ctx.body = {
      data: { list },
    };
  }
  async uploadPhoto() {
    const ctx = this.ctx;
    const user_id = ctx.state.user.user_id;
    const stream = await ctx.getFileStream();
    // 文件名
    const date = new Date();
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    const formatArr = [ year, month, day, hour, minute, second ];
    const filename = formatArr.map(formatNumber).toString().replace(/,/g, '') + user_id.toString()
    + Math.floor(Math.random() * (999 - 111 + 1) + 111).toString() + path
      .extname(stream.filename)
      .toLocaleLowerCase();
    const feildate = 'userfiles/content/';
    // 文件位置
    const uplaodBasePath = 'app/public/' + feildate;

    // 生成一个文件写入流
    // const target = path.join(this.config.baseDir, uplaodBasePath, filename);
    const target = path.join(uplaodBasePath, filename);
    const writeStream = fs.createWriteStream(target);
    try {
      // 异步把文件流写入
      await awaitWriteStream(stream.pipe(writeStream));
      const dimensions = sizeOf(uplaodBasePath + filename);
      // console.log(dimensions.width, dimensions.height);
      const data = await ctx.service.common.upload(user_id, feildate + filename, dimensions);
      ctx.body = {
        data,
      };
    } catch (err) {
      // 如果出现错误，关闭管道
      await sendToWormhole(stream);
      this.ctx.throw('上传失败');
    }
  }
}

module.exports = BaseDataController;
