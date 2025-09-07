"use strict";
const {
  __pow,
  __export,
  __toESM,
  __toCommonJS
} = require('./cjslib.cjs');


// src/main/ts/ip.ts
var ip_exports = {};
__export(ip_exports, {
  IPV4: () => IPV4,
  IPV6: () => IPV6,
  V4_RE: () => V4_RE,
  V4_S_RE: () => V4_S_RE,
  V6_RE: () => V6_RE,
  V6_S_RE: () => V6_S_RE,
  address: () => address,
  addresses: () => addresses,
  cidr: () => cidr,
  cidrSubnet: () => cidrSubnet,
  default: () => ip_default,
  fromLong: () => fromLong,
  fromPrefixLen: () => fromPrefixLen,
  ip: () => ip,
  isEqual: () => isEqual,
  isLoopback: () => isLoopback,
  isPrivate: () => isPrivate,
  isPublic: () => isPublic,
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
  subnet: () => subnet,
  toBuffer: () => toBuffer,
  toLong: () => toLong,
  toString: () => toString
});
module.exports = __toCommonJS(ip_exports);
var import_buffer = require("buffer");
var import_os = __toESM(require("os"), 1);
var PUBLIC = "public";
var PRIVATE = "private";
var IPV4 = "IPv4";
var IPV6 = "IPv6";
var V4_RE = /^(\d{1,3}(\.|$)){4}$/;
var V6_RE = /^(?=.+)(::)?(((\d{1,3}\.){3}\d{1,3})?|([0-9a-f]{0,4}:{0,2})){1,8}(::)?$/i;
var V4_S_RE = /^((25[0-5]|(2[0-4]|1\d|[1-9]|)\d)\.?\b){4}$/;
var V6_S_RE = /(([\dA-Fa-f]{1,4}:){7}[\dA-Fa-f]{1,4}|([\dA-Fa-f]{1,4}:){1,7}:|([\dA-Fa-f]{1,4}:){1,6}:[\dA-Fa-f]{1,4}|([\dA-Fa-f]{1,4}:){1,5}(:[\dA-Fa-f]{1,4}){1,2}|([\dA-Fa-f]{1,4}:){1,4}(:[\dA-Fa-f]{1,4}){1,3}|([\dA-Fa-f]{1,4}:){1,3}(:[\dA-Fa-f]{1,4}){1,4}|([\dA-Fa-f]{1,4}:){1,2}(:[\dA-Fa-f]{1,4}){1,5}|[\dA-Fa-f]{1,4}:((:[\dA-Fa-f]{1,4}){1,6})|:((:[\dA-Fa-f]{1,4}){1,7}|:)|fe80:(:[\dA-Fa-f]{0,4}){0,4}%[\dA-Za-z]+|::(ffff(:0{1,4}){0,1}:){0,1}((25[0-5]|(2[0-4]|1{0,1}\d){0,1}\d)\.){3}(25[0-5]|(2[0-4]|1{0,1}\d){0,1}\d)|([\dA-Fa-f]{1,4}:){1,4}:((25[0-5]|(2[0-4]|1{0,1}\d){0,1}\d)\.){3}(25[0-5]|(2[0-4]|1{0,1}\d){0,1}\d))$/;
var isV4Format = (ip2) => V4_RE.test(ip2);
var isV6Format = (ip2) => V6_RE.test(ip2);
var isV4 = (ip2) => V4_S_RE.test(ip2);
var isV6 = (ip2) => V6_S_RE.test(ip2);
function normalizeFamily(family) {
  const f = `${family}`.toLowerCase().trim();
  return f === "6" || f === IPV6.toLowerCase() ? IPV6 : IPV4;
}
var normalizeAddress = (addr) => {
  const _a = (addr + "").toLowerCase();
  return _a.includes(":") ? toString(toBuffer(_a)) : fromLong(normalizeToLong(_a));
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
  let val;
  switch (parts.length) {
    case 1:
      val = parts[0];
      break;
    case 2:
      if (parts[0] > 255 || parts[1] > 16777215) return -1;
      val = parts[0] << 24 | parts[1] & 16777215;
      break;
    case 3:
      if (parts[0] > 255 || parts[1] > 255 || parts[2] > 65535) return -1;
      val = parts[0] << 24 | parts[1] << 16 | parts[2] & 65535;
      break;
    case 4:
      if (parts.some((p) => p > 255)) return -1;
      val = parts[0] << 24 | parts[1] << 16 | parts[2] << 8 | parts[3];
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
var toLong = (ip2) => ip2.split(".").reduce((acc, octet) => (acc << 8) + Number(octet), 0) >>> 0;
var toString = (buff, offset = 0, length) => {
  const o = ~~offset;
  const l = length || buff.length - offset;
  if (l === 4)
    return [...buff.subarray(o, o + l)].join(".");
  if (l === 16)
    return Array.from({ length: l / 2 }, (_, i) => buff.readUInt16BE(o + i * 2).toString(16)).join(":").replace(/(^|:)0(:0)*:0(:|$)/, "$1::$3").replace(/:{3,4}/, "::");
  throw new Error("Invalid buffer length for IP address");
};
var toBuffer = (ip2, buff, offset = 0) => {
  offset = ~~offset;
  if (isV4Format(ip2)) {
    const res = buff || import_buffer.Buffer.alloc(offset + 4);
    for (const byte of ip2.split("."))
      res[offset++] = +byte & 255;
    return res;
  }
  if (isV6Format(ip2)) {
    let sections = ip2.split(":", 8);
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
    const res = buff || import_buffer.Buffer.alloc(offset + 16);
    for (const sec of sections) {
      const word = parseInt(sec, 16) || 0;
      res[offset++] = word >> 8;
      res[offset++] = word & 255;
    }
    return res;
  }
  throw Error(`Invalid ip address: ${ip2}`);
};
var fromPrefixLen = (prefixlen, family) => {
  family = prefixlen > 32 ? IPV6 : normalizeFamily(family);
  const buff = import_buffer.Buffer.alloc(family === IPV6 ? 16 : 4);
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
  const out = import_buffer.Buffer.alloc(Math.max(a.length, m.length));
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
  return {
    networkAddress: fromLong(networkAddress),
    firstAddress: fromLong(firstAddress),
    lastAddress: fromLong(lastAddress),
    broadcastAddress: fromLong(networkAddress + numAddresses - 1),
    subnetMask: smask,
    subnetMaskLength: maskLen,
    numHosts,
    length: numAddresses,
    contains(ip2) {
      return networkAddress === toLong(mask(ip2, smask));
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
  let ab = toBuffer(a);
  let bb = toBuffer(b);
  if (ab.length === bb.length) {
    for (let i = 0; i < ab.length; i++) {
      if (ab[i] !== bb[i]) return false;
    }
    return true;
  }
  if (bb.length === 4) [ab, bb] = [bb, ab];
  for (let i = 0; i < 10; i++) if (bb[i] !== 0) return false;
  const prefix = bb.readUInt16BE(10);
  if (prefix !== 0 && prefix !== 65535) return false;
  for (let i = 0; i < 4; i++) if (ab[i] !== bb[i + 12]) return false;
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
var addresses = (name, family) => {
  const interfaces = import_os.default.networkInterfaces();
  const fam = normalizeFamily(family);
  const check = name === PUBLIC ? isPublic : name === PRIVATE ? isPrivate : () => true;
  if (name && name !== PRIVATE && name !== PUBLIC) {
    const nic = interfaces[name];
    if (!nic) return [];
    const match = nic.find((details) => normalizeFamily(details.family) === fam);
    return [match == null ? void 0 : match.address];
  }
  const all = Object.values(interfaces).reduce((acc, nic) => {
    for (const { family: family2, address: address2 } of nic != null ? nic : []) {
      if (normalizeFamily(family2) !== fam) continue;
      if (isLoopback(address2)) continue;
      if (check(address2)) acc.push(address2);
    }
    return acc;
  }, []);
  return all.length ? all : [loopback(fam)];
};
var address = (name, family) => addresses(name, family)[0];
var ip = {
  address,
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
  not,
  or,
  subnet,
  toBuffer,
  toLong,
  toString
};
var ip_default = ip;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  IPV4,
  IPV6,
  V4_RE,
  V4_S_RE,
  V6_RE,
  V6_S_RE,
  address,
  addresses,
  cidr,
  cidrSubnet,
  fromLong,
  fromPrefixLen,
  ip,
  isEqual,
  isLoopback,
  isPrivate,
  isPublic,
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
  subnet,
  toBuffer,
  toLong,
  toString
});