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
    common_lib: PATHS.src + "/common_lib.js",
    popup_listview: PATHS.src + '/popup_listview.css',
    bubble_lib: PATHS.src + "/bubble_lib.js",
  },
});

module.exports = config;