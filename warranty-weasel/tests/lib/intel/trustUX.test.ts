import { describe, it, expect } from 'vitest';
import { trustUX } from '@/lib/intel/trustUX';

describe('trustUX', () => {
  it('should export an array of TrustMessage objects', () => {
    expect(Array.isArray(trustUX)).toBe(true);
    expect(trustUX.length).toBeGreaterThan(0);
  });

  it('should have valid types', () => {
    const validTypes = ['UNKNOWN', 'CAUTION', 'AVOID', 'SAFE', 'LIMITATION'];
    for (const item of trustUX) {
      expect(validTypes).toContain(item.type);
    }
  });

  it('should have at least one message for each type', () => {
    for (const item of trustUX) {
      expect(Array.isArray(item.messages)).toBe(true);
      expect(item.messages.length).toBeGreaterThan(0);
    }
  });

  it('should contain only non-empty strings in messages', () => {
    for (const item of trustUX) {
      for (const message of item.messages) {
        expect(typeof message).toBe('string');
        expect(message.trim().length).toBeGreaterThan(0);
      }
    }
  });
});
