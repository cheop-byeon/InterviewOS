export type ActiveTab =
  | "dashboard"
  | "ats_lab"
  | "system_design"
  | "mock_interview"
  | "visual_library"
  | "question_bank"
  | "job_crm";

export type TargetLevel = "L4" | "L5" | "L6";

export interface LLMConfig {
  mode: "hybrid_local" | "openai" | "gemini" | "anthropic";
  apiKey: string;
  model: string;
}

// ==========================================
// 1. ATS RESUME LAB & XYZ BULLET OPTIMIZER
// ==========================================

export interface KeywordItem {
  keyword: string;
  category: "hard_skill" | "architecture" | "soft_skill" | "tooling";
  foundInResume: boolean;
  frequencyInResume: number;
  importance: "critical" | "recommended" | "bonus";
}

export interface BulletCritique {
  id: string;
  original: string;
  score: number; // 0-100
  hasActionVerb: boolean;
  hasQuantifiedMetric: boolean;
  isPassive: boolean;
  issues: string[];
  xyzRewrite: string;
  explanation: string;
}

export interface FormattingCheck {
  id: string;
  label: string;
  passed: boolean;
  detail: string;
}

export interface PrepRecommendation {
  skillGap: string;
  recommendedModule: ActiveTab;
  targetTopicId: string;
  actionLabel: string;
  reason: string;
}

export interface ResumeScanResult {
  overallScore: number;
  hardSkillMatchPct: number;
  architectureMatchPct: number;
  impactMetricScore: number;
  parsabilityScore: number;
  detectedRole: string;
  detectedLevel: TargetLevel;
  keywords: KeywordItem[];
  bulletCritiques: BulletCritique[];
  formattingChecks: FormattingCheck[];
  prepRecommendations: PrepRecommendation[];
  executiveSummary: string;
}

export interface ResumeJDPreset {
  id: string;
  title: string;
  company: string;
  level: TargetLevel;
  resumeText: string;
  jdText: string;
}

// ==========================================
// 2. SYSTEM DESIGN GUIDED PRACTICE (HELLOINTERVIEW STYLE)
// ==========================================

export type DeliveryStageId =
  | "requirements"
  | "estimation"
  | "api_data"
  | "high_level_design"
  | "deep_dives";

export type NodeCategory =
  | "client"
  | "edge"
  | "compute"
  | "cache"
  | "database"
  | "queue"
  | "search_ai";

export interface CanvasNode {
  id: string;
  label: string;
  sublabel: string;
  category: NodeCategory;
  x: number;
  y: number;
}

export interface CanvasEdge {
  id: string;
  from: string;
  to: string;
  protocol?: string;
}

export interface StepEvaluationResult {
  stageId: DeliveryStageId;
  score: number; // 0-100
  status: "strong" | "acceptable" | "needs_work";
  coveredPoints: string[];
  missedPoints: string[];
  interviewerFeedback: string;
  levelCalibrationNote: string;
}

export interface SystemDesignProblem {
  id: string;
  title: string;
  companyTags: string[];
  difficulty: "Medium" | "Hard" | "Staff+";
  category: "Distributed Systems" | "Real-Time & Geo" | "GenAI & ML Systems" | "Core Infrastructure";
  estimatedMinutes: number;
  promptSummary: string;
  functionalRequirements: string[];
  nonFunctionalRequirements: string[];
  capacityDefaults: {
    dau: string;
    readQps: string;
    writeQps: string;
    storagePerYear: string;
    bandwidth: string;
  };
  apiEndpoints: {
    method: "GET" | "POST" | "PUT" | "DELETE" | "WS";
    path: string;
    description: string;
    payload: string;
  }[];
  coreEntities: {
    table: string;
    dbType: string;
    schema: string;
    partitionKey: string;
  }[];
  starterNodes: CanvasNode[];
  starterEdges: CanvasEdge[];
  referenceNodes: CanvasNode[];
  referenceEdges: CanvasEdge[];
  requiredArchitectureKeywords: string[];
  deepDiveQuestions: {
    level: TargetLevel;
    question: string;
    idealTradeoff: string;
    keywords: string[];
  }[];
}

// ==========================================
// 3. LIVE AI MOCK INTERVIEW STUDIO & REAL CODE RUNNER
// ==========================================

export type InterviewMode =
  | "system_design"
  | "coding"
  | "behavioral"
  | "resume_jd";

export interface InterviewMessage {
  id: string;
  role: "interviewer" | "candidate" | "system_coach";
  content: string;
  timestamp: string;
  stageTag?: string;
  liveSignal?: {
    clarity: number;
    depth: number;
    hint?: string;
  };
}

