'use strict';

const Service = require('egg').Service;

class PackService extends Service {
  async getListById(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    const sqlstr = `SELECT
        a.regist_id,a.user_id,a.add_time,
        b.nickname,b.headimgurl

        FROM ${this.app.config.dbprefix}pack_regist a
        INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id

        WHERE a.content_id = ${reqData.content_id}
        AND a.is_delete = 0
        AND a.state = 1

        GROUP BY a.user_id

        ORDER BY a.regist_id DESC
        ${limit}`;
    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(item => {
      if (item.headimgurl.length < 100) item.headimgurl = this.app.config.publicAdd + item.headimgurl;
      if (item.add_time) item.add_time = new Date(item.add_time).toLocaleString();
      if (item.reply_time) item.reply_time = new Date(item.reply_time).toLocaleString();
      return item;
    });
    return list;
  }

  // 获取拼团内容
  async getDetailById(user_id, content_id) {
    // 动态内容(1)用户参与(2)评论(3)
    // 点赞类型
    const likeType = 1;
    const sqlstr =
      `SELECT a.content_id,a.type_id,a.title,a.content,a.keyword,a.show_type,a.visit_num,a.like_num,a.collect_num,a.add_time,a.link_external_name,a.link_external_url,
    b.user_id,b.phone,b.nickname,b.headimgurl,b.personal_signature,
    c.closing_date,

    if((SELECT like_state FROM ${this.app.config.dbprefix}like_record WHERE type_id = ${likeType} AND rel_id = a.content_id AND user_id = ${user_id}) = 1, 1, 0) AS like_state,
    if((SELECT collect_state FROM ${this.app.config.dbprefix}collect_record WHERE rel_id = a.content_id AND user_id = ${user_id}) = 1, 1, 0) AS collect_state

    FROM ${this.app.config.dbprefix}content_record a
    INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.user_id
    LEFT JOIN ${this.app.config.dbprefix}pack_content c ON c.content_id = a.content_id

    WHERE a.content_id = ${content_id}
    AND a.is_delete = 0
    AND a.state = 1`;

    const results = await this.app.mysql.query(sqlstr);

    const data = JSON.parse(JSON.stringify(results[0]));
    if (data.headimgurl.length < 100) { data.headimgurl = this.app.config.publicAdd + data.headimgurl; }
    return data;
  }

