import { describe, it, expect } from 'vitest'
import {
  failureScenarios,
  getAllFailureIds,
  getFailureScenario,
  getFailureByTrigger,
} from '@/lib/intel/failureRegistry'

describe('failureRegistry', () => {
  describe('getAllFailureIds', () => {
    it('returns an array of all failure scenario IDs', () => {
      const ids = getAllFailureIds()
      expect(ids).toBeInstanceOf(Array)
      expect(ids).toHaveLength(failureScenarios.length)

      // Verify all IDs match exactly and in the same order
      const expectedIds = failureScenarios.map((fs) => fs.id)
      expect(ids).toEqual(expectedIds)
    })
  })

  describe('getFailureScenario', () => {
    it('returns the correct scenario for a known ID', () => {
      const firstScenario = failureScenarios[0]
      const found = getFailureScenario(firstScenario.id)
      expect(found).toBeDefined()
      expect(found?.id).toBe(firstScenario.id)
      expect(found).toEqual(firstScenario)
    })

    it('returns undefined for an unknown ID', () => {
      const found = getFailureScenario('UNKNOWN-ID-999')
      expect(found).toBeUndefined()
    })
  })

  describe('getFailureByTrigger', () => {
    it('returns the correct scenario that matches the trigger string', () => {
      const firstScenario = failureScenarios[0]
      const found = getFailureByTrigger(firstScenario.trigger)
      expect(found).toBeDefined()
      expect(found?.id).toBe(firstScenario.id)
      expect(found).toEqual(firstScenario)
    })

    it('returns undefined when no trigger matches', () => {
      const found = getFailureByTrigger('This is not a known trigger')
      expect(found).toBeUndefined()
    })
  })
})
