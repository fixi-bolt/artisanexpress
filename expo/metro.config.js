const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

const emptyModule = path.resolve(__dirname, "shims/empty.js");

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  stream: emptyModule,
  events: emptyModule,
  ws: emptyModule,
  "@supabase/node-fetch": emptyModule,
};

module.exports = withRorkMetro(config);
