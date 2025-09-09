/**
 * Class to parse and handle IP addresses
 */
type Family = 4 | 6;
type ParsedAddress = {
    family: Family;
    big: bigint;
};
export declare class Address {
    raw: string;
    family: Family;
    big: bigint;
    constructor(addr: string);
    static parse(addr: string, opts?: Record<string, any>): ParsedAddress;
    static ipv4ToGroups(ipv4: string): string[];
}
export {};
