import assert from 'node:assert'
import {test, describe} from 'vitest'
import { address, isPrivate } from '../../main/ts/index.ts'

describe('index', () => {
  test('re-exports both core & native helpers', () => {
    assert.equal(typeof address, 'function')
    assert.equal(typeof isPrivate, 'function')
  })
})
