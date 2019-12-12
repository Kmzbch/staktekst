'use strict';

const merge = require('webpack-merge');

const common = require('./webpack.common.js');
const PATHS = require('./paths');

// Merge webpack configuration files
const config = merge(common, {
  entry: {
    popup: PATHS.src + '/popup.js',
    contentScript: PATHS.src + '/contentScript.js',
    background: PATHS.src + '/background.js',
    currentTab: PATHS.src + "/currentTab.js",
    miraiScript: PATHS.src + "/miraiScript.js",
    selection: PATHS.src + "/selection.js",
    commandPreset: PATHS.src + "/CommandPreset.js"
  },
});

module.exports = config;