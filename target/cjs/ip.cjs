"use strict";
const {
  __export,
  __toCommonJS
} = require('./cjslib.cjs');


// src/main/ts/ip.ts
var ip_exports = {};
__export(ip_exports, {
  default: () => ip_default,
  foo: () => foo,
  ip: () => ip
});
module.exports = __toCommonJS(ip_exports);
var foo = "bar";
var ip = { foo };
var ip_default = ip;
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  foo,
  ip
});