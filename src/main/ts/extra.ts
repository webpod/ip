import { type BufferLike, Buffer } from './buffer.ts'

const IPV6_LAST = 'ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff'
const IPV4_LAST= '255.255.255.255'
const IPV4_LEN_LIM = IPV4_LAST.length
const IPV6_LEN_LIM = IPV6_LAST.length
const IPV4_LIM = 4294967295 // 2 ** 32

const HEX_RE = /^[0-9a-fA-F]+$/
const HEXX_RE = /^0x[0-9a-f]+$/
const DEC_RE = /^(0|[1-9]\d*)$/
const OCT_RE = /^0[0-7]+$/

// -------------------------------------------------------
// Class to parse and handle IP addresses
// -------------------------------------------------------

type Family = 4 | 6
type Raw = string | number | bigint
type Subnet = {
  networkAddress: string
  firstAddress: string
  lastAddress: string
  broadcastAddress: string
  subnetMask: string
  subnetMaskLength: number
  numHosts: bigint
  length: bigint
  contains(ip: string | number): boolean
}

export class Address {
  raw!: Raw
  family!: Family
  big!: bigint

  toBuffer(buff?: BufferLike, offset = 0): Buffer {
    offset |= 0
    const len = this.family === 4 ? 4 : 16
    const buf = buff ?? Buffer.alloc(len)

    if (buf.length < offset + len) throw Error(`Buffer too small for IPv${this.family}`)

    for (let i = 0; i < len; i++) {
      buf[offset + i] = Number((this.big >> BigInt((len - 1 - i) * 8)) & 0xffn)
    }
    return buf
  }

  toString(family: Family = this.family, mapped = (family === 6) && (this.family !== family)): string {
    const { big } = this
    // IPv4
    if (family === 4) {
      if (big > 0xffffffffn) throw new Error('Address is wider than IPv4')
      return Array.from({ length: 4 }, (_, i) =>
        Number((big >> BigInt((3 - i) * 8)) & 0xffn)
      ).join('.')
    }

    // IPv6-mapped IPv4 (::ffff:x.x.x.x)
    if (mapped && big < 0x100000000n) {
      const ipv4 = Number(big & 0xffffffffn)
      return `::ffff:${[
        (ipv4 >> 24) & 0xff,
        (ipv4 >> 16) & 0xff,
        (ipv4 >> 8) & 0xff,
        ipv4 & 0xff,
      ].join('.')}`
    }

    // IPv6
    return Array.from({ length: 8 }, (_, i) =>
      Number((big >> BigInt((7 - i) * 16)) & 0xffffn).toString(16)
    )
      .join(':')
      .replace(/(^|:)0(:0)*:0(:|$)/, '$1::$3')
      .replace(/:{3,4}/, '::')
  }

  toLong(): number {
    if (this.big > 0xffffffffn) throw new Error('Address is wider than IPv4')
    return Number(this.big)
  }

  mask(mask: Raw | Address): string {
    const mAddr = Address.from(mask)
    const { family, big } = mAddr

    // same family → pure BigInt AND
    if (this.family === family) {
      const bits = this.family === 4 ? 32 : 128
      const maskBig = big & ((1n << BigInt(bits)) - 1n)
      const masked = this.big & maskBig
      return Address.fromNumber(masked, this.family).toString()
    }

    // IPv6 addr with IPv4 mask → apply low 32 bits
    if (this.family === 6 && family === 4) {
      const low32 = this.big & 0xffffffffn
      const maskedLow = low32 & mAddr.big
      const masked = (this.big & ~0xffffffffn) | maskedLow
      return Address.fromNumber(masked, this.family).toString()
    }

    // IPv4 addr with IPv6 mask → expand to ::ffff:ipv4
    if (this.family === 4 && family === 6) {
      const lowMask = big & 0xffffffffn
      const low = this.big & lowMask
      const masked = (0xffffn << 32n) | low
      return Address.fromNumber(masked, this.family).toString()
    }

    throw new Error('Unsupported family combination')
  }

  subnet(smask: string): Subnet {
    const maskAddr = Address.fromString(smask)
    const { family, big: maskBig } = maskAddr
    const bits = family === 4 ? 32 : 128

    // masked network address
    const nw = this.big & maskBig

    // derive prefix length (assumes contiguous mask)
    const maskLen = maskBig
      .toString(2)
      .padStart(bits, '0')
      .replace(/0+$/, '').length

    const len = 1n << BigInt(bits - maskLen)
    const hosts = len <= 2n ? len : len - 2n
    const first = len <= 2n ? nw : nw + 1n
    const last = len <= 2n ? nw + (len - 1n) : nw + (len - 2n)
    const bc = nw + (len - 1n)

    return {
      networkAddress:   Address.fromNumber(nw, family).toString(),
      firstAddress:     Address.fromNumber(first, family).toString(),
      lastAddress:      Address.fromNumber(last, family).toString(),
      broadcastAddress: Address.fromNumber(bc, family).toString(), // set to last for IPv6 or undefined? RFC 4291
      subnetMask:       smask,
      subnetMaskLength: maskLen,
      numHosts:         hosts,
      length:           len,
      contains: (ip: string | number): boolean => {
        const {big} = Address.from(ip)
        return big >= nw && big <= bc
      },
    }
  }

  private static create(extra?: Partial<Address>): Address {
    return Object.assign(Object.create(this.prototype), extra)
  }

  static from(raw: Raw | Address): Address {
    if (raw instanceof Address) return this.create(raw)
    if (typeof raw === 'string') return this.fromString(raw)
    return this.fromNumber(raw)
  }

  static fromPrefixLen = (prefixlen: number, family?: Family): Address => {
    family = prefixlen > 32 ? 6 : family
    const bits = family === 6 ? 128 : 32

    if (prefixlen < 0 || prefixlen > bits)
      throw new RangeError(`Invalid prefix length for IPv${family}: ${prefixlen}`)

    const big = prefixlen === 0
      ? 0n
      : (~0n << BigInt(bits - prefixlen)) & ((1n << BigInt(bits)) - 1n)

    return this.fromNumber(big)
  }

  private static fromNumber(n: number | bigint, fam?: Family): Address {
    const big = BigInt(n)
    if (big < 0n) throw new Error('Invalid address')
    const family = big > 0xffffffffn ? 6 : (fam || 4)
    return this.create({ raw: n, big, family})
  }

  private static fromString(addr: string): Address {
    const raw = addr
    if (addr === '::' ) return this.create({ big: 0n, family: 6, raw })
    if (addr === '0') return this.create({ big: 0n, family: 4, raw })
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
        return this.create({big: BigInt(long), family: 4, raw})
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

    return this.create({family: 6, big, raw})
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

// -------------------------------------------------------
// Legacy API
// -------------------------------------------------------

