import assert from 'node:assert'
import {test, describe} from 'vitest'
import { Address } from '../../main/ts/core.ts'

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
          const arr = addr.toArray()

          test(`Address(${input}).toBuffer(${b}, ${o}) → ${expected.toString('hex')}`, () => {
            assert.deepEqual(buf, expected)
            assert.deepEqual(arr, [...expected])
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
    })

    describe('static', () => {
      describe('isSpecial()', () => {
        const cases: [string, boolean, string?][] = [
          ['::', true],                // unspecified IPv6
          ['::1', true],               // IPv6 loopback
          ['127.0.0.1', true],         // IPv4 loopback
          ['10.0.0.1', true],          // IPv4 private
          ['172.16.5.4', true],        // IPv4 private (172.16.0.0/12)
          ['192.168.1.1', true],       // IPv4 private
          ['169.254.10.20', true],     // IPv4 link-local (169.254.0.0/16)
          ['::ffff:192.168.1.1', true],// IPv4-mapped IPv6 private
          ['fe80::1', true],           // IPv6 link-local (fe80::/10)
          ['fc00::1', true],           // IPv6 unique-local (fc00::/7)
          ['ff02::1', true],           // IPv6 multicast (ff00::/8)

          ['1.1.1.1', false],          // public IPv4
          ['8.8.8.8', false],          // Google DNS IPv4
          ['2001:4860:4860::8888', false], // Google DNS IPv6
          ['2400:cb00::1', false],     // Cloudflare IPv6
          ['::1234:abcd', false],      // generic IPv6, not special

          ['::1', true, 'loopback'],
          ['127.0.0.1', true, 'loopback'],
          ['127.0.0.1', false, 'documentation'],

          ['10.1.2.3', true, 'private'],
          ['172.16.0.5', true, 'private'],
          ['192.168.100.200', true, 'private'],
          ['100.64.0.1', true, 'private'],
          ['fc00::abcd', true, 'private'],
          ['198.18.0.42', true, 'private'],
          ['10.0.0.1', false, 'loopback'],

          ['169.254.1.1', true, 'linklocal'],
          ['fe80::1234', true, 'linklocal'],
          ['fe80::1', false, 'private'],

          ['224.0.0.1', true, 'multicast'],
          ['ff02::1', true, 'multicast'],
          ['ff02::2', true, 'multicast'],
          ['224.0.0.1', false, 'reserved'],

          ['192.0.2.1', true, 'documentation'],
          ['198.51.100.42', true, 'documentation'],
          ['203.0.113.5', true, 'documentation'],
          ['2001:db8::1', true, 'documentation'],
          ['192.0.2.1', false, 'private'],

          ['0.0.0.0', true, 'reserved'],
          ['240.0.0.1', true, 'reserved'],
          ['255.255.255.255', true, 'reserved'],
          ['::', true, 'reserved'],
          ['::ffff:192.0.2.1', true, 'reserved'],
          ['64:ff9b::1', true, 'reserved'],
          ['64:ff9b:1::abcd', true, 'reserved'],
          ['100::1', true, 'reserved'],
          ['2001::abcd', true, 'reserved'],
          ['2001:20::1', true, 'reserved'],
          ['2002::1', true, 'reserved'],
          ['3fff::1', true, 'reserved'],
          ['5f00::1', true, 'reserved'],
          ['0.0.0.1', false, 'private'],
        ]

        for (const [input, expected, cat] of cases) {
          test(`Address.isSpecial(${input}, ${cat}) → ${expected}`, () => {
            assert.equal(Address.isSpecial(input, cat), expected)
          })
        }
      })

      describe('from()', () => {
        const cases: [any, Pick<Address, 'big' | 'family'> | RegExp][] = [
          // invalid strings
          ['', /Invalid address/],
          ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffffff', /Invalid address/],
          [':ff',     /Invalid address/],
          [':::f',    /Invalid address/],
          ['f:::f',   /Invalid address/],
          ['ff:::',   /Invalid address/],
          ['ff:',     /Invalid address/],
          ['ff::f:',  /Invalid address/],
          [':ff:',    /Invalid address/],
          ['ff:ff',   /Invalid address/],
          ['::ff:0.0.0.1',        /Invalid address/],
          ['::ffff:ffff:0.0.0.1', /Invalid address/],
          ['::ffff:0.0.0.256',    /Invalid/],
          ['255.255.255.256',     /Invalid/],

          // valid IPv6
          ['::',       {big: 0n, family: 6}],
          ['::1',      {big: 1n, family: 6}],
          ['::ff',     {big: 255n, family: 6}],
          ['f::f',     {big: 77884452878022414427957444938301455n, family: 6}],
          ['ff::',     {big: 1324035698926381045275276563951124480n, family: 6}],
          ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
            {big: (1n << 128n) - 1n, family: 6}],
          ['::ffff:0.0.0.1', {big: 281470681743361n, family: 6}], // IPv4-mapped

          // valid IPv4
          ['0',              {big: 0n, family: 4}],
          ['0.0.0.1',        {big: 1n, family: 4}],
          ['1.1.1.1',        {big: 16843009n, family: 4}],
          ['255.255.255.255',{big: 4294967295n, family: 4}],

          // buffer inputs
          [Buffer.from([0, 0, 0, 1]), {big: 1n, family: 4}],
          [Buffer.from(new Array(16).fill(0)), {big: 0n, family: 6}],
          [Buffer.alloc(5), /Invalid buffer length/],

          // Uint8Array inputs
          [new Uint8Array([127, 0, 0, 1]), {big: 2130706433n, family: 4}],

          // 8Array inputs
          [[127, 0, 0, 1], {big: 2130706433n, family: 4}],
          [[255, 255, 255, 256], /Invalid/],

          // number inputs (assume IPv4)
          [0, {big: 0n, family: 4}],
          [4294967295, {big: 4294967295n, family: 4}],

          // bigint inputs (assume IPv4)
          [1234n, {big: 1234n, family: 4}],

          // Address input (clone)
          [Address.from(1), {big: 1n, family: 4}],
        ]

        for (const [raw, expected] of cases) {
          test(`from(${raw})`, () => {
            if (expected instanceof RegExp) {
              assert.throws(() => Address.from(raw), expected)
            } else {
              const addr = Address.from(raw)
              assert.equal(addr.big, expected.big)
              assert.equal(addr.family, expected.family)
            }
          })
        }
      })

      test('cidr()', () => {
        const cases: [string, string][] = [
          ['192.168.1.134/26', '192.168.1.128'],
          ['2607:f0d0:1002:51::4/56', '2607:f0d0:1002::']
        ]

        for (const [input, expected] of cases) {
          const res = Address.cidr(input)
          assert.strictEqual(res, expected, `cidr(${input}) === ${expected}`)
        }

        assert.throws(() => Address.cidr(''), /Invalid CIDR/)
      })

      test('cidrSubnet()', () => {
        const cases: [string, Record<string, any>][] = [
          ['192.168.1.134/26', {
            networkAddress: '192.168.1.128',
            firstAddress:   '192.168.1.129',
            lastAddress:    '192.168.1.190',
            broadcastAddress: '192.168.1.191',
            subnetMask:     '255.255.255.192',
            subnetMaskLength: 26,
            numHosts:      62n,
            length:        64n,
          }],
        ]

        for (const [input, expected] of cases) {
          const res = Address.cidrSubnet(input)
          for (const k of Object.keys(expected))
            assert.strictEqual(res[k as keyof typeof res], expected[k], `cidrSubnet(${input}).${k} === ${expected[k]}`)
        }

        assert.throws(() => Address.cidrSubnet(''), /Invalid CIDR/)
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

        for (const [addr, mask, expected] of cases) {
          test(`Address.mask(${addr}, ${mask}) → ${expected}`, () => {
            if (expected instanceof RegExp)
              assert.throws(() => Address.mask(addr, mask), expected)
            else
              assert.equal(Address.mask(addr, mask), expected)
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
          const res = Address.subnet(addr, smask)
          for (const k of Object.keys(expected))
            assert.strictEqual(res[k as keyof typeof res], expected[k], `subnet(${addr}, ${smask}).${k} === ${expected[k]}`)

          assert.ok(inside.every(a => res.contains(a)), `subnet(${addr}, ${smask}) contains ${inside.join(', ')}`)
          assert.ok(out.every(a => !res.contains(a)), `subnet(${addr}, ${smask}) does not contain ${out.join(', ')}`)
        }
      })

      test('or()', () => {
        const cases : [string, string, string][] = [
          // IPv4
          ['0.0.0.255', '192.168.1.10', '192.168.1.255'],
          ['10.0.0.1', '1.2.3.4', '11.2.3.5'],
          ['255.255.255.255', '0.0.0.0', '255.255.255.255'],

          // IPv6
          ['::ff', '::1', '::ff'],
          ['::abcd:dcba:abcd:0', '::1111:1111:0:1111', '::bbdd:ddbb:abcd:1111'],
          ['ffff:ffff::', '::ffff', 'ffff:ffff::ffff'],

          // IPv4 embedded IPv6 (zero-extension of IPv4)
          ['::ff', '::abcd:dcba:abcd:dcba', '::abcd:dcba:abcd:dcff'],
          ['0.0.0.255', '::abcd:dcba:abcd:dcba', '::abcd:dcba:abcd:dcff'],
          ['192.168.0.1', '::', '::c0a8:1'],  // 192.168.0.1 → 0xc0a80001 → ::c0a8:1
        ]

        for (const [a, b, expected] of cases)
          assert.strictEqual(Address.or(a, b), expected, `or(${a}, ${b}) === ${expected}`)
      })

      test('not()', () => {
        const cases: [string, string][] = [
          // IPv4
          ['255.255.255.0', '0.0.0.255'],
          ['255.0.0.0', '0.255.255.255'],
          ['1.2.3.4', '254.253.252.251'],
          ['0.0.0.0', '255.255.255.255'],
          ['255.255.255.255', '0.0.0.0'],

          // IPv6
          ['::', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'],
          ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', '::'],
          ['::ffff:ffff', 'ffff:ffff:ffff:ffff:ffff:ffff::'],
          ['::abcd:dcba:abcd:dcba', 'ffff:ffff:ffff:ffff:5432:2345:5432:2345'],
          ['1234:5678::', 'edcb:a987:ffff:ffff:ffff:ffff:ffff:ffff'],
        ]

        for (const [a, expected] of cases)
          assert.strictEqual(Address.not(a), expected, `not(${a}) === ${expected}`)
      })

      test('isEqual()', () => {
        const cases: [string, string, boolean][] = [
          // IPv4 / IPv4
          ['127.0.0.1', '127.0.0.1', true],
          ['127.0.0.1', '127.0.0.2', false],
          ['0.0.0.0', '255.255.255.255', false],

          // IPv6 / IPv6
          ['::1', '::1', true],
          ['::1', '::2', false],
          ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff',
            'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', true],

          // IPv4 / IPv6 zero-extended (::ipv4)
          ['127.0.0.1', '::7f00:1', true],
          ['127.0.0.1', '::7f00:2', false],
          ['192.168.0.1', '::c0a8:1', true],

          // IPv4 / IPv6 IPv4-mapped (::ffff:ipv4)
          ['127.0.0.1', '::ffff:7f00:1', true],
          ['127.0.0.1', '::ffff:7f00:2', false],
          ['192.168.0.1', '::ffff:c0a8:1', true],

          // IPv4-mapped / IPv4-mapped
          ['::ffff:127.0.0.1', '::ffff:127.0.0.1', true],
          ['::ffff:127.0.0.1', '::ffff:127.0.0.2', false],

          // IPv4-mapped / plain IPv4
          ['::ffff:127.0.0.1', '127.0.0.1', true],
          ['::ffff:192.168.0.1', '192.168.0.2', false],

          // Edge cases
          ['::', '0.0.0.0', true],       // both all-zero
          ['::ffff:0.0.0.0', '0.0.0.0', true], // IPv4-mapped zero
        ]

        for (const [a, b, expected] of cases)
          assert.equal(Address.isEqual(a, b), expected, `isEqual(${a}, ${b}) === ${expected}`)
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

      describe('parseCidr()', () => {
        const cases: [string, [string, string] | RegExp][] = [
          ['', /Invalid CIDR/],
          ['0/', /Invalid CIDR/],
          ['0/0/', /Invalid CIDR/],
          ['192.168.1.134/26', ['192.168.1.134', '255.255.255.192']],
          ['::ffff:0/64', ['::ffff:0', 'ffff:ffff:ffff:ffff::']],
          ['::ffff:192.168.1.134/122', ['::ffff:c0a8:186', 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffc0']],
        ]

        for (const [input, expected] of cases) {
          test(`Address.parseCidr(${input}) → ${expected}`, () => {
            if (expected instanceof RegExp)
              assert.throws(() => Address.parseCidr(input), expected)
            else {
              const [addr, mask] = Address.parseCidr(input)
              assert.equal(addr.toString(), expected[0])
              assert.equal(mask.toString(), expected[1])
            }
          })
        }
      })
    })
  })
})
