// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Adaptive Engine
// Watches the user's pattern over time. Tailors the experience.
// No jargon. No clinical language. Just decisions about what to show next.
// ─────────────────────────────────────────────────────────────────────────────

import { AdaptiveState, Session, SessionMode } from './types';
import { cdiColor } from '../themes/tokens';

// ── Insight copy shown after choices — poetic, never clinical ──
// Keyed by distortion, written for a human who just wants to feel understood.
export const INSIGHT_COPY: Record<string, Record<string, string>> = {
  temporalDiscount: {
    high: "Your mind is hungry for relief right now. That pull toward the immediate option is real — it's your brain conserving fuel, not a character flaw.",
    medium: "You're balancing now and later pretty well. That's harder than it sounds when you're stretched thin.",
    low: "You're thinking ahead. That kind of patience is a sign your mind has some room to breathe.",
  },
  negativityBias: {
    high: "You weighed the downside heavily here. A mind that's been worn down tends to make losses feel louder than gains — it's protective, not pessimistic.",
    medium: "You're cautious, but not locked in. Your sense of risk looks proportionate.",
    low: "You processed this one with clarity. Gains and losses felt balanced — that's a healthy signal.",
  },
  allOrNothing: {
    high: "The middle path felt invisible here. Burned-out thinking often collapses options into extremes — it's cognitive economy, not stubbornness.",
    medium: "You leaned toward a clear choice, but didn't completely shut out nuance.",
    low: "You found the middle ground. That's a sign your thinking has flexibility right now.",
  },
  decisionAvoidance: {
    high: "Choosing felt costly here. When our mental reserves are low, the brain protects itself by deferring — it's exhaustion, not indecision.",
    medium: "You paused, but moved forward. That balance is healthy.",
    low: "You committed without hesitation. Your executive function is showing up for you.",
  },
  catastrophizing: {
    high: "The worst outcome felt very close in this one. Minds running on empty tend to weight catastrophe heavily as a defense — not weakness.",
    medium: "You considered the risk without being consumed by it.",
    low: "You held the uncertainty without amplifying it. That's real cognitive steadiness.",
  },
  effortReward: {
    high: "The return felt smaller than the cost to you here. That gap — between what you put in and what you get back — is one of burnout's clearest signatures.",
    medium: "Your effort-reward calibration is slightly off, but not dramatically so.",
    low: "The effort and reward felt proportionate. Your expectations and reality are in sync.",
  },
};

// ── Adaptive nudge messages — shown between sessions, not after every choice ──
export const ADAPTIVE_NUDGES = {
  recovering: [
    "Something is shifting. Your choices this week look lighter than before.",
    "The fog is lifting. Your patterns are trending toward steadiness.",
    "You're doing something right. Keep going.",
  ],
  worsening: [
    "It's been a heavy stretch. These patterns are signals, not sentences.",
    "Your mind is carrying more right now. That's okay. Just notice it.",
    "This is just data — not judgment. Something is worth attending to.",
  ],
  stable: [
    "You're holding steady. Consistency is underrated.",
    "No dramatic shifts. Sometimes stable is exactly what's needed.",
  ],
  unknown: [
    "You're just getting started. Let the pattern reveal itself slowly.",
    "Early sessions are for noticing, not judging.",
  ],
  celebrate: [
    "Three sessions improving. That's not nothing.",
    "Your cognitive flexibility is visibly expanding. This is real.",
  ],
};

// ── Weekly reframe challenges — tied to dominant distortion ──
// Gentle, non-clinical exercises. Never 'therapy homework.'
export const WEEKLY_CHALLENGES: Record<string, { title: string; prompt: string }> = {
  temporalDiscount: {
    title: "The Three-Day View",
    prompt: "Once today, before making a small decision, ask yourself: 'Would I feel differently about this in three days?' You don't have to change anything — just notice.",
  },
  negativityBias: {
    title: "The Equal Weight",
    prompt: "Find one thing today that went well — even slightly. Give it the same mental airtime as one thing that went wrong. Not positivity theater. Just balance.",
  },
  allOrNothing: {
    title: "The Third Option",
    prompt: "When you find yourself thinking 'either X or Y,' spend 30 seconds looking for a third option. It doesn't have to be better. Just notice that it exists.",
  },
  decisionAvoidance: {
    title: "The Small Commitment",
    prompt: "Make one small decision today that you'd normally defer. Doesn't matter what. The practice is just: choose, then let it be done.",
  },
  catastrophizing: {
    title: "The Probability Check",
    prompt: "When a worst-case scenario appears in your mind today, give it an honest percentage. Not to dismiss it — just to see it at its actual size.",
  },
  effortReward: {
    title: "The Effort Ledger",
    prompt: "List three things you did this week. For each one, write what you actually got back — visible or invisible. You might be richer than your brain thinks.",
  },
};

