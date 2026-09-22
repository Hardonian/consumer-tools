import { describe, it, expect } from 'vitest'
import { failureScenarios, getFailureScenario, getFailureByTrigger, getAllFailureIds } from '@/lib/intel/failureRegistry'

describe('failureRegistry', () => {
  it('has 50 failure scenarios', () => {
    expect(failureScenarios.length).toBe(50)
  })

  it('all scenarios have unique IDs', () => {
    const ids = failureScenarios.map((fs) => fs.id)
    const uniqueIds = new Set(ids)
    expect(uniqueIds.size).toBe(50)
  })

  it('all scenarios have required fields', () => {
    for (const fs of failureScenarios) {
      expect(fs.id).toBeDefined()
      expect(fs.scenario).toBeDefined()
      expect(fs.trigger).toBeDefined()
      expect(fs.expectedBehavior).toBeDefined()
      expect(fs.badBehavior).toBeDefined()
      expect(fs.fix).toBeDefined()
      expect(fs.userMessage).toBeDefined()
      expect(fs.confidenceImpact).toBeDefined()
      expect(fs.testCase).toBeDefined()
    }
  })

  it('confidenceImpact is between 0 and 100', () => {
    for (const fs of failureScenarios) {
      expect(fs.confidenceImpact).toBeGreaterThanOrEqual(0)
      expect(fs.confidenceImpact).toBeLessThanOrEqual(100)
    }
  })

  it('getFailureScenario returns correct scenario', () => {
    const fs = getFailureScenario('FS-01')
    expect(fs).toBeDefined()
    expect(fs?.id).toBe('FS-01')
    expect(fs?.scenario).toContain('Rate limiting')
  })

  it('getFailureScenario returns undefined for missing ID', () => {
    const fs = getFailureScenario('FS-99')
    expect(fs).toBeUndefined()
  })

  it('getFailureByTrigger finds scenario by trigger keyword', () => {
    const fs = getFailureByTrigger('429')
    expect(fs).toBeDefined()
    expect(fs?.id).toBe('FS-01')
  })

  it('getAllFailureIds returns all IDs correctly', () => {
    const ids = getAllFailureIds()
    const expectedIds = failureScenarios.map((fs) => fs.id)
    expect(ids).toEqual(expectedIds)
  })

  // Verify key failure scenarios exist
  it('FS-02 covers CAPTCHA', () => {
    const fs = getFailureScenario('FS-02')
    expect(fs?.scenario).toContain('CAPTCHA')
  })

  it('FS-04 covers empty 200 / out of stock', () => {
    const fs = getFailureScenario('FS-04')
    expect(fs?.scenario).toContain('out of stock')
  })

  it('FS-05 covers WAF 403', () => {
    const fs = getFailureScenario('FS-05')
    expect(fs?.trigger).toContain('403')
  })

  it('FS-14 covers timeout', () => {
    const fs = getFailureScenario('FS-14')
    expect(fs?.scenario).toContain('timeout')
  })

  it('FS-50 covers complete unavailability', () => {
    const fs = getFailureScenario('FS-50')
    expect(fs?.scenario).toContain('unreachable')
  })
})
