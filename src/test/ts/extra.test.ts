import assert from 'node:assert'
import {test, describe} from 'vitest'
import { Address, ParsedAddress } from '../../main/ts/extra.ts'

describe('extra', () => {
  describe('class Address', () => {
    describe('static parse()', () => {
      const cases: [any, ParsedAddress | RegExp ][] = [
        ['', /Invalid address/],
        ['0', {big: 0n, family: 4}],
        ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffff', /Invalid address/],
        [':ff', /Invalid address/],
        [':::f', /Invalid address/],
        ['f:::f', /Invalid address/],
        ['ff:::', /Invalid address/],
        ['ff:', /Invalid address/],
        ['ff::f:', /Invalid address/],
        [':ff:', /Invalid address/],
        ['::ff', {big: 255n, family: 6}],
        ['f::f', {big: 77884452878022414427957444938301455n, family: 6}],
        ['ff::', {big: 1324035698926381045275276563951124480n, family: 6}],
        ['ff:ff', /Invalid address/],
        ['::ffff:0.0.0.1', {big: 281470681743361n, family: 6}],
        ['::ff:0.0.0.1', /Invalid address/],
        ['::ffff:ffff:0.0.0.1', /Invalid address/],
        ['::ffff:0.0.0.256', /Invalid IPv4/],

        ['0.0.0.1', {big: 1n, family: 4}],
        ['1.1.1.1', {big: 16843009n, family: 4}],
        ['255.255.255.255', {big:  4294967295n, family: 4}],
        ['255.255.255.256', /Invalid address/],
      ]

      for (const [input, expected] of cases) {
        test(`${input} → ${expected}`, () => {
          if (expected instanceof RegExp)
            assert.throws(() => Address.parse(input), expected)
          else
            assert.deepEqual(Address.parse(input), expected)
        })
      }
    })
  })
})
