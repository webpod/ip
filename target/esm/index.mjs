var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/main/ts/native.ts
var native_exports = {};
__export(native_exports, {
  address: () => address,
  addresses: () => addresses,
  isIP: () => isIP,
  isIPv4: () => isIPv4,
  isIPv6: () => isIPv6,
  isV4Format: () => isIPv42,
  isV6Format: () => isIPv62
});
import os from "node:os";
import { isLoopback, isPrivate, isPublic, loopback, Address } from "./core.mjs";
import {
  isIP,
  isIPv6,
  isIPv4,
  isIPv4 as isIPv42,
  isIPv6 as isIPv62
} from "node:net";
var PUBLIC = "public";
var PRIVATE = "private";
var { normalizeFamily } = Address;
var addresses = (kind, family = 4) => {
  const fam = normalizeFamily(family);
  const interfaces = os.networkInterfaces();
  const check = kind === PUBLIC ? isPublic : kind === PRIVATE ? isPrivate : () => true;
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
      if (isLoopback(address2)) continue;
      if (check(address2)) acc.push(address2);
    }
    return acc;
  }, []);
  return all.length ? all : [loopback(fam)];
};
var address = (kind, family) => addresses(kind, family)[0];

// src/main/ts/index.ts
import * as core from "./core.mjs";
import {
  Address as Address2,
  isPrivate as isPrivate2,
  isPublic as isPublic2,
  isEqual,
  isLoopback as isLoopback2,
  loopback as loopback2,
  toLong,
  toBuffer,
  toString,
  fromLong,
  fromPrefixLen,
  cidr,
  cidrSubnet,
  subnet,
  mask,
  not,
  or,
  normalizeToLong
} from "./core.mjs";
var ip = { ...core, ...native_exports };
var index_default = ip;
export {
  Address2 as Address,
  address,
  addresses,
  cidr,
  cidrSubnet,
  index_default as default,
  fromLong,
  fromPrefixLen,
  ip,
  isEqual,
  isIP,
  isIPv4,
  isIPv6,
  isLoopback2 as isLoopback,
  isPrivate2 as isPrivate,
  isPublic2 as isPublic,
  isIPv42 as isV4Format,
  isIPv62 as isV6Format,
  loopback2 as loopback,
  mask,
  normalizeToLong,
  not,
  or,
  subnet,
  toBuffer,
  toLong,
  toString
};
