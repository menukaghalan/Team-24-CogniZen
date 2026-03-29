export interface WhoopDayData {
  date: string;
  recovery: number;
  hrv: number;
  restingHR: number;
  sleepPerformance: number;
  sleepDuration: number;
  strain: number;
}

export interface WhoopWeekSummary {
  weekNumber: number;
  startDate: string;
  endDate: string;
  days: WhoopDayData[];
}

export interface WhoopPersona {
  id: 'recoverer' | 'steady' | 'drifter';
  name: string;
  age: number;
  occupation: string;
  archetype: string;
  tagline: string;
  accentColor: string;
  weeks: WhoopWeekSummary[];
  cdiArc: { start: number; week26: number; end: number };
}

function prand(seed: number): number {
  const x = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return x - Math.floor(x);
}

function noise(seed: number, amplitude: number): number {
  return (prand(seed * 7.3 + 1.9) + prand(seed * 3.1 + 6.7) - 1.0) * amplitude;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * clamp(t, 0, 1);
}

function gaussianDip(week: number, center: number, width: number): number {
  return Math.exp(-0.5 * Math.pow((week - center) / width, 2));
}

function easeInOut(t: number): number {
  return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
}

function isoDate(offsetDays: number): string {
  const base = new Date('2024-01-01T00:00:00Z');
  base.setUTCDate(base.getUTCDate() + offsetDays);
  return base.toISOString().slice(0, 10);
}

interface DayParams {
  recovery: number;
  hrv: number;
  restingHR: number;
  sleepPerf: number;
  sleepDur: number;
  strain: number;
}

function generateDay(
  weekIdx: number,
  dayIdx: number,
  params: DayParams,
  seedOffset: number,
): WhoopDayData {
  const seed = weekIdx * 100 + dayIdx * 10 + seedOffset;
  const isWeekend = dayIdx >= 4;
  const weekendStrain = isWeekend ? noise(seed + 91, 1.5) : 0;
  const weekendSleep = isWeekend ? noise(seed + 92, -3) : 0;

  return {
    date: isoDate(weekIdx * 7 + dayIdx),
    recovery: clamp(Math.round(params.recovery + noise(seed + 1, 9)), 2, 99),
    hrv: clamp(Math.round(params.hrv + noise(seed + 2, 5)), 12, 120),
    restingHR: clamp(Math.round(params.restingHR + noise(seed + 3, 3)), 42, 95),
    sleepPerformance: clamp(Math.round(params.sleepPerf + weekendSleep + noise(seed + 4, 6)), 20, 100),
    sleepDuration: clamp(parseFloat((params.sleepDur + weekendSleep * 0.08 + noise(seed + 5, 0.5)).toFixed(1)), 3.5, 10),
    strain: clamp(parseFloat((params.strain + weekendStrain + noise(seed + 6, 1.5)).toFixed(1)), 0, 21),
  };
}

function buildRecovererWeeks(): WhoopWeekSummary[] {
  const weeks: WhoopWeekSummary[] = [];

  for (let w = 0; w < 52; w += 1) {
    const t = w / 51;
    const recovery = lerp(27, 81, easeInOut(Math.pow(t, 0.65)));
    const hrv = lerp(26, 68, easeInOut(Math.pow(t, 0.7)));
    const restingHR = lerp(80, 57, easeInOut(t));
    const sleepPerf = lerp(52, 89, easeInOut(Math.pow(t, 0.8)));
    const sleepDur = lerp(5.8, 7.8, easeInOut(t));
    const strain = lerp(16.5, 10.2, easeInOut(Math.pow(t, 0.5)));

    const params: DayParams = { recovery, hrv, restingHR, sleepPerf, sleepDur, strain };
    const days = Array.from({ length: 7 }, (_, d) => generateDay(w, d, params, 1));

    weeks.push({
      weekNumber: w + 1,
      startDate: isoDate(w * 7),
      endDate: isoDate(w * 7 + 6),
      days,
    });
  }

  return weeks;
}