export interface RubricDimension {
  dimension: string;
  score: number; // 1.0 - 4.0 (FAANG scale)
  maxScore: number;
  verdict: "Exceeds" | "Meets" | "Below";
  feedback: string;
}

export interface InterviewScorecard {
  overallHireSignal: "Strong Hire" | "Hire" | "Lean Hire" | "Lean No-Hire";
  calibratedLevel: TargetLevel;
  overallScorePct: number;
  dimensions: RubricDimension[];
  strengths: string[];
  growthAreas: string[];
  sampleStrongerAnswer: string;
}

export interface CodingProblem {
  id: string;
  title: string;
  pattern: string;
  difficulty: "Medium" | "Hard";
  companies: string[];
  prompt: string;
  examples: { input: string; output: string; explanation: string }[];
  starterCode: string;
  starterCodePy: string;
  optimalSolution: string;
  timeComplexity: string;
  spaceComplexity: string;
  keyInsights: string[];
  testCases: {
    input: string;
    expected: string;
    runnerCodeJs: string;
    runnerCodePy: string;
  }[];
}

// ==========================================
// 4. VISUAL LIBRARY (BYTEBYTEGO STYLE)
// ==========================================

export interface ArchitectureEvolutionStep {
  stepNumber: number;
  title: string;
  scaleTarget: string;
  bottleneckSolved: string;
  explanation: string;
  activeComponents: string[];
  metrics: { latency: string; availability: string; maxThroughput: string };
}

export interface CodingPatternVisual {
  id: string;
  name: string;
  whenToUse: string[];
  timeComplexity: string;
  templateSnippet: string;
  classicProblems: string[];
  arrayDemo: {
    array: (number | string)[];
    steps: {
      stepTitle: string;
      leftIdx: number;
      rightIdx: number;
      highlightIndices: number[];
      windowState: string;
      explanation: string;
    }[];
  };
}

// ==========================================
// 5. CROWDSOURCED COMPANY QUESTION BANK (ACED.IO / EXPONENT STYLE)
// ==========================================

export interface CompanyQuestionItem {
  id: string;
  company: string;
  role: "Backend / Distributed Systems" | "AI / ML Infrastructure" | "Full-Stack / Product" | "Engineering Manager";
  level: TargetLevel;
  roundType: "System Design" | "Coding" | "Behavioral" | "AI Architecture";
  questionTitle: string;
  details: string;
  askedAgo: string;
  frequency: "High Frequency" | "Trending" | "Verified Onsite";
  keyRubricSignal: string;
  linkedModule: ActiveTab;
  linkedTopicId: string;
  upvotes?: number;
}

// ==========================================
// 6. JOB APPLICATION CRM, STAR MATRIX & SESSION HISTORY
// ==========================================

export type JobStage = "wishlist" | "applied" | "oa_screen" | "onsite" | "offer";

export interface JobApplicationCard {
  id: string;
  company: string;
  role: string;
  level: TargetLevel;
  compensation: string;
  stage: JobStage;
  atsMatchScore: number;
  mockReadinessScore: number;
  nextAction: string;
  updatedAt: string;
  linkedProblemId?: string;
  notes: string;
}

export interface StarStory {
  id: string;
  title: string;
  projectContext: string;
  competencies: ("Leadership" | "Conflict Resolution" | "Ambiguity" | "Failure & Learning" | "Technical Complexity" | "Speed vs Quality")[];
  situation: string;
  task: string;
  action: string;
  resultQuantified: string;
  levelImpactNote: string;
}

export interface PracticeSessionRecord {
  id: string;
  date: string;
  type: "mock_interview" | "system_design_step" | "coding_execution";
  title: string;
  level: TargetLevel;
  scorePct: number;
  verdict: string;
}

export interface ResumeScanRecord {
  id: string;
  roleTitle: string;
  targetLevel: TargetLevel;
  overallScore: number;
  keywordMatchScore: number;
  impactMetricScore: number;
  formattingScore: number;
  matchedCount: number;
  missingCount: number;
  createdAt: string;
}

export interface UserProfileRecord {
  id: string;
  name: string;
  email: string;
  targetRole: string;
  targetLevel: TargetLevel;
  streakDays: number;
}

export interface DatabaseTelemetry {
  engine: string;
  dbPath: string;
  journalMode: string;
  fileSizeBytes: number;
  tableCounts: {
    users: number;
    system_design_problems: number;
    coding_problems: number;
    question_bank: number;
    job_applications: number;
    star_stories: number;
    practice_sessions: number;
    resume_scans: number;
  };
  aggregates: {
    avgAtsScore: number;
    avgPracticeScore: number;
    totalUpvotes: number;
    activePipelineCount: number;
  };
}
