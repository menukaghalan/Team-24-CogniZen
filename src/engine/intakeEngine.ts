// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Intake Engine
// Translates self-reported intake answers into a mathematically grounded
// initial CDI prior and distortion vector seed.
//
// Model design:
//   • Burnout frequency carries 35% weight — strongest signal of cognitive drift.
//   • Satisfaction uses prospect-theory asymmetry (λ≈2.2): low scores penalise
//     more steeply than high scores reward (mirrors computeLossAversion).
//   • Career clarity proxies temporalDiscount — low clarity collapses time
//     horizon, raising impulsive / avoidant cognition.
//   • Emotional state proxies negativityBias + catastrophizing.
//   • Age modulates evidence confidence, not CDI magnitude.
//   • Output is clamped [15, 82] — extremes require behavioural evidence.
// ─────────────────────────────────────────────────────────────────────────────

import {
  AgeRange, BurnoutLevel, ClarityLevel, DistortionVector,
  EmotionalState, IntakeAnswers, OccupationStatus,
} from './types';

// ── Age → evidence-confidence factor (does NOT shift CDI directly) ────────────
// Younger users have higher baseline variance; trust self-report less.
export const AGE_MIDPOINTS: Record<AgeRange, number> = {
  '18-21': 20,
  '22-24': 23,
  '25-28': 27,
  '29-35': 32,
  '36+':   40,
};

// ── Occupation base vulnerability ─────────────────────────────────────────────
// Calibrated from burnout research: career-transition periods show highest drift.
const OCCUPATION_BASE: Record<OccupationStatus, number> = {
  recentGrad:  0.62,   // highest — transition + expectation gap
  student:     0.50,   // high uncertainty, lower external pressure
  earlyWorker: 0.44,   // adapting, but more structure
  other:       0.38,
};

// ── Clarity → decisionAvoidance proxy ────────────────────────────────────────
const CLARITY_SCORE: Record<ClarityLevel, number> = {
  clear:    0.10,
  somewhat: 0.30,
  unclear:  0.60,
  lost:     0.90,
};

// ── Burnout → composite stress signal ────────────────────────────────────────
const BURNOUT_SCORE: Record<BurnoutLevel, number> = {
  rarely:    0.10,
  sometimes: 0.32,
  often:     0.65,
  always:    0.90,
};

// ── Emotional state → negativityBias proxy ───────────────────────────────────
const EMOTIONAL_SCORE: Record<EmotionalState, number> = {
  good:       0.10,
  neutral:    0.32,
  struggling: 0.62,
  hard:       0.88,
};

// ── Satisfaction → effortReward proxy (prospect-theory weighted) ──────────────
// Loss-aversion multiplier λ=2.2: scores below neutral (3) penalise more
// steeply than scores above 3 reward.
function satisfactionScore(s: number): number {
  const neutral = 3;
  const delta = s - neutral;                    // −2 … +2
  if (delta < 0) {
    return 0.50 + Math.abs(delta) * 0.20 * 2.2; // losses amplified by λ
  }
  return 0.50 - delta * 0.20;                   // gains at face value
}

// ── Primary export: compute initial CDI from intake answers ──────────────────
export function computeIntakeCDI(answers: IntakeAnswers): number {
  const occupationBase = OCCUPATION_BASE[answers.occupationStatus];

  // Weighted composite (weights sum to 1.0)
  const composite =
    CLARITY_SCORE[answers.careerClarity]      * 0.20 +
    satisfactionScore(answers.satisfaction)    * 0.20 +
    BURNOUT_SCORE[answers.burnout]             * 0.35 +
    EMOTIONAL_SCORE[answers.emotionalState]    * 0.25;

  // Scale: tuned so worst-case → ~82, median → ~35, best-case → ~15
  const raw = composite * occupationBase * 180;
  return Math.round(Math.max(15, Math.min(82, raw)));
}

// ── Compute initial distortion priors for the adaptive engine ─────────────────
// These seed the first session's context — they decay as behavioural
// evidence accumulates through bayesianCDIUpdate.
export function computeIntakeDistortionPriors(
  answers: IntakeAnswers,
): Partial<DistortionVector> {
  return {
    decisionAvoidance: CLARITY_SCORE[answers.careerClarity],
    effortReward:      satisfactionScore(answers.satisfaction),
    temporalDiscount:  BURNOUT_SCORE[answers.burnout] * 0.85,
    negativityBias:    EMOTIONAL_SCORE[answers.emotionalState],
    catastrophizing:   EMOTIONAL_SCORE[answers.emotionalState] * 0.80,
    allOrNothing:      CLARITY_SCORE[answers.careerClarity] * 0.70,
  };
}
