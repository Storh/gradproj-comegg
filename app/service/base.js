'use strict';

const Service = require('egg').Service;
const formatNumber = n => {
  n = n.toString();
  return n[1] ? n : '0' + n;
};
class BaseService extends Service {
  fromatDate(getData) {
    const date = new Date(parseInt(getData));
    const year = date.getFullYear();
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const hour = date.getHours();
    const minute = date.getMinutes();
    const second = date.getSeconds();
    return [ year, month, day ].map(formatNumber).join('-') + ' ' + [ hour, minute, second ].map(formatNumber).join(':');
  }
}

module.exports = BaseService;
