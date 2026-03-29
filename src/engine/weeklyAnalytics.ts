import { getCDILabel } from './adaptiveEngine';
import { buildWhoopCDIUpdate, computeWearablePhysiologyDrift } from './mathEngine';
import { WhoopPersona, WhoopWeekSummary } from '../data/whoopPersonas';

export interface WeeklyStats {
  weekNumber: number;
  avgRecovery: number;
  avgHRV: number;
  avgRestingHR: number;
  avgSleepPerformance: number;
  avgSleepDuration: number;
  totalStrain: number;
  avgStrain: number;
  peakRecovery: number;
  lowestRecovery: number;
  bestDayIndex: number;
  hardestDayIndex: number;
  wellnessScore: number;
}

export type TrendDirection = 'rising' | 'steady' | 'falling';

export interface WeekComparison {
  recoveryTrend: TrendDirection;
  sleepTrend: TrendDirection;
  hrvTrend: TrendDirection;
  strainTrend: TrendDirection;
  overallTrend: TrendDirection;
}

export type InsightTone = 'celebrate' | 'encourage' | 'gentle' | 'steady';

export interface WeeklyInsight {
  quote: string;
  subtext: string;
  suggestion: string;
  tone: InsightTone;
  highlightLabel: string;
  highlightValue: string;
}

export interface PersonaWeekSnapshot {
  weekNumber: number;
  stats: WeeklyStats;
  comparison: WeekComparison;
  insight: WeeklyInsight;
  physiologyDrift: number;
  cdi: number;
  cdiLabel: string;
}

export interface PersonaStageOption {
  id: 'opening' | 'midyear' | 'yearEnd';
  label: string;
  weekNumber: number;
}

const STAGE_OPTIONS: PersonaStageOption[] = [
  { id: 'opening', label: 'Week 1', weekNumber: 1 },
  { id: 'midyear', label: 'Week 26', weekNumber: 26 },
  { id: 'yearEnd', label: 'Week 52', weekNumber: 52 },
];

const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

type InsightEntry = {
  quote: string;
  subtext: string;
  suggestion: string;
  tone: InsightTone;
  label: string;
};

const CELEBRATE_INSIGHTS: InsightEntry[] = [
  {
    quote: 'This week, the body said yes.',
    subtext: 'Recovery stayed strong through the week. That is not luck. It means something in the routine is working.',
    suggestion: 'Protect whatever gave this week its calm rhythm.',
    tone: 'celebrate',
    label: 'Peak Recovery Week',
  },
  {
    quote: 'Seven days of quiet wins.',
    subtext: 'Sleep and readiness moved together in a healthy range. That pairing is rarer than it looks.',
    suggestion: 'Use this clear stretch to do one thing that usually feels heavier.',
    tone: 'celebrate',
    label: 'Rest and Readiness',
  },
  {
    quote: 'The system looks flexible right now.',
    subtext: 'The recovery pattern this week points to room to adapt, not just survive.',
    suggestion: 'Notice what feels slightly easier this week and make a note of it.',
    tone: 'celebrate',
    label: 'Strong Adaptation',
  },
];

const ENCOURAGE_INSIGHTS: InsightEntry[] = [
  {
    quote: 'The trend is yours to keep.',
    subtext: 'The numbers are moving in a kinder direction, even if the feeling has not fully caught up yet.',
    suggestion: 'Small consistency matters more than occasional perfect days.',
    tone: 'encourage',
    label: 'Rising Recovery',
  },
  {
    quote: 'Slowly and surely is still movement.',
    subtext: 'The system is rebuilding. It does not need to look dramatic to be real.',
    suggestion: 'Aim for one more restful night this week, not a total reset.',
    tone: 'encourage',
    label: 'Steady Progress',
  },
  {
    quote: 'Momentum is usually quiet.',
    subtext: 'The metrics are improving in small ways that matter over a longer arc.',
    suggestion: 'Keep the next step modest enough that it still feels doable tomorrow.',
    tone: 'encourage',
    label: 'Gentle Climb',
  },
];

const GENTLE_INSIGHTS: InsightEntry[] = [
  {
    quote: 'Heavy week. That is just the truth.',
    subtext: 'The body carried a lot, and recovery did not fully catch up. That is information, not failure.',
    suggestion: 'Before adding something new this week, look for one thing you can remove.',
    tone: 'gentle',
    label: 'High Load Week',
  },
  {
    quote: 'Sleep is trying to say something.',
    subtext: 'When sleep slips for a full week, it is usually a pattern worth listening to.',
    suggestion: 'Pick one night to make quieter on purpose.',
    tone: 'gentle',
    label: 'Sleep Deficit',
  },
  {
    quote: 'The strain-recovery gap is widening.',
    subtext: 'Output stayed high while readiness stayed lower. That mismatch tends to compound if it keeps going.',
    suggestion: 'Give the week at least one genuinely lower-load day.',
    tone: 'gentle',
    label: 'Strain Recovery Gap',
  },
];

