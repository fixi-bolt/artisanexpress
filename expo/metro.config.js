const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);
const emptyModule = path.resolve(__dirname, "empty-module.js");

const NODE_BUILTINS = new Set([
  "stream",
  "events",
  "http",
  "https",
  "net",
  "tls",
  "zlib",
  "url",
  "util",
  "os",
  "fs",
  "path",
  "assert",
  "child_process",
  "querystring",
  "string_decoder",
  "dns",
  "crypto",
  "buffer",
]);

const originalResolveRequest = config.resolver?.resolveRequest;

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    if (NODE_BUILTINS.has(moduleName)) {
      return { type: "sourceFile", filePath: emptyModule };
    }
    if (moduleName === "@supabase/node-fetch") {
      return { type: "sourceFile", filePath: emptyModule };
    }
    if (originalResolveRequest) {
      return originalResolveRequest(context, moduleName, platform);
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withRorkMetro(config);
