const assert = require('assert')
const ip = require('@webpod/ip')

// Smoke CJS test
{
  assert.ok(ip.isPrivate('127.0.0.1'))
}

console.log('smoke cjs: ok')
