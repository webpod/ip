import { V4_RE } from './legacy.ts'

const IPV6_LAST = 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
const IPV4_LAST= '255.255.255.255'
const IPV4_LEN_LIM = IPV4_LAST.length
const IPV6_LEN_LIM = IPV6_LAST.length
const IPV4_BIG_LIM = 4294967295n
const IPV6_BIG_LIM = 340282366920938463463374607431768211455n
const IPV6_NULL = '::'

const onlydigits = (s: string) => /^\d+$/.test(s)

/**
 * Class to parse and handle IP addresses
 */

export class Address {
  raw: string
  constructor(addr: string) {
    this.raw = addr
  }

  static parse(addr: string): bigint {
    if (addr === '0' || addr === '::' ) return 0n
    if (!addr || addr.length > IPV6_LEN_LIM) throw new Error('Invalid address')

    // Compressed zeros (::)
    const [h, t] = addr.split('::', 2)
    const heads = h ? h.split(':', 8) : []
    const tails = t ? t.split(':', 8) : []
    const groups = t === undefined ? heads : [
      ...heads,
      ...Array(8 - heads.length - tails.length).fill('0'),
      ...tails,
    ]
    const last = groups[groups.length - 1]
    if (last.includes('.')) {
      if (heads.length > 1) throw new Error('Invalid address')
      if (heads.length === 0 ) {
        if (tails.length > 2) throw new Error('Invalid address')
        if (tails.length === 2) {
          if (tails[0] !== 'ffff') throw new Error('Invalid address')
          groups[5] = 'ffff'
        }
      } else {
        groups.length = 8
        groups.fill('0')
      }

      const [g6, g7] = this.ipv4ToGroups(last)
      groups[6] = g6
      groups[7] = g7
    }
    if (groups.length !== 8 || groups.includes('')) throw new Error('Invalid address')


    const b = groups.reduce(
      (acc, part) => (acc << 16n) + BigInt(parseInt(part, 16)),
      0n
    )
    console.log('groups', groups)
    console.log('b', b)

    return 0n

  }
  static ipv4ToGroups(ipv4: string): string[] {
    const groups = ipv4.split('.')
    if (groups.length !== 4) throw new Error('Invalid IPv4')
    const nums = groups.map(p => {
      const n = +p
      if (n < 0 || n > 255 || !onlydigits(p)) throw new Error('Invalid IPv4')
      return n
    })
    return [
      ((nums[0] << 8) | nums[1]).toString(16),
      ((nums[2] << 8) | nums[3]).toString(16),
    ]
  }
}