const STEADY_INSIGHTS: InsightEntry[] = [
  {
    quote: 'Consistent. Quiet. Holding.',
    subtext: 'Nothing swung too wildly this week. Sometimes steadiness is the real win.',
    suggestion: 'Use the calm to build one small habit that future-you will appreciate.',
    tone: 'steady',
    label: 'Stable Week',
  },
  {
    quote: 'The baseline is holding.',
    subtext: 'The system stayed reliable across the week. That kind of repeatability matters.',
    suggestion: 'Take a minute to notice what is helping keep the floor steady.',
    tone: 'steady',
    label: 'Reliable Rhythm',
  },
  {
    quote: 'Nothing dramatic, and that is okay.',
    subtext: 'No crashes, no spikes. The body is not asking for a big story right now.',
    suggestion: 'Let a calm week stay calm.',
    tone: 'steady',
    label: 'Even Keel',
  },
];

function avg(values: number[]): number {
  return values.length ? values.reduce((sum, value) => sum + value, 0) / values.length : 0;
}

function round1(value: number): number {
  return Math.round(value * 10) / 10;
}

function direction(delta: number, threshold: number = 4): TrendDirection {
  if (delta >= threshold) return 'rising';
  if (delta <= -threshold) return 'falling';
  return 'steady';
}

function pick<T>(pool: T[], weekNumber: number): T {
  return pool[weekNumber % pool.length];
}

export function computeWeeklyStats(week: WhoopWeekSummary): WeeklyStats {
  const recoveries = week.days.map(day => day.recovery);
  const peakRecovery = Math.max(...recoveries);
  const lowestRecovery = Math.min(...recoveries);
  const bestDayIndex = recoveries.indexOf(peakRecovery);
  const hardestDayIndex = recoveries.indexOf(lowestRecovery);
  const avgRecovery = Math.round(avg(recoveries));
  const avgHRV = Math.round(avg(week.days.map(day => day.hrv)));
  const avgRestingHR = Math.round(avg(week.days.map(day => day.restingHR)));
  const avgSleepPerformance = Math.round(avg(week.days.map(day => day.sleepPerformance)));
  const avgSleepDuration = round1(avg(week.days.map(day => day.sleepDuration)));
  const totalStrain = round1(week.days.reduce((sum, day) => sum + day.strain, 0));
  const avgStrain = round1(totalStrain / 7);
  const hrvProxy = Math.min(100, Math.max(0, ((avgHRV - 20) / 60) * 100));
  const wellnessScore = Math.round(
    (avgRecovery * 0.4) +
    (avgSleepPerformance * 0.3) +
    (hrvProxy * 0.3)
  );

  return {
    weekNumber: week.weekNumber,
    avgRecovery,
    avgHRV,
    avgRestingHR,
    avgSleepPerformance,
    avgSleepDuration,
    totalStrain,
    avgStrain,
    peakRecovery,
    lowestRecovery,
    bestDayIndex,
    hardestDayIndex,
    wellnessScore,
  };
}

export function compareWeeks(current: WeeklyStats, previous: WeeklyStats | null): WeekComparison {
  if (!previous) {
    return {
      recoveryTrend: 'steady',
      sleepTrend: 'steady',
      hrvTrend: 'steady',
      strainTrend: 'steady',
      overallTrend: 'steady',
    };
  }

  const recoveryTrend = direction(current.avgRecovery - previous.avgRecovery);
  const sleepTrend = direction(current.avgSleepPerformance - previous.avgSleepPerformance);
  const hrvTrend = direction(current.avgHRV - previous.avgHRV, 3);
  const strainTrend = direction(current.totalStrain - previous.totalStrain, 5);
  const overallTrend = direction(current.wellnessScore - previous.wellnessScore, 5);

  return { recoveryTrend, sleepTrend, hrvTrend, strainTrend, overallTrend };
}

