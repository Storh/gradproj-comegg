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

    // myAppName: 'egg',
  };

  return {
    ...config,
    ...userConfig,
  };
};
