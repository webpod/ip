import * as address from './address.ts'
import * as core from './core.ts'

export * from './address.ts'
export * from './core.ts'

export const ip = { ...address, ...core }
export default ip