export function generateWeeklyInsight(stats: WeeklyStats, comparison: WeekComparison): WeeklyInsight {
  let entry: InsightEntry;

  if (stats.wellnessScore >= 75 && comparison.overallTrend !== 'falling') {
    entry = pick(CELEBRATE_INSIGHTS, stats.weekNumber);
  } else if (comparison.overallTrend === 'rising' && stats.wellnessScore >= 55) {
    entry = pick(ENCOURAGE_INSIGHTS, stats.weekNumber);
  } else if (stats.avgRecovery < 42 || (stats.avgSleepPerformance < 60 && comparison.sleepTrend === 'falling')) {
    entry = pick(GENTLE_INSIGHTS, stats.weekNumber);
  } else if (comparison.overallTrend === 'falling') {
    entry = pick(GENTLE_INSIGHTS, stats.weekNumber);
  } else {
    entry = pick(STEADY_INSIGHTS, stats.weekNumber);
  }

  let highlightLabel = 'Recovery Score';
  let highlightValue = `${stats.avgRecovery}`;

  if (entry.tone === 'celebrate' && stats.avgHRV >= 60) {
    highlightLabel = 'Avg HRV';
    highlightValue = `${stats.avgHRV} ms`;
  } else if (comparison.sleepTrend === 'falling' || stats.avgSleepPerformance < 65) {
    highlightLabel = 'Sleep Quality';
    highlightValue = `${stats.avgSleepPerformance}%`;
  } else if (stats.totalStrain > 85) {
    highlightLabel = 'Weekly Strain';
    highlightValue = `${stats.totalStrain}`;
  }

  return {
    quote: entry.quote,
    subtext: entry.subtext,
    suggestion: entry.suggestion,
    tone: entry.tone,
    highlightLabel,
    highlightValue,
  };
}

export function computeWhoopCDI(stats: WeeklyStats): number {
  return computeWearablePhysiologyDrift(stats);
}

const personaSnapshotCache = new Map<WhoopPersona['id'], PersonaWeekSnapshot[]>();

function buildPersonaSnapshotsCache(persona: WhoopPersona): PersonaWeekSnapshot[] {
  const existing = personaSnapshotCache.get(persona.id);
  if (existing) return existing;

  const snapshots: PersonaWeekSnapshot[] = [];
  let runningCDI = persona.cdiArc.start;

  persona.weeks.forEach((week, index) => {
    const stats = computeWeeklyStats(week);
    const previous = index > 0 ? snapshots[index - 1].stats : null;
    const comparison = compareWeeks(stats, previous);
    const insight = generateWeeklyInsight(stats, comparison);
    const { cdi, physiologyDrift } = buildWhoopCDIUpdate(runningCDI, stats, index);
    runningCDI = cdi;

    snapshots.push({
      weekNumber: week.weekNumber,
      stats,
      comparison,
      insight,
      physiologyDrift,
      cdi,
      cdiLabel: getCDILabel(cdi).label,
    });
  });

  personaSnapshotCache.set(persona.id, snapshots);
  return snapshots;
}

export function getPersonaSnapshots(persona: WhoopPersona): PersonaWeekSnapshot[] {
  return buildPersonaSnapshotsCache(persona);
}

export function getStageOptions(): PersonaStageOption[] {
  return STAGE_OPTIONS;
}

export function getStageSnapshot(persona: WhoopPersona, stageId: PersonaStageOption['id']): PersonaWeekSnapshot {
  const stage = STAGE_OPTIONS.find(option => option.id === stageId) ?? STAGE_OPTIONS[2];
  return getPersonaSnapshots(persona)[stage.weekNumber - 1];
}

export function getPersonaYearMoments(persona: WhoopPersona): PersonaWeekSnapshot[] {
  return STAGE_OPTIONS.map(stage => getPersonaSnapshots(persona)[stage.weekNumber - 1]);
}

export function stageSummaryLabel(stageId: PersonaStageOption['id']): string {
  if (stageId === 'opening') return 'Start of year';
  if (stageId === 'midyear') return 'Midyear';
  return 'Year end';
}

export function formatTrendArrow(trend: TrendDirection): string {
  if (trend === 'rising') return '↑';
  if (trend === 'falling') return '↓';
  return '→';
}

export function trendLabel(trend: TrendDirection, inverted = false): string {
  if (inverted) {
    if (trend === 'rising') return 'Higher';
    if (trend === 'falling') return 'Better';
    return 'Steady';
  }
  if (trend === 'rising') return 'Rising';
  if (trend === 'falling') return 'Lower';
  return 'Steady';
}

export function insightToneColor(tone: InsightTone): string {
  if (tone === 'celebrate') return '#7DB7A4';
  if (tone === 'encourage') return '#D79A62';
  if (tone === 'gentle') return '#B67A63';
  return '#8A6E5C';
}

export function bestAndHardestLabels(snapshot: PersonaWeekSnapshot): { best: string; hardest: string } {
  return {
    best: DAY_LABELS[snapshot.stats.bestDayIndex],
    hardest: DAY_LABELS[snapshot.stats.hardestDayIndex],
  };
}
