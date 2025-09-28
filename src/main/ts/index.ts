import * as native from './native.ts'
import * as core from './core.ts'

export * from './native.ts'
export {
  type Special,
  type BufferLike,
  Address,
  isPrivate,
  isPublic,
  isEqual,
  isLoopback,
  loopback,
  toLong,
  toBuffer,
  toString,
  fromLong,
  fromPrefixLen,
  cidr,
  cidrSubnet,
  subnet,
  mask,
  not,
  or,
  normalizeToLong,
} from './core.ts'

export const ip = { ...core, ...native }
export default ip
