import { describe, it, expect } from 'vitest'
import { suspiciousSignals, safeSignals, getSuspiciousSignal, getSafeSignal } from '@/lib/intel/signalRegistry'
import { categoryRules, edgeCases, getCategoryRule, detectCategory, getEdgeCase } from '@/lib/intel/categoryRegistry'

describe('signalRegistry', () => {
  it('has suspicious signals defined', () => {
    expect(suspiciousSignals.length).toBeGreaterThan(0)
  })

  it('has safe signals defined', () => {
    expect(safeSignals.length).toBeGreaterThan(0)
  })

  it('all suspicious signals have required fields', () => {
    for (const signal of suspiciousSignals) {
      expect(signal.name).toBeDefined()
      expect(signal.description).toBeDefined()
      expect(signal.weight).toBeDefined()
      expect(signal.example).toBeDefined()
      expect(signal.explanation).toBeDefined()
    }
  })

  it('suspicious signal weights are positive', () => {
    for (const signal of suspiciousSignals) {
      expect(signal.weight).toBeGreaterThan(0)
    }
  })

  it('getSuspiciousSignal returns correct signal', () => {
    const signal = getSuspiciousSignal('temporal_sync')
    expect(signal).toBeDefined()
    expect(signal?.name).toBe('temporal_sync')
  })

  it('getSafeSignal returns correct signal', () => {
    const signal = getSafeSignal('verified_consistent')
    expect(signal).toBeDefined()
    expect(signal?.name).toBe('verified_consistent')
  })

  it('temporal_sync has high weight', () => {
    const signal = getSuspiciousSignal('temporal_sync')
    expect(signal?.weight).toBe(15)
  })

  it('safety_concern has highest weight', () => {
    const signal = getSuspiciousSignal('safety_concern')
    expect(signal?.weight).toBe(25)
  })
})

describe('categoryRegistry', () => {
  it('has category rules defined', () => {
    expect(categoryRules.length).toBeGreaterThan(0)
  })

  it('has edge cases defined', () => {
    expect(edgeCases.length).toBeGreaterThan(0)
  })

  it('getCategoryRule returns correct rule', () => {
    const rule = getCategoryRule('electronics')
    expect(rule).toBeDefined()
    expect(rule?.category).toBe('electronics')
  })

  it('getCategoryRule returns undefined for unknown category', () => {
    const rule = getCategoryRule('nonexistent')
    expect(rule).toBeUndefined()
  })

  it('getEdgeCase returns correct edge case', () => {
    const ec = getEdgeCase('EC-01')
    expect(ec).toBeDefined()
    expect(ec?.id).toBe('EC-01')
  })

  it('detectCategory identifies electronics', () => {
    const category = detectCategory('Wireless Bluetooth Headphones', {})
    expect(category).toBe('electronics')
  })

  it('detectCategory identifies tools', () => {
    const category = detectCategory('Cordless Drill Set', {})
    expect(category).toBe('tools')
  })

  it('detectCategory identifies apparel', () => {
    const category = detectCategory('Men Running Shoes', {})
    expect(category).toBe('apparel')
  })

  it('detectCategory identifies digital', () => {
    const category = detectCategory('Photo Editing Software Subscription', {})
    expect(category).toBe('digital')
  })

  it('detectCategory defaults to general', () => {
    const category = detectCategory('Mystery Box Item', {})
    expect(category).toBe('general')
  })

  it('electronics has safety adjustment', () => {
    const rule = getCategoryRule('electronics')
    expect(rule?.adjustments.safety_concern).toBe(1.5)
  })

  it('tools has highest safety adjustment', () => {
    const rule = getCategoryRule('tools')
    expect(rule?.adjustments.safety_concern).toBe(1.6)
  })
})
