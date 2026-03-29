// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · useAdaptiveContent hook
// Derives all the user-facing copy from the hidden adaptive state.
// Components call this hook — they never read raw adaptive state directly.
// ─────────────────────────────────────────────────────────────────────────────

import { useProfileStore } from '../store/profileStore';
import {
  getCDILabel,
  getTrajectoryNudge,
  WEEKLY_CHALLENGES,
  ADAPTIVE_NUDGES,
} from '../engine/adaptiveEngine';

export function useAdaptiveContent() {
  const adaptiveState = useProfileStore(s => s.profile.adaptiveState);
  const cdi = useProfileStore(s => s.profile.currentCDI);
  const sessions = useProfileStore(s => s.profile.sessions);
  const isFirstSession = adaptiveState.totalSessions === 0;

  const { label: cdiLabel, color: cdiColor } = getCDILabel(cdi);
  const nudge = getTrajectoryNudge(adaptiveState.trajectory);
  const challenge = WEEKLY_CHALLENGES[adaptiveState.topDistortion];

  // Session entry prompt — tailored to the mode
  const sessionEntryPrompt = getSessionEntryPrompt(
    adaptiveState.nextSessionMode,
    adaptiveState.trajectory,
    adaptiveState.streakCount,
    isFirstSession,
  );

  // Whether to show encouragement vs challenge
  const isNurturing = adaptiveState.nextSessionMode === 'nurture';
  const isCelebrating = adaptiveState.nextSessionMode === 'celebrate';

  // Streak message
  const streakMessage = getStreakMessage(
    adaptiveState.streakCount,
    adaptiveState.streakDirection,
  );

  return {
    cdi,
    cdiLabel,
    cdiColor,
    nudge,
    challenge,
    sessionEntryPrompt,
    isNurturing,
    isCelebrating,
    streakMessage,
    adaptiveState,
    isFirstSession,
    totalSessions: adaptiveState.totalSessions,
    trajectory: adaptiveState.trajectory,
  };
}

function getSessionEntryPrompt(
  mode: string,
  trajectory: string,
  streakCount: number,
  isFirst: boolean,
): { headline: string; sub: string } {
  if (isFirst) {
    return {
      headline: 'Begin your first journey',
      sub: 'Five choices · About four minutes · No right answers',
    };
  }

  switch (mode) {
    case 'nurture':
      return {
        headline: 'A gentler journey awaits',
        sub: trajectory === 'worsening'
          ? 'Your patterns suggest you\'re carrying something. Take your time.'
          : 'A quiet session today.',
      };
    case 'celebrate':
      return {
        headline: `${streakCount} sessions improving`,
        sub: 'Something is shifting. Keep going.',
      };
    case 'challenge':
      return {
        headline: 'Your mind is ready for more',
        sub: 'A deeper set of scenarios today.',
      };
    case 'probe':
      return {
        headline: 'Going deeper today',
        sub: 'We\'re focusing on your most active pattern.',
      };
    default:
      return {
        headline: 'Enter the realm',
        sub: 'Five choices · About four minutes',
      };
  }
}

function getStreakMessage(count: number, direction: string): string | null {
  if (count < 2) return null;
  if (direction === 'down') {
    return count >= 5
      ? `${count} sessions trending healthier. This is real.`
      : count >= 3
      ? `${count} sessions in a row improving. Something is working.`
      : `Two sessions improving. Keep noticing.`;
  }
  if (direction === 'up') {
    return count >= 3
      ? `Your patterns have been heavier for ${count} sessions. That\'s worth attending to.`
      : null;
  }
  return null;
}
