export interface BufferLike extends Omit<Uint8Array, 'slice'> {
    readUInt16BE(offset?: number): number;
    slice(start?: number, end?: number): BufferLike;
    toString(encoding?: 'hex'): string;
}
export declare const FakeBuffer: {
    alloc: (size: number, fill?: number) => BufferLike;
};
export declare const Buffer: any;
