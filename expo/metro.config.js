const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

const emptyModule = path.resolve(__dirname, "empty-module.js");

config.resolver = {
  ...config.resolver,
  resolveRequest: (context, moduleName, platform) => {
    const nodeBuiltins = ['stream', 'events', 'http', 'https', 'net', 'tls', 'crypto', 'zlib', 'buffer', 'url', 'util', 'os', 'fs', 'path', 'assert', 'child_process'];
    if (nodeBuiltins.includes(moduleName)) {
      return {
        type: 'sourceFile',
        filePath: emptyModule,
      };
    }
    if (moduleName === '@supabase/node-fetch') {
      return {
        type: 'sourceFile',
        filePath: emptyModule,
      };
    }
    return context.resolveRequest(context, moduleName, platform);
  },
};

module.exports = withRorkMetro(config);
