const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

const originalResolver = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@supabase/node-fetch') {
    return {
      type: 'empty',
    };
  }
  if (originalResolver) {
    return originalResolver(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = withRorkMetro(config);
