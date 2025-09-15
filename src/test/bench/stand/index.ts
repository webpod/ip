import * as net from 'node:net'
import webpodip from '@webpod/ip'
import ip from 'ip'
import * as isip from 'is-ip'
import ipaddrjs from 'ipaddr.js'
import * as ipa from 'ip-address'

type Checker = (addr: string) => boolean | null

export const tools: Record<string, Record<string, Checker>> = {
  'node:net': {
    isIPv4: (addr) => net.isIPv4(addr),
    isIPv6: (addr) => net.isIPv6(addr),
  },
  ip: {
    isIPv4: (addr) => ip.isV4Format(addr),
    isIPv6: (addr) => ip.isV6Format(addr),
    isPrivate: (addr) => ip.isPrivate(addr),
  },
  '@webpod/ip': {
    isIPv4: (addr) => webpodip.isV4Format(addr),
    isIPv6: (addr) => webpodip.isV6Format(addr),
    isPrivate: (addr) => {
      try { return webpodip.isPrivate(addr)
      } catch { return null }
    },
  },

  'is-ip': {
    isIPv4: (addr) => isip.isIPv4(addr),
    isIPv6: (addr) => isip.isIPv6(addr),
  },
  'ipaddr.js': {
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
    isIPv4: (addr) => {
      return ipa.Address4.isValid(addr)
    },
    isIPv6: (addr) => {
      return ipa.Address6.isValid(addr)
    },
  },
}
