
var __defProp = Object.defineProperty;

var __defProps = Object.defineProperties;

var __getOwnPropDesc = Object.getOwnPropertyDescriptor;

var __getOwnPropDescs = Object.getOwnPropertyDescriptors;

var __getOwnPropNames = Object.getOwnPropertyNames;

var __getOwnPropSymbols = Object.getOwnPropertySymbols;

var __hasOwnProp = Object.prototype.hasOwnProperty;

var __propIsEnum = Object.prototype.propertyIsEnumerable;

var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;

var __spreadValues = (a, b) => {
  for (var prop in b || (b = {}))
    if (__hasOwnProp.call(b, prop))
      __defNormalProp(a, prop, b[prop]);
  if (__getOwnPropSymbols)
    for (var prop of __getOwnPropSymbols(b)) {
      if (__propIsEnum.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    }
  return a;
};

var __spreadProps = (a, b) => __defProps(a, __getOwnPropDescs(b));

var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};

var __toCommonJS = (mod) => __copyProps(__defProp({}, "__esModule", { value: true }), mod);

var __publicField = (obj, key, value) => __defNormalProp(obj, typeof key !== "symbol" ? key + "" : key, value);

var __create = Object.create;

var __getProtoOf = Object.getPrototypeOf;

var __reExport = (target, mod, secondTarget) => (__copyProps(target, mod, "default"), secondTarget && __copyProps(secondTarget, mod, "default"));

var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

module.exports = {
  __defProp,
  __defProps,
  __getOwnPropDesc,
  __getOwnPropDescs,
  __getOwnPropNames,
  __getOwnPropSymbols,
  __hasOwnProp,
  __propIsEnum,
  __defNormalProp,
  __spreadValues,
  __spreadProps,
  __export,
  __copyProps,
  __toCommonJS,
  __publicField,
  __create,
  __getProtoOf,
  __reExport,
  __toESM
};
