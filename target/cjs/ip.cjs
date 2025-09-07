"use strict";
const {
  __export,
  __toCommonJS
} = require('./cjslib.cjs');


// src/main/ts/ip.ts
var ip_exports = {};
__export(ip_exports, {
  foo: () => foo
});
module.exports = __toCommonJS(ip_exports);
var foo = "bar";
// Annotate the CommonJS export names for ESM import in node:
0 && (module.exports = {
  foo
});