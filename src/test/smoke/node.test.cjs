var assert = require('assert')

var ip
try {
  ip = require('@webpod/ip')
} catch (e) { // nodejs < 12
  ip = require('../../../target/cjs/index.cjs')
}

// Smoke CJS test
{
  assert.ok(ip.isPrivate('127.0.0.1'))
}

console.log('smoke cjs: ok')
