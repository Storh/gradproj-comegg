'use strict';

const Controller = require('egg').Controller;

class ActivityController extends Controller {
// 活动的参与列表
  async getListById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) {
      this.ctx.throw('动态ID不能为空');
    }
    const list = await ctx.service.content.activity.getListById(user_id, reqData);
    ctx.body = {
      data: { list },
    };
  }

  // 获取动态详情
  async getDetailById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }

    const content_id = Number(reqData.content_id);
    ctx.service.common.visitRecordAdd(user_id, content_id);
    const data = await ctx.service.content.activity.getDetailById(user_id, content_id);
    if (!data) { this.ctx.throw('该动态内容不存在'); }

    const images = await ctx.service.content.main.getPhotos(content_id);
    data.images = images;
    data.add_time = this.ctx.service.base.fromatDate(new Date(data.add_time).getTime());
    data.is_end = new Date(data.closing_date).getTime() - new Date().getTime() > 0 ? 0 : 1;
    data.closing_date = this.ctx.service.base.fromatDate(new Date(data.closing_date).getTime());
    ctx.body = {
      data,
    };
  }

  // 发布动态接口（活动）
  async add() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.title) { this.ctx.throw('标题不能为空'); }
    if (!reqData.content) { this.ctx.throw('内容描述不能为空'); }
    if (!reqData.show_type) { this.ctx.throw('可见类型不能为空'); }
    if (!reqData.closing_date) { this.ctx.throw('活动截止日期不能为空'); }
    if (!reqData.num_upper_limit) { this.ctx.throw('活动参与人数上限不能为空'); }

    const content_id = await ctx.service.content.activity.add(user_id, reqData);
    if (content_id) {
      ctx.body = {
        data: { content_id },
      };
    }
  }

  // 编辑活动
  async edit() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }
    if (!reqData.title) { this.ctx.throw('标题不能为空'); }
    if (!reqData.content) { this.ctx.throw('内容描述不能为空'); }
    if (!reqData.show_type) { this.ctx.throw('可见类型不能为空'); }
    if (!reqData.closing_date) { this.ctx.throw('活动截止日期不能为空'); }
    if (!reqData.num_upper_limit) { this.ctx.throw('活动参与人数上限不能为空'); }

    const result = await ctx.service.content.activity.edit(user_id, reqData);
    if (result) {
      ctx.body = {
        data: { },
      };
    }
  }

  // 参与活动接口
  async registAdd() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }
    const regist_id = await ctx.service.content.activity.registAdd(user_id, reqData);
    ctx.body = {
      data: { regist_id },
    };
  }
}

module.exports = ActivityController;
