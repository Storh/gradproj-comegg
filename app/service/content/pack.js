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
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      if (item.reply_time) item.reply_time = this.ctx.service.base.fromatDate(new Date(item.reply_time).getTime());
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

  async getOrderListById(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;
    const sqlstr =
      `SELECT
a.order_id,a.regist_user_id,a.add_time,a.order_amount,a.consignee,a.mobile,a.address,a.message,
b.nickname,b.headimgurl

FROM ${this.app.config.dbprefix}order_info a
INNER JOIN ${this.app.config.dbprefix}user_profile b ON b.user_id = a.regist_user_id

WHERE a.content_id = ${reqData.content_id}
AND a.launch_user_id = ${user_id}

ORDER BY a.order_id DESC
${limit}`;
    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(async item => {
      if (item.headimgurl.length < 100) item.headimgurl = this.app.config.publicAdd + item.headimgurl;
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      item.goods = await this.getOrderGoodsList(item.order_id);
      return item;
    });
    return list;
  }

  async getOrderGoodsList(order_id) {
    const sqlstr =
    `SELECT
    goods_name,goods_specs,goods_price,goods_number

    FROM ${this.app.config.dbprefix}order_goods

    WHERE order_id = ${order_id}

    ORDER BY record_id ASC`;
    const resultsGoods = await this.app.mysql.query(sqlstr);
    return resultsGoods;
  }

  async getGoodsListAllById(content_id) {
    const sqlstr =
    `SELECT
    t.goods_id, t.goods_name, t.goods_specs, t.goods_price, t.goods_number,
    SUM( t.buy_number ) AS used_number
FROM
    (
    SELECT
        a.goods_id,
        a.goods_name,
        a.goods_specs,
        a.goods_price,
        a.goods_number,
        a.is_delete,
        b.order_id,
        b.goods_number AS buy_number
    FROM
        ${this.app.config.dbprefix}goods a
        LEFT JOIN ${this.app.config.dbprefix}order_goods b ON b.goods_id = a.goods_id
        LEFT JOIN ${this.app.config.dbprefix}order_info c ON c.order_id = b.order_id
    WHERE
        1
        AND a.content_id = ${content_id}
        AND ( a.is_delete = 0 OR b.goods_number IS NOT NULL )
        AND ( c.order_status IN (1,2) OR b.goods_number IS NULL )
    ) t
WHERE
    1
GROUP BY
    t.goods_id
ORDER BY
    t.goods_id ASC`;
    const results = await this.app.mysql.query(sqlstr);

    const list = results.map(item => {
      const used_number = item.used_number ? item.used_number : 0;
      item.remaining_number = item.goods_number - used_number;
      delete item.is_delete;
      delete item.used_number;
      return item;
    });
    return list;
  }

  async getOrderAmountByContentId(user_id, content_id) {
    const sqlstr =
    `SELECT SUM(order_amount) AS order_amount

    FROM ${this.app.config.dbprefix}order_info
    WHERE 1
    AND content_id = ${content_id}
    AND launch_user_id = ${user_id}`;
    const results = await this.app.mysql.query(sqlstr);
    let order_amount = 0;
    if (results) {
      const result = JSON.parse(JSON.stringify(results[0]));
      order_amount = result.order_amount;
    }
    return order_amount;
  }

  async getGoodsListById(content_id) {
    const sqlstr =
    `SELECT
    a.goods_id,
    a.goods_name,
    a.goods_specs,
    a.goods_price,
    a.goods_number,
    SUM( b.goods_number ) AS used_number
FROM
    ${this.app.config.dbprefix}goods a
    LEFT JOIN ${this.app.config.dbprefix}order_goods b ON b.goods_id = a.goods_id
WHERE
    1
    AND a.is_delete = 0
    AND a.content_id = ${content_id}
    AND ( ( SELECT order_status FROM ${this.app.config.dbprefix}order_info WHERE order_id = b.order_id ) IN ( 1, 2 ) OR b.goods_number IS NULL )
GROUP BY
    a.goods_id
ORDER BY
    a.goods_id ASC`;
    const results = await this.app.mysql.query(sqlstr);
    console.log(results);
    const list = results.map(item => {
      const used_number = item.used_number ? item.used_number : 0;
      item.remaining_number = item.goods_number - used_number;
      delete item.used_number;
      return item;
    });
    return list;
  }

  async add(user_id, reqData) {
    const { ctx, app } = this;
    const date_now = ctx.service.base.fromatDate(new Date().getTime());
    const userInfo = await this.ctx.service.member.info.getInfo(user_id);

    const title = reqData.title;
    const images = reqData.images;
    const content = reqData.content;
    const show_type = reqData.show_type;
    const keyword = reqData.keyword;
    const link_external_name = reqData.link_external_name;
    const link_external_url = reqData.link_external_url;
    const closing_date = new Date(reqData.closing_date);
    const goods = reqData.goods;// 商品数组
    const district_id = userInfo.district_id;

    let content_id;

    const trans_success = await app.mysql.beginTransactionScope(async addmain => {

      const add_main_log = await addmain.insert(app.config.dbprefix + 'content_record', {
        type_id: 5,
        user_id,
        district_id,
        title,
        content,
        show_type,
        keyword,
        link_external_name,
        link_external_url,
        add_time: date_now,
      });
      content_id = add_main_log.insertId;

      // 插入拼团内容表
      addmain.insert(app.config.dbprefix + 'pack_content', {
        content_id,
        closing_date,
      });


      // 关键字
      if (keyword) {
        const keywordArr = keyword.split(',');
        keywordArr.map(aword => {
          addmain.insert(app.config.dbprefix + 'content_keyword', {
            content_id,
            keyword: aword,
          });
        });
      }

      // 图片
      if (images) {
        const uploadType = 2;// 动态内容图片
        const photoIdArr = images.map(item => {
          return item.id;
        });
        await addmain.update(app.config.dbprefix + 'upload_file_record',
          {
            rel_id: content_id,
          },
          {
            where: {
              type_id: uploadType,
              user_id,
              file_id: photoIdArr,
            },
          });
      }

      // 商品
      goods.map(gooditem => {
        addmain.insert(app.config.dbprefix + 'goods', {
          user_id,
          content_id,
          content_type: 5,
          goods_name: gooditem.goods_name,
          goods_specs: gooditem.goods_specs,
          goods_price: gooditem.goods_price,
          goods_number: gooditem.goods_number,
        });
      });
      return true;
    }, ctx);

    if (!trans_success) {
      ctx.throw('提交失败，请重试');
    }
    return content_id;
  }

  async edit(user_id, reqData) {
    const { ctx, app } = this;
    const date_now = ctx.service.base.fromatDate(new Date().getTime());

    const content_id = reqData.content_id;
    const title = reqData.title;
    const images = reqData.images;
    const content = reqData.content;
    const show_type = reqData.show_type;
    const keyword = reqData.keyword;
    const link_external_name = reqData.link_external_name;
    const link_external_url = reqData.link_external_url;
    const closing_date = new Date(reqData.closing_date);
    const goods = reqData.goods;// 商品数组

    const trans_success = await app.mysql.beginTransactionScope(async addmain => {

      // 更新动态内容表
      addmain.update(app.config.dbprefix + 'content_record', {
        title,
        content,
        show_type,
        keyword,
        link_external_name,
        link_external_url,
        modify_time: date_now,
      },
      {
        where: {
          content_id,
          user_id,
        },
      });
      // 更新团购内容表
      addmain.update(app.config.dbprefix + 'pack_content', {
        closing_date,
      }, {
        where: {
          content_id,
        },
      });

      // 关键字
      await addmain.delete(app.config.dbprefix + 'content_keyword', {
        content_id,
      });

      if (keyword) {
        const keywordArr = keyword.split(',');
        keywordArr.map(aword => {
          addmain.insert(app.config.dbprefix + 'content_keyword', {
            content_id,
            keyword: aword,
          });
        });
      }

      // 图片
      if (images) {
        const uploadType = 2;// 动态内容图片
        const photoIdArr = images.map(item => {
          return item.id;
        });
        // 删除原来存储的图片
        const delstr =
          `SELECT *
  FROM ${app.config.dbprefix}upload_file_record
  WHERE type_id=${uploadType}
  AND user_id=${user_id}
  AND rel_id=${content_id}
  AND file_id NOT IN (${photoIdArr.toString()})`;
        const dellist = await addmain.query(delstr);

        dellist.map(item => {
          addmain.delete(app.config.dbprefix + 'upload_file_record', {
            file_id: item.file_id,
          });
        });

        await addmain.update(app.config.dbprefix + 'upload_file_record', {
          rel_id: content_id,
        }, {
          where: {
            type_id: uploadType,
            user_id,
            file_id: photoIdArr,
          },
        });
      }

      // 商品

      const goodsIdArr = goods.map(async gooditem => {
        if (gooditem.goods_id) {
          addmain.update(app.config.dbprefix + 'goods', {
            goods_name: gooditem.goods_name,
            goods_specs: gooditem.goods_specs,
            goods_price: gooditem.goods_price,
            goods_number: gooditem.goods_number,
          }, {
            where: {
              goods_id: gooditem.goods_id,
              content_id,
            },
          });
          return gooditem.goods_id;
        }
        const newgood = await addmain.insert(app.config.dbprefix + 'goods', {
          user_id,
          content_id,
          content_type: 5,
          goods_name: gooditem.goods_name,
          goods_specs: gooditem.goods_specs,
          goods_price: gooditem.goods_price,
          goods_number: gooditem.goods_number,
        });
        return newgood.insertId;
      });
      // 删除用户前端删除的商品
      const delgoodstr =
  `UPDATE ${app.config.dbprefix}goods
  SET is_delete=1
  WHERE user_id=${user_id}
  AND content_id=${content_id}
  AND goods_id NOT IN (${goodsIdArr.toString()})`;
      addmain.query(delgoodstr);
      return true;
    }, ctx);

    if (!trans_success) {
      ctx.throw('提交失败，请重试');
    }
    return true;
  }
}

module.exports = PackService;
