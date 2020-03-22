'use strict';

/** @type Egg.EggPlugin */
module.exports = {
  // had enabled by egg
  static: {
    enable: true,
  },
  mysql: {
    enable: true,
    package: 'egg-mysql',
  },
  ailer: {
    enable: true,
    package: 'egg-crypto',
  },
  jwt: {
    enable: true,
    package: 'egg-jwt',
  },
};
