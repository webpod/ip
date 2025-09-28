export { isIP, isIPv6, isIPv4, isIPv4 as isV4Format, isIPv6 as isV6Format, } from 'node:net';
export declare const addresses: (name?: string, family?: string | number) => string[];
export declare const address: (name?: string, family?: string) => string | undefined;
