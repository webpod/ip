import * as assert from 'node:assert'
import {describe, test} from 'node:test'
import {foo} from '../../main/ts/ip.ts'

describe('ip', () => {
  test('foo equals bar', () => {
    assert.equal(foo, 'bar')
  })
})
