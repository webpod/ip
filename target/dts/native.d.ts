import { type FamilyAlias } from './core.ts';
export { isIP, isIPv6, isIPv4, isIPv4 as isV4Format, isIPv6 as isV6Format, } from 'node:net';
export declare const addresses: (kind?: string, family?: FamilyAlias) => string[];
export declare const address: (kind?: string, family?: FamilyAlias) => string | undefined;
