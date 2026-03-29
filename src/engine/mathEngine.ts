// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Silent Math Engine
// Pure functions. No UI dependencies. No jargon surfaced to the user.
// ─────────────────────────────────────────────────────────────────────────────

import { BurnoutForecast, ChoiceRecord, DistortionKey, DistortionVector, GameResult, Session } from './types';

const DISTORTION_KEYS: DistortionKey[] = [
  'temporalDiscount', 'negativityBias', 'allOrNothing',
  'decisionAvoidance', 'catastrophizing', 'effortReward',
];
const DAY_MS = 24 * 60 * 60 * 1000;

export interface WearableWeeklyInput {
  avgRecovery: number;
  avgHRV: number;
  avgRestingHR: number;
  avgSleepPerformance: number;
  avgSleepDuration: number;
  avgStrain: number;
  totalStrain: number;
  peakRecovery: number;
  lowestRecovery: number;
  wellnessScore: number;
}

// ── Prospect Theory: derive loss aversion λ from negativity bias choices ──
// λ > 1 means losses are weighted more heavily than equivalent gains
// Burned-out brains show λ > 2.5 (healthy baseline ~1.5–2.0)
export function computeLossAversion(choices: ChoiceRecord[]): number {
  const relevant = choices.filter(c => c.distortion === 'negativityBias');
  if (relevant.length === 0) return 1.5; // baseline
  const avgWeight = relevant.reduce((s, c) => s + c.signalWeight, 0) / relevant.length;
  // Map signal weight 0–5 → λ 1.0–4.0
  return 1.0 + (avgWeight / 5) * 3.0;
}

// ── Hyperbolic Discounting: derive temporal myopia k ──
// Higher k = more impulsive, prefers immediate small reward
// Formula: V = A / (1 + k * D)  where D = delay, A = reward
export function computeTemporalMyopia(choices: ChoiceRecord[]): number {
  const relevant = choices.filter(c => c.distortion === 'temporalDiscount');
  if (relevant.length === 0) return 0.1; // baseline
  const avgWeight = relevant.reduce((s, c) => s + c.signalWeight, 0) / relevant.length;
  // Map 0–5 → k 0.05 (patient) to 0.8 (very impulsive)
  return 0.05 + (avgWeight / 5) * 0.75;
}

// ── Signal Detection Theory: response-time bias filter ──
// Fast responses to high-weight choices suggest System 1 (emotional) dominance
// d' = separation between signal and noise distributions
export function computeResponseBias(choices: ChoiceRecord[]): number {
  if (choices.length === 0) return 0;
  const highWeight = choices.filter(c => c.signalWeight >= 3);
  const lowWeight = choices.filter(c => c.signalWeight < 3);
  if (highWeight.length === 0 || lowWeight.length === 0) return 0;
  const avgFastMs = highWeight.reduce((s, c) => s + c.responseTimeMs, 0) / highWeight.length;
  const avgSlowMs = lowWeight.reduce((s, c) => s + c.responseTimeMs, 0) / lowWeight.length;
  // If high-distortion choices are answered faster → impulsive/automatic processing
  const ratio = avgSlowMs > 0 ? avgFastMs / avgSlowMs : 1;
  return Math.max(0, Math.min(1, 1 - ratio)); // 0 = no bias, 1 = strong impulsive bias
}

// ── Distortion Vector: 6-dim score for this session ──
export function computeDistortionVector(choices: ChoiceRecord[]): DistortionVector {
  const vector = {} as DistortionVector;
  for (const key of DISTORTION_KEYS) {
    const relevant = choices.filter(c => c.distortion === key);
    if (relevant.length === 0) {
      vector[key] = 0;
    } else {
      const avg = relevant.reduce((s, c) => s + c.signalWeight, 0) / relevant.length;
      vector[key] = Math.min(1, avg / 5);
    }
  }
  return vector;
}

// ── Bayesian CDI Update ──
// Prior = previous CDI. New evidence from this session.
// Returns updated CDI 0–100 and trend direction.
export function bayesianCDIUpdate(
  priorCDI: number,
  newVector: DistortionVector,
  sessionCount: number,
): { cdi: number; trend: Session['trend'] } {
  // Evidence strength: average across all 6 dimensions
  const evidence = DISTORTION_KEYS.reduce((s, k) => s + newVector[k], 0) / 6;
  const evidenceCDI = evidence * 100;

  // Bayesian weight: trust prior more early on, evidence more as sessions accumulate
  const evidenceWeight = Math.min(0.6, 0.15 + sessionCount * 0.05);
  const priorWeight = 1 - evidenceWeight;

  const newCDI = Math.round(priorWeight * priorCDI + evidenceWeight * evidenceCDI);
  const clamped = Math.max(0, Math.min(100, newCDI));

  const delta = clamped - priorCDI;
  const trend: Session['trend'] = delta <= -3 ? 'improving' : delta >= 5 ? 'drifting' : 'stable';

  return { cdi: clamped, trend };
}