function buildSteadyWeeks(): WhoopWeekSummary[] {
  const weeks: WhoopWeekSummary[] = [];

  for (let w = 0; w < 52; w += 1) {
    const dip1 = gaussianDip(w, 22, 3.5) * 0.4;
    const dip2 = gaussianDip(w, 42, 3.0) * 0.32;
    const totalDip = Math.max(dip1, dip2);

    const recovery = lerp(71, 45, totalDip) + noise(w + 200, 4);
    const hrv = lerp(65, 44, totalDip) + noise(w + 201, 3);
    const restingHR = lerp(61, 72, totalDip) + noise(w + 202, 2);
    const sleepPerf = lerp(84, 61, totalDip) + noise(w + 203, 5);
    const sleepDur = lerp(7.7, 6.1, totalDip) + noise(w + 204, 0.4);
    const strain = lerp(11.5, 16.0, totalDip) + noise(w + 205, 1.2);

    const params: DayParams = {
      recovery: clamp(recovery, 40, 90),
      hrv: clamp(hrv, 35, 85),
      restingHR: clamp(restingHR, 55, 80),
      sleepPerf: clamp(sleepPerf, 55, 95),
      sleepDur: clamp(sleepDur, 5.5, 9.0),
      strain: clamp(strain, 8, 19),
    };
    const days = Array.from({ length: 7 }, (_, d) => generateDay(w, d, params, 2));

    weeks.push({
      weekNumber: w + 1,
      startDate: isoDate(w * 7),
      endDate: isoDate(w * 7 + 6),
      days,
    });
  }

  return weeks;
}

function buildDrifterWeeks(): WhoopWeekSummary[] {
  const weeks: WhoopWeekSummary[] = [];

  for (let w = 0; w < 52; w += 1) {
    const t = w / 51;
    const declineCurve = Math.pow(t, 1.6);

    const recovery = lerp(86, 28, declineCurve);
    const hrv = lerp(76, 28, declineCurve);
    const restingHR = lerp(52, 79, declineCurve);
    const sleepPerf = lerp(93, 47, declineCurve);
    const sleepDur = lerp(8.2, 5.4, declineCurve);
    const strain = lerp(9.0, 17.5, declineCurve);

    const params: DayParams = { recovery, hrv, restingHR, sleepPerf, sleepDur, strain };
    const days = Array.from({ length: 7 }, (_, d) => generateDay(w, d, params, 3));

    weeks.push({
      weekNumber: w + 1,
      startDate: isoDate(w * 7),
      endDate: isoDate(w * 7 + 6),
      days,
    });
  }

  return weeks;
}

export const WHOOP_PERSONAS: WhoopPersona[] = [
  {
    id: 'recoverer',
    name: 'Alex',
    age: 23,
    occupation: 'Graduate student',
    archetype: 'The Recoverer',
    tagline: 'Climbed back from overload one week at a time.',
    accentColor: '#7DB7A4',
    weeks: buildRecovererWeeks(),
    cdiArc: { start: 82, week26: 50, end: 21 },
  },
  {
    id: 'steady',
    name: 'Jordan',
    age: 26,
    occupation: 'Early-career professional',
    archetype: 'The Steady',
    tagline: 'Held the line through two rough patches.',
    accentColor: '#D79A62',
    weeks: buildSteadyWeeks(),
    cdiArc: { start: 34, week26: 42, end: 31 },
  },
  {
    id: 'drifter',
    name: 'Sam',
    age: 21,
    occupation: 'Undergraduate student',
    archetype: 'The Drifter',
    tagline: 'Started strong, then slowly slipped under the radar.',
    accentColor: '#B67A63',
    weeks: buildDrifterWeeks(),
    cdiArc: { start: 18, week26: 44, end: 76 },
  },
];

export function getPersonaById(id: WhoopPersona['id']): WhoopPersona {
  return WHOOP_PERSONAS.find(persona => persona.id === id) ?? WHOOP_PERSONAS[0];
}

export function getWeek(persona: WhoopPersona, weekNumber: number): WhoopWeekSummary {
  const safeIndex = clamp(weekNumber - 1, 0, 51);
  return persona.weeks[safeIndex];
}
