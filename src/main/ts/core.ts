export * from './legacy.ts'

import { type BufferLike, Buffer, fromEntries } from './polyfill.ts'

const IPV4_LEN_LIM = 4 * 3 + 3 // 4 groups of 3dec + 3 dots
const IPV6_LEN_LIM = 4 * 8 + 7 // 8 groups of 4hex + 7 colons

const HEX_RE = /^[0-9a-fA-F]+$/
const HEXX_RE = /^0x[0-9a-f]+$/
const DEC_RE = /^(0|[1-9]\d*)$/
const OCT_RE = /^0[0-7]+$/

// https://en.wikipedia.org/wiki/Reserved_IP_addresses
export type Special = 'loopback' | 'private' | 'linklocal' | 'multicast' | 'documentation' | 'reserved' | 'unspecified'
const SPECIALS: Record<Special, string[]> = {
  unspecified: [
    '0.0.0.0/8',
    '::/128',
  ],
  loopback: [
    '127.0.0.0/8',    // IPv4 loopback
    '::1/128',        // IPv6 loopback
  ],
  private: [
    '10.0.0.0/8',     // IPv4 private
    '172.16.0.0/12',  // IPv4 private
    '192.168.0.0/16', // IPv4 private
    '100.64.0.0/10',  // IPv4 CGNAT
    'fc00::/7',       // IPv6 ULA
    '198.18.0.0/15',  // IPv4 benchmarking
  ],
  linklocal: [
    '169.254.0.0/16', // IPv4 link-local
    'fe80::/64',      // IPv6 link-local
  ],
  multicast: [
    '224.0.0.0/4',    // IPv4 multicast
    'ff00::/8',       // IPv6 multicast
  ],
  documentation: [
    '192.0.0.0/24',   // IPv4 IETF
    '192.0.2.0/24',   // TEST-NET-1
    '192.88.99.0/24', // IPv4 relay anycast
    '198.51.100.0/24',// TEST-NET-2
    '203.0.113.0/24', // TEST-NET-3
    '2001:db8::/32',  // IPv6 docs
  ],
  reserved: [
    '240.0.0.0/4',    // IPv4 reserved
    '255.255.255.255/32', // IPv4 broadcast
    '::ffff:0:0/96',  // IPv4-mapped IPv6
    '64:ff9b::/96',   // IPv6 NAT64
    '64:ff9b:1::/48', // IPv6 NAT64 local
    '100::/64',       // IPv6 discard
    '2001::/32',      // ORCHID
    '2001:20::/28',   // ORCHIDv2
    '2002::/16',      // 6to4
    '3fff::/20',      // IPv6 reserved
    '5f00::/16',      // IPv6 reserved
  ],
}

// -------------------------------------------------------
// Class to parse and handle IP addresses
// -------------------------------------------------------

type Family = 4 | 6
type Raw = string | number | bigint | BufferLike | Array<number> | Address
type Subnet = {
  family: Family
  networkAddress: string
  firstAddress: string
  lastAddress: string
  broadcastAddress: string
  subnetMask: string
  subnetMaskLength: number
  numHosts: bigint
  length: bigint
  contains(addr: Raw): boolean
}

export class Address {
  raw!: Raw
  family!: Family
  big!: bigint

  toBuffer(buff?: BufferLike, offset = 0): BufferLike {
    offset |= 0
    const len = this.family === 4 ? 4 : 16
    const buf = buff ?? Buffer.alloc(len)

    if (buf.length < offset + len) throw Error(`Buffer too small for IPv${this.family}`)

    for (let i = 0; i < len; i++) {
      buf[offset + i] = Number((this.big >> BigInt((len - 1 - i) * 8)) & 0xffn)
    }
    return buf
  }

  toArray(): number[] {
    return [...this.toBuffer()]
  }