// ── Dominant Distortion: which pattern is loudest this session ──
export function getDominantDistortion(vector: DistortionVector): DistortionKey {
  return DISTORTION_KEYS.reduce((a, b) => vector[a] >= vector[b] ? a : b);
}

export function computeWearablePhysiologyDrift(stats: WearableWeeklyInput): number {
  const recoveryDrift = 1 - stats.avgRecovery / 100;
  const hrvDrift = clamp01(1 - (stats.avgHRV - 20) / 60);
  const sleepDrift = 1 - stats.avgSleepPerformance / 100;
  const strainDrift = clamp01(stats.avgStrain / 21) * recoveryDrift;

  const raw = (
    recoveryDrift * 0.35 +
    hrvDrift * 0.3 +
    sleepDrift * 0.25 +
    strainDrift * 0.1
  ) * 100;

  return Math.round(clamp01(raw / 100) * 100);
}

export function wearableStatsToDistortionVector(stats: WearableWeeklyInput): DistortionVector {
  const recoveryDeficit = 1 - stats.avgRecovery / 100;
  const hrvDeficit = clamp01(1 - (stats.avgHRV - 20) / 60);
  const restingHRLoad = clamp01((stats.avgRestingHR - 52) / 28);
  const sleepDeficit = 1 - stats.avgSleepPerformance / 100;
  const sleepDebt = clamp01((7.5 - stats.avgSleepDuration) / 3);
  const strainLoad = clamp01(stats.avgStrain / 21);
  const volatility = clamp01((stats.peakRecovery - stats.lowestRecovery) / 50);
  const wellnessDeficit = 1 - stats.wellnessScore / 100;
  const physiology = computeWearablePhysiologyDrift(stats) / 100;

  return {
    temporalDiscount: clamp01((sleepDeficit * 0.45) + (sleepDebt * 0.2) + (strainLoad * 0.35) + (physiology * 0.1)),
    negativityBias: clamp01((recoveryDeficit * 0.35) + (restingHRLoad * 0.25) + (sleepDeficit * 0.2) + (wellnessDeficit * 0.2)),
    allOrNothing: clamp01((volatility * 0.45) + (strainLoad * 0.2) + (recoveryDeficit * 0.35)),
    decisionAvoidance: clamp01((wellnessDeficit * 0.4) + (recoveryDeficit * 0.35) + (sleepDebt * 0.25)),
    catastrophizing: clamp01((restingHRLoad * 0.4) + (recoveryDeficit * 0.35) + (volatility * 0.25)),
    effortReward: clamp01((strainLoad * 0.45) + (recoveryDeficit * 0.35) + (sleepDeficit * 0.2)),
  };
}

export function buildWhoopCDIUpdate(
  priorCDI: number,
  stats: WearableWeeklyInput,
  weekIndex: number,
): { cdi: number; trend: Session['trend']; distortionVector: DistortionVector; physiologyDrift: number } {
  const physiologyDrift = computeWearablePhysiologyDrift(stats);
  const rawVector = wearableStatsToDistortionVector(stats);
  const physiologyWeight = physiologyDrift / 100;
  const distortionVector = DISTORTION_KEYS.reduce((acc, key) => {
    acc[key] = clamp01(rawVector[key] * 0.8 + physiologyWeight * 0.2);
    return acc;
  }, {} as DistortionVector);
  const effectiveSessionCount = Math.min(9, Math.floor(weekIndex / 6) + 1);
  const { cdi, trend } = bayesianCDIUpdate(priorCDI, distortionVector, effectiveSessionCount);

  return { cdi, trend, distortionVector, physiologyDrift };
}

// ── Game → Distortion contribution ───────────────────────────────────────────
// Maps a game result to a partial distortion vector (one or two dimensions).
// Games provide weaker evidence than narrative scenarios, so contributions
// are scaled conservatively and blended via buildGameCDIUpdate.
export function gameToDistortionContribution(result: GameResult): Partial<DistortionVector> {
  // driftSignal: 0 = perfect, 1 = maximum drift
  const driftSignal = Math.max(0, Math.min(1, 1 - result.score / 100));
  // reactionSignal: maps avg response time to 0–1 (capped at 1200 ms)
  const reactionSignal = Math.min(1, result.avgResponseMs / 1200);

  switch (result.gameType) {
    case 'reactionTap':
      // Slow taps = attentional fatigue → higher temporal discount
      return { temporalDiscount: reactionSignal };
    case 'stroop':
      // Interference errors = rigid/binary processing
      return { allOrNothing: driftSignal, negativityBias: driftSignal * 0.5 };
    case 'patternMemory':
      // Poor recall = decision avoidance proxy (working-memory overload)
      return { decisionAvoidance: driftSignal };
    case 'maze':
      // Navigation struggle = catastrophizing + focus loss
      return { catastrophizing: driftSignal };
    case 'creative':
      // Negative colour/narrative choices = negativity bias signal
      return { negativityBias: driftSignal };
    default:
      return {};
  }
}

