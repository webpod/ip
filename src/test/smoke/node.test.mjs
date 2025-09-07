import assert from 'assert'
import ip from '@webpod/ip'

// Smoke ESM test
{
  assert.ok(ip.isPrivate('127.0.0.1'))
}

console.log('smoke ems: ok')
