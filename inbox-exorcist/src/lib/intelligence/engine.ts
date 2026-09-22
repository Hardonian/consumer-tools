import type { 
  EmailMetadata, 
  IntelligenceConfig, 
  IntelligenceReport, 
  SafetyRule, 
  SenderPattern, 
  EdgeCase,
  Decision
} from './types.ts';
import configJson from '../../../intelligence/v1/config.json' with { type: 'json' };
import safetyRulesJson from '../../../intelligence/v1/safety_rules.json' with { type: 'json' };
import senderPatternsJson from '../../../intelligence/v1/sender_patterns.json' with { type: 'json' };
import edgeCasesJson from '../../../intelligence/v1/edge_cases.json' with { type: 'json' };

let defaultEngineInstance: IntelligenceEngine | null = null;

export function getDefaultIntelligenceEngine(): IntelligenceEngine {
  if (!defaultEngineInstance) {
    defaultEngineInstance = new IntelligenceEngine(
      configJson as unknown as IntelligenceConfig,
      ((senderPatternsJson as unknown as { patterns: SenderPattern[] }).patterns) || [],
      ((safetyRulesJson as unknown as { rules: SafetyRule[] }).rules) || [],
      ((edgeCasesJson as unknown as { cases: EdgeCase[] }).cases) || []
    );
  }
  return defaultEngineInstance;
}

export class IntelligenceEngine {
  private config: IntelligenceConfig;
  private patterns: SenderPattern[];
  private safetyRules: SafetyRule[];
  private edgeCases: EdgeCase[];

  constructor(
    config: IntelligenceConfig,
    patterns: SenderPattern[],
    safetyRules: SafetyRule[],
    edgeCases: EdgeCase[]
  ) {
    this.config = config;
    this.patterns = patterns;
    this.safetyRules = safetyRules;
    this.edgeCases = edgeCases;
  }

  public analyze(email: EmailMetadata): IntelligenceReport {
    let score = this.config.engine_settings.default_base_score;
    const matchingRules: string[] = [];
    const matchingPatterns: string[] = [];
    let detectedCategory = 'general';
    let forcedDecision: Decision | null = null;
    let explanation = '';

    // 1. Safety Rules (Highest Priority)
    if (this.config.engine_settings.safety_override_enabled) {
      for (const rule of this.safetyRules) {
        if (this.matchesSafetyRule(email, rule)) {
          matchingRules.push(rule.id);
          if (rule.action === 'FORCE_KEEP') {
            forcedDecision = 'keep';
            score = 100;
            explanation = `Safety override: ${rule.description}`;
            detectedCategory = rule.category;
            break; 
          }
          // PROTECT adds a large boost but doesn't necessarily force keep immediately
          score += 50; 
          detectedCategory = rule.category;
        }
      }
    }

    if (forcedDecision) {
      return this.generateReport(forcedDecision, score, matchingRules, matchingPatterns, detectedCategory, explanation);
    }

    // 2. Sender Patterns
    for (const p of this.patterns) {
      if (this.matchesSenderPattern(email.sender, p)) {
        matchingPatterns.push(p.pattern);
        
        // Apply category multiplier if defined
        const multiplier = this.config.weight_modifiers.category_multipliers[p.category] || 1.0;
        score += p.score_modifier * multiplier;
        
        // Use the category of the strongest match if not already set by safety
        if (detectedCategory === 'general') {
          detectedCategory = p.category;
        }
      }
    }

    // 3. Header Analysis
    if (email.headers['List-Unsubscribe']) {
      score += this.config.weight_modifiers.header_weights.list_unsubscribe_exists;
    }
    if (email.subject.toLowerCase().startsWith('re:')) {
      score += this.config.weight_modifiers.header_weights.thread_index_exists;
    }

    // 4. Edge Cases (Heuristics)
    if (this.config.engine_settings.edge_case_enabled) {
      for (const edge of this.edgeCases) {
        if (this.matchesEdgeCase(email, edge)) {
          matchingRules.push(edge.id);
          if (edge.action === 'bypass_classification' || edge.action === 'FORCE_KEEP') {
            forcedDecision = 'keep';
            score = Math.max(score, 90);
            explanation = `Edge case detected: ${edge.description}`;
            break;
          }
          if (edge.action === 'elevate_priority') {
            score += 30;
          }
        }
      }
    }

    if (forcedDecision) {
      return this.generateReport(forcedDecision, score, matchingRules, matchingPatterns, detectedCategory, explanation);
    }

    // 5. Final Decision based on thresholds
    const decision = this.calculateDecision(score);
    explanation = explanation || `Score ${score.toFixed(0)} based on matched patterns and headers.`;

    return this.generateReport(decision, score, matchingRules, matchingPatterns, detectedCategory, explanation);
  }

  private matchesSafetyRule(email: EmailMetadata, rule: SafetyRule): boolean {
    const subject = email.subject.toLowerCase();
    const sender = email.sender.toLowerCase();

    if (rule.match.subject_keywords?.some(k => subject.includes(k.toLowerCase()))) {
      return true;
    }
    if (rule.match.sender_fragments?.some(f => sender.includes(f.toLowerCase()))) {
      return true;
    }
    return false;
  }

  private matchesSenderPattern(sender: string, p: SenderPattern): boolean {
    const s = sender.toLowerCase();
    const pat = p.pattern.toLowerCase();
    
    if (p.type === 'domain') {
      return s.endsWith(`@${pat}`) || s.endsWith(`.${pat}`);
    }
    return s.includes(pat);
  }

  private matchesEdgeCase(email: EmailMetadata, edge: EdgeCase): boolean {
    // Simple implementation for now - in production this would be a more robust DSL or rule engine
    const subject = email.subject.toLowerCase();
    const body = email.body.toLowerCase();

    if (edge.id === 'EC_OTP_001') {
      return (subject.includes('code') || subject.includes('otp')) && /\d{4,8}/.test(body);
    }
    if (edge.id === 'EC_CAL_001') {
      return !!(email.has_attachments && (email.attachment_types?.includes('text/calendar') || email.attachment_types?.includes('application/ics')));
    }
    // Add more specific logic for other edge cases as they are refined
    return false;
  }

  private calculateDecision(score: number): Decision {
    const { junk_threshold, keep_threshold } = this.config.engine_settings;
    
    if (score <= junk_threshold) return 'junk';
    if (score >= keep_threshold) return 'keep';
    return 'review';
  }

  private generateReport(
    decision: Decision, 
    score: number, 
    rules: string[], 
    patterns: string[], 
    category: string,
    explanation: string
  ): IntelligenceReport {
    // Clamp score
    const clampedScore = Math.max(
      this.config.engine_settings.score_clamping.min, 
      Math.min(this.config.engine_settings.score_clamping.max, score)
    );

    return {
      decision,
      final_score: clampedScore,
      matching_rules: rules,
      matching_patterns: patterns,
      category,
      explanation
    };
  }
}
