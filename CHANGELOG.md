## [0.4.0](https://github.com/webpod/ip/compare/v0.3.0...v0.4.0) (2025-09-16)

### Features
* feat: introduce `isIP()`, `isIPv4()` and `isIPv6()` shortcuts. (#21) ([5155e0a](https://github.com/webpod/ip/commit/5155e0a69d70b46f064ae6f0738eff54a5e42264))

## [0.3.0](https://github.com/webpod/ip/compare/v0.2.7...v0.3.0) (2025-09-16)

### Features
* feat: introduce `Address.range` getter (#20) ([1f471b4](https://github.com/webpod/ip/commit/1f471b4ed031685cb633ac2fb6d40b0f802f4e07))

## [0.2.7](https://github.com/webpod/ip/compare/v0.2.6...v0.2.7) (2025-09-15)

### Fixes & improvements
* fix: disallow truncated IPv4 mapped IPv6 (#19) ([d7c0a60](https://github.com/webpod/ip/commit/d7c0a60d9cc7f859962b6ca164d169d19add066c))

## [0.2.6](https://github.com/webpod/ip/compare/v0.2.5...v0.2.6) (2025-09-15)

### Fixes & improvements
* perf: optimize IPv6 flow (#18) ([49ae6d7](https://github.com/webpod/ip/commit/49ae6d75fd56c6d97a69516011148e97507bf87a))

## [0.2.5](https://github.com/webpod/ip/compare/v0.2.4...v0.2.5) (2025-09-15)

### Fixes & improvements
* docs: describe IP tools coherence ([a74464a](https://github.com/webpod/ip/commit/a74464ae300ef3eee1b82f8073c2d340e5aa17a2))

## [0.2.4](https://github.com/webpod/ip/compare/v0.2.3...v0.2.4) (2025-09-15)

### Fixes & improvements
* perf: IPv4 flow optimizations (#17) ([657fbb4](https://github.com/webpod/ip/commit/657fbb41e2df64dd9135026e1d0129258a254285))

## [0.2.3](https://github.com/webpod/ip/compare/v0.2.2...v0.2.3) (2025-09-12)

### Fixes & improvements
* fix: adapt length limiter for full ipv4-mapped-ipv6 case ([d607594](https://github.com/webpod/ip/commit/d607594d9cb105abbcc73437c6f8c278e8dded1d))
* perf: add str length precheck for `cidr()` ([55ca034](https://github.com/webpod/ip/commit/55ca034d0e452f9f1e111e89af0db5c5cb614d15))

## [0.2.2](https://github.com/webpod/ip/compare/v0.2.1...v0.2.2) (2025-09-12)

### Fixes & improvements
* fix: strengthen `fromPrefixLen()` (#15) ([355afcc](https://github.com/webpod/ip/commit/355afccf0a2b0e80ead01a01db3caf63727e8ef8))

## [0.2.1](https://github.com/webpod/ip/compare/v0.2.0...v0.2.1) (2025-09-12)

### Fixes & improvements
* fix: handle double compression mark `::` (#14) ([c8528a2](https://github.com/webpod/ip/commit/c8528a2e9310f2e09f24ae2eb35532419334d612))

## [0.2.0](https://github.com/webpod/ip/compare/v0.1.0...v0.2.0) (2025-09-11)

### Fixes & improvements
* docs: describe `Address` proto ([2f450cb](https://github.com/webpod/ip/commit/2f450cbd0cd3b3e3464214a7ded22a4de87ec3fe))
* refactor: align inputs normalization ([d45bf5b](https://github.com/webpod/ip/commit/d45bf5b273c910aa73c6c8fbe7522817977c5aaf))
* fix: avoid prefix bytes loss on ipv4 mapped ipv6 parsing ([ce59bfd](https://github.com/webpod/ip/commit/ce59bfd870ac1ce29c87cd1d3a0a1d89692cda0f))
* refactor: rebuild legacy methods with `Address` ([3c01ec5](https://github.com/webpod/ip/commit/3c01ec533787bd96373f616e4a995f75c22663ce))
* refactor: enhance rangemap types ([1ae1ed2](https://github.com/webpod/ip/commit/1ae1ed259e82094556856d18c85c5c6f38356e4d))
* refactor: rearrange internal modules ([e98b272](https://github.com/webpod/ip/commit/e98b272d3e60b715429822564e8e367b1d29ccb3))
* refactor: separate `Address.parse()` helper ([64eb291](https://github.com/webpod/ip/commit/64eb2918017c8dcfc2aa1de82d325a94609ce4e7))
* refactor: simplify `ipV4ToLong()` ([7fd3889](https://github.com/webpod/ip/commit/7fd3889c124ad53642f2258afa0c06cb3ff40619))

### Features
* feat: add `Address.isSpecial()` (#12) ([0d18017](https://github.com/webpod/ip/commit/0d1801791d94dbb7119bdca6055106938542f143))
* feat: add `toArray()` shortcut (#11) ([f16dce0](https://github.com/webpod/ip/commit/f16dce045aa03ffa2af2d0ce1956bc4cb667102a))
* feat: introduce `Address` class ([abb28ed](https://github.com/webpod/ip/commit/abb28edb00b6163f59824a95fe85c505c6c7e654))

## [0.1.0](https://github.com/webpod/ip/compare/v0.0.1...v0.1.0) (2025-09-08)

### Features
* feat: extend `toLong()`, `toString()` and `subnet.contains()` suitable input types (#8) ([349252b](https://github.com/webpod/ip/commit/349252b913f0aaba7478f5de1d57d2b7e21f24ec))

## [0.0.1](https://github.com/webpod/ip/compare/v0.0.0...v0.0.1) (2025-09-08)

### Fixes & improvements
* docs: mention browser-compatible `./core` ([7995be0](https://github.com/webpod/ip/commit/7995be06c540521f2e159c9fc665ca383cc0ab48))
* fix(pkg): set pkg access public ([d3ac90f](https://github.com/webpod/ip/commit/d3ac90fa6f5d04f86eca44812e758f7a73ffca4a))

## [0.0.0](https://github.com/webpod/ip/compare/undefined...v0.0.0) (2025-09-08)

### Fixes & improvements
* refactor: optimize a bit `isSpecial()` ([c4039db](https://github.com/webpod/ip/commit/c4039db4414b1000184dcf85ffc91f8ffe0c2fc4))
* refactor: simplify `normilizeToLong()` inners ([ee038d9](https://github.com/webpod/ip/commit/ee038d9239b63bd6e2c4ccc3e387236078dd397e))
* docs: add readme ([907ccb4](https://github.com/webpod/ip/commit/907ccb425d326b64b83b83bca91b3b6578e8cb69))

### Features
* feat: introduce `isSpecial()` ip checker (#6) ([6da2ec5](https://github.com/webpod/ip/commit/6da2ec53c6e421909b3f8299a1b5a80aade89764))
* feat: introduce `setMode()` helper for lib `legacy/strict` mode switching (#5) ([6a68e75](https://github.com/webpod/ip/commit/6a68e7568dcb3587abf0f1e9b8fb41d1b5dba5d3))
* feat: separate browser compat `core` layer ([f124b00](https://github.com/webpod/ip/commit/f124b0044631b0d6abdd87d2026dc9c95334cb1b))
* feat: mvp (#3) ([78f0ff2](https://github.com/webpod/ip/commit/78f0ff2668621b8e380751997003c76d1e57b38d))
* feat: expose ESM and CJS entry points (#2) ([a6ae47a](https://github.com/webpod/ip/commit/a6ae47ad7145945d6b73bdb0e50c11bffd92b24d))
