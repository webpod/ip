import { type BufferLike, Buffer } from './polyfill.ts'

export type { BufferLike } from './polyfill.ts'

const IPV4_LEN_LIM = 4 * 3 + 3                // 4 groups of 3dec + 3 dots
const IPV6_LEN_LIM = 6 * 4 + 6 + IPV4_LEN_LIM // 6 groups of 4hex + 6 colons + ipv4 = IPv4-mapped IPv6
const IPV4_LB = '127.0.0.1'
const IPV6_LB = 'fe80::1'
const IPV6_MAX = (1n << 128n) - 1n
const IPV4_MAX = 0xffffffffn

const HEX_RE = /^[0-9a-fA-F]+$/
const HEXX_RE = /^0x[0-9a-f]+$/
const DEC_RE = /^(?:0|[1-9][0-9]*)$/
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

  toString(family: Family | string | number = this.family, mapped?: boolean): string {
    const fam = Address.normalizeFamily(family)
    const _mapped = mapped ?? (fam === 6 && this.family !== fam)
    const { big } = this
    // IPv4
    if (fam === 4) {
      if (big > IPV4_MAX) throw new Error(`Address is wider than IPv4: ${this}`)
      return Array.from({ length: 4 }, (_, i) =>
        Number((big >> BigInt((3 - i) * 8)) & 0xffn)
      ).join('.')
    }

    // IPv6-mapped IPv4 (::ffff:x.x.x.x)
    if (_mapped && big <= IPV4_MAX) {
      const ipv4 = Number(big & IPV4_MAX)
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
    if (this.big > IPV4_MAX) throw new Error(`Address is wider than IPv4: ${this}`)
    return Number(this.big)
  }

  get range(): Special | undefined {
    for (const matcher of SPECIAL_MATCHERS) {
      const res = matcher(this)
      if (res) return res
    }
  }

  private static create(big: bigint, family: Family, raw: Raw): Address {
    const o = Object.create(this.prototype)
    o.big = big; o.family = family; o.raw = raw
    return o
  }

  static from(raw: Raw): Address {
    if (raw instanceof Address) return this.create(raw.big, raw.family, raw.raw)
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
      const low32 = a.big & IPV4_MAX
      const maskedLow = low32 & m.big
      const masked = (a.big & ~IPV4_MAX) | maskedLow
      return Address.fromNumber(masked, a.family).toString()
    }

    // IPv4 addr with IPv6 mask → expand to ::ffff:ipv4
    if (a.family === 4 && m.family === 6) {
      const lowMask = m.big & IPV4_MAX
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
      contains(ip: Raw): boolean {
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

  static fromPrefixLen = (prefixlen: number | `${number}` | string, family?: string | number): Address => {
    if (typeof prefixlen === 'string' && !DEC_RE.test(prefixlen)) throw new Error(`Invalid prefix: ${prefixlen}`)

    const len = +prefixlen | 0
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
    if (big < 0n || big > IPV6_MAX) throw new Error(`Invalid address: ${n}`)
    const family = big > IPV4_MAX ? 6 : (fam || 4)
    return this.create(big, family, n)
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
    if (!addr || (addr.length > IPV6_LEN_LIM)) throw new Error(`Invalid address: ${addr}`)
    if (addr === '::' ) return this.create(0n, 6, addr)
    if (addr === '0') return this.create(0n, 4, addr)

    return addr.includes(':')
      ? this.fromIPv6(addr)
      : this.fromIPv4(addr)
  }

  private static fromIPv6(addr: string): Address {
    const groups: number[] = []
    const al = addr.length
    let p = 0, gc = -1

    // only one '::' allowed
    const sep = addr.indexOf('::')
    if (sep !== -1 && addr.indexOf('::', sep + 1) !== -1)
      throw new Error(`Invalid address: ${addr}`)

    while (true) {
      const i = addr.indexOf(':', p)
      const last = i === -1
      const end = last ? al : i
      const v = addr.slice(p, end)

      if (v === '') {
        if (sep === -1 || (end !== sep && end !== sep + 1 + +last))
          throw new Error(`Invalid address: ${addr}`)
        gc = groups.length
      } else if (last && v.includes('.')) {
        // embedded IPv4
        if (
          groups.length > 6 ||
          gc === groups.length ||
          (gc === -1 && groups.length !== 6) ||
          groups[groups.length - 1] !== 0xffff ||
          groups.slice(0, -1).some(x => x !== 0)
        ) throw new Error(`Invalid address: ${addr}`)

        const long = Address.normalizeToLong(v, true)
        if (long === -1) throw new Error(`Invalid address: ${addr}`)
        return this.create((0xffffn << 32n) | BigInt(long), 6, addr)
      } else {
        if (v.length > 4 || !HEX_RE.test(v)) throw new Error(`Invalid address: ${addr}`)
        groups.push(parseInt(v, 16))
      }

      if (last) break
      p = i + 1
    }
    if (gc === -1 ? groups.length !== 8 : groups.length > 7) throw new Error(`Invalid address: ${addr}`)

    let big = 0n
    for (let i = 0; i < 8; i++) {
      const part = i < gc ? groups[i] : i < gc + (8 - groups.length) ? 0 : groups[i - (8 - groups.length)]
      big = (big << 16n) + BigInt(part)
    }
    return this.create(big, 6, addr)
  }

  private static fromIPv4(addr: string): Address {
    if (addr.includes('.')) return this.fromLong(this.normalizeToLong(addr, isIPv4Candidate(addr)))
    if (DEC_RE.test(addr)) return this.fromNumber(addr as `${bigint}`)
    throw new Error(`Invalid address: ${addr}`)
  }

  private static parseCidr = (cidr: string): [Address, Address] => {
    if (cidr.length > IPV6_LEN_LIM + 4) throw new Error(`Invalid CIDR: ${cidr}`)
    const chunks = cidr.split('/', 3)
    const [ip, prefix] = chunks
    if (chunks.length !== 2 || !prefix.length) throw new Error(`Invalid CIDR: ${cidr}`)
    if (ip.includes('.') && !isIPv4Candidate(ip)) throw new Error(`Invalid CIDR: ${cidr}`)

    const addr = this.fromString(ip)
    const m = this.fromPrefixLen(prefix, addr.family)
    return [addr, m]
  }

  static normalizeFamily(family: string | number): Family {
    const f = `${family}`.toLowerCase()
    if (f === '4' || f === 'ipv4') return 4
    if (f == '6' || f === 'ipv6') return 6
    throw new Error(`Invalid family: ${family}`)
  }

  static normalizeToLong(addr: string, strict = false): number {
    const groups: number[] = []
    let p = 0

    while (true) {
      if (groups.length === 4) return -1
      const i = addr.indexOf('.', p)
      const v = addr.slice(p, i === -1 ? addr.length : i)

      if (isDec(v))
        groups.push(+v)
      else {
        if (strict) return -1
        const radix = HEXX_RE.test(v) ? 16 : OCT_RE.test(v) ? 8 : -1
        if (radix === -1) return -1
        groups.push(parseInt(v, radix))
      }

      if (i === -1) {
        if (strict && (groups.length !== 4)) return -1
        break
      }
      p = i + 1
    }

    const [g0, g1 = 0, g2 = 0, g3 = 0] = groups
    switch (groups.length) {
      case 1: return g0
      case 2: return g0 <= 0xff && g1 <= 0xffffff ? ((g0 << 24) | g1) >>> 0 : -1
      case 3: return g0 <= 0xff && g1 <= 0xff && g2 <= 0xffff ? ((g0 << 24) | (g1 << 16) | g2) >>> 0 : -1
      case 4: return (g0 | g1 | g2 | g3) >>> 8 === 0 ? ((g0 << 24) | (g1 << 16) | (g2 << 8) | g3) >>> 0 : -1
      default: return -1
    }
  }

  static isSpecial(addr: Raw, range?: Special | Special[]): boolean {
    const ip = Address.from(addr)
    for (const matcher of SPECIAL_MATCHERS) {
      const res = matcher(ip)
      if (res) return res === range || !range || range.includes(res)
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

const isDec = (str: string): boolean => {
  if (str === '0') return true
  if (!str || str[0] === '0') return false
  for (let i = 0; i < str.length; i++) { const c = str.charCodeAt(i); if (c < 48 || c > 57) return false }
  return true
}

const isIPv4Candidate = (str: string): boolean => {
  let dots = 0
  for (let i = 0; i < str.length; i++) { if (str[i] === '.' && ++dots > 3) return false }
  return dots === 3
}

const ipv6fySubnet = (c: string) => {
  if (c.includes(':')) return [c]

  const [base, len] = c.split('/')
  const prefix = `::ffff:${base}`
  return [c, `${prefix}/${96 + Number(len)}`]
}

const SPECIAL_MATCHERS: ((addr: Address) => Special | undefined)[] = []
for (const [cat, cidrs] of Object.entries(SPECIALS)) {
  for (const cidr of cidrs) {
    for (const x of ipv6fySubnet(cidr)) {
      const subnet = Address.cidrSubnet(x)
      SPECIAL_MATCHERS.push((addr: Address) => addr.family === subnet.family && subnet.contains(addr) ? (cat as Special) : undefined)
    }
  }
}

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

export function toString(buf: BufferLike | number, offset = 0, length?: number): string {
  if (typeof buf === 'number') return Address.from(buf).toString()

  const sliced = buf.subarray(
    offset,
    length ? offset + length : undefined
  )

  return Address.from(sliced).toString()
}

export function toLong(addr: Raw): number {
  return Address.from(addr).toLong()
}

export function fromLong(n: number | bigint | `${bigint}`): string {
  return Address.from(n).toString()
}

export const isV4Format = (addr: string): boolean=> {
  return isIPv4Candidate(addr) && Address.normalizeToLong(addr, true) !== -1
}

export const isV6Format = (addr: string): boolean => {
  if (!`${addr}`.includes(':')) return false

  try {
    return Address.from(addr).family === 6
  } catch (e) {
    return false
  }
}

export const isIPv4 = isV4Format
export const isIPv6 = isV6Format
export const isIP = (addr: string): boolean => isV4Format(addr) || isV6Format(addr)

export function isLoopback(addr: Raw): boolean {
  return Address.isSpecial(addr, ['loopback', 'unspecified', 'linklocal'])
}

export function loopback(family: string | number = 4): string {
  const fam = Address.normalizeFamily(family)
  return fam === 4 ? IPV4_LB : IPV6_LB
}