// ── Bayesian CDI update from a game result ────────────────────────────────────
// Uses a lighter evidence weight than scenario sessions (games are noisier).
export function buildGameCDIUpdate(
  priorCDI: number,
  result: GameResult,
  sessionCount: number,
): { cdi: number; trend: Session['trend'] } {
  const contribution = gameToDistortionContribution(result);

  // Fill un-measured dimensions with neutral 0.5 so only the game's
  // specific dimensions move the CDI — everything else stays put.
  const neutral: DistortionVector = {
    temporalDiscount: 0.5, negativityBias: 0.5, allOrNothing: 0.5,
    decisionAvoidance: 0.5, catastrophizing: 0.5, effortReward: 0.5,
  };
  const fullVector: DistortionVector = { ...neutral, ...contribution };

  // Games carry ≤12% evidence weight (vs scenarios which can reach 60%)
  const gameWeight = Math.min(0.12, 0.05 + sessionCount * 0.01);
  const evidence = DISTORTION_KEYS.reduce((s, k) => s + fullVector[k], 0) / 6;
  const newCDI   = Math.round((1 - gameWeight) * priorCDI + gameWeight * (evidence * 100));
  const clamped  = Math.max(0, Math.min(100, newCDI));
  const delta    = clamped - priorCDI;
  const trend: Session['trend'] = delta <= -3 ? 'improving' : delta >= 5 ? 'drifting' : 'stable';
  return { cdi: clamped, trend };
}

// ── Build a complete session object from raw choices ──
export function buildSession(
  choices: ChoiceRecord[],
  priorCDI: number,
  sessionCount: number,
  startedAt: number,
): Session {
  const distortionVector = computeDistortionVector(choices);
  const { cdi, trend } = bayesianCDIUpdate(priorCDI, distortionVector, sessionCount);
  return {
    id: `session_${Date.now()}`,
    startedAt,
    completedAt: Date.now(),
    choices,
    distortionVector,
    cdiScore: cdi,
    dominantDistortion: getDominantDistortion(distortionVector),
    trend,
  };
}

