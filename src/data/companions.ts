import type { CompanionCharacter } from '../engine/types';
import { colors } from '../themes/tokens';

export const COMPANION_OPTIONS = [
  { key: 'mochi', name: 'Mochi', note: 'Included companion', locked: false },
  { key: 'pangoro', name: 'Pangoro', note: 'Premium companion', locked: true },
  { key: 'piplup', name: 'Piplup', note: 'Premium companion', locked: true },
] as const;

export type CompanionOption = (typeof COMPANION_OPTIONS)[number];

export function getCompanionAccent(character: CompanionCharacter) {
  if (character === 'pangoro') return colors.violetDark;
  if (character === 'piplup') return colors.amberDark;
  return colors.jade;
}
