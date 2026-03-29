// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Scenario Screen
// The game. The user sees: a world, a dilemma, choices.
// We see: distortion signals, response times, behavioral patterns.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useProfileStore, selectSessionMode, selectTopDistortion, selectCDI,
} from '../store/profileStore';
import { selectScenariosForSession } from '../scenarios/allScenarios';
import { getInsightForChoice } from '../engine/adaptiveEngine';
import { ChoiceRecord, Scenario } from '../engine/types';
import { colors, typography, spacing, radii, shadows, cdiColor } from '../themes/tokens';
import MountainScene from '../components/MountainScene';
import MochiCompanion from '../components/MochiCompanion';

const { width: SCREEN_W } = Dimensions.get('window');
const SCENE_H = 112;

type Phase = 'scenario' | 'insight' | 'complete';
type GameRoute = 'ReactionTapGame' | 'StroopGame' | 'PatternMemoryGame';

export default function ScenarioScreen({ navigation }: any) {
  const mode            = useProfileStore(selectSessionMode);
  const topDistortion   = useProfileStore(selectTopDistortion);
  const profile         = useProfileStore(s => s.profile);
  const addChoice       = useProfileStore(s => s.addChoice);
  const completeSession = useProfileStore(s => s.completeSession);
  const startSession    = useProfileStore(s => s.startSession);
  const cdi             = useProfileStore(selectCDI);
  const accent          = cdiColor(cdi);
  const questionCount   = getSessionQuestionCount(mode, cdi);
  const gentleSession   = questionCount <= 3;
  const mochiMessage    = getScenarioSupportMessage(cdi, mode);

  const [scenarios, setScenarios]       = useState<Scenario[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [phase, setPhase]               = useState<Phase>('scenario');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [insightText, setInsightText]   = useState('');
  const [choices, setChoices]           = useState<ChoiceRecord[]>([]);
  const [sessionStartTime]              = useState(Date.now());
  const [gameCheckpoint] = useState(() => planGameCheckpoint(questionCount));
  const [gameCheckpointUsed, setGameCheckpointUsed] = useState(false);

  const choiceStartTime = useRef(Date.now());
  const fadeAnim        = useRef(new Animated.Value(1)).current;
  const promptAnim      = useRef(new Animated.Value(0)).current;
  const choicesAnim     = useRef(new Animated.Value(0)).current;
  const insightAnim     = useRef(new Animated.Value(0)).current;

  // Initialize session
  useEffect(() => {
    startSession();
    const completedIds = profile.sessions.flatMap(s => s.choices.map(c => c.scenarioId));
    const selected = selectScenariosForSession(mode, topDistortion, completedIds, questionCount);
    setScenarios(selected);
    choiceStartTime.current = Date.now();
  }, []);

  const currentScenario = scenarios[currentIndex];

  useEffect(() => {
    if (!currentScenario || phase !== 'scenario') {
      return;
    }

    promptAnim.setValue(0);
    choicesAnim.setValue(0);

    Animated.sequence([
      Animated.timing(promptAnim, {
        toValue: 1,
        duration: 220,
        useNativeDriver: true,
      }),
      Animated.timing(choicesAnim, {
        toValue: 1,
        duration: 240,
        useNativeDriver: true,
      }),
    ]).start();
  }, [choicesAnim, currentIndex, currentScenario, phase, promptAnim]);

  const handleChoice = useCallback((choiceIndex: number) => {
    if (selectedChoice !== null || !currentScenario) return;

    const responseTimeMs = Date.now() - choiceStartTime.current;
    const choice = currentScenario.choices[choiceIndex];

    const record: ChoiceRecord = {
      scenarioId:    currentScenario.id,
      choiceIndex,
      distortion:    currentScenario.distortion,
      signalWeight:  choice.signalWeight,
      responseTimeMs,
      timestamp:     Date.now(),
    };

    setSelectedChoice(choiceIndex);
    const insight = getInsightForChoice(currentScenario.distortion, choice.signalWeight);
    const displayInsight = (mode === 'nurture' && choice.signalWeight >= 3)
      ? currentScenario.positiveReframe
      : insight;

    setInsightText(displayInsight);
    setChoices(prev => [...prev, record]);
    addChoice(record);

    Animated.spring(insightAnim, {
      toValue: 1,
      damping: 18,
      stiffness: 170,
      mass: 0.9,
      useNativeDriver: true,
    }).start();
    setPhase('insight');
  }, [selectedChoice, currentScenario, mode]);

  const handleNext = useCallback(() => {
    const isLast = currentIndex >= scenarios.length - 1;

    if (isLast) {
      completeSession(choices, sessionStartTime);
      navigation.navigate('SessionComplete');
      return;
    }

    Animated.timing(fadeAnim, { toValue: 0, duration: 200, useNativeDriver: false }).start(() => {
      setCurrentIndex(i => i + 1);
      setSelectedChoice(null);
      setPhase('scenario');
      insightAnim.setValue(0);
      choiceStartTime.current = Date.now();
      const shouldLaunchGame =
        !gameCheckpointUsed &&
        gameCheckpoint !== null &&
        currentIndex === gameCheckpoint.afterIndex;
      if (shouldLaunchGame) {
        setGameCheckpointUsed(true);
      }
      Animated.timing(fadeAnim, { toValue: 1, duration: 300, useNativeDriver: false }).start();
      promptAnim.setValue(0);
      choicesAnim.setValue(0);
      if (shouldLaunchGame) {
        navigation.navigate(gameCheckpoint.route);
      }
    });
  }, [currentIndex, scenarios.length, choices, sessionStartTime, gameCheckpointUsed, gameCheckpoint, navigation]);

  if (!currentScenario) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.loading}>
          <Text style={styles.loadingText}>Mochi is getting your check-in ready.</Text>
        </View>
      </SafeAreaView>
    );
  }

  const progress = (currentIndex + (phase === 'insight' ? 1 : 0)) / scenarios.length;

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Mountain scene header ────────────────────────────────────── */}
        <View style={styles.sceneWrap}>
          <MountainScene width={SCREEN_W} height={SCENE_H} accent={accent} />
          <View style={styles.sceneOverlay}>
            <View>
              <Text style={styles.sceneEyebrow}>{gentleSession ? 'Gentle check-in' : "Today's check-in"}</Text>
              <Text style={styles.sceneLocation}>{currentScenario.realmName}</Text>
            </View>
            {/* Progress bar */}
            <View style={styles.progressTrack}>
              <Animated.View
                style={[styles.progressFill, { width: `${progress * 100}%`, backgroundColor: accent }]}
              />
            </View>
          </View>
        </View>

        {/* ── Body card slides up over scene ──────────────────────────── */}
        <View style={styles.body}>
          <Animated.View style={{ opacity: fadeAnim }}>
            <View style={styles.mochiCard}>
              <View style={styles.mochiArtWrap}>
                <MochiCompanion
                  variant={gentleSession ? 'sleepy' : 'happy'}
                  motionPreset={gentleSession ? 'menu' : 'home'}
                  accent={accent}
                  size={72}
                />
              </View>
              <View style={styles.mochiCopy}>
                <Text style={styles.mochiTitle}>
                  {gentleSession ? 'Mochi is keeping this one light.' : 'Mochi is here with you.'}
                </Text>
                <Text style={styles.mochiBody}>{mochiMessage}</Text>
              </View>
            </View>

            {/* The Scenario */}
            <Animated.View
              style={{
                opacity: promptAnim,
                transform: [
                  {
                    translateY: promptAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [12, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.scenarioCard}>
                <Text style={styles.scenarioText}>{currentScenario.narrativePrompt}</Text>
              </View>
            </Animated.View>

            {/* Choices */}
            <Animated.View
              style={{
                opacity: choicesAnim,
                transform: [
                  {
                    translateY: choicesAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [16, 0],
                    }),
                  },
                ],
              }}
            >
              <View style={styles.choicesContainer}>
                {currentScenario.choices.map((choice, i) => (
                  <ChoiceButton
                    key={i}
                    text={choice.text}
                    index={i}
                    selected={selectedChoice === i}
                    dimmed={selectedChoice !== null && selectedChoice !== i}
                    accent={accent}
                    onPress={() => handleChoice(i)}
                  />
                ))}
              </View>
            </Animated.View>

            {/* Insight — revealed after choice */}
            {phase === 'insight' && (
              <Animated.View
                style={[
                  styles.insightCard,
                  {
                    opacity: insightAnim,
                    transform: [
                      {
                        translateY: insightAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [16, 0],
                        }),
                      },
                      {
                        scale: insightAnim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.98, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <View style={[styles.insightTopBar, { backgroundColor: accent + 'CC' }]} />
                <View style={styles.insightPadding}>
                  <Text style={styles.insightEyebrow}>🌿  Mochi's gentle note</Text>
                  <Text style={styles.insightText}>{insightText}</Text>
                  <TouchableOpacity
                    style={[styles.nextBtn, { backgroundColor: accent }]}
                    onPress={handleNext}
                    activeOpacity={0.82}
                  >
                    <Text style={styles.nextBtnText}>
                      {currentIndex >= scenarios.length - 1 ? 'Wrap up check-in  ✓' : 'Move softly forward  →'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </Animated.View>
            )}

          </Animated.View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Choice Button Component ───────────────────────────────────────────────────

function ChoiceButton({
  text, index, selected, dimmed, accent, onPress,
}: {
  text: string;
  index: number;
  selected: boolean;
  dimmed: boolean;
  accent: string;
  onPress: () => void;
}) {
  const letters   = ['A', 'B', 'C', 'D'];
  const pressAnim = useRef(new Animated.Value(1)).current;

  const handlePress = () => {
    Animated.sequence([
      Animated.timing(pressAnim, { toValue: 0.97, duration: 80, useNativeDriver: false }),
      Animated.timing(pressAnim, { toValue: 1,    duration: 80, useNativeDriver: false }),
    ]).start();
    onPress();
  };

  return (
    <Animated.View style={{ transform: [{ scale: pressAnim }], opacity: dimmed ? 0.35 : 1 }}>
      <TouchableOpacity
        style={[
          styles.choiceBtn,
          selected && { borderColor: accent, backgroundColor: colors.bg2 },
        ]}
        onPress={handlePress}
        activeOpacity={0.85}
        disabled={dimmed || selected}
      >
        <View style={[styles.choiceLetter, selected && { backgroundColor: accent }]}>
          <Text style={[styles.choiceLetterText, selected && { color: colors.textOnAccent }]}>
            {letters[index]}
          </Text>
        </View>
        <Text style={[styles.choiceText, selected && { color: colors.textPrimary }]}>
          {text}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: colors.bg0 },
  scroll:  { flex: 1 },
  content: { paddingBottom: spacing.xxl },

  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },

  // Scene header
  sceneWrap: { height: SCENE_H, overflow: 'hidden' },
  sceneOverlay: {
    position: 'absolute',
    inset: 0,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    justifyContent: 'space-between',
  },
  sceneEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    letterSpacing: 1.2,
    textTransform: 'uppercase',
  },
  sceneLocation: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    marginTop: spacing.xs,
  },
  progressTrack: {
    height: 4,
    backgroundColor: colors.border1,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },

  // Body
  body: {
    backgroundColor: colors.bg0,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    marginTop: -24,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.screen,
  },

  mochiCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border0,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.inner,
  },
  mochiArtWrap: {
    width: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mochiCopy: { flex: 1 },
  mochiTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  mochiBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
    lineHeight: typography.sizes.xs * 1.6,
  },

  // Scenario card
  scenarioCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border0,
    padding: spacing.md,
    marginBottom: spacing.md,
    ...shadows.card,
  },
  scenarioText: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * 1.55,
  },

  // Choices
  choicesContainer: { gap: spacing.sm, marginBottom: spacing.md },
  choiceBtn: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    ...shadows.inner,
  },
  choiceLetter: {
    width: 28,
    height: 28,
    borderRadius: radii.full,
    backgroundColor: colors.bg3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  choiceLetterText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  choiceText: {
    flex: 1,
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: typography.sizes.sm * 1.5,
  },

  // Insight card
  insightCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border0,
    overflow: 'hidden',
    marginTop: spacing.sm,
    ...shadows.lifted,
  },
  insightTopBar: { height: 4, width: '100%' },
  insightPadding: { padding: spacing.md },
  insightEyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  insightText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.6,
    marginBottom: spacing.md,
  },
  nextBtn: {
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  nextBtnText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textOnAccent,
    letterSpacing: 0.3,
  },
});

function getSessionQuestionCount(_mode: string, _cdi: number): number {
  return 3;
}

function getScenarioSupportMessage(cdi: number, mode: string): string {
  if (mode === 'nurture' || cdi >= 60) {
    return "Your body is working hard, let's breathe together for a moment.";
  }
  if (cdi <= 35) {
    return "Your consistency is paying off, let's take one step at a time.";
  }
  return "I'm proud of you for checking in today.";
}

function planGameCheckpoint(
  questionCount: number,
): { afterIndex: number; route: GameRoute } | null {
  if (questionCount < 4) {
    return null;
  }

  const routes: GameRoute[] = ['ReactionTapGame', 'StroopGame', 'PatternMemoryGame'];
  const route = routes[Math.floor(Math.random() * routes.length)];
  const safeAfterIndex = Math.min(questionCount - 2, 1 + Math.floor(Math.random() * Math.max(1, questionCount - 3)));

  return {
    afterIndex: safeAfterIndex,
    route,
  };
}
