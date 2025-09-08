import assert from 'node:assert'
import {test, describe} from 'vitest'
import { Address } from '../../main/ts/extra.ts'

describe('extra', () => {
  describe('class Address', () => {
    describe('static parse()', () => {
      const cases: [any, bigint | RegExp ][] = [
        ['', /Invalid address/],
        ['0', 0n],
        ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffff', /Invalid address/],
        [':ff', /Invalid address/],
        [':::f', /Invalid address/],
        ['f:::f', /Invalid address/],
        ['ff:::', /Invalid address/],
        ['ff:', /Invalid address/],
        ['ff::f:', /Invalid address/],
        [':ff:', /Invalid address/],
        ['::ff', 0n],
        ['f::f', 0n],
        ['ff::', 0n],
        ['ff:ff', /Invalid address/],
        ['::ffff:0.0.0.1', 0n],
        ['::ff:0.0.0.1', /Invalid address/],
        ['::ffff:ffff:0.0.0.1', /Invalid address/],
        ['::ffff:0.0.0.256', /Invalid IPv4/],

        ['0.0.0.1', 0n],
      ]

      for (const [input, expected] of cases) {
        test(`${input} → ${expected}`, () => {
          if (expected instanceof RegExp)
            assert.throws(() => Address.parse(input), expected)
          else
            assert.equal(Address.parse(input), expected)
        })
      }
    })
  })
})
