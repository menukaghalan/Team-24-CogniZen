export type AgeRange = '18-21' | '22-24' | '25-28' | '29-35' | '36+';
export type OccupationStatus = 'student' | 'recentGrad' | 'earlyWorker' | 'other';
export type ClarityLevel = 'clear' | 'somewhat' | 'unclear' | 'lost';
export type BurnoutLevel = 'rarely' | 'sometimes' | 'often' | 'always';
export type EmotionalState = 'good' | 'neutral' | 'struggling' | 'hard';

export interface IntakeAnswers {
  name: string;                    // first name, collected at start of intake
  ageRange: AgeRange;
  age: number;                    // numeric midpoint derived from ageRange
  occupationStatus: OccupationStatus;
  careerClarity: ClarityLevel;
  satisfaction: number;           // 1–5
  burnout: BurnoutLevel;
  emotionalState: EmotionalState;
  completedAt: number;
}

export type DistortionKey =
  | 'temporalDiscount'
  | 'negativityBias'
  | 'allOrNothing'
  | 'decisionAvoidance'
  | 'catastrophizing'
  | 'effortReward';

export type DistortionVector = Record<DistortionKey, number>;

export interface ChoiceRecord {
  scenarioId: string;
  choiceIndex: number;
  distortion: DistortionKey;
  signalWeight: number;
  responseTimeMs: number;
  timestamp: number;
}

export interface Session {
  id: string;
  startedAt: number;
  completedAt?: number;
  choices: ChoiceRecord[];
  distortionVector: DistortionVector;
  cdiScore: number;
  dominantDistortion: DistortionKey;
  trend: 'improving' | 'stable' | 'drifting';
}

export interface UserProfile {
  userId: string;
  createdAt: number;
  sessions: Session[];
  currentCDI: number;
  cdiHistory: { timestamp: number; score: number }[];
  adaptiveState: AdaptiveState;
  preferences: UserPreferences;
  hasCompletedIntake: boolean;
  intakeAnswers?: IntakeAnswers;
}

export type CompanionCharacter = 'mochi' | 'pangoro' | 'piplup';

export interface UserPreferences {
  showCDIScore: boolean;
  selectedCompanion: CompanionCharacter;
}

export interface BurnoutForecast {
  status: 'insufficient_data' | 'watching' | 'approaching' | 'crossed';
  sampleCount: number;
  threshold: number;           // normalized 0–1 threshold
  latestCI: number;            // normalized latest CI
  compositeRisk: number;       // blended current-risk score after feature calibration
  slopePerDay: number;         // normalized CI change per day
  projectedDays: number | null;
  projectedTimestamp: number | null;
  confidence: 'low' | 'moderate' | 'high';
  confidenceLabel: string;
  rSquared: number;
  spanDays: number;
}

export interface AdaptiveState {
  trajectory: 'recovering' | 'stable' | 'worsening' | 'unknown';
  streakCount: number;
  streakDirection: 'up' | 'down' | 'flat';
  topDistortion: DistortionKey;
  nextSessionMode: SessionMode;
  positivityBank: number;
  totalSessions: number;
}

export type SessionMode = 'explore' | 'challenge' | 'nurture' | 'celebrate' | 'probe';

export interface Scenario {
  id: string;
  distortion: DistortionKey;
  difficulty: 1 | 2 | 3;
  realmName: string;
  narrativePrompt: string;
  choices: ScenarioChoice[];
  positiveReframe: string;
}

export interface ScenarioChoice {
  text: string;
  signalWeight: number;
  _signal: string;
}

// ── Games ─────────────────────────────────────────────────────────────────────

export type GameType = 'reactionTap' | 'stroop' | 'patternMemory' | 'maze' | 'creative';

export interface GameResult {
  gameType: GameType;
  completedAt: number;
  score: number;         // 0–100, higher = better performance
  accuracy: number;      // 0–1
  avgResponseMs: number;
  rawMetrics: Record<string, number>;
}
