const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");

const config = getDefaultConfig(__dirname);

config.resolver.unstable_conditionNames = ['browser', 'require', 'react-native'];

module.exports = withRorkMetro(config);
