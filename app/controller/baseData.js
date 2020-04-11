'use strict';
const fs = require('fs');
const path = require('path');
const sendToWormhole = require('stream-wormhole');
const awaitWriteStream = require('await-stream-ready').write;
const Controller = require('egg').Controller;
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};

class BaseDataController extends Controller {
  async distList() {
    const { ctx } = this;
    const list = await ctx.service.common.getListByType('estate');
    ctx.body = {
      data: { list },
    };
  }
  async specialityList() {
    const { ctx } = this;
    const list = await ctx.service.common.specialityList(1);
    ctx.body = {
      data: { list },
    };
  }
  async hobbyList() {
    const { ctx } = this;
    const list = await ctx.service.common.specialityList(2);
    ctx.body = {
      data: { list },
    };
  }
  async uploadPhoto() {
    const ctx = this.ctx;
    // const user_id = ctx.state.user.user_id;
    const user_id = 1;
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
    const target = path.join(this.config.baseDir, uplaodBasePath, filename);
    const writeStream = fs.createWriteStream(target);
    try {
      // 异步把文件流写入
      await awaitWriteStream(stream.pipe(writeStream));

    } catch (err) {
      // 如果出现错误，关闭管道
      await sendToWormhole(stream);
      this.ctx.throw('上传失败');
    }

    ctx.body = {


    };
  }
}

module.exports = BaseDataController;