  toString(family: Family = this.family, mapped?: boolean): string {
    const fam = Address.normalizeFamily(family)
    const _mapped = mapped ?? (fam === 6 && this.family !== fam)
    const { big } = this
    // IPv4
    if (fam === 4) {
      if (big > 0xffffffffn) throw new Error(`Address is wider than IPv4: ${this}`)
      return Array.from({ length: 4 }, (_, i) =>
        Number((big >> BigInt((3 - i) * 8)) & 0xffn)
      ).join('.')
    }

    // IPv6-mapped IPv4 (::ffff:x.x.x.x)
    if (_mapped && big < 0x100000000n) {
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
    if (this.big > 0xffffffffn) throw new Error(`Address is wider than IPv4: ${this}`)
    return Number(this.big)
  }

  private static create(extra?: Partial<Address>): Address {
    return Object.assign(Object.create(this.prototype), extra)
  }

  static from(raw: Raw): Address {
    if (raw instanceof Address) return this.create(raw)
    if (typeof raw === 'string') return this.fromString(raw.toLowerCase())
    if (typeof raw === 'number' || typeof raw === 'bigint') return this.fromNumber(raw)
    if (raw && typeof raw === 'object' && 'length' in raw) return this.fromBuffer(raw)

    throw new Error(`Invalid address: ${raw}`)
  }

  static mask(addr: Raw, mask: Raw): string {
    const a = Address.from(addr)
    const m = Address.from(mask)

    // same family → pure BigInt
    if (a.family === m.family) {
      const bits = a.family === 4 ? 32 : 128
      const maskBig = m.big & ((1n << BigInt(bits)) - 1n)
      const masked = a.big & maskBig
      return Address.fromNumber(masked, a.family).toString()
    }

    // IPv6 addr with IPv4 mask → apply low 32 bits
    if (a.family === 6 && m.family === 4) {
      const low32 = a.big & 0xffffffffn
      const maskedLow = low32 & m.big
      const masked = (a.big & ~0xffffffffn) | maskedLow
      return Address.fromNumber(masked, a.family).toString()
    }

    // IPv4 addr with IPv6 mask → expand to ::ffff:ipv4
    if (a.family === 4 && m.family === 6) {
      const lowMask = m.big & 0xffffffffn
      const low = a.big & lowMask
      const masked = (0xffffn << 32n) | low
      return Address.fromNumber(masked, a.family).toString()
    }

    throw new Error('Unsupported family combination')
  }

  static subnet(addr: Raw, smask: Raw): Subnet {
    const a = Address.from(addr)
    const m = Address.from(smask)
    const bits = m.family === 4 ? 32 : 128

    const nw = a.big & m.big   // masked network address
    const maskLen = m.big     // derive prefix length (assumes contiguous mask)
      .toString(2)
      .padStart(bits, '0')
      .replace(/0+$/, '').length

    const len = 1n << BigInt(bits - maskLen)
    const hosts = len <= 2n ? len : len - 2n
    const first = len <= 2n ? nw : nw + 1n
    const last = len <= 2n ? nw + (len - 1n) : nw + (len - 2n)
    const bc = nw + (len - 1n)

    return {
      networkAddress:   Address.fromNumber(nw, m.family).toString(),
      firstAddress:     Address.fromNumber(first, m.family).toString(),
      lastAddress:      Address.fromNumber(last, m.family).toString(),
      broadcastAddress: Address.fromNumber(bc, m.family).toString(), // set to last for IPv6 or undefined? RFC 4291
      subnetMask:       m.toString(),
      subnetMaskLength: maskLen,
      numHosts:         hosts,
      length:           len,
      family:           m.family,
      contains: (ip: Raw): boolean => {
        const {big} = Address.from(ip)
        return big >= nw && big <= bc
      },
    }
  }

  static cidr(cidrString: string): string  {
    return this.mask(...this.parseCidr(cidrString))
  }

  static cidrSubnet (cidrString: string): Subnet  {
    return this.subnet(...this.parseCidr(cidrString))
  }

  static not(addr: Raw): string {
    const { big, family } = Address.from(addr)
    const bits = family === 4 ? 32 : 128
    const mask = (1n << BigInt(bits)) - 1n
    return Address.fromNumber(~big & mask, family).toString()
  }

  static or(addrA: Raw, addrB: Raw): string {
    const a = Address.from(addrA)
    const b = Address.from(addrB)

    // same family -> simple OR (mask to family width)
    if (a.family === b.family) {
      const bits = a.family === 4 ? 32 : 128
      const mask = (1n << BigInt(bits)) - 1n
      return Address.fromNumber((a.big | b.big) & mask, a.family).toString()
    }

    // mixed families -> zero-extend IPv4 into low 32 bits of IPv6 (NO ::ffff)
    const ipv6 = a.family === 6 ? a : b
    const ipv4 = a.family === 4 ? a : b

    const resultBig = ipv6.big | ipv4.big // ipv4.big occupies low 32 bits
    return Address.fromNumber(resultBig, 6).toString()
  }

  static isEqual(addrA: Raw, addrB: Raw): boolean {
    const a = Address.from(addrA)
    const b = Address.from(addrB)

    // same family: compare directly
    if (a.family === b.family) return a.big === b.big

    // normalize so A is IPv4, B is IPv6
    const v4 = a.family === 4 ? a : b
    const v6 = a.family === 6 ? a : b

    // candidate: plain zero-extended ::ipv4
    if (v6.big === v4.big) return true

    // candidate: IPv4-mapped ::ffff:ipv4
    return v6.big === ((0xffffn << 32n) | v4.big)
  }

  static fromPrefixLen = (prefixlen: number, family?: string | number): Address => {
    const len = prefixlen | 0
    const fam = this.normalizeFamily(family || (len > 32 ? 6 : 4))
    const bits = fam === 6 ? 128 : 32

    if (len < 0 || len > bits)
      throw new RangeError(`Invalid prefix length for IPv${fam}: ${len}`)

    const big = len === 0
      ? 0n
      : (~0n << BigInt(bits - len)) & ((1n << BigInt(bits)) - 1n)

    return this.fromNumber(big)
  }

  private static fromNumber(n: number | bigint | `${bigint}`, fam?: Family): Address {
    const big = BigInt(n)
    if (big < 0n) throw new Error(`Invalid address: ${n}`)
    const family = big > 0xffffffffn ? 6 : (fam || 4)
    return this.create({ raw: n, big, family})
  }

  private static fromLong(n: number | bigint | `${bigint}`): Address {
    const addr = this.fromNumber(n)
    if (addr.family !== 4) throw new Error(`Invalid address (long): ${n}`)
    return addr
  }

  private static fromBuffer(buf: BufferLike | Array<number>): Address {
    if (buf.length !== 4 && buf.length !== 16)
      throw new Error(`Invalid buffer length ${buf.length}, must be 4 (IPv4) or 16 (IPv6)`)

    let big = 0n
    for (const byte of buf) {
      if (byte < 0 || byte > 255 || !Number.isInteger(byte))
        throw new Error(`Invalid byte value ${byte} in buffer`)
      big = (big << 8n) | BigInt(byte)
    }

    const family = buf.length === 4 ? 4 : 6
    return Address.fromNumber(big, family)
  }

  private static fromString(addr: string): Address {
    const raw = addr
    if (addr === '::' ) return this.create({ big: 0n, family: 6, raw })
    if (addr === '0') return this.create({ big: 0n, family: 4, raw })
    if (!addr || addr.length > IPV6_LEN_LIM) throw new Error(`Invalid address: ${addr}`)

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
      if (last.length === raw.length) return this.fromLong(this.normalizeToLong(last))
      if (groups[groups.length - 2] !== 'ffff') throw new Error(`Invalid address: ${addr}`)
      if (groups.slice(0, -2).some(v => v !== '0')) throw new Error(`Invalid address: ${addr}`)

      const [g6, g7] = this.ipv4ToGroups(last)
      groups[5] = 'ffff'
      groups[6] = g6
      groups[7] = g7
    }
    if (groups.length === 1 && DEC_RE.test(last)) return Address.fromNumber(raw as `${bigint}`) // single decimal number
    if (groups.length !== 8 || groups.includes('')) throw new Error(`Invalid address: ${addr}`)

    const big = groups.reduce(
      (acc, part) => {
        if (part.length > 4 || !HEX_RE.test(part)) throw new Error(`Invalid address: ${addr}`)
        return (acc << 16n) + BigInt(parseInt(part, 16))
      },
      0n
    )

    return this.create({family: 6, big, raw})
  }

