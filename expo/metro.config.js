const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

const emptyModule = require.resolve("./shims/empty.js");

const originalResolveRequest = config.resolver.resolveRequest;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === "@supabase/node-fetch") {
    return { type: "sourceFile", filePath: emptyModule };
  }

  const nodeBuiltins = [
    "stream", "events", "http", "https", "net",
    "tls", "zlib", "url", "crypto", "buffer",
    "util", "os", "path", "fs", "child_process",
  ];

  if (nodeBuiltins.includes(moduleName)) {
    return { type: "sourceFile", filePath: emptyModule };
  }

  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }

  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withRorkMetro(config);
