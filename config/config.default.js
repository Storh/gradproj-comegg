/* eslint valid-jsdoc: "off" */

'use strict';

/**
 * @param {Egg.EggAppInfo} appInfo app info
 */
module.exports = appInfo => {
  /**
   * built-in config
   * @type {Egg.EggAppConfig}
   **/
  const config = exports = {};

  // use for cookie sign key, should change to your own and keep security
  config.keys = appInfo.name + '_1584019421199_9328';

  // add your middleware config here
  config.middleware = [ 'jwtErrorHandler' ];

  // 安全策略暂时关闭，防止无法开发
  config.security = {
    csrf: {
      enable: false,
      ignoreJSON: true,
    },
    domainWhiteList: [ 'http://localhost:8080' ], // 允许访问接口的白名单
  };

  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  // config/config.${env}.js
  exports.mysql = {
    // 单数据库信息配置
    client: {
      // host
      host: 'rm-uf6vwri7l8a0553ne0o.mysql.rds.aliyuncs.com',
      // 端口号
      port: '3306',
      // 用户名
      user: 'gradpro_admin',
      // 密码
      password: 'GradP@sw0lddh19463n',
      // 数据库名
      database: 'gradproj',
    },
    // 是否加载到 app 上，默认开启
    app: true,
    // 是否加载到 agent 上，默认关闭
    agent: false,
  };

  exports.jwt = {
    secret: 'G2adPr0j',
  };
  // add your user config here
  const userConfig = {
    // 采用app.config.XX访问
    dbprefix: 'al_', // 数据库表前缀
    serviceUrl: 'http://127.0.0.1:7001', // 服务器地址
    publicAdd: 'http://127.0.0.1:7001/public/', // 静态资源地址
    contentTypeIdByName: {
      HELP: 1,
      QUESTION: 2,
      UNUSED: 3,
      ACTIVITY: 4,
      PACK: 5,
      TOPIC: 6,
    },
    contentType: [
      {
        name: '互助',
        id: 1,
        registTable: 'help_regist',
      },
      {
        name: '问答',
        id: 2,
        registTable: 'question_regist',
      },
      {
        name: '共享',
        id: 3,
        registTable: 'unused_regist',
      },
      {
        name: '活动',
        id: 4,
        registTable: 'activity_regist',
      },
      {
        name: '团购',
        id: 5,
        registTable: 'pack_regist',
      },
      {
        name: '话题',
        id: 6,
        registTable: 'topic_regist',
      },
    ],
    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
