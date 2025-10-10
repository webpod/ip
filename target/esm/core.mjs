var __defProp = Object.defineProperty;
var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

// src/main/ts/polyfill.ts
var FakeBuffer = {
  alloc: (size, fill = 0) => {
    if (size < 0)
      throw new RangeError('The value of "size" is out of range.');
    const arr = new Uint8Array(size);
    if (fill !== 0)
      arr.fill(fill);
    const buf = arr;
    return Object.assign(buf, {
      slice(start, end) {
        const sliced = Uint8Array.prototype.slice.call(this, start, end);
        return Object.assign(sliced, {
          slice: buf.slice,
          toString: buf.toString
        });
      },
      toString(encoding) {
        if (encoding !== "hex")
          throw new Error("Only 'hex' encoding is supported in this polyfill");
        return Array.from(this).map((b) => b.toString(16).padStart(2, "0")).join("");
      }
    });
  }
};
var getGlobal = function() {
  if (typeof globalThis !== "undefined") return globalThis;
  if (typeof window !== "undefined") return window;
  if (typeof global !== "undefined") return global;
  return Function("return this")();
};
var Buffer2 = getGlobal().Buffer || FakeBuffer;

// src/main/ts/core.ts
var IPV4_LEN_LIM = 4 * 3 + 3;
var IPV6_LEN_LIM = 6 * 4 + 6 + IPV4_LEN_LIM;
var IPV4_LB = "127.0.0.1";
var IPV6_LB = "fe80::1";
var IPV6_MAX = (/* @__PURE__ */ BigInt("1") << /* @__PURE__ */ BigInt("128")) - /* @__PURE__ */ BigInt("1");
var IPV4_MAX = /* @__PURE__ */ BigInt("0xffffffff");
var IPV4_RE = /^(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)(\.(25[0-5]|2[0-4]\d|1\d\d|[1-9]?\d)){3}$/;
var OCT_RE = /^0[0-7]+$/;
var HEX_RE = /^[0-9a-fA-F]+$/;
var HEXX_RE = /^0x[0-9a-f]+$/;
var SPECIALS = {
  unspecified: [
    "0.0.0.0/8",
    "::/128"
  ],
  loopback: [
    "127.0.0.0/8",
    // IPv4 loopback
    "::1/128"
    // IPv6 loopback
  ],
  private: [
    "10.0.0.0/8",
    // IPv4 private
    "172.16.0.0/12",
    // IPv4 private
    "192.168.0.0/16",
    // IPv4 private
    "100.64.0.0/10",
    // IPv4 CGNAT
    "fc00::/7",
    // IPv6 ULA
    "198.18.0.0/15"
    // IPv4 benchmarking
  ],
  linklocal: [
    "169.254.0.0/16",
    // IPv4 link-local
    "fe80::/64"
    // IPv6 link-local
  ],
  multicast: [
    "224.0.0.0/4",
    // IPv4 multicast
    "ff00::/8"
    // IPv6 multicast
  ],
  documentation: [
    "192.0.0.0/24",
    // IPv4 IETF
    "192.0.2.0/24",
    // TEST-NET-1
    "192.88.99.0/24",
    // IPv4 relay anycast
    "198.51.100.0/24",
    // TEST-NET-2
    "203.0.113.0/24",
    // TEST-NET-3
    "2001:db8::/32"
    // IPv6 docs
  ],
  reserved: [
    "240.0.0.0/4",
    // IPv4 reserved
    "255.255.255.255/32",
    // IPv4 broadcast
    "::ffff:0:0/96",
    // IPv4-mapped IPv6
    "64:ff9b::/96",
    // IPv6 NAT64
    "64:ff9b:1::/48",
    // IPv6 NAT64 local
    "100::/64",
    // IPv6 discard
    "2001::/32",
    // ORCHID
    "2001:20::/28",
    // ORCHIDv2
    "2002::/16",
    // 6to4
    "3fff::/20",
    // IPv6 reserved
    "5f00::/16"
    // IPv6 reserved
  ]
};
var PRIVATES = ["private", "linklocal", "loopback", "unspecified"];
var _Address = class _Address {
  constructor() {
    __publicField(this, "raw");
    __publicField(this, "family");
    __publicField(this, "big");
  }
  toBuffer(buff, offset = 0) {
    offset |= 0;
    const len = this.family === 4 ? 4 : 16;
    const buf = buff != null ? buff : Buffer2.alloc(len);
    if (buf.length < offset + len) throw Error(`Buffer too small for IPv${this.family}`);
    for (let i = 0; i < len; i++) {
      buf[offset + i] = Number(this.big >> BigInt((len - 1 - i) * 8) & /* @__PURE__ */ BigInt("0xff"));
    }
    return buf;
  }
  toArray() {
    return [...this.toBuffer()];
  }
  toString(family = this.family, mapped) {
    const fam = _Address.normalizeFamily(family);
    const _mapped = mapped != null ? mapped : fam === 6 && this.family !== fam;
    const { big } = this;
    if (fam === 4) {
      if (big > IPV4_MAX) throw new Error(`Address is wider than IPv4: ${this}`);
      return Array.from(
        { length: 4 },
        (_, i) => Number(big >> BigInt((3 - i) * 8) & /* @__PURE__ */ BigInt("0xff"))
      ).join(".");
    }
    if (_mapped && big <= IPV4_MAX) {
      const ipv4 = Number(big & IPV4_MAX);
      return `::ffff:${[
        ipv4 >> 24 & 255,
        ipv4 >> 16 & 255,
        ipv4 >> 8 & 255,
        ipv4 & 255
      ].join(".")}`;
    }
    return Array.from(
      { length: 8 },
      (_, i) => Number(big >> BigInt((7 - i) * 16) & /* @__PURE__ */ BigInt("0xffff")).toString(16)
    ).join(":").replace(/(^|:)0(:0)*:0(:|$)/, "$1::$3").replace(/:{3,4}/, "::");
  }
  toLong() {
    if (this.big > IPV4_MAX) throw new Error(`Address is wider than IPv4: ${this}`);
    return Number(this.big);
  }
  get range() {
    for (const matcher of SPECIAL_MATCHERS) {
      const res = matcher(this);
      if (res) return res;
    }
  }
  static create(big, family, raw) {
    const o = Object.create(this.prototype);
    o.big = big;
    o.family = family;
    o.raw = raw;
    return o;
  }
  static from(raw) {
    if (raw instanceof _Address) return this.create(raw.big, raw.family, raw.raw);
    if (typeof raw === "string") return this.fromString(raw.toLowerCase());
    if (typeof raw === "number" || typeof raw === "bigint") return this.fromNumber(raw);
    if (raw && typeof raw === "object" && "length" in raw) return this.fromBuffer(raw);
    throw new Error(`Invalid address: ${raw}`);
  }
  static mask(addr, mask2) {
    const a = _Address.from(addr);
    const m = _Address.from(mask2);
    if (a.family === m.family) {
      const bits = a.family === 4 ? 32 : 128;
      const maskBig = m.big & (/* @__PURE__ */ BigInt("1") << BigInt(bits)) - /* @__PURE__ */ BigInt("1");
      const masked = a.big & maskBig;
      return _Address.fromNumber(masked, a.family).toString();
    }
    if (a.family === 6 && m.family === 4) {
      const low32 = a.big & IPV4_MAX;
      const maskedLow = low32 & m.big;
      const masked = a.big & ~IPV4_MAX | maskedLow;
      return _Address.fromNumber(masked, a.family).toString();
    }
    if (a.family === 4 && m.family === 6) {
      const lowMask = m.big & IPV4_MAX;
      const low = a.big & lowMask;
      const masked = /* @__PURE__ */ BigInt("0xffff") << /* @__PURE__ */ BigInt("32") | low;
      return _Address.fromNumber(masked, a.family).toString();
    }
    throw new Error("Unsupported family combination");
  }
  static subnet(addr, smask) {
    const a = _Address.from(addr);
    const m = _Address.from(smask);
    const bits = m.family === 4 ? 32 : 128;
    const nw = a.big & m.big;
    const maskLen = m.big.toString(2).padStart(bits, "0").replace(/0+$/, "").length;
    const len = /* @__PURE__ */ BigInt("1") << BigInt(bits - maskLen);
    const hosts = len <= /* @__PURE__ */ BigInt("2") ? len : len - /* @__PURE__ */ BigInt("2");
    const first = len <= /* @__PURE__ */ BigInt("2") ? nw : nw + /* @__PURE__ */ BigInt("1");
    const last = len <= /* @__PURE__ */ BigInt("2") ? nw + (len - /* @__PURE__ */ BigInt("1")) : nw + (len - /* @__PURE__ */ BigInt("2"));
    const bc = nw + (len - /* @__PURE__ */ BigInt("1"));
    return {
      networkAddress: _Address.fromNumber(nw, m.family).toString(),
      firstAddress: _Address.fromNumber(first, m.family).toString(),
      lastAddress: _Address.fromNumber(last, m.family).toString(),
      broadcastAddress: _Address.fromNumber(bc, m.family).toString(),
      // set to last for IPv6 or undefined? RFC 4291
      subnetMask: m.toString(),
      subnetMaskLength: maskLen,
      numHosts: hosts,
      length: len,
      family: m.family,
      contains(ip) {
        const { big } = _Address.from(ip);
        return big >= nw && big <= bc;
      }
    };
  }
  static cidr(cidrString) {
    return this.mask(...this.parseCidr(cidrString));
  }
  static cidrSubnet(cidrString) {
    return this.subnet(...this.parseCidr(cidrString));
  }
  static not(addr) {
    const { big, family } = _Address.from(addr);
    const bits = family === 4 ? 32 : 128;
    const mask2 = (/* @__PURE__ */ BigInt("1") << BigInt(bits)) - /* @__PURE__ */ BigInt("1");
    return _Address.fromNumber(~big & mask2, family).toString();
  }
  static or(addrA, addrB) {
    const a = _Address.from(addrA);
    const b = _Address.from(addrB);
    if (a.family === b.family) {
      const bits = a.family === 4 ? 32 : 128;
      const mask2 = (/* @__PURE__ */ BigInt("1") << BigInt(bits)) - /* @__PURE__ */ BigInt("1");
      return _Address.fromNumber((a.big | b.big) & mask2, a.family).toString();
    }
    const ipv6 = a.family === 6 ? a : b;
    const ipv4 = a.family === 4 ? a : b;
    const resultBig = ipv6.big | ipv4.big;
    return _Address.fromNumber(resultBig, 6).toString();
  }
  static isEqual(addrA, addrB) {
    const a = _Address.from(addrA);
    const b = _Address.from(addrB);
    if (a.family === b.family) return a.big === b.big;
    const v4 = a.family === 4 ? a : b;
    const v6 = a.family === 6 ? a : b;
    if (v6.big === v4.big) return true;
    return v6.big === (/* @__PURE__ */ BigInt("0xffff") << /* @__PURE__ */ BigInt("32") | v4.big);
  }
  static fromNumber(n, fam) {
    const big = BigInt(n);
    if (big < /* @__PURE__ */ BigInt("0") || big > IPV6_MAX) throw new Error(`Invalid address: ${n}`);
    const family = big > IPV4_MAX ? 6 : fam || 4;
    return this.create(big, family, n);
  }
  static fromLong(n) {
    const addr = this.fromNumber(n);
    if (addr.family !== 4) throw new Error(`Invalid address (long): ${n}`);
    return addr;
  }
  static fromBuffer(buf) {
    if (buf.length !== 4 && buf.length !== 16)
      throw new Error(`Invalid buffer length ${buf.length}, must be 4 (IPv4) or 16 (IPv6)`);
    let big = /* @__PURE__ */ BigInt("0");
    for (const byte of buf) {
      if (byte < 0 || byte > 255 || !Number.isInteger(byte))
        throw new Error(`Invalid byte value ${byte} in buffer`);
      big = big << /* @__PURE__ */ BigInt("8") | BigInt(byte);
    }
    const family = buf.length === 4 ? 4 : 6;
    return _Address.fromNumber(big, family);
  }
  static fromString(addr) {
    if (!addr) throw new Error(`Invalid address: empty`);
    if (addr === "::") return this.create(/* @__PURE__ */ BigInt("0"), 6, addr);
    if (addr === "0") return this.create(/* @__PURE__ */ BigInt("0"), 4, addr);
    return addr.includes(":") ? this.fromIPv6(addr, this.strict) : this.fromIPv4(addr);
  }
  static fromIPv6(addr, strict) {
    const al = addr.length;
    const sep = addr.indexOf("::");
    if (al > IPV6_LEN_LIM || sep !== -1 && addr.indexOf("::", sep + 1) !== -1)
      throw new Error(`Invalid address: ${addr}`);
    const groups = [];
    let p = 0, gc = -1;
    while (true) {
      const i = addr.indexOf(":", p);
      const last = i === -1;
      const end = last ? al : i;
      const v = addr.slice(p, end);
      if (v === "") {
        if (sep === -1 || end !== sep && end !== sep + 1 + +last)
          throw new Error(`Invalid address: ${addr}`);
        gc = groups.length;
      } else if (last && v.includes(".")) {
        if (gc === -1 ? groups.length !== 6 : groups.length > 5)
          throw new Error(`Invalid address: ${addr}`);
        if (strict && (gc === groups.length || groups[groups.length - 1] !== 65535 || groups.slice(0, -1).some((x) => x !== 0)))
          throw new Error(`Invalid address: ${addr}`);
        const long = _Address.normalizeToLong(v, true);
        if (long === -1) throw new Error(`Invalid address: ${addr}`);
        return this.create(/* @__PURE__ */ BigInt("0xffff") << /* @__PURE__ */ BigInt("32") | BigInt(long), 6, addr);
      } else {
        if (v.length > 4 || !HEX_RE.test(v)) throw new Error(`Invalid address: ${addr}`);
        groups.push(parseInt(v, 16));
      }
      if (last) break;
      p = i + 1;
    }
    const offset = 8 - groups.length;
    if (gc === -1 ? offset !== 0 : offset < 1) throw new Error(`Invalid address: ${addr}`);
    let big = /* @__PURE__ */ BigInt("0");
    for (let i = 0; i < 8; i++) {
      const idx = i < gc ? i : i < gc + offset ? -1 : i - offset;
      const part = idx === -1 ? 0 : groups[idx];
      big = (big << /* @__PURE__ */ BigInt("16")) + BigInt(part);
    }
    return this.create(big, 6, addr);
  }
  static fromIPv4(addr) {
    if (addr.includes(".")) return this.fromLong(this.normalizeToLong(addr, isIPv4Candidate(addr)));
    if (isDec(addr)) return this.fromNumber(addr);
    throw new Error(`Invalid address: ${addr}`);
  }
  static normalizeFamily(family) {
    const f = `${family}`.toLowerCase();
    if (f === "4" || f === "ipv4") return 4;
    if (f == "6" || f === "ipv6") return 6;
    throw new Error(`Invalid family: ${family}`);
  }
  static normalizeToLong(addr, strict = false) {
    if (addr.length > IPV4_LEN_LIM + 4) throw new Error(`Invalid address: ${addr}`);
    const groups = [];
    let p = 0;
    while (true) {
      if (groups.length === 4) return -1;
      const i = addr.indexOf(".", p);
      const v = addr.slice(p, i === -1 ? addr.length : i);
      if (isDec(v))
        groups.push(+v);
      else {
        if (strict) return -1;
        const radix = HEXX_RE.test(v) ? 16 : OCT_RE.test(v) ? 8 : -1;
        if (radix === -1) return -1;
        groups.push(parseInt(v, radix));
      }
      if (i === -1) {
        if (strict && groups.length !== 4) return -1;
        break;
      }
      p = i + 1;
    }
    const [g0, g1 = 0, g2 = 0, g3 = 0] = groups;
    switch (groups.length) {
      case 1:
        return g0;
      case 2:
        return g0 <= 255 && g1 <= 16777215 ? (g0 << 24 | g1) >>> 0 : -1;
      case 3:
        return g0 <= 255 && g1 <= 255 && g2 <= 65535 ? (g0 << 24 | g1 << 16 | g2) >>> 0 : -1;
      case 4:
        return (g0 | g1 | g2 | g3) >>> 8 === 0 ? (g0 << 24 | g1 << 16 | g2 << 8 | g3) >>> 0 : -1;
      default:
        return -1;
    }
  }
  static isSpecial(addr, range) {
    const ip = _Address.from(addr);
    for (const matcher of SPECIAL_MATCHERS) {
      const res = matcher(ip);
      if (res) return res === range || !range || range.includes(res);
    }
    return false;
  }
  static isPrivate(addr) {
    return this.isSpecial(addr, PRIVATES);
  }
  static isPublic(addr) {
    return !this.isPrivate(addr);
  }
};
__publicField(_Address, "strict", true);
__publicField(_Address, "fromPrefixLen", (prefixlen, family) => {
  if (typeof prefixlen === "string" && !isDec(prefixlen)) throw new Error(`Invalid prefix: ${prefixlen}`);
  const len = +prefixlen | 0;
  const fam = _Address.normalizeFamily(family || (len > 32 ? 6 : 4));
  const bits = fam === 6 ? 128 : 32;
  if (len < 0 || len > bits)
    throw new RangeError(`Invalid prefix length for IPv${fam}: ${len}`);
  const big = len === 0 ? /* @__PURE__ */ BigInt("0") : ~/* @__PURE__ */ BigInt("0") << BigInt(bits - len) & (/* @__PURE__ */ BigInt("1") << BigInt(bits)) - /* @__PURE__ */ BigInt("1");
  return _Address.fromNumber(big);
});
__publicField(_Address, "parseCidr", (cidr2) => {
  if (cidr2.length > IPV6_LEN_LIM + 4) throw new Error(`Invalid CIDR: ${cidr2}`);
  const chunks = cidr2.split("/", 3);
  const [ip, prefix] = chunks;
  if (chunks.length !== 2 || !prefix.length) throw new Error(`Invalid CIDR: ${cidr2}`);
  if (ip.includes(".") && !isIPv4Candidate(ip)) throw new Error(`Invalid CIDR: ${cidr2}`);
  const addr = _Address.fromString(ip);
  const m = _Address.fromPrefixLen(prefix, addr.family);
  return [addr, m];
});
var Address = _Address;
var isDec = (str) => {
  if (str === "0") return true;
  if (!str || str[0] === "0") return false;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  return true;
};
var isIPv4Candidate = (str) => {
  let dots = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "." && ++dots > 3) return false;
  }
  return dots === 3;
};
var ipv6fySubnet = (c) => {
  if (c.includes(":")) return [c];
  const [base, len] = c.split("/");
  const prefix = `::ffff:${base}`;
  return [c, `${prefix}/${96 + Number(len)}`];
};
var SPECIAL_MATCHERS = [];
for (const [cat, cidrs] of Object.entries(SPECIALS)) {
  for (const cidr2 of cidrs) {
    for (const x of ipv6fySubnet(cidr2)) {
      const subnet2 = Address.cidrSubnet(x);
      SPECIAL_MATCHERS.push((addr) => addr.family === subnet2.family && subnet2.contains(addr) ? cat : void 0);
    }
  }
}
var isPublic = Address.isPublic.bind(Address);
var isPrivate = Address.isPrivate.bind(Address);
var isEqual = Address.isEqual.bind(Address);
var mask = Address.mask.bind(Address);
var not = Address.not.bind(Address);
var or = Address.or.bind(Address);
var cidr = Address.cidr.bind(Address);
var normalizeToLong = Address.normalizeToLong.bind(Address);
function fromPrefixLen(prefixlen, family) {
  return Address.fromPrefixLen(prefixlen, family).toString();
}
function subnet(addr, smask) {
  const sub = Address.subnet(addr, smask);
  return sub.family === 6 ? sub : { ...sub, numHosts: Number(sub.numHosts), length: Number(sub.length) };
}
function cidrSubnet(cidrString) {
  const sub = Address.cidrSubnet(cidrString);
  return sub.family === 6 ? sub : { ...sub, numHosts: Number(sub.numHosts), length: Number(sub.length) };
}
function toBuffer(addr, buff, offset = 0) {
  return Address.from(addr).toBuffer(buff, offset);
}
function toString(buf, offset = 0, length) {
  if (typeof buf === "number") return Address.from(buf).toString();
  const sliced = buf.subarray(
    offset,
    length ? offset + length : void 0
  );
  return Address.from(sliced).toString();
}
function toLong(addr) {
  return Address.from(addr).toLong();
}
function fromLong(n) {
  return Address.from(n).toString();
}
var isV4Format = (addr) => {
  return addr.length <= IPV4_LEN_LIM && IPV4_RE.test(addr);
};
var isV6Format = (addr) => {
  if (!`${addr}`.includes(":")) return false;
  try {
    return Address.from(addr).family === 6;
  } catch {
    return false;
  }
};
var isIPv4 = isV4Format;
var isIPv6 = isV6Format;
var isIP = (addr) => isV4Format(addr) ? 4 : isV6Format(addr) ? 6 : 0;
function isLoopback(addr) {
  return Address.isSpecial(addr, ["loopback", "unspecified", "linklocal"]);
}
function loopback(family = 4) {
  const fam = Address.normalizeFamily(family);
  return fam === 4 ? IPV4_LB : IPV6_LB;
}
export {
  Address,
  cidr,
  cidrSubnet,
  fromLong,
  fromPrefixLen,
  isEqual,
  isIP,
  isIPv4,
  isIPv6,
  isLoopback,
  isPrivate,
  isPublic,
  isV4Format,
  isV6Format,
  loopback,
  mask,
  normalizeToLong,
  not,
  or,
  subnet,
  toBuffer,
  toLong,
  toString
};
