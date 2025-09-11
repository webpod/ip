import assert from 'node:assert'
import {test, describe} from 'vitest'

import { FakeBuffer } from '../../main/ts/polyfill.ts'

describe('buffer', () => {

  test('FakeBuffer mimics to Buffer', () => {
    assert.throws(() => Buffer.alloc(-1), /The value of "size" is out of range/)
    assert.throws(() => FakeBuffer.alloc(-1), /The value of "size" is out of range/)

    const b1 = Buffer.alloc(4, 1)
    assert.equal(b1.length, 4)
    assert.equal(b1.toString('hex'), '01010101')
    assert.equal(b1.readUInt16BE(), 257)
    assert.throws(() => b1.readUInt16BE(3), /The value of "offset" is out of range/)

    const b2 = b1.slice(2)
    assert.equal(b2.length, 2)
    assert.equal(b2.toString('hex'), '0101')

    const b3 = FakeBuffer.alloc(4, 1)
    assert.equal(b3.length, 4)
    assert.equal(b3.toString('hex'), '01010101')
    assert.equal(b3.readUInt16BE(), 257)
    assert.throws(() => b3.readUInt16BE(3), /The value of "offset" is out of range/)
    assert.throws(() => b3.toString('base64'), /Only 'hex' encoding is supported in this polyfill/)

    const b4 = b3.slice(2)
    assert.equal(b4.length, 2)
    assert.equal(b4.toString('hex'), '0101')
  })
})