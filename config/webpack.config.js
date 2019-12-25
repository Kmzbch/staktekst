'use strict';

const merge = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = merge(common, {
  entry: {
    popup: PATHS.src + '/popup.js',
    background: PATHS.src + '/background.js',
    currentTab: PATHS.src + "/currentTab.js",
    miraiTranslateScript: PATHS.src + "/miraiTranslateScript.js",
    oddcastScript: PATHS.src + '/oddcastScript.js',
    iconPreset: PATHS.src + "/IconPreset.js",
    common_lib: PATHS.src + "/common_lib.js"
  },
});

module.exports = config;