// Burnout forecast based on the last 5 CI readings.
// Uses linear regression over actual elapsed days and projects when the fitted
// line will cross the burnout threshold (default 0.75 on a 0–1 scale).
export function computeBurnoutForecast(
  history: { timestamp: number; score: number }[],
  sessions: Session[] = [],
  threshold = 0.75,
): BurnoutForecast {
  const points = history.slice(-5);
  const recentSessions = sessions.slice(-5);
  const recentChoices = recentSessions.flatMap(session => session.choices);

  if (points.length < 5) {
    return {
      status: 'insufficient_data',
      sampleCount: points.length,
      threshold,
      latestCI: points.length ? points[points.length - 1].score / 100 : 0,
      compositeRisk: points.length ? points[points.length - 1].score / 100 : 0,
      slopePerDay: 0,
      projectedDays: null,
      projectedTimestamp: null,
      confidence: 'low',
      confidenceLabel: 'Need 5 check-ins',
      rSquared: 0,
      spanDays: 0,
    };
  }

  const origin = points[0].timestamp;
  const xs = points.map(p => (p.timestamp - origin) / DAY_MS);
  const ys = points.map(p => p.score / 100);
  const lastX = xs[xs.length - 1];
  const latestCI = ys[ys.length - 1];
  const spanDays = Math.max(0, lastX);

  const meanX = xs.reduce((sum, x) => sum + x, 0) / xs.length;
  const meanY = ys.reduce((sum, y) => sum + y, 0) / ys.length;

  const varianceX = xs.reduce((sum, x) => sum + (x - meanX) ** 2, 0);
  if (varianceX === 0) {
    const compositeRisk = calibrateBurnoutRisk(latestCI, recentSessions, recentChoices);
    return {
      status: 'watching',
      sampleCount: points.length,
      threshold,
      latestCI,
      compositeRisk,
      slopePerDay: 0,
      projectedDays: null,
      projectedTimestamp: null,
      confidence: 'low',
      confidenceLabel: 'Clustered data',
      rSquared: 0,
      spanDays,
    };
  }

  const covariance = xs.reduce((sum, x, i) => sum + (x - meanX) * (ys[i] - meanY), 0);
  const slopePerDay = covariance / varianceX;
  const intercept = meanY - slopePerDay * meanX;

  const fitted = xs.map(x => intercept + slopePerDay * x);
  const ssResidual = ys.reduce((sum, y, i) => sum + (y - fitted[i]) ** 2, 0);
  const ssTotal = ys.reduce((sum, y) => sum + (y - meanY) ** 2, 0);
  const rSquared = ssTotal === 0 ? 0 : Math.max(0, 1 - ssResidual / ssTotal);
  const compositeRisk = calibrateBurnoutRisk(latestCI, recentSessions, recentChoices);

  const confidence = forecastConfidence(rSquared, spanDays, recentSessions.length);
  const confidenceLabel =
    confidence === 'high' ? 'Stronger signal' :
    confidence === 'moderate' ? 'Moderate signal' :
    'Early signal';

  const effectiveCurrentCI = Math.max(latestCI, compositeRisk);
  const effectiveSlopePerDay = slopePerDay * (0.85 + compositeRisk * 0.6);

  if (effectiveCurrentCI >= threshold) {
    return {
      status: 'crossed',
      sampleCount: points.length,
      threshold,
      latestCI,
      compositeRisk,
      slopePerDay: effectiveSlopePerDay,
      projectedDays: 0,
      projectedTimestamp: points[points.length - 1].timestamp,
      confidence,
      confidenceLabel,
      rSquared,
      spanDays,
    };
  }

  if (effectiveSlopePerDay <= 0) {
    return {
      status: 'watching',
      sampleCount: points.length,
      threshold,
      latestCI,
      compositeRisk,
      slopePerDay: effectiveSlopePerDay,
      projectedDays: null,
      projectedTimestamp: null,
      confidence,
      confidenceLabel,
      rSquared,
      spanDays,
    };
  }

  const projectedDays = (threshold - effectiveCurrentCI) / effectiveSlopePerDay;

  if (!Number.isFinite(projectedDays) || projectedDays <= 0) {
    return {
      status: 'crossed',
      sampleCount: points.length,
      threshold,
      latestCI,
      compositeRisk,
      slopePerDay: effectiveSlopePerDay,
      projectedDays: 0,
      projectedTimestamp: points[points.length - 1].timestamp,
      confidence,
      confidenceLabel,
      rSquared,
      spanDays,
    };
  }

  if (projectedDays > 180) {
    return {
      status: 'watching',
      sampleCount: points.length,
      threshold,
      latestCI,
      compositeRisk,
      slopePerDay: effectiveSlopePerDay,
      projectedDays: null,
      projectedTimestamp: null,
      confidence,
      confidenceLabel,
      rSquared,
      spanDays,
    };
  }

  const roundedDays = Math.max(1, Math.round(projectedDays));
  return {
    status: 'approaching',
    sampleCount: points.length,
    threshold,
    latestCI,
    compositeRisk,
    slopePerDay: effectiveSlopePerDay,
    projectedDays: roundedDays,
    projectedTimestamp: Date.now() + roundedDays * DAY_MS,
    confidence,
    confidenceLabel,
    rSquared,
    spanDays,
  };
}

function forecastConfidence(
  rSquared: number,
  spanDays: number,
  sessionCount: number,
): BurnoutForecast['confidence'] {
  if (rSquared >= 0.75 && spanDays >= 5 && sessionCount >= 3) return 'high';
  if (rSquared >= 0.4 && spanDays >= 2) return 'moderate';
  return 'low';
}

function calibrateBurnoutRisk(
  latestCI: number,
  recentSessions: Session[],
  recentChoices: ChoiceRecord[],
): number {
  if (recentSessions.length === 0) return latestCI;

  const distortionLoad = recentSessions.reduce((sum, session) => {
    return sum + DISTORTION_KEYS.reduce((acc, key) => acc + session.distortionVector[key], 0) / DISTORTION_KEYS.length;
  }, 0) / recentSessions.length;

  const avoidanceLoad = recentSessions.reduce((sum, session) => {
    return sum + (
      session.distortionVector.decisionAvoidance * 0.4 +
      session.distortionVector.catastrophizing * 0.35 +
      session.distortionVector.effortReward * 0.25
    );
  }, 0) / recentSessions.length;

  const lossAversion = normalizeRange(computeLossAversion(recentChoices), 1, 4);
  const temporalMyopia = normalizeRange(computeTemporalMyopia(recentChoices), 0.05, 0.8);
  const responseBias = computeResponseBias(recentChoices);

  return Math.max(
    0,
    Math.min(
      1,
      latestCI * 0.45 +
      distortionLoad * 0.2 +
      avoidanceLoad * 0.15 +
      lossAversion * 0.1 +
      temporalMyopia * 0.06 +
      responseBias * 0.04,
    ),
  );
}

function normalizeRange(value: number, min: number, max: number): number {
  if (max <= min) return 0;
  return Math.max(0, Math.min(1, (value - min) / (max - min)));
}

function clamp01(value: number): number {
  return Math.max(0, Math.min(1, value));
}
