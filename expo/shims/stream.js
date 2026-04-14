class Duplex {
  constructor() {}
  pipe() { return this; }
  on() { return this; }
  once() { return this; }
  emit() { return this; }
  write() { return true; }
  end() {}
  destroy() {}
  read() { return null; }
}

class Readable {
  constructor() {}
  pipe() { return this; }
  on() { return this; }
  read() { return null; }
}

class Writable {
  constructor() {}
  write() { return true; }
  end() {}
  on() { return this; }
}

class Transform extends Duplex {
  constructor() { super(); }
}

module.exports = { Duplex, Readable, Writable, Transform, Stream: Duplex };
module.exports.default = { Duplex, Readable, Writable, Transform, Stream: Duplex };
