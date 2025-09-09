const IPV6_LAST = 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
const IPV4_LAST= '255.255.255.255'
const IPV4_LEN_LIM = IPV4_LAST.length
const IPV6_LEN_LIM = IPV6_LAST.length
const IPV4_LIM = 4294967295

const HEX_RE = /^[0-9a-fA-F]+$/
const HEXX_RE = /^0x[0-9a-f]+$/
const DEC_RE = /^(0|[1-9]\d*)$/
const OCT_RE = /^0[0-7]+$/

type Family = 4 | 6
export type ParsedAddress = {
  family: Family
  big: bigint
}

/**
 * Class to parse and handle IP addresses
 */

export class Address {
  raw: string
  family: Family
  big: bigint
  constructor(addr: string) {
    const {family, big} = Address.parse(addr)
    this.raw = addr
    this.family = family
    this.big = big
  }

  static parse(addr: string, opts?: Record<string, any>): ParsedAddress {
    if (addr === '::' ) return { big: 0n, family: 6 }
    if (addr === '0') return { big: 0n, family: 4 }
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
        const long = ipV4ToLong(last)
        if (long < 0 || long > IPV4_LIM) throw new Error('Invalid address')
        return {big: BigInt(long), family: 4}
      }

      const [g6, g7] = this.ipv4ToGroups(last)
      groups[6] = g6
      groups[7] = g7
    }
    if (groups.length !== 8 || groups.includes('')) throw new Error('Invalid address')

    const big = groups.reduce(
      (acc, part) => {
        if (part.length > 4 || !HEX_RE.test(part)) throw new Error('Invalid address')
        return (acc << 16n) + BigInt(parseInt(part, 16))
      },
      0n
    )

    return {family: 6, big}
  }
  static ipv4ToGroups(ipv4: string): string[] {
    if (ipv4.length > IPV4_LEN_LIM) throw new Error('Invalid IPv4')
    const groups = ipv4.split('.', 5)
    if (groups.length !== 4) throw new Error('Invalid IPv4')
    const nums = groups.map(p => {
      const n = +p
      if (n < 0 || n > 255 || !DEC_RE.test(p)) throw new Error('Invalid IPv4')
      return n
    })
    return [
      ((nums[0] << 8) | nums[1]).toString(16),
      ((nums[2] << 8) | nums[3]).toString(16),
    ]
  }
}

const ipV4ToLong = (addr: string): number => {
  const groups = addr.split('.', 5)
    .map(v => {
      const radix =
        HEXX_RE.test(v) ? 16 :
          DEC_RE.test(v) ? 10 :
            OCT_RE.test(v) ? 8 : NaN
      return parseInt(v, radix)
    })
  const [g0, g1, g2, g3] = groups
  const l = groups.length

  if (l > 4 || groups.some(isNaN)) return -1

  if (l === 1)
    return g0 >>> 0

  if (l === 2 && g0 <= 0xff && g1 <= 0xffffff)
    return ((g0 << 24) | (g1 & 0xffffff)) >>> 0

  if (l === 3 && g0 <= 0xff && g1 <= 0xff && g2 <= 0xffff)
    return ((g0 << 24) | (g1 << 16) | (g2 & 0xffff)) >>> 0

  if (groups.every(g => g <= 0xff))
    return ((g0 << 24) | (g1 << 16) | (g2 << 8) | g3) >>> 0

  return -1
}