  async registAdd(user_id, reqData) {
    const { app, ctx } = this;
    const date_now = this.ctx.service.base.fromatDate(new Date().getTime());

    const sqlstr =
      `SELECT a.content_id, a.user_id, b.closing_date
    FROM ${this.app.config.dbprefix}content_record a
    INNER JOIN ${this.app.config.dbprefix}pack_content b ON b.content_id = a.content_id
    WHERE a.is_delete = 0
    AND a.state = 1
    AND a.content_id = ${reqData.content_id}`;
    const results = await this.app.mysql.query(sqlstr);
    if (!results) this.ctx.throw('该团购活动不存在');
    const result = JSON.parse(JSON.stringify(results[0]));
    const launch_user_id = result.user_id;
    const closing_date = result.closing_date;

    if (new Date(closing_date).getTime() - new Date().getTime() <= 0) {
      this.ctx.throw('很抱歉，该团购活动已结束，请关注下次活动');
    }

    const goods = reqData.goods;
    const consignee = reqData.consignee;
    const mobile = reqData.mobile;
    const address = reqData.address;
    const message = reqData.message;


    const trans_success = await app.mysql.beginTransactionScope(async sqlsetColl => {
      let goods_amount = 0;// 商品总额
      const goodsNew = [];// 记录最新的商品信息，用于写入订单表

      goods.forEach(async element => {

        const goods_id = element.goods_id;
        const buy_number = Number(element.buy_number);
        if (buy_number <= 0) return false;

        const getGoods = await this.getGoodsById(reqData.content_id, goods_id);
        if (!getGoods) this.ctx.throw(`${element.goods_name}-${element.goods_specs}不存在`);

        const goods_name = getGoods.goods_name;
        const goods_price = getGoods.buy_number;
        const goods_specs = getGoods.goods_specs;
        const goods_number = getGoods.goods_number;
        const used_number = await this.getGoodsNumUsed(goods_id);
        const enable_number = Number(goods_number) - Number(used_number);

        if (enable_number < buy_number) {
          this.ctx.throw('库存不足');
        }

        goods_amount += (parseInt(Number(goods_price) * 100, 10) * buy_number);

        goodsNew.push({
          goods_id,
          goods_name,
          goods_price,
          goods_specs,
          goods_number,
        });
      });
      if (goods_amount <= 0) {
        this.ctx.throw('订单总额必须大于0');
      }
      goods_amount = goods_amount / 100;
      const order_info = await sqlsetColl.insert(this.app.config.dbprefix + 'order_info', {
        launch_user_id,
        regist_user_id: user_id,
        content_id: reqData.content_id,
        content_type: 5,
        add_time: date_now,
        goods_amount,
        order_amount: goods_amount,
        order_status: 1,
        consignee,
        mobile,
        address,
        message,
      });
      const order_id = order_info.insertId;

      const order_no = await this.ctx.service.common.getOrderNoById(order_id.toString());

      await sqlsetColl.update(app.config.dbprefix + 'order_info',
        { order_no },
        { where: { order_id } });

      // 记录商品详情
      goodsNew.forEach(async element => {
        sqlsetColl.insert(this.app.config.dbprefix + 'order_goods', {
          order_id,
          launch_user_id,
          regist_user_id: user_id,
          content_id: reqData.content_id,
          content_type: 5,
          goods_id: element.goods_id,
          goods_name: element.goods_name,
          goods_price: element.goods_price,
          goods_specs: element.goods_specs,
          goods_number: element.goods_number,
        });
      });

      // 记录到拼团参与表
      const pack_ins = await sqlsetColl.insert(this.app.config.dbprefix + 'pack_regist', {
        user_id,
        content_id: reqData.content_id,
        order_id,
        add_time: date_now,
      });
      const regist_id = pack_ins.insertId;
      return regist_id;
    }, ctx);

    if (!trans_success) {
      ctx.throw('操作失败，请重试');
    }
    // 通知
    this.registAddPostNotice(user_id, reqData.content_id, trans_success);
    return trans_success;
  }

  async getGoodsById(content_id, goods_id) {
    const result = await this.app.mysql.get(this.app.config.dbprefix + 'goods', {
      goods_id,
      content_id,
      is_delete: 0,
    });
    return result;
  }

  async getGoodsNumUsed(goods_id) {
    const sqlstr =
      `SELECT SUM(goods_number) as nums

    FROM ${this.app.config.dbprefix}order_goods a
    INNER JOIN ${this.app.config.dbprefix}order_info b ON b.order_id = a.order_id

    WHERE a.goods_id = ${goods_id}
    AND b.order_status IN(0,1)`;

    const results = await this.app.mysql.query(sqlstr);
    const result = JSON.parse(JSON.stringify(results[0]));
    if (results) {
      return result.nums;
    }
    return 0;
  }

  async registAddPostNotice(user_id, content_id, regist_id) {
    // (1)SYSTEM系统通知;(2)CONTENT_REGIST内容参与记录;(3)CONTENT_REVIEW内容评论记录;(4)TYPE_LIKE点赞;
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);
    const contentInfo = await this.ctx.service.common.getContentInfoById(content_id);
    if (!contentInfo) return;
    const noticedata = {
      type_id: 2,
      receive_user_id: contentInfo.user_id,
      start_user_id: user_id,
      rel_id: regist_id,
      content_id,
      regist_id,
      content_type: contentInfo.type_id,
      title: userInfo.nickname + '参与了你的' + this.app.config.contentType[contentInfo.type_id - 1].name,
      desc: contentInfo.content,
    };
    await this.ctx.service.common.noticeRecordAdd(noticedata);
  }
}

module.exports = PackService;
