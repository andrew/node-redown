var util              = require('util')
  , bops              = require('bops')
  , AbstractLevelDOWN = require('abstract-leveldown').AbstractLevelDOWN
  , AbstractIterator  = require('abstract-leveldown').AbstractIterator
  , noop              = function () {}
  , setImmediate      = global.setImmediate || process.nextTick
  , redis             = require("redis");

function toKey (key) {
  return typeof key == 'string' ? key : JSON.stringify(key)
}

function RedIterator (db, options) {
  AbstractIterator.call(this, db)
  this._reverse = options.reverse
  this._limit   = options.limit
  this._count   = 0
  this._end     = options.end
  this._start   = options.start
  this._gt      = options.gt
  this._gte     = options.gte
  this._lt      = options.lt
  this._lte     = options.lte

  var i

  if (this._start) {
    for (i = 0; i < this.db._keys.length; i++) {
      if (this.db._keys[i] >= this._start) {
        this._pos = i
        if (this.db._keys[i] != this._start) {
          if (this._reverse) {
            // going backwards and key doesn't match, jump back one
            --this._pos
          }
        } else {
          if (options.exclusiveStart) {
            // key matches but it's a gt or lt
            this._pos += (this._reverse ? -1 : 1)
          }
        }
        break
      }
    }

    if (this._pos == null && !this._reverse) // no matching keys, non starter
      this._pos = -1
  }

  if (!options.start || !this._pos)
    this._pos = this._reverse ? this.db._keys.length - 1 : 0
}

util.inherits(RedIterator, AbstractIterator)

RedIterator.prototype._next = function (callback) {
  var self  = this
    , key   = self.db._keys[self._pos]
    , value

  if (self._pos >= self.db._keys.length || self._pos < 0)
    return setImmediate(callback)

  if (!!self._end && (self._reverse ? key < self._end : key > self._end))
    return setImmediate(callback)


  if (!!self._limit && self._limit > 0 && self._count++ >= self._limit)
    return setImmediate(callback)

  if (  (this._lt  && key >= this._lt)
     || (this._lte && key > this._lte)
     || (this._gt  && key <= this._gt)
     || (this._gte && key < this._gte))
    return setImmediate(callback)

  value = self.db._store[toKey(key)]
  self._pos += self._reverse ? -1 : 1

  setImmediate(function () { callback(null, key, value) })
}

function ReDOWN (location) {
  if (!(this instanceof ReDOWN))
    return new ReDOWN(location)

  AbstractLevelDOWN.call(this, "/tmp/db.tmp");
  this._store = {}
  this._keys  = []

}

util.inherits(ReDOWN, AbstractLevelDOWN)

ReDOWN.prototype._open = function (options, callback) {
  this._client = ((options.redis instanceof redis.RedisClient) ? options.redis : redis.createClient());
  this._client.on('ready', function(){
    callback();
  })
}

ReDOWN.prototype._put = function (key, value, options, callback) {
  this._client.set(key, value, (callback || noop));
}

ReDOWN.prototype._get = function (key, options, callback) {
  this._client.get(key, (callback || noop))
}

ReDOWN.prototype._del = function (key, options, callback) {
  this._client.del(key, (callback || noop))
}

ReDOWN.prototype._batch = function (array, options, callback) {
  var err
    , i = 0
    , key
    , value

  if (Array.isArray(array)) {
    for (; i < array.length; i++) {
      if (array[i]) {
        key = bops.is(array[i].key) ? array[i].key : String(array[i].key)
        err = this._checkKeyValue(key, 'key')
        if (err) return setImmediate(function () { callback(err) })
        if (array[i].type === 'del') {
          this._del(array[i].key, options, noop)
        } else if (array[i].type === 'put') {
          value = bops.is(array[i].value) ? array[i].value : String(array[i].value)
          err = this._checkKeyValue(value, 'value')
          if (err) return setImmediate(function () { callback(err) })
          this._put(key, value, options, noop)
        }
      }
    }
  }
  callback && setImmediate(callback);
}

ReDOWN.prototype._iterator = function (options) {
  return new RedIterator(this, options)
}

ReDOWN.prototype._isBuffer = function (obj) {
  return bops.is(obj)
}

module.exports = ReDOWN