  private static ipv4ToGroups(addr: string): string[] {
    if (addr.length > IPV4_LEN_LIM) throw new Error(`Invalid address: ${addr}`)
    const groups = addr.split('.', 5)
    if (groups.length !== 4) throw new Error(`Invalid address: ${addr}`)
    const nums = groups.map(p => {
      const n = +p
      if (n < 0 || n > 255 || !DEC_RE.test(p)) throw new Error(`Invalid address: ${addr}`)
      return n
    })
    return [
      ((nums[0] << 8) | nums[1]).toString(16),
      ((nums[2] << 8) | nums[3]).toString(16),
    ]
  }

  static parseCidr = (cidr: string): [Address, Address] => {
    const chunks = cidr.split('/', 3)
    const [ip, prefix] = chunks
    if (chunks.length !== 2 || !prefix.length) throw new Error(`Invalid CIDR: ${cidr}`)

    const addr = this.fromString(ip)
    const m = this.fromPrefixLen(parseInt(prefix, 10), addr.family)
    return [addr, m]
  }

  static normalizeFamily(family: string | number): Family {
    const f = `${family}`.toLowerCase()
    if (f === '4' || f === 'ipv4') return 4
    if (f == '6' || f === 'ipv6') return 6
    throw new Error(`Invalid family: ${family}`)
  }

