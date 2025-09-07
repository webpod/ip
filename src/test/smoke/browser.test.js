import { describe, it, expect } from 'vitest'
import { isPrivate } from '@webpod/ip/core'

describe('isPrivate', () => {
  it('returns true for 127.0.0.1', () => {
    expect(isPrivate('127.0.0.1')).toBe(true)
  })

  it('returns false for public IP', () => {
    expect(isPrivate('8.8.8.8')).toBe(false)
  })
})
