import * as net from 'node:net'
import webpodip from '@webpod/ip'
import ip from 'ip'
import * as isip from 'is-ip'
import ipaddrjs from 'ipaddr.js'
import * as ipa from 'ip-address'
import * as ip2buf from 'ip2buf'

export type Checker = (addr: string) => boolean | null

export const tools: Record<string, Record<string, Checker | string>> = {
  'node:net': {
    isIPv4: (addr) => net.isIPv4(addr),
    isIPv6: (addr) => net.isIPv6(addr),
  },
  ip: {
    ref: 'https://github.com/indutny/node-ip',
    isIPv4: (addr) => ip.isV4Format(addr),
    isIPv6: (addr) => ip.isV6Format(addr),
    isPrivate: (addr) => ip.isPrivate(addr),
  },
  '@webpod/ip': {
    ref: 'https://github.com/webpod/ip',
    isIPv4: (addr) => webpodip.isV4Format(addr),
    isIPv6: (addr) => webpodip.isV6Format(addr),
    isPrivate: (addr) => {
      try { return webpodip.isPrivate(addr)
      } catch { return null }
    },
  },

  'is-ip': {
    ref: 'https://github.com/sindresorhus/is-ip',
    isIPv4: (addr) => isip.isIPv4(addr),
    isIPv6: (addr) => isip.isIPv6(addr),
  },
  'ipaddr.js': {
    ref: 'https://github.com/whitequark/ipaddr.js/',
    isIPv4: (addr) => {
      try { return ipaddrjs.parse(addr).kind() === 'ipv4' }
      catch { return false }
    },
    isIPv6: (addr) => {
      try { return ipaddrjs.parse(addr).kind() === 'ipv6' }
      catch { return false }
    },
    isPrivate: (addr) => {
      try {
        const a = ipaddrjs.parse(addr)
        return ['private', 'loopback', 'linkLocal', 'uniqueLocal', 'unspecified', 'benchmarking'].includes(a.range())
      } catch { return null }
    },
  },
  'ip-address': {
    ref: 'https://github.com/beaugunderson/ip-address',
    isIPv4: (addr) => {
      return ipa.Address4.isValid(addr)
    },
    isIPv6: (addr) => {
      return ipa.Address6.isValid(addr)
    },
  },
  'ip2buf': {
    ref: 'https://github.com/reklatsmasters/ip2buf',
    isIPv4: (addr) => {
      try { return !!ip2buf.pton4(addr) } catch { return false }
    },
    isIPv6: (addr) => {
      try { return !!ip2buf.pton6(addr) } catch { return false }
    },
  },
}
