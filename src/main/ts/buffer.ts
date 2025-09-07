export interface BufferLike extends Omit<Uint8Array, 'slice'> {
  readUInt16BE(offset?: number): number
  slice(start?: number, end?: number): BufferLike
  toString(encoding?: 'hex'): string
}

export const FakeBuffer = {
  alloc: (size: number, fill: number = 0): BufferLike => {
    if (size < 0)
      throw new RangeError('The value of \"size\" is out of range.')

    const arr = new Uint8Array(size)
    if (fill !== 0)
      arr.fill(fill)

    const buf = arr as BufferLike

    return Object.assign(buf, {
      readUInt16BE(offset: number = 0): number {
        if (offset < 0 || offset + 2 > (this as any).length)
          throw new RangeError(`RangeError: The value of "offset" is out of range. It must be >= 0 and <= 2. Received ${offset}`)

        return (this as any)[offset] << 8 | (this as any)[offset + 1]
      },
      slice(start?: number, end?: number): BufferLike {
          const sliced = Uint8Array.prototype.slice.call(this, start, end)

          return Object.assign(sliced, {
            readUInt16BE: buf.readUInt16BE,
            slice: buf.slice,
            toString: buf.toString,
          }) as BufferLike
      },
      toString(encoding?: 'hex'): string {
        if (encoding !== 'hex')
          throw new Error("Only 'hex' encoding is supported in this polyfill")

        return Array.from(this as any)
          .map((b) => (b as number).toString(16).padStart(2, '0'))
          .join('')
      },
    })
  }
}

export const Buffer = (global as any || globalThis).Buffer || FakeBuffer
