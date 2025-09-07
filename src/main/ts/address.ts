import os from 'node:os'
import { isLoopback, isPrivate, isPublic, loopback, normalizeFamily } from './core.ts'

const PUBLIC = 'public'
const PRIVATE = 'private'

export const addresses = (name?: string, family?: string): string[] => {
  const interfaces = os.networkInterfaces()
  const fam = normalizeFamily(family)
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