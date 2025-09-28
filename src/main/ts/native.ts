import os from 'node:os'
import { isLoopback, isPrivate, isPublic, loopback, Address, type FamilyAlias } from './core.ts'

export {
  isIP,
  isIPv6,
  isIPv4,
  isIPv4 as isV4Format,
  isIPv6 as isV6Format,
} from 'node:net'

const PUBLIC = 'public'
const PRIVATE = 'private'

const {normalizeFamily} = Address
export const addresses = (kind?: string, family: FamilyAlias = 4): string[] => {
  const fam = normalizeFamily(family)
  const interfaces = os.networkInterfaces()
  const check =
    kind === PUBLIC ? isPublic
      : kind === PRIVATE ? isPrivate
        : () => true

  // specific NIC requested
  if (kind && kind !== PRIVATE && kind !== PUBLIC) {
    const nic = interfaces[kind]
    if (!nic) return []
    const match = nic.find(details => normalizeFamily(details.family) === fam)
    return [match?.address!]
  }

  // scan all NICs
  const all = Object.values(interfaces).reduce<string[]>((acc, nic) => {
    for (const {family, address} of nic ?? []) {
      if (normalizeFamily(family) !== fam) continue
      if (isLoopback(address)) continue
      if (check(address)) acc.push(address)
    }
    return acc
  }, [])

  return all.length ? all : [loopback(fam)]
}

export const address = (kind?: string, family?: FamilyAlias): string | undefined =>
  addresses(kind, family)[0]
