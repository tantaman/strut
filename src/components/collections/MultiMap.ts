"use strict";

class MultiMap<V> {
  _map: { [key: string]: Array<V> } = {};

  put(key: string, val: V) {
    var entries = this._map[key];
    if (entries == null) {
      entries = [];
      this._map[key] = entries;
    }

    entries.push(val);

    return this;
  }

  putAll(key: string, vals: ReadonlyArray<V>) {
    var entries = this._map[key];
    if (entries == null) {
      // We don't just do entries = vals
      // because someone may be modifyng vals elsewhere.
      entries = [];
    }

    this._map[key] = entries.concat(vals);

    return this;
  }

  get(key: string): V[] {
    var result = this._map[key];
    return result || [];
  }

  // We don't overload remove
  // since we allow null & undefined entries to be added.
  remove(key: string, val: V) {
    var entries = this._map[key];
    var idx = entries.indexOf(val);

    if (idx >= 0) {
      if (entries.length <= 1) {
        this.removeAll(key);
        return [];
      } else {
        entries.splice(idx, 1);
        return entries;
      }
    }
  }

  removeAll(key: string) {
    delete this._map[key];
    return this;
  }

  putIfAbsent(key: string, val: V) {
    var entries = this._map[key];
    if (entries == null) {
      entries = [];
      this._map[key] = entries;
    }

    if (entries.indexOf(val) < 0) entries.push(val);

    return this;
  }
}

export default MultiMap;
