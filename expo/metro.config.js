const { getDefaultConfig } = require("expo/metro-config");
const { withRorkMetro } = require("@rork-ai/toolkit-sdk/metro");
const path = require("path");

const config = getDefaultConfig(__dirname);

const shimsDir = path.resolve(__dirname, "shims");

config.resolver.extraNodeModules = {
  ...config.resolver.extraNodeModules,
  events: path.resolve(shimsDir, "events.js"),
  stream: path.resolve(shimsDir, "stream.js"),
  http: path.resolve(shimsDir, "http.js"),
  https: path.resolve(shimsDir, "https.js"),
  net: path.resolve(shimsDir, "net.js"),
  tls: path.resolve(shimsDir, "tls.js"),
  crypto: path.resolve(shimsDir, "crypto.js"),
  url: path.resolve(shimsDir, "url.js"),
  zlib: path.resolve(shimsDir, "zlib.js"),
  bufferutil: path.resolve(shimsDir, "bufferutil.js"),
  "utf-8-validate": path.resolve(shimsDir, "utf-8-validate.js"),
  "@supabase/node-fetch": path.resolve(shimsDir, "empty.js"),
};

module.exports = withRorkMetro(config);
