import { test, describe } from 'node:test';
import assert from 'node:assert';
import { IntelligenceEngine } from '../../src/lib/intelligence/engine.ts';
import type { EmailMetadata, IntelligenceConfig, SafetyRule } from '../../src/lib/intelligence/types.ts';

describe('IntelligenceEngine Unit Tests', () => {
  const mockConfig: IntelligenceConfig = {
    version: '1.0.0',
    last_updated: '2026-04-29T00:00:00Z',
    engine_settings: {
      default_base_score: 50,
      junk_threshold: 40,
      keep_threshold: 80,
      uncertainty_buffer: 10,
      safety_override_enabled: true,
      edge_case_enabled: true,
      score_clamping: { min: 0, max: 100 }
    },
    weight_modifiers: {
      category_multipliers: { finance: 1.5, security: 2.0 },
      header_weights: { list_unsubscribe_exists: -20, thread_index_exists: 30 }
    },
    auto_actions: {
      immediate_junk_below: 20,
      immediate_keep_above: 90,
      flag_for_review_range: [20, 90]
    }
  };

  const mockSafetyRules: SafetyRule[] = [
    {
      id: 'SR_FIN_001',
      category: 'finance',
      description: 'Bank Statement',
      match: { subject_keywords: ['statement'], sender_fragments: ['bank'] },
      action: 'FORCE_KEEP',
      risk_level: 'critical'
    }
  ];

  const engine = new IntelligenceEngine(mockConfig, [], mockSafetyRules, []);

  test('should force keep a bank statement based on safety rules', () => {
    const email: EmailMetadata = {
      sender: 'alerts@bank.com',
      subject: 'Your monthly statement is ready',
      body: 'View your statement online.',
      headers: {},
      has_attachments: false
    };

    const report = engine.analyze(email);
    assert.strictEqual(report.decision, 'keep');
    assert.strictEqual(report.final_score, 100);
    assert.match(report.explanation, /Safety override/);
  });

  test('should identify junk based on score threshold', () => {
    const engineWithJunk = new IntelligenceEngine(mockConfig, [
      { pattern: 'newsletter.com', type: 'domain', category: 'promotional', score_modifier: -30, description: 'Spammy newsletter' }
    ], [], []);

    const email: EmailMetadata = {
      sender: 'news@newsletter.com',
      subject: 'Daily spam',
      body: 'Click here to buy stuff.',
      headers: { 'List-Unsubscribe': 'true' },
      has_attachments: false
    };

    const report = engineWithJunk.analyze(email);
    // Base 50 - 30 (pattern) - 20 (header) = 0
    assert.strictEqual(report.decision, 'junk');
    assert.strictEqual(report.final_score, 0);
  });
});
