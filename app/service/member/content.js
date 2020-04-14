'use strict';

const Service = require('egg').Service;

class ContentService extends Service {
  async getListBySelf(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;
    const sql_content_type = reqData.content_type ? ` AND type_id = ${reqData.content_type}` : '';
    const sqlstr =
    `SELECT content_id,type_id,title,content,add_time

    FROM ${this.app.config.dbprefix}content_record

    WHERE 1
    AND is_delete = 0
    AND state = 1
    AND user_id = ${user_id}
    ${sql_content_type}

    ORDER BY content_id DESC
    ${limit}`;
    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(item => {
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      return item;
    });
    return list;
  }

  async getPackListBySelf(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    const sqlstr =
    `SELECT a.content_id,a.title,a.add_time,
    b.closing_date

    FROM ${this.app.config.dbprefix}content_record a
    LEFT JOIN ${this.app.config.dbprefix}pack_content b ON b.content_id = a.content_id

    WHERE 1
    AND a.is_delete = 0
    AND a.state = 1
    AND a.type_id = ${reqData.content_type}
    AND a.user_id = ${user_id}

    ORDER BY a.content_id DESC
    ${limit}`;

    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(async item => {
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      item.goods = await this.getGoodsListAllById(user_id, item.content_id);
      item.is_end = new Date(item.closing_date).getTime() - new Date().getTime() > 0 ? 0 : 1;
      return item;
    });
    return list;
  }

  async getGoodsListAllById(user_id, content_id) {
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
        AND a.user_id = ${user_id}
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
    const goods = results.map(rowGoods => {
      const used_number = rowGoods.used_number ? rowGoods.used_number : 0;
      rowGoods.remaining_number = rowGoods.goods_number - used_number;
      delete rowGoods.used_number;
      return rowGoods;
    });

    return goods;
  }

  async getListByRegist(user_id, reqData) {
    const content_type = reqData.content_type;
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    const registTable = this.app.config.contentType[content_type - 1].registTable;
    const sqlstr =
`SELECT b.content_id,b.type_id,b.title,b.content,b.add_time

FROM ${this.app.config.dbprefix}${registTable} a
INNER JOIN ${this.app.config.dbprefix}content_record b ON b.content_id = a.content_id

WHERE 1
AND a.user_id = ${user_id}
AND a.is_delete = 0
AND a.state = 1
AND b.is_delete = 0
AND b.state = 1

GROUP BY a.content_id

ORDER BY b.content_id DESC
${limit}`;
    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(item => {
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      return item;
    });
    return list;
  }

  async getPackListByRegist(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    const sqlstr =
    `SELECT b.content_id,b.title,
    c.closing_date

    FROM ${this.app.config.dbprefix}pack_regist a
    INNER JOIN ${this.app.config.dbprefix}content_record b ON b.content_id = a.content_id
    INNER JOIN ${this.app.config.dbprefix}pack_content c ON c.content_id = a.content_id

    WHERE 1
    AND a.user_id = ${user_id}

    GROUP BY a.content_id

    ORDER BY b.content_id DESC
    ${limit}`;

    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(async item => {
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      item.goods = await this.getGoodsBuyListById(user_id, item.content_id);
      item.is_end = new Date(item.closing_date).getTime() - new Date().getTime() > 0 ? 0 : 1;
      item.order_amount = this.getRegistOrderAmountById(user_id, item.content_id);
      return item;
    });
    return list;
  }

  async getGoodsBuyListById(user_id, content_id) {
    const sqlstr =
`SELECT
t.goods_id, t.goods_name, t.goods_specs, t.goods_price,
SUM(t.goods_number) AS buy_number
FROM
(
SELECT
    a.goods_id,
    a.goods_name,
    a.goods_specs,
    a.goods_price,
    a.goods_number
FROM
    ${this.app.config.dbprefix}order_goods a
    INNER JOIN ${this.app.config.dbprefix}order_info b ON b.order_id = a.order_id
WHERE
    1
    AND a.content_id = ${content_id}
    AND a.regist_user_id = ${user_id}
    AND b.order_status IN (1,2)
) t
GROUP BY
t.goods_id
ORDER BY
t.goods_id ASC`;

    const goods = await this.app.mysql.query(sqlstr);

    return goods;
  }

  async getRegistOrderAmountById(user_id, content_id) {
    const sqlstr =
`SELECT SUM(order_amount) AS order_amount
FROM ${this.app.config.dbprefix}order_info
WHERE 1
AND order_status IN (1,2)
AND content_id = ${content_id}
AND regist_user_id = ${user_id}`;

    const results = await this.app.mysql.query(sqlstr);
    const result = JSON.parse(JSON.stringify(results[0]));
    const order_amount = result.order_amount ? result.order_amount : 0;

    return order_amount;
  }

  async getCollectList(user_id, reqData) {
    const limitrow = await this.ctx.service.common.getPageStyle(reqData);
    const limit = limitrow.limit;

    const sqlstr =
    `SELECT b.content_id,b.type_id,b.title,b.content,b.add_time

    FROM ${this.app.config.dbprefix}collect_record a
    INNER JOIN ${this.app.config.dbprefix}content_record b ON b.content_id = a.rel_id

    WHERE 1
    AND a.user_id = ${user_id}
    AND a.collect_state = 1
    AND b.is_delete = 0
    AND b.state = 1

    ORDER BY b.content_id DESC
    ${limit}`;

    const results = await this.app.mysql.query(sqlstr);
    const list = results.map(item => {
      if (item.add_time) item.add_time = this.ctx.service.base.fromatDate(new Date(item.add_time).getTime());
      return item;
    });
    return list;
  }
}

module.exports = ContentService;
