module.exports = {
  createHash: function(algorithm) {
    return {
      update: function() { return this; },
      digest: function(encoding) { return ''; },
    };
  },
  createHmac: function() {
    return {
      update: function() { return this; },
      digest: function() { return ''; },
    };
  },
  randomBytes: function(size) {
    const bytes = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      bytes[i] = Math.floor(Math.random() * 256);
    }
    return bytes;
  },
};
