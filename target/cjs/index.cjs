"use strict";
const {
  __spreadValues,
  __export,
  __toESM,
  __toCommonJS
} = require('./cjslib.cjs');


// src/main/ts/index.ts
var index_exports = {};
__export(index_exports, {
  Address: () => import_core2.Address,
  address: () => address,
  addresses: () => addresses,
  cidr: () => import_core2.cidr,
  cidrSubnet: () => import_core2.cidrSubnet,
  default: () => index_default,
  fromLong: () => import_core2.fromLong,
  fromPrefixLen: () => import_core2.fromPrefixLen,
  ip: () => ip,
  isEqual: () => import_core2.isEqual,
  isIP: () => import_node_net.isIP,
  isIPv4: () => import_node_net.isIPv4,
  isIPv6: () => import_node_net.isIPv6,
  isLoopback: () => import_core2.isLoopback,
  isPrivate: () => import_core2.isPrivate,
  isPublic: () => import_core2.isPublic,
  isV4Format: () => import_node_net.isIPv4,
  isV6Format: () => import_node_net.isIPv6,
  loopback: () => import_core2.loopback,
  mask: () => import_core2.mask,
  normalizeToLong: () => import_core2.normalizeToLong,
  not: () => import_core2.not,
  or: () => import_core2.or,
  subnet: () => import_core2.subnet,
  toBuffer: () => import_core2.toBuffer,
  toLong: () => import_core2.toLong,
  toString: () => import_core2.toString
});
module.exports = __toCommonJS(index_exports);

// src/main/ts/native.ts
var native_exports = {};
__export(native_exports, {
  address: () => address,
  addresses: () => addresses,
  isIP: () => import_node_net.isIP,
  isIPv4: () => import_node_net.isIPv4,
  isIPv6: () => import_node_net.isIPv6,
  isV4Format: () => import_node_net.isIPv4,
  isV6Format: () => import_node_net.isIPv6
});
var import_node_os = __toESM(require("os"), 1);
var import_core = require("./core.cjs");
var import_node_net = require("net");
var PUBLIC = "public";
var PRIVATE = "private";
var { normalizeFamily } = import_core.Address;
var addresses = (kind, family = 4) => {
  const fam = normalizeFamily(family);
  const interfaces = import_node_os.default.networkInterfaces();
  const check = kind === PUBLIC ? import_core.isPublic : kind === PRIVATE ? import_core.isPrivate : () => true;
  if (kind && kind !== PRIVATE && kind !== PUBLIC) {
    const nic = interfaces[kind];
    if (!nic) return [];
    const match = nic.find((details) => normalizeFamily(details.family) === fam);
    if (!match) return [];
    return [match.address];
  }
  const all = Object.values(interfaces).reduce((acc, nic) => {
    for (const { family: family2, address: address2 } of nic != null ? nic : []) {
      if (normalizeFamily(family2) !== fam) continue;
      if ((0, import_core.isLoopback)(address2)) continue;
      if (check(address2)) acc.push(address2);
    }
    return acc;
  }, []);
  return all.length ? all : [(0, import_core.loopback)(fam)];
};
var address = (kind, family) => addresses(kind, family)[0];

// src/main/ts/index.ts
var core = __toESM(require("./core.cjs"), 1);
var import_core2 = require("./core.cjs");
var ip = __spreadValues(__spreadValues({}, core), native_exports);
var index_default = ip;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  Address,
  address,
  addresses,
  cidr,
  cidrSubnet,
  fromLong,
  fromPrefixLen,
  ip,
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
});