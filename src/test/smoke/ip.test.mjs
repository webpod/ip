import assert from 'assert'
import ip from '@webpod/ip'

// Smoke ESM test
{
  assert.equal(ip.foo, 'bar')
}

console.log('smoke ems: ok')
