# ReDOWN

*Work in Progress*

**A drop-in replacement for [LevelDOWN](https://github.com/rvagg/node-leveldown) that works with redis. Can be used as a back-end for [LevelUP](https://github.com/rvagg/node-levelup) rather than an actual LevelDB store.**

*Note: the above tests include the use of `TypedArray`s. If you don't use them then you can likely ignore the failures.*

As of version 0.7, LevelUP allows you to pass a `'db'` option when you create a new instance. This will override the default LevelDOWN store with a LevelDOWN API compatible object. ReDOWN conforms exactly to the LevelDOWN API but only performs operations in memory, so your data is discarded when the process ends or you release a reference to the database.

## Example

```js
var ReDOWN = require('redown')
 , levelup = require('levelup')
 , redis = require('redis');

 var redis_client = redis.createClient(6379, 'localhost');  

 // Either a connection string or an existing redis instance must be passed, or the driver will connect to localhost
 var db = levelup('redis://:@localhost:6379?detect_buffers=false', { db: ReDOWN, redis: redis_client })

db.put('name', 'Yuri Irsenovich Kim')
db.put('dob', '16 February 1941')
db.put('spouse', 'Kim Young-sook')
db.put('occupation', 'Clown')

db.readStream()
  .on('data', console.log)
  .on('close', function () { console.log('Show\'s over folks!') })
```

Running our example gives:

```
{ key: 'dob', value: '16 February 1941' }
{ key: 'name', value: 'Yuri Irsenovich Kim' }
{ key: 'occupation', value: 'Clown' }
{ key: 'spouse', value: 'Kim Young-sook' }
Show's over folks!
```

## Licence

Copyright (c) 2013 Andrew Nesbitt. See [LICENSE](https://github.com/andrew/node-sass/blob/master/LICENSE) for details.
