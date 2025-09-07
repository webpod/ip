# @webpod/ip

> Lite IP tools

This lib is an alternative for the [`ip`](https://www.npmjs.com/package/ip) package which resolves [many upstream issues](https://github.com/indutny/node-ip/issues).
* Rewritten in TypeScript
* Provides both ESM and CJS entries
* Eliminates annoying vulnerability [CVE-2024-29415](https://github.com/advisories/GHSA-2p57-rm9w-gvfp)
* Brings various fixes and improvements

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


## Usage
The API is fully compatible with the latest `ip@2.0.1`

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

Additional features:
```ts
ip.isV4Format('255.255.255.256')   // true
ip.isV6Format('127.0.0.1')         // true

ip.setMode('strict')               // or 'legacy'
ip.isV4Format('255.255.255.256')   // false
ip.isV6Format('127.0.0.1')         // false

// new methods are always strict
ip.isV4('255.255.255.256')         // false
ip.isV6('127.0.0.1')               // false
```

## License
MIT
