import { assert } from 'https://deno.land/std@0.224.0/assert/assert.ts'
import { ip } from '../../../target/esm/index.mjs'

Deno.test('deno smoke test', () => {
  assert(ip.isPrivate('127.0.0.1'))
})
