import assert from 'node:assert'
import {test, describe} from 'vitest'

import { FakeBuffer } from '../../main/ts/polyfill.ts'

describe('buffer', () => {
  test('FakeBuffer mimics to Buffer', () => {
    assert.throws(() => Buffer.alloc(-1), /The value of "size" is out of range/)
    assert.throws(() => FakeBuffer.alloc(-1), /The value of "size" is out of range/)

    const b1 = FakeBuffer.alloc(4, 1)
    assert.equal(b1.length, 4)
    assert.equal(b1.toString('hex'), '01010101')
    assert.throws(() => b1.toString('base64'), /Only 'hex' encoding is supported in this polyfill/)

    const b2 = b1.slice(2)
    assert.equal(b2.length, 2)
    assert.equal(b2.toString('hex'), '0101')
  })
})
