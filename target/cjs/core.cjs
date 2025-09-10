"use strict";
const {
  __pow,
  __export,
  __toCommonJS,
  __publicField
} = require('./cjslib.cjs');


// src/main/ts/core.ts
var core_exports = {};
__export(core_exports, {
  Address: () => Address,
  IPV4: () => IPV4,
  IPV6: () => IPV6,
  V4_RE: () => V4_RE,
  V4_S_RE: () => V4_S_RE,
  V6_RE: () => V6_RE,
  V6_S_RE: () => V6_S_RE,
  cidr: () => cidr,
  cidrSubnet: () => cidrSubnet,
  fromLong: () => fromLong,
  fromPrefixLen: () => fromPrefixLen,
  isEqual: () => isEqual,
  isLoopback: () => isLoopback,
  isPrivate: () => isPrivate,
  isPublic: () => isPublic,
  isSpecial: () => isSpecial,
  isV4: () => isV4,
  isV4Format: () => isV4Format,
  isV6: () => isV6,
  isV6Format: () => isV6Format,
  loopback: () => loopback,
  mask: () => mask,
  normalizeAddress: () => normalizeAddress,
  normalizeFamily: () => normalizeFamily,
  normalizeToLong: () => normalizeToLong,
  not: () => not,
  or: () => or,
  setMode: () => setMode,
  subnet: () => subnet,
  toBuffer: () => toBuffer,
  toLong: () => toLong,
  toString: () => toString
});
module.exports = __toCommonJS(core_exports);

