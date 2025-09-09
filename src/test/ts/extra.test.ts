import assert from 'node:assert'
import {test, describe} from 'vitest'
import { Address } from '../../main/ts/extra.ts'

describe('extra', () => {
  describe('class Address', () => {
    describe('prototype', () => {
      describe('toBuffer()', () => {
        const cases: [[string, Buffer?, number?], Buffer][] = [
          [['::'],             Buffer.alloc(16, 0)],
          [['0',               Buffer.from([0,0,0,0])], Buffer.from([0,0,0,0])],
          [['1.2.3.4'],        Buffer.from([1,2,3,4])],
          [['::1.2.3.4'],      Buffer.from([0,0,0,0, 0,0,0,0, 0,0,0,0,     1,2,3,4])],
          [['::ffff:1.2.3.4'], Buffer.from([0,0,0,0, 0,0,0,0, 0,0,255,255, 1,2,3,4])],
        ]

        for (const [[input, b, o], expected] of cases) {
          const addr = Address.from(input)
          const buf = addr.toBuffer(b, o)

          test(`Address(${input}).toBuffer(${b}, ${o}) → ${expected.toString('hex')}`, () => {
            assert.deepEqual(buf, expected)
          })
        }
      })

      describe('toString()', () => {
        const cases: [string, string | RegExp, (4 | 6 | undefined)?][] = [
          ['::', '::', 6],
          ['::', '0.0.0.0', 4],
          ['1.2.3.4', '1.2.3.4'],
          ['1.2.3.4', '::ffff:1.2.3.4', 6],
          ['::0a0a:0a0a', '10.10.10.10', 4],
          ['ff::', /Address is wider than IPv4/, 4],
        ]

        for (const [input, expected, fam] of cases) {
          const addr = Address.from(input)
          test(`Address(${input}).toString(${fam}) → ${expected}`, () => {
            if (expected instanceof RegExp)
              assert.throws(() => addr.toString(fam), expected)
            else
              assert.equal(addr.toString(fam), expected)
          })
        }
      })

      describe('toLong()', () => {
        const cases: [string, number | RegExp][] = [
          ['ff::', /Address is wider than IPv4/],
          ['::ff', 255],
          ['::ffff:ffff', 4294967295],
        ]

        for (const [input, expected] of cases) {
          const addr = Address.from(input)
          test(`Address(${input}).toLong() → ${expected}`, () => {
            if (expected instanceof RegExp)
              assert.throws(() => addr.toLong(), expected)
            else
              assert.equal(addr.toLong(), expected)
          })
        }
      })

      describe('mask()', () => {
        const cases: [string, string, string | RegExp][] = [
          ['ff::', '::ff', '::'],
          ['::1', '0.0.0.0', '::'],
          ['0.0.0.1', '::', '::ffff:0:0'],
          ['192.168.1.134', '255.255.255.0', '192.168.1.0'],
          ['1.2.3.4', '255.255.255.0', '1.2.3.0'],
          ['1.2.3.4', '0.0.0.255', '0.0.0.4'],
          ['192.168.1.134', '::ffff:ff00', '::ffff:c0a8:100'],
          ['ff::', '', /Invalid address/],
        ]

        for (const [input, mask, expected] of cases) {
          const addr = Address.from(input)
          test(`Address(${input}).mask(${mask}) → ${expected}`, () => {
            if (expected instanceof RegExp)
              assert.throws(() => addr.mask(mask), expected)
            else
              assert.equal(addr.mask(mask), expected)
          })
        }
      })

      test('subnet()', () => {
        const cases: [string, string, Record<string, any>, (string | number)[], (string | number)[]][] = [
          ['192.168.1.134', '255.255.255.192', {
            networkAddress:   '192.168.1.128',
            firstAddress:     '192.168.1.129',
            lastAddress:      '192.168.1.190',
            broadcastAddress: '192.168.1.191',
            subnetMask:       '255.255.255.192',
            subnetMaskLength: 26,
            numHosts:         62n,
            length:           64n,
          }, [
            '192.168.1.180',
            '192.168.1.128',
          ], [
            '192.168.1.192'
          ]],

          ['10.10.10.10', '255.255.0.0', {
            firstAddress: '10.10.0.1',
            lastAddress:  '10.10.255.254',
            numHosts: 65534n
          }, [], []],

          ['::1:1', '::ffff:0', {
            firstAddress: '::1:1',
            lastAddress:  '::1:fffe',
            numHosts: 65534n
          }, ['::1:1010'], []],

          ['192.168.1.134', '255.255.255.255', {
            firstAddress: '192.168.1.134',
            lastAddress:  '192.168.1.134',
            numHosts: 1n
          }, ['192.168.1.134'], []],

          ['192.168.1.134', '255.255.255.254', {
            firstAddress: '192.168.1.134',
            lastAddress:  '192.168.1.135',
            numHosts: 2n
          }, [], []]
        ]
        for (const [addr, smask, expected, inside, out] of cases) {
          const res = Address.from(addr).subnet(smask)
          for (const k of Object.keys(expected))
            assert.strictEqual(res[k as keyof typeof res], expected[k], `subnet(${addr}, ${smask}).${k} === ${expected[k]}`)

          assert.ok(inside.every(a => res.contains(a)), `subnet(${addr}, ${smask}) contains ${inside.join(', ')}`)
          assert.ok(out.every(a => !res.contains(a)), `subnet(${addr}, ${smask}) does not contain ${out.join(', ')}`)
        }
      })
    })

    describe('static', () => {
      describe('from()', () => {
        const cases: [any, Pick<Address, 'big' | 'family'> | RegExp ][] = [
          ['', /Invalid address/],
          ['0', {big: 0n, family: 4}],
          ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffff', /Invalid address/],
          [':ff',     /Invalid address/],
          [':::f',    /Invalid address/],
          ['f:::f',   /Invalid address/],
          ['ff:::',   /Invalid address/],
          ['ff:',     /Invalid address/],
          ['ff::f:',  /Invalid address/],
          [':ff:',    /Invalid address/],
          ['::ff',    {big: 255n, family: 6}],
          ['f::f',    {big: 77884452878022414427957444938301455n, family: 6}],
          ['ff::',    {big: 1324035698926381045275276563951124480n, family: 6}],
          ['ff:ff',    /Invalid address/],
          ['::ffff:0.0.0.1',      {big: 281470681743361n, family: 6}],
          ['::ff:0.0.0.1',        /Invalid address/],
          ['::ffff:ffff:0.0.0.1', /Invalid address/],
          ['::ffff:0.0.0.256',    /Invalid IPv4/],

          ['0.0.0.1',         {big: 1n, family: 4}],
          ['1.1.1.1',         {big: 16843009n, family: 4}],
          ['255.255.255.255', {big:  4294967295n, family: 4}],
          ['255.255.255.256', /Invalid address/],
        ]

        for (const [input, expected] of cases) {
          test(`${input} → ${expected}`, () => {
            if (expected instanceof RegExp)
              assert.throws(() => Address.from(input), expected)
            else {
              const addr = Address.from(input)
              assert.equal(addr.big, expected.big)
              assert.equal(addr.family, expected.family)
            }
          })
        }
      })

      describe('fromPrefixLen()', () => {
        const cases: [number, string | RegExp][] = [
          [24, '255.255.255.0'],
          [64, 'ffff:ffff:ffff:ffff::']
        ]

        for (const [input, expected] of cases) {
          const addr = Address.fromPrefixLen(input)
          test(`Address.fromPrefixLen(${input}) → ${expected}`, () => {
            if (expected instanceof RegExp)
              assert.throws(() => addr.toString(), expected)
            else
              assert.equal(addr.toString(), expected)
          })
        }
      })
    })
  })
})