// ── Compute updated adaptive state from session history ──
export function computeAdaptiveState(
  sessions: Session[],
  currentState: AdaptiveState,
): AdaptiveState {
  if (sessions.length === 0) {
    return { ...currentState, nextSessionMode: 'explore', trajectory: 'unknown' };
  }

  const recent = sessions.slice(-5); // last 5 sessions
  const last = sessions[sessions.length - 1];
  const prev = sessions[sessions.length - 2];

  // Trajectory: compare last 3 CDI scores
  const cdiTrend = recent.slice(-3).map(s => s.cdiScore);
  const avgDelta = cdiTrend.length >= 2
    ? (cdiTrend[cdiTrend.length - 1] - cdiTrend[0]) / cdiTrend.length
    : 0;

  const trajectory: AdaptiveState['trajectory'] =
    avgDelta <= -3 ? 'recovering' :
    avgDelta >= 4  ? 'worsening' :
                     'stable';

  // Streak tracking
  const streakDirection: AdaptiveState['streakDirection'] =
    last.trend === 'improving' ? 'down' :
    last.trend === 'drifting'  ? 'up' : 'flat';

  const prevStreak = currentState.streakDirection === streakDirection
    ? currentState.streakCount
    : 0;
  const streakCount = prevStreak + 1;

  // Positivity bank: reward improving choices, gentle decay otherwise
  const positivityDelta = last.trend === 'improving' ? 12 : last.trend === 'stable' ? 2 : -8;
  const positivityBank = Math.max(0, Math.min(100, currentState.positivityBank + positivityDelta));

  // Session mode decision
  let nextSessionMode: SessionMode;
  const totalSessions = sessions.length;

  if (totalSessions <= 2) {
    nextSessionMode = 'explore';
  } else if (trajectory === 'worsening' || last.cdiScore > 65) {
    nextSessionMode = 'nurture';
  } else if (trajectory === 'recovering' && streakCount >= 3) {
    nextSessionMode = 'celebrate';
  } else if (last.cdiScore < 30) {
    nextSessionMode = 'challenge';
  } else {
    nextSessionMode = 'probe'; // home in on dominant distortion
  }

  return {
    trajectory,
    streakCount,
    streakDirection,
    topDistortion: last.dominantDistortion,
    nextSessionMode,
    positivityBank,
    totalSessions,
  };
}

// ── Get the insight level (high/medium/low) from a signal weight ──
export function getInsightLevel(signalWeight: number): 'high' | 'medium' | 'low' {
  if (signalWeight >= 4) return 'high';
  if (signalWeight >= 2) return 'medium';
  return 'low';
}

// ── Get insight copy for a choice ──
export function getInsightForChoice(
  distortion: string,
  signalWeight: number,
): string {
  const level = getInsightLevel(signalWeight);
  return INSIGHT_COPY[distortion]?.[level] ?? '';
}

// ── Get the CDI label shown to user — descriptive, not numerical in isolation ──
export function getCDILabel(cdi: number): { label: string; color: string } {
  if (cdi < 20) return { label: 'Anchored', color: cdiColor(cdi) };
  if (cdi < 40) return { label: 'Steady', color: cdiColor(cdi) };
  if (cdi < 55) return { label: 'Drifting slightly', color: cdiColor(cdi) };
  if (cdi < 70) return { label: 'Drifting', color: cdiColor(cdi) };
  return { label: 'Strong drift', color: cdiColor(cdi) };
}

// ── Get a random nudge for the current trajectory ──
export function getTrajectoryNudge(trajectory: AdaptiveState['trajectory']): string {
  const bank = ADAPTIVE_NUDGES[trajectory] ?? ADAPTIVE_NUDGES.stable;
  return bank[Math.floor(Math.random() * bank.length)];
}
