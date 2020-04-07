'use strict';

const Controller = require('egg').Controller;

class PackController extends Controller {
  async getListById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) {
      this.ctx.throw('动态ID不能为空');
    }
    const list = await ctx.service.content.pack.getListById(user_id, reqData);
    ctx.body = {
      data: { list },
    };
  }

  // 获取拼团详情
  async getDetailById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }

    const content_id = Number(reqData.content_id);
    await ctx.service.common.visitRecordAdd(user_id, content_id);
    const data = await ctx.service.content.pack.getDetailById(user_id, content_id);
    if (!data) { this.ctx.throw('该动态内容不存在'); }

    const images = await ctx.service.content.main.getPhotos(content_id);
    data.images = images;
    data.add_time = new Date(data.add_time).toLocaleString();
    data.is_end = new Date(data.closing_date).getTime() - new Date().getTime() > 0 ? 0 : 1;
    data.closing_date = new Date(data.closing_date).toLocaleString();
    ctx.body = {
      data,
    };
  }
}

module.exports = PackController;
