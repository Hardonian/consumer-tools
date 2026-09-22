import { describe, it, expect } from 'vitest'
import { trustUX } from '@/lib/intel/trustUX'

// Tests written to match the current structure of TrustMessage in the codebase
// which uses `type` and `messages` array instead of `id`, `trigger`, and `message`.
describe('trustUX array', () => {
  it('should be defined and an array', () => {
    expect(trustUX).toBeDefined()
    expect(Array.isArray(trustUX)).toBe(true)
  })

  it('should have correct type for each TrustMessage', () => {
    const validTypes = ['UNKNOWN', 'CAUTION', 'AVOID', 'SAFE', 'LIMITATION']
    trustUX.forEach(entry => {
      expect(validTypes).toContain(entry.type)
    })
  })

  it('should have a non-empty messages array of strings for each entry', () => {
    trustUX.forEach(entry => {
      expect(Array.isArray(entry.messages)).toBe(true)
      expect(entry.messages.length).toBeGreaterThan(0)

      entry.messages.forEach(message => {
        expect(typeof message).toBe('string')
        expect(message.length).toBeGreaterThan(0)
      })
    })
  })

  it('should contain expected categories', () => {
    const typesPresent = trustUX.map(entry => entry.type)

    expect(typesPresent).toContain('UNKNOWN')
    expect(typesPresent).toContain('CAUTION')
    expect(typesPresent).toContain('AVOID')
    expect(typesPresent).toContain('LIMITATION')
  })

  it('should not contain duplicate messages within a category', () => {
    trustUX.forEach(entry => {
      const uniqueMessages = new Set(entry.messages)
      expect(uniqueMessages.size).toBe(entry.messages.length)
    })
  })

  it('should not contain duplicate messages across all categories', () => {
    const allMessages = trustUX.flatMap(entry => entry.messages)
    const uniqueMessages = new Set(allMessages)
    expect(uniqueMessages.size).toBe(allMessages.length)
  })
})