// src/main/ts/buffer.ts
var FakeBuffer = {
  alloc: (size, fill = 0) => {
    if (size < 0)
      throw new RangeError('The value of "size" is out of range.');
    const arr = new Uint8Array(size);
    if (fill !== 0)
      arr.fill(fill);
    const buf = arr;
    return Object.assign(buf, {
      readUInt16BE(offset = 0) {
        if (offset < 0 || offset + 2 > this.length)
          throw new RangeError(`RangeError: The value of "offset" is out of range. It must be >= 0 and <= 2. Received ${offset}`);
        return this[offset] << 8 | this[offset + 1];
      },
      slice(start, end) {
        const sliced = Uint8Array.prototype.slice.call(this, start, end);
        return Object.assign(sliced, {
          readUInt16BE: buf.readUInt16BE,
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

// src/main/ts/legacy.ts
var IPV4 = "IPv4";
var IPV6 = "IPv6";
var V4_RE = /^(\d{1,3}(\.|$)){4}$/;
var V6_RE = /^(?=.+)(::)?(((\d{1,3}\.){3}\d{1,3})?|([0-9a-f]{0,4}:{0,2})){1,8}(::)?$/i;
var V4_S_RE = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
var V6_S_RE = /(([\dA-Fa-f]{1,4}:){7}[\dA-Fa-f]{1,4}|([\dA-Fa-f]{1,4}:){1,7}:|([\dA-Fa-f]{1,4}:){1,6}:[\dA-Fa-f]{1,4}|([\dA-Fa-f]{1,4}:){1,5}(:[\dA-Fa-f]{1,4}){1,2}|([\dA-Fa-f]{1,4}:){1,4}(:[\dA-Fa-f]{1,4}){1,3}|([\dA-Fa-f]{1,4}:){1,3}(:[\dA-Fa-f]{1,4}){1,4}|([\dA-Fa-f]{1,4}:){1,2}(:[\dA-Fa-f]{1,4}){1,5}|[\dA-Fa-f]{1,4}:((:[\dA-Fa-f]{1,4}){1,6})|:((:[\dA-Fa-f]{1,4}){1,7}|:)|fe80:(:[\dA-Fa-f]{0,4}){0,4}%[\dA-Za-z]+|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}\d){0,1}\d)\.){3}(25[0-5]|(2[0-4]|1{0,1}\d){0,1}\d)|([\dA-Fa-f]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}\d){0,1}\d)\.){3}(25[0-5]|(2[0-4]|1{0,1}\d){0,1}\d))$/;
var isV4Format = (ip) => defs.V4_RE.test(ip);
var isV6Format = (ip) => defs.V6_RE.test(ip);
var isV4 = (ip) => V4_S_RE.test(ip);
var isV6 = (ip) => V6_S_RE.test(ip);
var defs = {
  V4_RE,
  V6_RE
};
var setMode = (mode) => {
  if (mode === "legacy") {
    Object.assign(defs, { V4_RE, V6_RE });
    return;
  }
  if (mode === "strict") {
    Object.assign(defs, { V4_RE: V4_S_RE, V6_RE: V6_S_RE });
    return;
  }
  throw new Error('mode must be either "legacy" or "strict"');
};
function normalizeFamily(family) {
  const f = `${family}`.toLowerCase().trim();
  return f === "6" || f === IPV6.toLowerCase() ? IPV6 : IPV4;
}
var normalizeAddress = (addr) => {
  const a = (addr + "").toLowerCase();
  return a.includes(":") ? toString(toBuffer(a)) : fromLong(normalizeToLong(a));
};
var normalizeToLong = (addr) => {
  const parts = addr.split(".").map((part) => {
    if (/^0x[0-9a-f]+$/i.test(part))
      return parseInt(part, 16);
    if (/^0[0-7]+$/.test(part))
      return parseInt(part, 8);
    if (/^(0|[1-9]\d*)$/.test(part))
      return parseInt(part, 10);
    return NaN;
  });
  if (parts.some(isNaN)) return -1;
  const [p0, p1, p2, p3] = parts;
  let val;
  switch (parts.length) {
    case 1:
      val = p0;
      break;
    case 2:
      if (p0 > 255 || p1 > 16777215) return -1;
      val = p0 << 24 | p1 & 16777215;
      break;
    case 3:
      if (p0 > 255 || p1 > 255 || p2 > 65535) return -1;
      val = p0 << 24 | p1 << 16 | p2 & 65535;
      break;
    case 4:
      if (parts.some((p) => p > 255)) return -1;
      val = p0 << 24 | p1 << 16 | p2 << 8 | p3;
      break;
    default:
      return -1;
  }
  return val >>> 0;
};
var V4_LB = "127.0.0.1";
var V6_LB = "fe80::1";
var isLoopback = (addr) => {
  const a = normalizeAddress(addr);
  const s = a.slice(0, 5);
  return s === "::1" || s === "::" || s === "0177." || s === "0x7f." || a === V6_LB || a === V4_LB || a.startsWith("::ffff:7") || /^(::f{4}:)?127\.(\d{1,3}(\.|$)){3}$/.test(a);
};
var loopback = (family) => {
  family = normalizeFamily(family);
  if (family === IPV4) return V4_LB;
  if (family === IPV6) return V6_LB;
  throw new Error("family must be ipv4 or ipv6");
};
var fromLong = (n) => {
  if (n < 0) throw new Error("invalid ipv4 long");
  return [
    n >>> 24 & 255,
    n >>> 16 & 255,
    n >>> 8 & 255,
    n & 255
  ].join(".");
};
var toLong = (ip) => typeof ip === "string" ? ip.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0 : ip.length === 4 ? (ip[0] << 24) + (ip[1] << 16) + (ip[2] << 8) + ip[3] >>> 0 : -1;
var toString = (buff, offset = 0, length) => {
  if (typeof buff === "number") buff = toBuffer(buff);
  const o = ~~offset;
  const l = length || buff.length - offset;
  if (l === 4)
    return [...buff.subarray(o, o + l)].join(".");
  if (l === 16)
    return Array.from({ length: l / 2 }, (_, i) => buff.readUInt16BE(o + i * 2).toString(16)).join(":").replace(/(^|:)0(:0)*:0(:|$)/, "$1::$3").replace(/:{3,4}/, "::");
  throw new Error("Invalid buffer length for IP address");
};
var toBuffer = (ip, buff, offset = 0) => {
  if (typeof ip === "number") ip = fromLong(ip);
  offset = ~~offset;
  if (isV4Format(ip)) {
    const res = buff || Buffer2.alloc(offset + 4);
    for (const byte of ip.split("."))
      res[offset++] = +byte & 255;
    return res;
  }
  if (isV6Format(ip)) {
    let sections = ip.split(":", 8);
    for (let i = 0; i < sections.length; i++) {
      if (isV4Format(sections[i])) {
        const v4 = toBuffer(sections[i]);
        sections[i] = v4.slice(0, 2).toString("hex");
        if (++i < 8) sections.splice(i, 0, v4.slice(2, 4).toString("hex"));
      }
    }
    if (sections.includes("")) {
      const emptyIndex = sections.indexOf("");
      const pad = 8 - sections.length + 1;
      sections.splice(emptyIndex, 1, ...Array(pad).fill("0"));
    } else {
      while (sections.length < 8) sections.push("0");
    }
    const res = buff || Buffer2.alloc(offset + 16);
    for (const sec of sections) {
      const word = parseInt(sec, 16) || 0;
      res[offset++] = word >> 8;
      res[offset++] = word & 255;
    }
    return res;
  }
  throw Error(`invalid IP address: ${ip}`);
};
var fromPrefixLen = (prefixlen, family) => {
  family = prefixlen > 32 ? IPV6 : normalizeFamily(family);
  const buff = Buffer2.alloc(family === IPV6 ? 16 : 4);
  for (let i = 0; i < buff.length; i++) {
    const bits = Math.min(prefixlen, 8);
    prefixlen -= bits;
    buff[i] = ~(255 >> bits) & 255;
  }
  return toString(buff);
};
var mask = (addr, maskStr) => {
  const a = toBuffer(addr);
  const m = toBuffer(maskStr);
  const out = Buffer2.alloc(Math.max(a.length, m.length));
  if (a.length === m.length) {
    for (let i = 0; i < a.length; i++) out[i] = a[i] & m[i];
  } else if (m.length === 4) {
    for (let i = 0; i < 4; i++) out[i] = a[a.length - 4 + i] & m[i];
  } else {
    out.fill(0, 0, 10);
    out[10] = out[11] = 255;
    for (let i = 0; i < a.length; i++) out[i + 12] = a[i] & m[i + 12];
  }
  return toString(out);
};
var subnet = (addr, smask) => {
  const networkAddress = toLong(mask(addr, smask));
  const maskBuf = toBuffer(smask);
  let maskLen = 0;
  for (const byte of maskBuf) {
    if (byte === 255) {
      maskLen += 8;
    } else {
      let b = byte;
      while (b) {
        b = b << 1 & 255;
        maskLen++;
      }
    }
  }
  const numAddresses = __pow(2, 32 - maskLen);
  const numHosts = numAddresses <= 2 ? numAddresses : numAddresses - 2;
  const firstAddress = numAddresses <= 2 ? networkAddress : networkAddress + 1;
  const lastAddress = numAddresses <= 2 ? networkAddress + numAddresses - 1 : networkAddress + numAddresses - 2;
  const broadcastAddress = networkAddress + numAddresses - 1;
  return {
    networkAddress: fromLong(networkAddress),
    firstAddress: fromLong(firstAddress),
    lastAddress: fromLong(lastAddress),
    broadcastAddress: fromLong(broadcastAddress),
    subnetMask: smask,
    subnetMaskLength: maskLen,
    numHosts,
    length: numAddresses,
    contains(ip) {
      const long = typeof ip === "number" ? ip : typeof ip === "string" ? toLong(toBuffer(ip)) : toLong(ip);
      return long >= networkAddress && long <= broadcastAddress;
    }
  };
};
var parseCidr = (cidrString) => {
  const [addr, prefix] = cidrString.split("/");
  if (!addr || prefix === void 0)
    throw new Error(`invalid CIDR subnet: ${cidrString}`);
  const m = fromPrefixLen(parseInt(prefix, 10));
  return [addr, m];
};
var cidr = (cidrString) => mask(...parseCidr(cidrString));
var cidrSubnet = (cidrString) => subnet(...parseCidr(cidrString));
var not = (addr) => {
  const buff = toBuffer(addr);
  for (let i = 0; i < buff.length; i++) buff[i] ^= 255;
  return toString(buff);
};
var or = (a, b) => {
  let buffA = toBuffer(a);
  let buffB = toBuffer(b);
  if (buffA.length === buffB.length) {
    for (let i = 0; i < buffA.length; i++) buffA[i] |= buffB[i];
    return toString(buffA);
  }
  if (buffB.length > buffA.length) [buffA, buffB] = [buffB, buffA];
  const offset = buffA.length - buffB.length;
  for (let i = 0; i < buffB.length; i++) buffA[offset + i] |= buffB[i];
  return toString(buffA);
};
var isEqual = (a, b) => {
  let buffA = toBuffer(a);
  let buffB = toBuffer(b);
  if (buffA.length === buffB.length) {
    for (let i = 0; i < buffA.length; i++) {
      if (buffA[i] !== buffB[i]) return false;
    }
    return true;
  }
  if (buffB.length === 4) [buffA, buffB] = [buffB, buffA];
  for (let i = 0; i < 10; i++) if (buffB[i] !== 0) return false;
  const prefix = buffB.readUInt16BE(10);
  if (prefix !== 0 && prefix !== 65535) return false;
  for (let i = 0; i < 4; i++) if (buffA[i] !== buffB[i + 12]) return false;
  return true;
};
var isPrivate = (addr) => {
  if (isLoopback(addr)) return true;
  return /^(::f{4}:)?10\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/i.test(addr) || // 10.0.0.0/8
  /^(::f{4}:)?192\.168\.(\d{1,3})\.(\d{1,3})$/i.test(addr) || // 192.168.0.0/16
  /^(::f{4}:)?172\.(1[6-9]|2\d|3[01])\.(\d{1,3})\.(\d{1,3})$/i.test(addr) || // 172.16.0.0 – 172.31.255.255
  /^(::f{4}:)?169\.254\.(\d{1,3})\.(\d{1,3})$/i.test(addr) || // link-local
  /^f[cd][0-9a-f]{2}:/i.test(addr) || // unique local (fc00::/7)
  /^fe80:/i.test(addr) || // link-local (fe80::/10)
  addr === "::1" || // loopback (::1)
  addr === "::";
};
var isPublic = (addr) => !isPrivate(addr);
var SPECIALS = [
  "0.0.0.0/8",
  "10.0.0.0/8",
  "100.64.0.0/10",
  "127.0.0.0/8",
  "169.254.0.0/16",
  "172.16.0.0/12",
  "192.0.0.0/24",
  "192.0.2.0/24",
  "192.88.99.0/24",
  "192.168.0.0/16",
  "198.18.0.0/15",
  "198.51.100.0/24",
  "203.0.113.0/24",
  "224.0.0.0/4",
  "233.252.0.0/24",
  "240.0.0.0/4",
  "255.255.255.255/32"
  // TODO
  // '::/128',
  // '::1/128',
  // '::ffff:0:0/96',
  // '64:ff9b::/96',
  // '64:ff9b:1::/48',
  // '100::/64',
  // '2001::/32',
  // '2001:20::/28',
  // '2001:db8::/32',
  // '2002::/16',
  // '3fff::/20',
  // '5f00::/16',
  // 'fc00::/7',
  // 'fe80::/64',
  // 'ff00::/8',
].map(cidrSubnet);
var isSpecial = (addr) => {
  const a = normalizeAddress(addr);
  if (isLoopback(a)) return true;
  return SPECIALS.some((sn) => sn.contains(a));
};

