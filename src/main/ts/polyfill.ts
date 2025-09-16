// -------------------------------------------------------
// Browser compatibility helpers
// -------------------------------------------------------

export interface BufferLike extends Omit<Uint8Array, 'slice'> {
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
      slice(start?: number, end?: number): BufferLike {
        const sliced = Uint8Array.prototype.slice.call(this, start, end)

        return Object.assign(sliced, {
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

const getGlobal = function() {
  if (typeof globalThis !== 'undefined') return globalThis
  if (typeof window !== 'undefined') return window
  if (typeof global !== 'undefined') return global
  return Function('return this')()
}

export const Buffer = getGlobal().Buffer || FakeBuffer
