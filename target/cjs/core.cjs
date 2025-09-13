"use strict";
const {
  __spreadValues,
  __spreadProps,
  __export,
  __toCommonJS,
  __publicField
} = require('./cjslib.cjs');


// src/main/ts/core.ts
var core_exports = {};
__export(core_exports, {
  Address: () => Address,
  cidr: () => cidr,
  cidrSubnet: () => cidrSubnet,
  fromLong: () => fromLong,
  fromPrefixLen: () => fromPrefixLen,
  isEqual: () => isEqual,
  isLoopback: () => isLoopback,
  isPrivate: () => isPrivate,
  isPublic: () => isPublic,
  isV4Format: () => isV4Format,
  isV6Format: () => isV6Format,
  loopback: () => loopback,
  mask: () => mask,
  normalizeToLong: () => normalizeToLong,
  not: () => not,
  or: () => or,
  subnet: () => subnet,
  toBuffer: () => toBuffer,
  toLong: () => toLong,
  toString: () => toString
});
module.exports = __toCommonJS(core_exports);

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
var fromEntries = Object.fromEntries || ((entries) => entries.reduce((obj, [key, val]) => {
  obj[key] = val;
  return obj;
}, {}));

// src/main/ts/core.ts
var IPV4_LEN_LIM = 4 * 3 + 3;
var IPV6_LEN_LIM = 6 * 4 + 6 + IPV4_LEN_LIM;
var IPV4_LB = "127.0.0.1";
var IPV6_LB = "fe80::1";
var IPV6_MAX = (/* @__PURE__ */ BigInt("1") << /* @__PURE__ */ BigInt("128")) - /* @__PURE__ */ BigInt("1");
var IPV4_MAX = /* @__PURE__ */ BigInt("0xffffffff");
var HEX_RE = /^[0-9a-fA-F]+$/;
var HEXX_RE = /^0x[0-9a-f]+$/;
var DEC_RE = /^(?:0|[1-9][0-9]*)$/;
var OCT_RE = /^0[0-7]+$/;
var isDec = (str) => {
  if (str === "0") return true;
  if (!str || str[0] === "0") return false;
  for (let i = 0; i < str.length; i++) {
    const c = str.charCodeAt(i);
    if (c < 48 || c > 57) return false;
  }
  return true;
};
function isIPv4Candidate(str) {
  let dots = 0;
  for (let i = 0; i < str.length; i++) {
    if (str[i] === "." && ++dots > 3) return false;
  }
  return dots === 3;
}
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
    if (!addr || addr.length > IPV6_LEN_LIM) throw new Error(`Invalid address: ${addr}`);
    if (addr === "::") return this.create(/* @__PURE__ */ BigInt("0"), 6, addr);
    if (addr === "0") return this.create(/* @__PURE__ */ BigInt("0"), 4, addr);
    const single = !addr.includes(":");
    if (single) {
      if (addr.includes(".")) return this.fromLong(this.normalizeToLong(addr, isIPv4Candidate(addr)));
      if (DEC_RE.test(addr)) return this.fromNumber(addr);
      throw new Error(`Invalid address: ${addr}`);
    }
    const sep = addr.indexOf("::");
    if (sep !== -1 && addr.indexOf("::", sep + 1) !== -1)
      throw new Error(`Invalid address: ${addr}`);
    const h = sep === -1 ? addr : addr.slice(0, sep);
    const t = sep === -1 ? void 0 : addr.slice(sep + 2);
    const heads = h ? h.split(":", 9) : [];
    const tails = t ? t.split(":", 9) : [];
    const diff = 8 - heads.length - tails.length;
    if (diff < 0 || diff === 0 && t) throw new Error(`Invalid address: ${addr}`);
    const groups = t === void 0 ? heads : [
      ...heads,
      ...Array(diff).fill("0"),
      ...tails
    ];
    const last = groups[groups.length - 1];
    if (last.includes(".")) {
      if (!diff || groups[groups.length - 2] !== "ffff" || groups.slice(0, -2).some((v) => +v !== 0))
        throw new Error(`Invalid address: ${addr}`);
      const [g6, g7] = this.ipv4ToGroups(last);
      groups[5] = "ffff";
      groups[6] = g6;
      groups[7] = g7;
    }
    if (groups.length !== 8) throw new Error(`Invalid address: ${addr}`);
    let big = /* @__PURE__ */ BigInt("0");
    for (const part of groups) {
      if (part.length > 4 || !HEX_RE.test(part)) throw new Error(`Invalid address: ${addr}`);
      big = (big << /* @__PURE__ */ BigInt("16")) + BigInt(parseInt(part, 16));
    }
    return this.create(big, 6, addr);
  }
  static ipv4ToGroups(addr) {
    if (addr.length > IPV4_LEN_LIM) throw new Error(`Invalid address: ${addr}`);
    const groups = addr.split(".", 5);
    if (groups.length !== 4) throw new Error(`Invalid address: ${addr}`);
    const nums = groups.map((p) => {
      const n = +p;
      if (n < 0 || n > 255 || !DEC_RE.test(p)) throw new Error(`Invalid address: ${addr}`);
      return n;
    });
    return [
      (nums[0] << 8 | nums[1]).toString(16),
      (nums[2] << 8 | nums[3]).toString(16)
    ];
  }
  static normalizeFamily(family) {
    const f = `${family}`.toLowerCase();
    if (f === "4" || f === "ipv4") return 4;
    if (f == "6" || f === "ipv6") return 6;
    throw new Error(`Invalid family: ${family}`);
  }
  static normalizeToLong(addr, forceDec = false) {
    const groups = [];
    let l = 0;
    let p = 0;
    let i = -1;
    while ((i = addr.indexOf(".", p)) !== -1 || !l || p) {
      if (l === 4) return -1;
      const v = addr.slice(p, i === -1 ? addr.length : i);
      if (isDec(v)) groups.push(+v);
      else {
        if (forceDec) return -1;
        const radix = HEXX_RE.test(v) ? 16 : OCT_RE.test(v) ? 8 : -1;
        if (radix === -1) return -1;
        groups.push(parseInt(v, radix));
      }
      p = i + 1;
      l = groups.length;
      if (i === -1) break;
    }
    const [g0, g1, g2, g3] = groups;
    return l === 1 ? g0 : l === 2 && g0 <= 255 && g1 <= 16777215 ? (g0 << 24 | g1 & 16777215) >>> 0 : l === 3 && g0 <= 255 && g1 <= 255 && g2 <= 65535 ? (g0 << 24 | g1 << 16 | g2 & 65535) >>> 0 : (g0 | g1 | g2 | g3) >>> 8 === 0 ? (g0 << 24 | g1 << 16 | g2 << 8 | g3) >>> 0 : -1;
  }
  static isSpecial(addr, range) {
    const ip = _Address.from(addr);
    const subnets = [].concat(...range ? (Array.isArray(range) ? range : [range]).map((r) => SPECIAL_SUBNETS[r] || []) : Object.values(SPECIAL_SUBNETS));
    for (const subnet2 of subnets) {
      if (subnet2.family === ip.family && subnet2.contains(ip)) return true;
    }
    return false;
  }
  static isPrivate(addr) {
    return this.isSpecial(addr, ["private", "linklocal", "loopback", "unspecified"]);
  }
  static isPublic(addr) {
    return !this.isPrivate(addr);
  }
};
__publicField(_Address, "fromPrefixLen", (prefixlen, family) => {
  if (typeof prefixlen === "string" && !DEC_RE.test(prefixlen)) throw new Error(`Invalid prefix: ${prefixlen}`);
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
var ipv6fySubnet = (c) => {
  if (c.includes(":")) return [c];
  const [base, len] = c.split("/");
  const prefix = `::ffff:${base}`;
  return [c, `${prefix}/${96 + Number(len)}`];
};
var SPECIAL_SUBNETS = fromEntries(
  Object.entries(SPECIALS).map(([cat, cidrs]) => [
    cat,
    [].concat(...cidrs.map((c) => ipv6fySubnet(c).map((x) => Address.cidrSubnet(x))))
  ])
);
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
  return sub.family === 6 ? sub : __spreadProps(__spreadValues({}, sub), { numHosts: Number(sub.numHosts), length: Number(sub.length) });
}
function cidrSubnet(cidrString) {
  const sub = Address.cidrSubnet(cidrString);
  return sub.family === 6 ? sub : __spreadProps(__spreadValues({}, sub), { numHosts: Number(sub.numHosts), length: Number(sub.length) });
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
  return isIPv4Candidate(addr) && Address.normalizeToLong(addr, true) !== -1;
};
var isV6Format = (addr) => {
  if (!`${addr}`.includes(":")) return false;
  try {
    return Address.from(addr).family === 6;
  } catch (e) {
    return false;
  }
};
function isLoopback(addr) {
  return Address.isSpecial(addr, ["loopback", "unspecified", "linklocal"]);
}
function loopback(family = 4) {
  const fam = Address.normalizeFamily(family);
  return fam === 4 ? IPV4_LB : IPV6_LB;
}
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Address,
  cidr,
  cidrSubnet,
  fromLong,
  fromPrefixLen,
  isEqual,
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
});