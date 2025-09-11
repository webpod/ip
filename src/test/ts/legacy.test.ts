import assert from 'node:assert'
import {test, describe} from 'vitest'

import {
  type BufferLike,
  normalizeFamily,
  normalizeToLong,
  IPV4,
  IPV6,
  isV4Format,
  isV6Format,
  isLoopback,
  isEqual,
  isPrivate,
  isPublic,
  fromLong,
  fromPrefixLen,
  toBuffer,
  toString,
  toLong,
  mask,
  subnet,
  cidr,
  cidrSubnet,
  or,
  not,
} from '../../main/ts/core.ts'

describe('core', () => {
  test('normalizeFamily() normalizes input to enum', () => {
    const cases: [any, string][] = [
      [4, IPV4],
      ['4', IPV4],
      ['ipv4', IPV4],
      ['iPV4', IPV4],
      [6, IPV6],
      ['6', IPV6],
      ['ipv6', IPV6],
      [undefined, IPV4],
      [null, IPV4],
      ['', IPV4],
    ]
    for (const [input, expected] of cases) {
      const result = normalizeFamily(input)
      assert.equal(result, expected, `normalizeFamily(${input}) === ${expected}`)
    }
  })

  test('normalizeToLong()', () => {
    const cases: [string, number][] = [
      ['2130706433', 2130706433],
      ['127.1', 2130706433],
      ['0177.0.0.1', 2130706433],
      ['1.2.3.4.5', -1],
      ['1', 1],
      ['1.1', 16777217],
      ['1.1.1', 16842753],
      ['1.1.1.1', 16843009],
    ]

    for (const [input, expected] of cases) {
      assert.equal(normalizeToLong(input), expected, `normalizeToLong(${input}) === ${expected}`)
    }
  })

  describe('isV4Format()', () => {
    const cases: [string, boolean][] = [
      ['', false],                 // empty
      ['127.0.0.1', true],         // normal IPv4
      ['255.255.255.255', true],   // broadcast IPv4
      ['0.0.0.0', true],           // unspecified IPv4
      ['1.2.3', false],            // too few octets
      ['1.2.3.256', false],        // invalid octet
      ['::1', false],              // IPv6
      ['::ffff:127.0.0.1', false], // IPv6 mapped IPv4 (still not pure v4 format)
      ['abc.def.ghi.jkl', false],  // invalid chars
      [' 127.0.0.1 ', false],      // whitespace not allowed
    ]

    for (const [input, expected] of cases) {
      test(`${input} → ${expected}`, () => {
        assert.equal(isV4Format(input), expected)
      })
    }
  })

  describe.only('isV6Format()', () => {
    const cases: [string, boolean][] = [
      // ['', false],                    // empty
      // ['::1', true],                  // loopback
      // ['::', true],                   // unspecified
      // ['2001:db8::1', true],          // documentation range
      // ['fe80::1', true],              // link-local
      // ['ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff', true], // full expanded IPv6
      // ['1.2.3.4', false],             // IPv4
      // ['::ffff:127.0.0.1', true],     // IPv4-mapped IPv6 (valid IPv6 string!)
      // ['12345::1', false],            // too big hextet
      // ['abcd::abcd::1', false],       // double compression
      ['0:0:0:0:0:0:0:0:0:0', false], // extra bits
      //['abcd:efgh::1', false],        // invalid hex chars
    ]

    for (const [input, expected] of cases) {
      test(`${input} → ${expected}`, () => {
        assert.equal(isV6Format(input), expected)
      })
    }
  })

  test('isLoopback()', () => {
    const cases: [string | number, boolean?][] = [
      ['127.0.0.1', true],
      ['127.8.8.8', true],
      ['fe80::1', true],
      ['::1', true],
      ['::', true],
      ['128.0.0.1'],
      ['8.8.8.8'],
      [2130706434, true],
      [4294967295],
      ['0177.0.0.1', true],
      ['0177.0.1', true],
      ['0177.1', true],
      ['0x7f.0.0.1', true],
      ['0x7f.0.1', true],
      ['0x7f.1', true],
      ['2130706433', true],
      ['192.168.1.1', false],
    ]

    for (const [input, expected] of cases) {
      assert.equal(isLoopback(input), !!expected, `isLoopback(${input}) === ${expected}`)
    }
  })

  test('fromLong()', () => {
    const cases: [number, string][] = [
      [2130706434, '127.0.0.2'],
      [4294967295, '255.255.255.255'],
    ]

    for (const [input, expected] of cases) {
      assert.equal(fromLong(input), expected, `fromLong(${input}) === ${expected}`)
    }
  })

  test('toLong()', () => {
    const cases: [string | BufferLike, number][] = [
      ['127.0.0.1', 2130706433],
      ['255.255.255.255', 4294967295],
      [Buffer.from([127, 0, 0, 1]), 2130706433],
    ]

    for (const [input, expected] of cases) {
      assert.equal(toLong(input), expected, `toLong(${input}) === ${expected}`)
    }
  })

  test('toBuffer()', () => {
    const cases: [string | number, BufferLike][] = [
      ['127.0.0.1',       Buffer.from([127, 0, 0, 1])],
      ['0.0.0.1',         Buffer.from([0, 0, 0, 1])],
      // ['::0.0.0.1',       Buffer.from([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1])],  // invalid but supported
      ['::ffff:0.0.0.1',  Buffer.from([0,0,0,0, 0,0,0,0, 0,0,255,255, 0,0,0,1])],
      // ['::ff:0.0.0.1',    Buffer.from([0,0,0,0, 0,0,0,0, 0,0,0,255, 0,0,0,1])], // invalid but supported
      ['::1',             Buffer.from([0,0,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,1])],
      ['1::',             Buffer.from([0,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0])],
      ['0001::',          Buffer.from([0,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0])],
      ['1:0:0:0:0:0:0:0', Buffer.from([0,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0])],
      // ['1:0:0:0:0:0',     Buffer.from([0,1,0,0, 0,0,0,0, 0,0,0,0, 0,0,0,0])], // invalid but supported
      ['abcd::dcba',      Buffer.from([0xab,0xcd,0,0, 0,0,0,0, 0,0,0,0, 0,0,0xdc,0xba])],
    ]

    for (const [input, expected] of cases)
      assert.deepEqual(toBuffer(input), expected, `toBuffer(${input}) === ${expected}`)
  })

  test('toBuffer()/toString()', () => {
    const u = undefined
    const cases: [string | number, Buffer | undefined, number | undefined, number | undefined, string, string?][] = [
      ['127.0.0.1', u, u, u, '7f000001'],
      [2130706433, u, u, u, '7f000001'],
      // ['::ffff:127.0.0.1', u, u, u, '00000000000000000000ffff7f000001', '::ffff:7f00:1'],
      //['127.0.0.1', Buffer.alloc(128), 64, 4, '0'.repeat(128) + '7f000001' + '0'.repeat(120)],
      // ['::1', u, u, u, '00000000000000000000000000000001'],
      // ['1::', u, u, u, '00010000000000000000000000000000'],
      // ['abcd::dcba', u, u, u, 'abcd000000000000000000000000dcba'],
      // ['::1', Buffer.alloc(128), 64, 16, '0'.repeat(128 + 31) + '1' + '0'.repeat(128 - 32)],
      // ['abcd::dcba', Buffer.alloc(128), 64, 16, '0'.repeat(128) + 'abcd000000000000000000000000dcba' + '0'.repeat(128 - 32)],
      // ['::ffff:127.0.0.1', u, u, u, '00000000000000000000ffff7f000001', '::ffff:7f00:1'],
      // // ['ffff::127.0.0.1', u, u, u, 'ffff000000000000000000007f000001', 'ffff::7f00:1'],
      // ['0:0:0:0:0:ffff:127.0.0.1', u, u, u, '00000000000000000000ffff7f000001', '::ffff:7f00:1'],
    ]
    for (const [input, b, o, l, h, s = input] of cases) {
      const buf = toBuffer(input, b, o)
      const str = toString(buf, o, l)
      const long = toLong(buf)
      const hex = buf.toString('hex')

      console.log('buf:', buf)

      assert.equal(hex, h, `toBuffer(${input}).toString('hex') === ${h}`)

      if (typeof s === 'string') assert.equal(str, s, `toString(toBuffer(${input})) === ${s}`)
      if (typeof s === 'number') assert.equal(long, s, `toLong(toBuffer(${input})) === ${s}`)
    }

    assert.throws(() => toBuffer(''), /Invalid/)
  })

  test('toLong(), toString(), toBuffer() roundtrip', () => {
    assert.deepEqual(toLong('127.0.0.1'), toLong(toBuffer('127.0.0.1')))
    assert.equal(toLong('127.0.0.1'), toLong(toBuffer('127.0.0.1')))
    assert.equal(toString(toBuffer(2130706433)), toString(2130706433))
  })

  test('fromPrefixLen()', () => {
    const cases: [number, string, (string | number)?][] = [
      [24, '255.255.255.0'],
      [64, 'ffff:ffff:ffff:ffff::'],
      [24, 'ffff:ff00::', 'ipv6'],
    ]

    for (const [input, expected, family] of cases) {
      const res = fromPrefixLen(input, family)
      assert.strictEqual(res, expected, `fromPrefixLen(${input}, ${family}) === ${expected}`)
    }
  })

  test('mask()', () => {
    const cases: [string, string, string][] = [
      ['192.168.1.134', '255.255.255.0', '192.168.1.0'],
      ['192.168.1.134', '::ffff:ff00', '::ffff:c0a8:100'],
      ['::1', '0.0.0.0', '::'],
      ['0.0.0.1', '::', '::ffff:0:0'],
      ['ff::', '::ff', '::'],
    ]

    for (const [a, m, expected] of cases) {
      const res = mask(a, m)
      assert.strictEqual(res, expected, `mask(${a}, ${m}) === ${expected}`)
    }
  })

  test('subnet()', () => {
    const cases: [string, string, Record<string, any>, (string | number | BufferLike)[]?, (string | number | BufferLike)[]?][] = [
      ['192.168.1.134', '255.255.255.192', {
        networkAddress: '192.168.1.128',
        firstAddress:   '192.168.1.129',
        lastAddress:    '192.168.1.190',
        broadcastAddress: '192.168.1.191',
        subnetMask:     '255.255.255.192',
        subnetMaskLength: 26,
        numHosts:      62,
        length:        64,
      }, [
        '192.168.1.180',
        '192.168.1.128',
        toLong('192.168.1.180'),
        toBuffer('192.168.1.180'),
      ], [
        '192.168.1.192'
      ]],

      ['192.168.1.134', '255.255.255.255', {
        firstAddress: '192.168.1.134',
        lastAddress:  '192.168.1.134',
        numHosts: 1
      }, ['192.168.1.134'], []],

      ['192.168.1.134', '255.255.255.254', {
        firstAddress: '192.168.1.134',
        lastAddress:  '192.168.1.135',
        numHosts: 2
      }],

      // wtf?
      ['::1010:1010', '::ffff:0', {
        firstAddress: '::1010:1',
        lastAddress:  '::1010:fffe',
      }],
    ]
    for (const [addr, smask, expected, inside = [], out = []] of cases) {
      const res = subnet(addr, smask)
      for (const k of Object.keys(expected))
        assert.strictEqual(res[k as keyof typeof res], expected[k], `subnet(${addr}, ${smask}).${k} === ${expected[k]}`)

      assert.ok(inside.every(a => res.contains(a)), `subnet(${addr}, ${smask}) contains ${inside.join(', ')}`)
      assert.ok(out.every(a => !res.contains(a)), `subnet(${addr}, ${smask}) does not contain ${out.join(', ')}`)
    }
  })


  test('cidr()', () => {
    const cases: [string, string][] = [
      ['192.168.1.134/26', '192.168.1.128'],
      ['2607:f0d0:1002:51::4/56', '2607:f0d0:1002::']
    ]

    for (const [input, expected] of cases) {
      const res = cidr(input)
      assert.strictEqual(res, expected, `cidr(${input}) === ${expected}`)
    }

    assert.throws(() => cidr(''), /Invalid CIDR/)
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
        numHosts:      62,
        length:        64,
      }],
    ]

    for (const [input, expected] of cases) {
      const res = cidrSubnet(input)
      for (const k of Object.keys(expected))
        assert.strictEqual(res[k as keyof typeof res], expected[k], `cidrSubnet(${input}).${k} === ${expected[k]}`)
    }

    assert.throws(() => cidrSubnet(''), /Invalid CIDR/)
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
      assert.strictEqual(or(a, b), expected, `or(${a}, ${b}) === ${expected}`)
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
      assert.strictEqual(not(a), expected, `not(${a}) === ${expected}`)
  })

  test('isEqual()', () => {
    const cases: [string, string, boolean][] = [
      ['127.0.0.1', '::7f00:1', true],
      ['127.0.0.1', '::7f00:2', false],
      ['127.0.0.1', '::ffff:7f00:1', true],
      ['127.0.0.1', '::ffaf:7f00:1', false],
      ['::ffff:127.0.0.1', '::ffff:127.0.0.1', true],
      ['::ffff:127.0.0.1', '127.0.0.1', true],
    ]

    for (const [a, b, expected] of cases)
      assert.equal(isEqual(a, b), expected, `isEqual(${a}, ${b}) === ${expected}`)
  })

  test('isPrivate()/isPublic()', () => {
    const cases: [string, boolean?][] = [
      ['127.0.0.1', true],
      ['127.0.0.2', true],
      ['127.1.1.1', true],

      ['192.168.0.123', true],
      ['192.168.122.123', true],
      ['192.162.1.2'],

      ['172.16.0.5', true],
      ['172.16.123.254', true],
      ['171.16.0.5'],
      ['172.25.232.15', true],
      ['172.15.0.5'],
      ['172.32.0.5'],

      ['169.254.2.3', true],
      ['169.254.221.9', true],
      ['168.254.2.3'],

      ['10.0.2.3', true],
      ['10.1.23.45', true],
      ['12.1.2.3'],

      // ['198.18.0.0'],

      ['fd12:3456:789a:1::1', true],
      ['fe80::f2de:f1ff:fe3f:307e', true],
      ['::ffff:10.100.1.42', true],
      ['::FFFF:172.16.200.1', true],
      ['::ffff:192.168.0.1', true],

      ['165.225.132.33'],

      ['::', true],
      ['::1', true],
      ['fe80::1', true],

      // CVE-2023-42282
      ['0x7f.1', true],

      // CVE-2024-29415
      ['127.1', true],
      ['2130706433', true],
      // ['01200034567', false],
      // ['012.1.2.3', false],
      // ['000:0:0000::01', true],
      ['::fFFf:127.0.0.1', true],
      // ['::fFFf:127.255.255.256', true]
    ]

    for (const [input, expected] of cases) {
      assert.equal(isPrivate(input), !!expected, `isPrivate(${input}) === ${!!expected}`)
      assert.equal(isPublic(input), !expected, `isPublic(${input}) === ${!expected}`)
    }
  })
})
