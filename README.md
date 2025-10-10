# @webpod/ip

> Lite IP tools

This lib is an alternative for the [`ip`](https://www.npmjs.com/package/ip) package which resolves [many upstream issues](https://github.com/indutny/node-ip/issues).
* Reforged in TypeScript
* Provides both ESM and CJS entries
* Exposes browser-compatible `./core`
* Eliminates annoying vulnerabilities [CVE-2024-29415](https://github.com/advisories/GHSA-2p57-rm9w-gvfp), [CVE-2023-42282](https://github.com/advisories/GHSA-78xj-cgh5-2h22)
* Brings various fixes, improvements and optimizations
* [Enterprise ready](https://dev.to/antongolub/cve-2024-29415-problem-solution-3o3f)

## Install
```shell
npm i @webpod/ip
```

## Drop-in
```shell
- const ip = require('ip')
+ const ip = require('@webpod/ip')
```
Temporary workaround to avoid refactoring is using `overrides` / `resolutions` in your `package.json`:
```json
{
  "overrides": {
    "ip": "@webpod/ip"
  }
}
```

Browser-compatible core build is available as `@webpod/ip/core`: it omits `node:os` dependency and polyfills the `Buffer` API.

### Strict mode
By default, the library is in the `strict` mode that rejects non-canonical embedded IPv4 in IPv6. Switch to legacy flow if needed:

```ts
import { Address } from '@webpod/ip'

Address.from('::ffff:5.6.7.8')    // ok
Address.from('1:2:3:4::5.6.7.8')  // throws

Address.strict = false
Address.from('1:2:3:4::5.6.7.8')  // now it's fine
```

## Usage
The API is fully compatible with the latest `ip@2.0.1` but enforces stricter validations. See [coherence.md](./COHERENCE.md) for details.

```ts
import ip from '@webpod/ip'

// -------------------------------------------------------
// Addresses & formats
// -------------------------------------------------------

ip.address()                              // '192.168.1.50'  (example local address)
ip.isPrivate('127.0.0.1')                 // true
ip.isV4Format('127.0.0.1')                // true
ip.isV6Format('::ffff:127.0.0.1')         // true
ip.isEqual('::1', '::0:1')                // true

// -------------------------------------------------------
// Conversions
// -------------------------------------------------------

ip.toBuffer('127.0.0.1')                  // <Buffer 7f 00 00 01>
ip.toString(Buffer.from([127, 0, 0, 1]))  // '127.0.0.1'

ip.toLong('127.0.0.1')                    // 2130706433
ip.fromLong(2130706433)                   // '127.0.0.1'

ip.fromPrefixLen(24)                      // '255.255.255.0'

// in-place buffer usage
const buf = Buffer.alloc(128)
const offset = 64
ip.toBuffer('127.0.0.1', buf, offset)     // writes [127, 0, 0, 1] at offset 64
ip.toString(buf, offset, 4)               // '127.0.0.1'

// -------------------------------------------------------
// Masking, bitwise, and ranges
// -------------------------------------------------------

ip.mask('192.168.1.134', '255.255.255.0') // '192.168.1.0'
ip.cidr('192.168.1.134/26')               // '192.168.1.128'
ip.not('255.255.255.0')                   // '0.0.0.255'
ip.or('192.168.1.134', '0.0.0.255')       // '192.168.1.255'

// -------------------------------------------------------
// Subnets
// -------------------------------------------------------

ip.subnet('192.168.1.134', '255.255.255.192')
/*
{
  networkAddress:   '192.168.1.128',
  firstAddress:     '192.168.1.129',
  lastAddress:      '192.168.1.190',
  broadcastAddress: '192.168.1.191',
  subnetMask:       '255.255.255.192',
  subnetMaskLength: 26,
  numHosts:         62,
  length:           64,
  contains: [Function: contains]
}
*/

ip.cidrSubnet('192.168.1.134/26').contains('192.168.1.190') // true
```

### Address class
```ts
import { Address } from '@webpod/ip'

// -------------------------------------------------------
// Prototype methods
// -------------------------------------------------------

const addr4 = Address.from('192.168.1.134')

addr4.family        // 4
addr4.big           // 323223590n
addr4.toString()    // '192.168.1.134'
addr4.toLong()      // 323223590
addr4.toBuffer()    // <Buffer c0 a8 01 86>
addr4.toArray()     // [192, 168, 1, 134]

const addr6 = Address.from('::1')

addr6.family        // 6
addr6.big           // 1n
addr6.toString()    // '::1'
addr6.toString(4)   // '0.0.0.1'
addr6.toBuffer().toString('hex') // '00000000000000000000000000000001'

// -------------------------------------------------------
// Specific ranges check
// -------------------------------------------------------

Address.from('127.0.0.1').range                   // 'loopback'
Address.from('192.0.2.10').range                  // 'documentation'

Address.isSpecial('127.0.0.1')                    // true
Address.isSpecial('127.0.0.1', 'loopback')        // true
Address.isSpecial('127.0.0.1', 'documentation')   // false
Address.isSpecial('1.2.3.4')                      // false
```

## Alternatives
Follow [coherence.md](./COHERENCE.md), [benchmark.md](./BENCHMARK.md) and [meta.md](./META.md) to explore suitable options.

## License
MIT
