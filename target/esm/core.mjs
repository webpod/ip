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
var Buffer = getGlobal().Buffer || FakeBuffer;

// src/main/ts/core.ts
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
    const res = buff || Buffer.alloc(offset + 4);
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
    const res = buff || Buffer.alloc(offset + 16);
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
  const buff = Buffer.alloc(family === IPV6 ? 16 : 4);
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
  const out = Buffer.alloc(Math.max(a.length, m.length));
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
  const numAddresses = 2 ** (32 - maskLen);
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
export {
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
};
