import os from 'node:os'
import { isLoopback, isPrivate, isPublic, loopback, Address } from './core.ts'

const PUBLIC = 'public'
const PRIVATE = 'private'

const {normalizeFamily} = Address
export const addresses = (name?: string, family: string | number = 4): string[] => {
  const fam = normalizeFamily(family)
  const interfaces = os.networkInterfaces()
  const check =
    name === PUBLIC ? isPublic
      : name === PRIVATE ? isPrivate
        : () => true

  // specific NIC requested
  if (name && name !== PRIVATE && name !== PUBLIC) {
    const nic = interfaces[name]
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

export const address = (name?: string, family?: string): string | undefined =>
  addresses(name, family)[0]