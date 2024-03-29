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
    ctx.service.common.visitRecordAdd(user_id, content_id);
    const data = await ctx.service.content.pack.getDetailById(user_id, content_id);
    if (!data) { this.ctx.throw('该动态内容不存在'); }

    const images = await ctx.service.content.main.getPhotos(content_id);
    data.images = images;
    data.add_time = this.ctx.service.base.fromatDate(new Date(data.add_time).getTime());
    // data.add_time = new Date(data.add_time).toLocaleString();
    data.is_end = new Date(data.closing_date).getTime() - new Date().getTime() > 0 ? 0 : 1;
    data.closing_date = this.ctx.service.base.fromatDate(new Date(data.closing_date).getTime());
    // data.closing_date = new Date(data.closing_date).toLocaleString();
    ctx.body = {
      data,
    };
  }

  // 参与拼团
  async registAdd() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }
    if (!reqData.goods) { this.ctx.throw('商品信息不能为空'); }
    if (!reqData.consignee) { this.ctx.throw('收货人不能为空'); }
    if (!reqData.mobile) { this.ctx.throw('联系电话不能为空'); }
    if (!reqData.address) { this.ctx.throw('收货地址不能为空'); }

    const regist_id = await ctx.service.content.pack.registAdd(user_id, reqData);
    ctx.body = {
      data: { regist_id },
    };
  }

  // 获取拼团参与列表（拼团-订单）
  async getOrderListById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }

    const list = await ctx.service.content.pack.getOrderListById(user_id, reqData);
    ctx.body = {
      data: { list },
    };
  }

  // 拼团商品列表（拼团-商品明细
  async getSelfGoodsInfoById() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }

    const list = await ctx.service.content.pack.getGoodsListAllById(reqData.content_id);
    let order_amount = 0;
    if (list) {
      order_amount = await ctx.service.content.pack.getOrderAmountByContentId(user_id, reqData.content_id);
    }

    ctx.body = {
      data: {
        list,
        order_amount,
      },
    };
  }

  // 1.2.7、 获取拼团商品列表（拼团-商品）
  async getGoodsListById() {
    const { ctx } = this;
    // const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;
    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }
    const list = await ctx.service.content.pack.getGoodsListById(reqData.content_id);
    ctx.body = {
      data: { list },
    };
  }

  // 发布动态接口（拼团）
  async add() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.title) { this.ctx.throw('标题不能为空'); }
    if (!reqData.content) { this.ctx.throw('内容描述不能为空'); }
    if (!reqData.show_type) { this.ctx.throw('可见类型不能为空'); }
    if (!reqData.closing_date) { this.ctx.throw('拼团截止日期不能为空'); }
    if (!reqData.goods) { this.ctx.throw('商品信息不能为空'); }

    const content_id = await ctx.service.content.pack.add(user_id, reqData);
    if (content_id) {
      ctx.body = {
        data: { content_id },
      };
    }
  }

  // 编辑拼团
  async edit() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.content_id) { this.ctx.throw('动态ID不能为空'); }
    if (!reqData.title) { this.ctx.throw('标题不能为空'); }
    if (!reqData.content) { this.ctx.throw('内容描述不能为空'); }
    if (!reqData.show_type) { this.ctx.throw('可见类型不能为空'); }
    if (!reqData.closing_date) { this.ctx.throw('拼团截止日期不能为空'); }
    if (!reqData.goods) { this.ctx.throw('商品信息不能为空'); }

    const result = await ctx.service.content.pack.edit(user_id, reqData);
    if (result) {
      ctx.body = {
        data: { },
      };
    }
  }
}

module.exports = PackController;
