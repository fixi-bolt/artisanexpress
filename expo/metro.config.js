const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: path.resolve(__dirname, "empty-module.js"),
  events: path.resolve(__dirname, "empty-module.js"),
  crypto: path.resolve(__dirname, "empty-module.js"),
  net: path.resolve(__dirname, "empty-module.js"),
  tls: path.resolve(__dirname, "empty-module.js"),
  http: path.resolve(__dirname, "empty-module.js"),
  https: path.resolve(__dirname, "empty-module.js"),
  zlib: path.resolve(__dirname, "empty-module.js"),
  bufferutil: path.resolve(__dirname, "empty-module.js"),
  "utf-8-validate": path.resolve(__dirname, "empty-module.js"),
};

module.exports = withRorkMetro(config);
