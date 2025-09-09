import { type BufferLike } from './buffer.ts';
type Family = 4 | 6;
type Raw = string | number | bigint;
type Subnet = {
    networkAddress: string;
    firstAddress: string;
    lastAddress: string;
    broadcastAddress: string;
    subnetMask: string;
    subnetMaskLength: number;
    numHosts: bigint;
    length: bigint;
    contains(ip: string | number): boolean;
};
export declare class Address {
    raw: Raw;
    family: Family;
    big: bigint;
    toBuffer(buff?: BufferLike, offset?: number): Buffer;
    toString(family?: Family, mapped?: boolean): string;
    toLong(): number;
    mask(mask: Raw | Address): string;
    subnet(smask: string): Subnet;
    private static create;
    static from(raw: Raw | Address): Address;
    static fromPrefixLen: (prefixlen: number, family?: Family) => Address;
    private static fromNumber;
    private static fromString;
    static ipv4ToGroups(ipv4: string): string[];
}
export {};
