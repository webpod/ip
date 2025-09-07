var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// src/main/ts/address.ts
var address_exports = {};
__export(address_exports, {
  address: () => address,
  addresses: () => addresses
});
import os from "node:os";
import { isLoopback, isPrivate, isPublic, loopback, normalizeFamily } from "./core.mjs";
var PUBLIC = "public";
var PRIVATE = "private";
var addresses = (name, family) => {
  const interfaces = os.networkInterfaces();
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

// src/main/ts/index.ts
import * as core from "./core.mjs";
export * from "./core.mjs";
var ip = { ...address_exports, ...core };
var index_default = ip;
export {
  address,
  addresses,
  index_default as default,
  ip
};
