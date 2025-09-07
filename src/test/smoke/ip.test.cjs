const assert = require('assert')
const ip = require('@webpod/ip')

// Smoke CJS test
{
  assert.equal(ip.foo, 'bar')
}

console.log('smoke cjs: ok')
