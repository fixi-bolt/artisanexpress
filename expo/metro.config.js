const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

const emptyModule = path.resolve(__dirname, "empty-module.js");

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: emptyModule,
  events: emptyModule,
  http: emptyModule,
  https: emptyModule,
  net: emptyModule,
  tls: emptyModule,
  crypto: emptyModule,
  zlib: emptyModule,
  fs: emptyModule,
  path: emptyModule,
  os: emptyModule,
  url: emptyModule,
  util: emptyModule,
  buffer: emptyModule,
  querystring: emptyModule,
  child_process: emptyModule,
  '@supabase/node-fetch': emptyModule,
};

module.exports = withRorkMetro(config);