  static normalizeToLong(addr: string): number {
    const groups = addr.split('.', 5)
      .map(v => {
        const radix =
          HEXX_RE.test(v) ? 16 :
            DEC_RE.test(v) ? 10 :
              OCT_RE.test(v) ? 8 : -1
        return parseInt(v, radix)
      })
    const [g0, g1, g2, g3] = groups
    const l = groups.length

    return l > 4 || groups.some(isNaN) ? -1 :
      l === 1 ? g0 :
      l === 2 && g0 <= 0xff && g1 <= 0xffffff ?             ((g0 << 24) | (g1 & 0xffffff)) >>> 0 :
      l === 3 && g0 <= 0xff && g1 <= 0xff && g2 <= 0xffff ? ((g0 << 24) | (g1 << 16) | (g2 & 0xffff)) >>> 0 :
      groups.every(g => g <= 0xff) ?                ((g0 << 24) | (g1 << 16) | (g2 << 8) | g3) >>> 0 : -1
  }

  static isSpecial(addr: Raw, range?: Special | Special[]): boolean {
    const ip = Address.from(addr)
    const subnets = !range
      ? Object.values(SPECIAL_SUBNETS).flat()
      : (Array.isArray(range) ? range : [range]).flatMap(r => SPECIAL_SUBNETS[r as Special] || [])

    for (const subnet of subnets) {
      if (subnet.family !== ip.family) continue
      if (subnet.contains(ip)) return true
    }

    return false
  }

  static isPrivate(addr: Raw) {
    return this.isSpecial(addr, ['private', 'linklocal', 'loopback', 'unspecified'])
  }

  static isPublic(addr: Raw) {
    return !this.isPrivate(addr)
  }
}

const ipv6fySubnet = (c: string) => {
  if (c.includes(':')) return [c]

  const [base, len] = c.split('/')
  const prefix = `::ffff:${base}`
  return [c, `${prefix}/${96 + Number(len)}`]
}

const SPECIAL_SUBNETS: Record<Special, Subnet[]> = fromEntries(Object.entries(SPECIALS)
  .map(([cat, cidrs]) => [
    cat as Special,
    cidrs.flatMap((c) => ipv6fySubnet(c).map((c) => Address.cidrSubnet(c)))
  ]))

// -------------------------------------------------------
// Legacy compatibility API
// -------------------------------------------------------

export const isPublic:        typeof Address['isPublic'] = Address.isPublic.bind(Address)
export const isPrivate:       typeof Address['isPrivate'] = Address.isPrivate.bind(Address)
export const isEqual:         typeof Address['isEqual'] = Address.isEqual.bind(Address)
export const mask:            typeof Address['mask'] = Address.mask.bind(Address)
export const not:             typeof Address['not'] = Address.not.bind(Address)
export const or:              typeof Address['or'] = Address.or.bind(Address)
export const cidr:            typeof Address['cidr'] = Address.cidr.bind(Address)
export const normalizeToLong: typeof Address['normalizeToLong'] = Address.normalizeToLong.bind(Address)

export function fromPrefixLen(prefixlen: number, family?: string | number): string {
  return Address.fromPrefixLen(prefixlen, family).toString()
}

type LegacySubnet = Omit<Subnet, 'numHosts' | 'length'> & {
  numHosts: number | bigint
  length: number | bigint
}
export function subnet(addr: Raw, smask: Raw): LegacySubnet {
  const sub = Address.subnet(addr, smask)
  return sub.family === 6 ? sub : {...sub, numHosts: Number(sub.numHosts), length:   Number(sub.length)}
}
export function cidrSubnet(cidrString: string): LegacySubnet {
  const sub = Address.cidrSubnet(cidrString)
  return sub.family === 6 ? sub : {...sub, numHosts: Number(sub.numHosts), length: Number(sub.length)}
}

export function toBuffer(addr: Raw, buff?: BufferLike, offset = 0): BufferLike {
  return Address.from(addr).toBuffer(buff, offset)
}


