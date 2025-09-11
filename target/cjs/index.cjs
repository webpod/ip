"use strict";
const {
  __spreadValues,
  __export,
  __reExport,
  __toESM,
  __toCommonJS
} = require('./cjslib.cjs');


// src/main/ts/index.ts
var index_exports = {};
__export(index_exports, {
  address: () => address,
  addresses: () => addresses,
  default: () => index_default,
  ip: () => ip
});
module.exports = __toCommonJS(index_exports);

// src/main/ts/address.ts
var address_exports = {};
__export(address_exports, {
  address: () => address,
  addresses: () => addresses
});
var import_node_os = __toESM(require("os"), 1);
var import_core = require("./core.cjs");
var PUBLIC = "public";
var PRIVATE = "private";
var { normalizeFamily } = import_core.Address;
var addresses = (name, family = 4) => {
  const fam = normalizeFamily(family);
  const interfaces = import_node_os.default.networkInterfaces();
  const check = name === PUBLIC ? import_core.isPublic : name === PRIVATE ? import_core.isPrivate : () => true;
  if (name && name !== PRIVATE && name !== PUBLIC) {
    const nic = interfaces[name];
    if (!nic) return [];
    const match = nic.find((details) => normalizeFamily(details.family) === fam);
    return [match == null ? void 0 : match.address];
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
var address = (name, family) => addresses(name, family)[0];

// src/main/ts/index.ts
var core = __toESM(require("./core.cjs"), 1);
__reExport(index_exports, require("./core.cjs"), module.exports);
var ip = __spreadValues(__spreadValues({}, address_exports), core);
var index_default = ip;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = Object.assign({
  address,
  addresses,
  ip,
}, require("./core.cjs")))