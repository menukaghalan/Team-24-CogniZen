import { DistortionKey } from '../engine/types';

export const DISTORTION_HUMAN_NAMES: Record<DistortionKey, string> = {
  temporalDiscount: 'Present-moment pull',
  negativityBias: 'Loss amplification',
  allOrNothing: 'Binary thinking',
  decisionAvoidance: 'Decision weight',
  catastrophizing: 'Worst-case focus',
  effortReward: 'Effort-return gap',
};

export const DISTORTION_ONE_LINERS: Record<DistortionKey, string> = {
  temporalDiscount: 'Your mind is hungry for relief right now.',
  negativityBias: 'Losses are feeling louder than gains.',
  allOrNothing: 'Middle paths are getting harder to see.',
  decisionAvoidance: 'Choices are carrying more weight than usual.',
  catastrophizing: 'The worst-case is taking up more space than the odds suggest.',
  effortReward: 'The gap between effort and return is widening.',
};

export const TREND_LABELS: Record<string, string> = {
  improving: 'Shifting healthier',
  stable: 'Holding steady',
  drifting: 'Drifting further',
};

export const TRAJECTORY_LABELS: Record<string, string> = {
  recovering: 'Recovering',
  stable: 'Stable',
  worsening: 'Worth attending to',
  unknown: 'Baseline unmeasured',
};

export function formatSessionDate(timestamp: number): string {
  const d = new Date(timestamp);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24));
  if (diffDays === 0) return 'Today';
  if (diffDays === 1) return 'Yesterday';
  if (diffDays < 7) return `${diffDays} days ago`;
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function formatResponseTime(ms: number): string {
  if (ms < 1000) return 'Immediate';
  if (ms < 3000) return 'Quick';
  if (ms < 8000) return 'Considered';
  return 'Careful';
}

export function vectorToLabel(value: number): string {
  if (value < 0.2) return 'Quiet';
  if (value < 0.4) return 'Mild';
  if (value < 0.6) return 'Active';
  if (value < 0.8) return 'Prominent';
  return 'Strong';
}
