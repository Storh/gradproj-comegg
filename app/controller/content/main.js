'use strict';

const Controller = require('egg').Controller;

class MainController extends Controller {
  async getList() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.event_type) {
      this.ctx.throw('页面类型不能为空');
    }
    // if (!Number.isInteger(reqData.event_type)) {
    //   this.ctx.throw('无效页面类型');
    // }
    if (!reqData.district_type) {
      this.ctx.throw('社区筛选类型不能为空');
    }
    // if (!Number.isInteger(reqData.district_type)) {
    //   this.ctx.throw('无效社区筛选类型');
    // }

    const resultsrow = await ctx.service.content.main.getList(user_id, reqData);
    const list = [];
    resultsrow.forEach(element => {
      if (element.image) {
        const imageArr = element.image.split(',');
        element.image = {
          src: this.app.config.publicAdd + imageArr[0],
          width: imageArr[1],
          height: imageArr[2],
        };
      } else {
        element.image = '';
      }
      if (element.like_num > 99) { element.like_num = '99+'; }
      if (element.headimgurl.length < 20) { element.headimgurl = this.app.config.publicAdd + element.headimgurl; }
      list.push(element);
    });

    ctx.body = {
      data: { list },
    };

  }

  async setLike() {
    const { ctx } = this;
    const user_id = ctx.state.user.user_id;
    const reqData = ctx.request.body;

    if (!reqData.content_id) {
      this.ctx.throw('动态ID不能为空');
    }
    // if (!Number.isInteger(reqData.content_id)) {
    //   this.ctx.throw('无效动态ID');
    // }
    if (!reqData.like_state) {
      this.ctx.throw('点赞状态不能为空');
    }
    // if (!Number.isInteger(reqData.like_state)) {
    //   this.ctx.throw('无效点赞状态');
    // }

    const results = await ctx.service.content.main.setLike(user_id, reqData);
    if (results) {
      ctx.body = {
        data: { },
      };
    }

  }
}

module.exports = MainController;