// src/main/ts/extra.ts
var IPV4_LEN_LIM = 4 * 3 + 3;
var IPV6_LEN_LIM = 4 * 8 + 7;
var IPV4_LIM = 4294967295;
var HEX_RE = /^[0-9a-fA-F]+$/;
var HEXX_RE = /^0x[0-9a-f]+$/;
var DEC_RE = /^(0|[1-9]\d*)$/;
var OCT_RE = /^0[0-7]+$/;
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
  toString(family = this.family, mapped = family === 6 && this.family !== family) {
    const { big } = this;
    if (family === 4) {
      if (big > /* @__PURE__ */ BigInt("0xffffffff")) throw new Error("Address is wider than IPv4");
      return Array.from(
        { length: 4 },
        (_, i) => Number(big >> BigInt((3 - i) * 8) & /* @__PURE__ */ BigInt("0xff"))
      ).join(".");
    }
    if (mapped && big < /* @__PURE__ */ BigInt("0x100000000")) {
      const ipv4 = Number(big & /* @__PURE__ */ BigInt("0xffffffff"));
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
    if (this.big > /* @__PURE__ */ BigInt("0xffffffff")) throw new Error("Address is wider than IPv4");
    return Number(this.big);
  }
  static create(extra) {
    return Object.assign(Object.create(this.prototype), extra);
  }
  static from(raw) {
    if (raw instanceof _Address) return this.create(raw);
    if (typeof raw === "string") return this.fromString(raw);
    return this.fromNumber(raw);
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
      const low32 = a.big & /* @__PURE__ */ BigInt("0xffffffff");
      const maskedLow = low32 & m.big;
      const masked = a.big & ~/* @__PURE__ */ BigInt("0xffffffff") | maskedLow;
      return _Address.fromNumber(masked, a.family).toString();
    }
    if (a.family === 4 && m.family === 6) {
      const lowMask = m.big & /* @__PURE__ */ BigInt("0xffffffff");
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
      contains: (ip) => {
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
  static fromNumber(n, fam) {
    const big = BigInt(n);
    if (big < /* @__PURE__ */ BigInt("0")) throw new Error("Invalid address");
    const family = big > /* @__PURE__ */ BigInt("0xffffffff") ? 6 : fam || 4;
    return this.create({ raw: n, big, family });
  }
  static fromString(addr) {
    const raw = addr;
    if (addr === "::") return this.create({ big: /* @__PURE__ */ BigInt("0"), family: 6, raw });
    if (addr === "0") return this.create({ big: /* @__PURE__ */ BigInt("0"), family: 4, raw });
    if (!addr || addr.length > IPV6_LEN_LIM) throw new Error("Invalid address");
    const [h, t] = addr.split("::", 2);
    const heads = h ? h.split(":", 8) : [];
    const tails = t ? t.split(":", 8) : [];
    const groups = t === void 0 ? heads : [
      ...heads,
      ...Array(8 - heads.length - tails.length).fill("0"),
      ...tails
    ];
    const last = groups[groups.length - 1];
    if (last.includes(".")) {
      if (heads.length > 1) throw new Error("Invalid address");
      if (heads.length === 0) {
        if (tails.length > 2) throw new Error("Invalid address");
        if (tails.length === 2) {
          if (tails[0] !== "ffff") throw new Error("Invalid address");
          groups[5] = "ffff";
        }
      } else {
        const long = this.ipV4ToLong(last);
        if (long < 0 || long > IPV4_LIM) throw new Error("Invalid address");
        return this.create({ big: BigInt(long), family: 4, raw });
      }
      const [g6, g7] = this.ipv4ToGroups(last);
      groups[6] = g6;
      groups[7] = g7;
    }
    if (groups.length !== 8 || groups.includes("")) throw new Error("Invalid address");
    const big = groups.reduce(
      (acc, part) => {
        if (part.length > 4 || !HEX_RE.test(part)) throw new Error("Invalid address");
        return (acc << /* @__PURE__ */ BigInt("16")) + BigInt(parseInt(part, 16));
      },
      /* @__PURE__ */ BigInt("0")
    );
    return this.create({ family: 6, big, raw });
  }
  static ipv4ToGroups(ipv4) {
    if (ipv4.length > IPV4_LEN_LIM) throw new Error("Invalid IPv4");
    const groups = ipv4.split(".", 5);
    if (groups.length !== 4) throw new Error("Invalid IPv4");
    const nums = groups.map((p) => {
      const n = +p;
      if (n < 0 || n > 255 || !DEC_RE.test(p)) throw new Error("Invalid IPv4");
      return n;
    });
    return [
      (nums[0] << 8 | nums[1]).toString(16),
      (nums[2] << 8 | nums[3]).toString(16)
    ];
  }
  static ipV4ToLong(addr) {
    const groups = addr.split(".", 5).map((v) => {
      const radix = HEXX_RE.test(v) ? 16 : DEC_RE.test(v) ? 10 : OCT_RE.test(v) ? 8 : NaN;
      return parseInt(v, radix);
    });
    const [g0, g1, g2, g3] = groups;
    const l = groups.length;
    if (l > 4 || groups.some(isNaN)) return -1;
    if (l === 1)
      return g0 >>> 0;
    if (l === 2 && g0 <= 255 && g1 <= 16777215)
      return (g0 << 24 | g1 & 16777215) >>> 0;
    if (l === 3 && g0 <= 255 && g1 <= 255 && g2 <= 65535)
      return (g0 << 24 | g1 << 16 | g2 & 65535) >>> 0;
    if (groups.every((g) => g <= 255))
      return (g0 << 24 | g1 << 16 | g2 << 8 | g3) >>> 0;
    return -1;
  }
};
__publicField(_Address, "fromPrefixLen", (prefixlen, family) => {
  const fam = prefixlen > 32 ? 6 : family;
  const len = prefixlen | 0;
  const bits = fam === 6 ? 128 : 32;
  if (len < 0 || len > bits)
    throw new RangeError(`Invalid prefix length for IPv${fam}: ${len}`);
  const big = len === 0 ? /* @__PURE__ */ BigInt("0") : ~/* @__PURE__ */ BigInt("0") << BigInt(bits - len) & (/* @__PURE__ */ BigInt("1") << BigInt(bits)) - /* @__PURE__ */ BigInt("1");
  return _Address.fromNumber(big);
});
__publicField(_Address, "parseCidr", (cidr2) => {
  const chunks = cidr2.split("/", 3);
  const [ip, prefix] = chunks;
  if (chunks.length !== 2 || !prefix.length) throw new Error(`Invalid CIDR: ${cidr2}`);
  const m = _Address.fromPrefixLen(parseInt(prefix, 10));
  const addr = _Address.fromString(ip);
  return [addr, m];
});
var Address = _Address;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Address,
  IPV4,
  IPV6,
  V4_RE,
  V4_S_RE,
  V6_RE,
  V6_S_RE,
  cidr,
  cidrSubnet,
  fromLong,
  fromPrefixLen,
  isEqual,
  isLoopback,
  isPrivate,
  isPublic,
  isSpecial,
  isV4,
  isV4Format,
  isV6,
  isV6Format,
  loopback,
  mask,
  normalizeAddress,
  normalizeFamily,
  normalizeToLong,
  not,
  or,
  setMode,
  subnet,
  toBuffer,
  toLong,
  toString
});