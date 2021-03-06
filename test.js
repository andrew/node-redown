var test       = require('tape')
  , testCommon = require('abstract-leveldown/testCommon')
  , ReDOWN    = require('./')
  //, AbstractIterator = require('./').AbstractIterator
  , testBuffer = require('./testdata_b64')

/*** compatibility with basic LevelDOWN API ***/

// meh require('abstract-leveldown/abstract/leveldown-test').args(ReDOWN, test, testCommon)

require('abstract-leveldown/abstract/open-test').args(ReDOWN, test, testCommon)
require('abstract-leveldown/abstract/open-test').open(ReDOWN, test, testCommon)

require('abstract-leveldown/abstract/del-test').all(ReDOWN, test, testCommon)

require('abstract-leveldown/abstract/get-test').all(ReDOWN, test, testCommon)

require('abstract-leveldown/abstract/put-test').all(ReDOWN, test, testCommon)

require('abstract-leveldown/abstract/put-get-del-test').all(ReDOWN, test, testCommon, testBuffer, process.browser && Uint8Array)

require('abstract-leveldown/abstract/batch-test').all(ReDOWN, test, testCommon)
require('abstract-leveldown/abstract/chained-batch-test').all(ReDOWN, test, testCommon)

require('abstract-leveldown/abstract/close-test').close(ReDOWN, test, testCommon)

require('abstract-leveldown/abstract/iterator-test').all(ReDOWN, test, testCommon)

require('abstract-leveldown/abstract/ranges-test').all(ReDOWN, test, testCommon)

test('unsorted entry, sorted iterator', function (t) {
  var db = new ReDOWN('foo')
    , noop = function () {}
  db.open(noop)
  db.put('f', 'F', noop)
  db.put('a', 'A', noop)
  db.put('c', 'C', noop)
  db.put('e', 'E', noop)
  db.batch([
      { type: 'put', key: 'd', value: 'D' }
    , { type: 'put', key: 'b', value: 'B' }
    , { type: 'put', key: 'g', value: 'G' }
  ], noop)
  testCommon.collectEntries(db.iterator({ keyAsBuffer: false, valueAsBuffer: false }), function (err, data) {
    t.notOk(err, 'no error')
    t.equal(data.length, 7, 'correct number of entries')
    var expected = [
        { key: 'a', value: 'A' }
      , { key: 'b', value: 'B' }
      , { key: 'c', value: 'C' }
      , { key: 'd', value: 'D' }
      , { key: 'e', value: 'E' }
      , { key: 'f', value: 'F' }
      , { key: 'g', value: 'G' }
    ]
    t.deepEqual(data, expected)
    t.end()
  })
})