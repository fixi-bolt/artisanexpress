class EventEmitter {
  constructor() {
    this._events = {};
    this._maxListeners = 10;
  }
  on(event, listener) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].push(listener);
    return this;
  }
  addListener(event, listener) { return this.on(event, listener); }
  once(event, listener) {
    const wrapped = (...args) => {
      this.removeListener(event, wrapped);
      listener.apply(this, args);
    };
    wrapped._original = listener;
    return this.on(event, wrapped);
  }
  emit(event, ...args) {
    if (!this._events[event]) return false;
    this._events[event].forEach(fn => fn.apply(this, args));
    return true;
  }
  removeListener(event, listener) {
    if (!this._events[event]) return this;
    this._events[event] = this._events[event].filter(
      fn => fn !== listener && fn._original !== listener
    );
    return this;
  }
  off(event, listener) { return this.removeListener(event, listener); }
  removeAllListeners(event) {
    if (event) { delete this._events[event]; }
    else { this._events = {}; }
    return this;
  }
  listeners(event) { return this._events[event] || []; }
  listenerCount(event) { return (this._events[event] || []).length; }
  setMaxListeners(n) { this._maxListeners = n; return this; }
  getMaxListeners() { return this._maxListeners; }
  prependListener(event, listener) {
    if (!this._events[event]) this._events[event] = [];
    this._events[event].unshift(listener);
    return this;
  }
  eventNames() { return Object.keys(this._events); }
}

module.exports = EventEmitter;
module.exports.EventEmitter = EventEmitter;
module.exports.default = EventEmitter;
