// src/config/interviewTracks.ts

export type InterviewRoleFamily =
  | 'technology'
  | 'data'
  | 'design'
  | 'marketing'
  | 'sales'
  | 'business'
  | 'finance'
  | 'human_resources'
  | 'operations'
  | 'customer_support'
  | 'healthcare'
  | 'education'
  | 'general';

export type InterviewTrack =
  | 'behavioral'
  | 'technical'
  | 'coding'
  | 'project_deep_dive'
  | 'system_design'
  | 'campaign_strategy'
  | 'marketing_analytics'
  | 'communication'
  | 'product_pitch'
  | 'objection_handling'
  | 'customer_roleplay'
  | 'portfolio_review';

export interface InterviewTrackConfig {
  roleFamily: InterviewRoleFamily;
  defaultTracks: InterviewTrack[];
  competencies: string[];
  scoringDimensions: string[];
  recommendedDuration: number;
  supportsVoice: boolean;
  supportsCodeEditor: boolean;
  supportsWhiteboard: boolean;
}

export const developerInterviewConfig: InterviewTrackConfig = {
  roleFamily: 'technology',
  defaultTracks: [
    'behavioral',
    'technical',
    'project_deep_dive',
    'coding',
    'system_design'
  ],
  competencies: [
    'problem_solving',
    'data_structures',
    'coding',
    'debugging',
    'system_thinking',
    'testing',
    'communication',
    'project_ownership'
  ],
  scoringDimensions: [
    'correctness',
    'complexity',
    'code_quality',
    'edge_cases',
    'technical_depth',
    'clarity',
    'communication'
  ],
  recommendedDuration: 30,
  supportsVoice: true,
  supportsCodeEditor: true,
  supportsWhiteboard: true
};

export const marketingInterviewConfig: InterviewTrackConfig = {
  roleFamily: 'marketing',
  defaultTracks: [
    'behavioral',
    'campaign_strategy',
    'marketing_analytics',
    'communication'
  ],
  competencies: [
    'audience_understanding',
    'campaign_planning',
    'content_strategy',
    'analytics',
    'creativity',
    'communication',
    'business_awareness'
  ],
  scoringDimensions: [
    'strategy',
    'customer_understanding',
    'creativity',
    'evidence',
    'business_impact',
    'clarity',
    'communication'
  ],
  recommendedDuration: 25,
  supportsVoice: true,
  supportsCodeEditor: false,
  supportsWhiteboard: false
};

export const salesInterviewConfig: InterviewTrackConfig = {
  roleFamily: 'sales',
  defaultTracks: [
    'behavioral',
    'product_pitch',
    'objection_handling',
    'customer_roleplay'
  ],
  competencies: [
    'communication',
    'active_listening',
    'persuasion',
    'negotiation',
    'customer_understanding',
    'resilience'
  ],
  scoringDimensions: [
    'clarity',
    'discovery',
    'persuasion',
    'objection_handling',
    'customer_focus',
    'confidence',
    'closing'
  ],
  recommendedDuration: 25,
  supportsVoice: true,
  supportsCodeEditor: false,
  supportsWhiteboard: false
};

export const financeInterviewConfig: InterviewTrackConfig = {
  roleFamily: 'finance',
  defaultTracks: [
    'behavioral',
    'project_deep_dive',
    'technical'
  ],
  competencies: [
    'financial_understanding',
    'accuracy',
    'numerical_reasoning',
    'risk_awareness',
    'attention_to_detail',
    'communication'
  ],
  scoringDimensions: [
    'accuracy',
    'financial_reasoning',
    'risk_awareness',
    'numerical_analysis',
    'attention_to_detail'
  ],
  recommendedDuration: 25,
  supportsVoice: true,
  supportsCodeEditor: false,
  supportsWhiteboard: false
};

export const generalInterviewConfig: InterviewTrackConfig = {
  roleFamily: 'general',
  defaultTracks: [
    'behavioral',
    'communication'
  ],
  competencies: [
    'communication',
    'problem_solving',
    'teamwork',
    'adaptability'
  ],
  scoringDimensions: [
    'clarity',
    'structure',
    'relevance',
    'evidence',
    'conciseness',
    'confidence'
  ],
  recommendedDuration: 20,
  supportsVoice: true,
  supportsCodeEditor: false,
  supportsWhiteboard: false
};

export const ROLE_INTERVIEW_CONFIGS: Record<InterviewRoleFamily, InterviewTrackConfig> = {
  technology: developerInterviewConfig,
  marketing: marketingInterviewConfig,
  sales: salesInterviewConfig,
  finance: financeInterviewConfig,
  data: developerInterviewConfig,
  design: {
    roleFamily: 'design',
    defaultTracks: ['portfolio_review', 'behavioral', 'project_deep_dive'],
    competencies: ['user_understanding', 'design_process', 'trade_offs'],
    scoringDimensions: ['problem_framing', 'user_understanding', 'design_process', 'trade_offs', 'visual_reasoning'],
    recommendedDuration: 30,
    supportsVoice: true,
    supportsCodeEditor: false,
    supportsWhiteboard: true,
  },
  human_resources: {
    roleFamily: 'human_resources',
    defaultTracks: ['behavioral', 'communication'],
    competencies: ['empathy', 'policy_awareness', 'conflict_handling'],
    scoringDimensions: ['empathy', 'policy_awareness', 'confidentiality', 'conflict_handling', 'communication', 'judgment'],
    recommendedDuration: 20,
    supportsVoice: true,
    supportsCodeEditor: false,
    supportsWhiteboard: false,
  },
  business: generalInterviewConfig,
  operations: generalInterviewConfig,
  customer_support: generalInterviewConfig,
  healthcare: generalInterviewConfig,
  education: generalInterviewConfig,
  general: generalInterviewConfig,
};

export function getInterviewConfigForRole(roleFamily: InterviewRoleFamily | null): InterviewTrackConfig {
  if (!roleFamily || !ROLE_INTERVIEW_CONFIGS[roleFamily]) {
    return generalInterviewConfig;
  }
  return ROLE_INTERVIEW_CONFIGS[roleFamily];
}
