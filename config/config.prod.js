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
    domainWhiteList: [ 'http://localhost:8080', '0.0.0.0/0' ], // 允许访问接口的白名单
  };

  config.cors = {
    origin: '*',
    allowMethods: 'GET,HEAD,PUT,POST,DELETE,PATCH',
  };

  // config/config.${env}.js

  // add your user config here
  const userConfig = {
    dbprefix: 'al_', // 数据库表前缀
    serviceUrl: 'http://water.glasssoda.cn:7001', // 服务器地址
    publicAdd: 'http://water.glasssoda.cn:7001/public/', // 静态资源地址
  };

  return {
    ...config,
    ...userConfig,
  };
};
