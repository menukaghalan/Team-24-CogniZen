// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Profile Store (Zustand + AsyncStorage)
// The memory of the user. Persists across sessions.
// ─────────────────────────────────────────────────────────────────────────────

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AdaptiveState,
  ChoiceRecord,
  CompanionCharacter,
  GameResult,
  IntakeAnswers,
  UserPreferences,
  UserProfile,
} from '../engine/types';
import { buildGameCDIUpdate, buildSession } from '../engine/mathEngine';
import { computeAdaptiveState } from '../engine/adaptiveEngine';
import { computeIntakeCDI } from '../engine/intakeEngine';

const STORAGE_KEY = '@cognizen_profile';

const DEFAULT_ADAPTIVE_STATE: AdaptiveState = {
  trajectory: 'unknown',
  streakCount: 0,
  streakDirection: 'flat',
  topDistortion: 'decisionAvoidance',
  nextSessionMode: 'explore',
  positivityBank: 50,
  totalSessions: 0,
};

const DEFAULT_PREFERENCES: UserPreferences = {
  showCDIScore: true,
  selectedCompanion: 'mochi',
};

const DEFAULT_PROFILE: UserProfile = {
  userId: `user_${Date.now()}`,
  createdAt: Date.now(),
  sessions: [],
  currentCDI: 30,  // start at a neutral-low baseline, not zero
  cdiHistory: [],
  adaptiveState: DEFAULT_ADAPTIVE_STATE,
  preferences: DEFAULT_PREFERENCES,
  hasCompletedIntake: false,
};

interface ProfileStore {
  profile: UserProfile;
  isLoaded: boolean;

  // Actions
  loadProfile: () => Promise<void>;
  completeSession: (choices: ChoiceRecord[], startedAt: number) => void;
  completeGameSession: (result: GameResult) => void;
  resetProfile: () => void;

  // Active session state (in-memory only, not persisted until complete)
  activeChoices: ChoiceRecord[];
  sessionStartTime: number;
  addChoice: (choice: ChoiceRecord) => void;
  startSession: () => void;
  clearActiveSession: () => void;
  completeIntake: (answers: IntakeAnswers) => void;
  setShowCDIScore: (show: boolean) => void;
  setSelectedCompanion: (companion: CompanionCharacter) => void;
}

export const useProfileStore = create<ProfileStore>((set, get) => ({
  profile: DEFAULT_PROFILE,
  isLoaded: false,
  activeChoices: [],
  sessionStartTime: Date.now(),

  loadProfile: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<UserProfile>;
        const hydrated: UserProfile = {
          ...DEFAULT_PROFILE,
          ...parsed,
          adaptiveState: {
            ...DEFAULT_ADAPTIVE_STATE,
            ...parsed.adaptiveState,
          },
          preferences: {
            ...DEFAULT_PREFERENCES,
            ...parsed.preferences,
          },
        };
        set({ profile: hydrated, isLoaded: true });
      } else {
        set({ isLoaded: true });
      }
    } catch {
      set({ isLoaded: true });
    }
  },

  startSession: () => {
    set({ activeChoices: [], sessionStartTime: Date.now() });
  },

  addChoice: (choice: ChoiceRecord) => {
    set(state => ({ activeChoices: [...state.activeChoices, choice] }));
  },

  completeSession: (choices: ChoiceRecord[], startedAt: number) => {
    const { profile } = get();
    const session = buildSession(
      choices,
      profile.currentCDI,
      profile.sessions.length,
      startedAt,
    );

    const updatedSessions = [...profile.sessions, session];
    const adaptiveState = computeAdaptiveState(updatedSessions, profile.adaptiveState);
    const cdiHistory = [
      ...profile.cdiHistory,
      { timestamp: Date.now(), score: session.cdiScore },
    ];

    const updatedProfile: UserProfile = {
      ...profile,
      sessions: updatedSessions,
      currentCDI: session.cdiScore,
      cdiHistory,
      adaptiveState,
    };

    set({ profile: updatedProfile, activeChoices: [] });

    // Persist async (fire and forget)
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  completeGameSession: (result: GameResult) => {
    const { profile } = get();
    const { cdi } = buildGameCDIUpdate(profile.currentCDI, result, profile.sessions.length);
    const cdiHistory = [...profile.cdiHistory, { timestamp: Date.now(), score: cdi }];
    const updatedProfile: UserProfile = { ...profile, currentCDI: cdi, cdiHistory };
    set({ profile: updatedProfile });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  clearActiveSession: () => {
    set({ activeChoices: [] });
  },

  completeIntake: (answers: IntakeAnswers) => {
    const initialCDI = computeIntakeCDI(answers);
    const { profile } = get();
    const updatedProfile: UserProfile = {
      ...profile,
      hasCompletedIntake: true,
      intakeAnswers: answers,
      currentCDI: initialCDI,
      cdiHistory: [{ timestamp: Date.now(), score: initialCDI }],
    };
    set({ profile: updatedProfile });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  setShowCDIScore: (show: boolean) => {
    const { profile } = get();
    const updatedProfile: UserProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        showCDIScore: show,
      },
    };
    set({ profile: updatedProfile });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  setSelectedCompanion: (companion: CompanionCharacter) => {
    const { profile } = get();
    const updatedProfile: UserProfile = {
      ...profile,
      preferences: {
        ...profile.preferences,
        selectedCompanion: companion,
      },
    };
    set({ profile: updatedProfile });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(updatedProfile)).catch(() => {});
  },

  resetProfile: () => {
    const fresh = { ...DEFAULT_PROFILE, userId: `user_${Date.now()}`, createdAt: Date.now() };
    set({ profile: fresh, activeChoices: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));

// ── Selector helpers ──────────────────────────────────────────────────────────

export const selectAdaptiveState = (s: ProfileStore) => s.profile.adaptiveState;
export const selectName = (s: ProfileStore) => s.profile.intakeAnswers?.name ?? '';
export const selectCDI = (s: ProfileStore) => s.profile.currentCDI;
export const selectCDIHistory = (s: ProfileStore) => s.profile.cdiHistory;
export const selectSessions = (s: ProfileStore) => s.profile.sessions;
export const selectShowCDIScore = (s: ProfileStore) => s.profile.preferences.showCDIScore;
export const selectSelectedCompanion = (s: ProfileStore) => s.profile.preferences.selectedCompanion;
export const selectSessionMode = (s: ProfileStore) => s.profile.adaptiveState.nextSessionMode;
export const selectTopDistortion = (s: ProfileStore) => s.profile.adaptiveState.topDistortion;
