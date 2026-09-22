export type Decision = 'keep' | 'junk' | 'review';

export interface SenderPattern {
  pattern: string;
  type: 'domain' | 'name_fragment';
  score_modifier: number;
  category: string;
  description: string;
}

export interface SafetyRule {
  id: string;
  category: string;
  description: string;
  match: {
    subject_keywords?: string[];
    sender_fragments?: string[];
  };
  action: 'FORCE_KEEP' | 'PROTECT';
  risk_level: 'critical' | 'high' | 'medium' | 'low';
}

export interface EdgeCase {
  id: string;
  scenario: string;
  criteria: string;
  logic_type: string;
  action: string;
  description: string;
}

export interface EngineSettings {
  junk_threshold: number;
  keep_threshold: number;
  uncertainty_buffer: number;
  safety_override_enabled: boolean;
  edge_case_enabled: boolean;
  default_base_score: number;
  score_clamping: {
    min: number;
    max: number;
  };
}

export interface IntelligenceConfig {
  version: string;
  last_updated: string;
  engine_settings: EngineSettings;
  weight_modifiers: {
    category_multipliers: Record<string, number>;
    header_weights: Record<string, number>;
  };
  auto_actions: {
    immediate_junk_below: number;
    immediate_keep_above: number;
    flag_for_review_range: [number, number];
  };
}

export interface EmailMetadata {
  sender: string;
  subject: string;
  body: string;
  headers: Record<string, string>;
  has_attachments: boolean;
  attachment_types?: string[];
}

export interface IntelligenceReport {
  decision: Decision;
  final_score: number;
  matching_rules: string[];
  matching_patterns: string[];
  category: string;
  explanation: string;
}
