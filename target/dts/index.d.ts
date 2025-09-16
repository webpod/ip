import * as core from './core.ts';
export * from './address.ts';
export * from './core.ts';
export declare const ip: {
    fromPrefixLen(prefixlen: number, family?: string | number): string;
    subnet(addr: string | number | bigint | number[] | core.BufferLike | core.Address, smask: string | number | bigint | number[] | core.BufferLike | core.Address): Omit<{
        family: 4 | 6;
        networkAddress: string;
        firstAddress: string;
        lastAddress: string;
        broadcastAddress: string;
        subnetMask: string;
        subnetMaskLength: number;
        numHosts: bigint;
        length: bigint;
        contains(addr: string | number | bigint | number[] | core.BufferLike | core.Address): boolean;
    }, "length" | "numHosts"> & {
        numHosts: number | bigint;
        length: number | bigint;
    };
    cidrSubnet(cidrString: string): Omit<{
        family: 4 | 6;
        networkAddress: string;
        firstAddress: string;
        lastAddress: string;
        broadcastAddress: string;
        subnetMask: string;
        subnetMaskLength: number;
        numHosts: bigint;
        length: bigint;
        contains(addr: string | number | bigint | number[] | core.BufferLike | core.Address): boolean;
    }, "length" | "numHosts"> & {
        numHosts: number | bigint;
        length: number | bigint;
    };
    toBuffer(addr: string | number | bigint | number[] | core.BufferLike | core.Address, buff?: core.BufferLike, offset?: number): core.BufferLike;
    toString(buf: core.BufferLike | number, offset?: number, length?: number): string;
    toLong(addr: string | number | bigint | number[] | core.BufferLike | core.Address): number;
    fromLong(n: number | bigint | `${bigint}`): string;
    isLoopback(addr: string | number | bigint | number[] | core.BufferLike | core.Address): boolean;
    loopback(family?: string | number): string;
    Address: typeof core.Address;
    isPublic: (typeof core.Address)["isPublic"];
    isPrivate: (typeof core.Address)["isPrivate"];
    isEqual: (typeof core.Address)["isEqual"];
    mask: (typeof core.Address)["mask"];
    not: (typeof core.Address)["not"];
    or: (typeof core.Address)["or"];
    cidr: (typeof core.Address)["cidr"];
    normalizeToLong: (typeof core.Address)["normalizeToLong"];
    isV4Format: (addr: string) => boolean;
    isV6Format: (addr: string) => boolean;
    isIPv4: (addr: string) => boolean;
    isIPv6: (addr: string) => boolean;
    isIP: (addr: string) => boolean;
    addresses: (name?: string, family?: string | number) => string[];
    address: (name?: string, family?: string) => string | undefined;
};
export default ip;
