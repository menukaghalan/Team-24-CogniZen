// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Stroop Game
// A colour word is shown in an ink colour. Tap the ink colour, not the word.
// Maps to: allOrNothing (cognitive flexibility / interference resistance)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../../store/profileStore';
import { GameResult } from '../../engine/types';
import { colors, typography, spacing, radii } from '../../themes/tokens';
import MochiCompanion from '../../components/MochiCompanion';

const STROOP_COLORS = [
  { name: 'RED',   hex: '#E05555' },
  { name: 'BLUE',  hex: '#5588E0' },
  { name: 'GREEN', hex: '#4DB870' },
  { name: 'AMBER', hex: '#D4893A' },
];

const NUM_ROUNDS = 4;

interface StroopRound {
  word: string;
  inkHex: string;
  correctIndex: number;
  isCongruent: boolean;
}

function generateRounds(): StroopRound[] {
  const rounds: StroopRound[] = [];
  for (let i = 0; i < NUM_ROUNDS; i++) {
    const wordIdx = Math.floor(Math.random() * 4);
    const congruent = i % 2 === 0;
    const inkIdx = congruent
      ? wordIdx
      : (wordIdx + 1 + Math.floor(Math.random() * 3)) % 4;
    rounds.push({
      word: STROOP_COLORS[wordIdx].name,
      inkHex: STROOP_COLORS[inkIdx].hex,
      correctIndex: inkIdx,
      isCongruent: congruent,
    });
  }
  // Shuffle
  return rounds.sort(() => Math.random() - 0.5);
}

type Phase = 'ready' | 'playing' | 'feedback' | 'done';

interface RoundResult {
  correct: boolean;
  responseMs: number;
  congruent: boolean;
}

export default function StroopGame({ navigation }: any) {
  const completeGameSession = useProfileStore(s => s.completeGameSession);

  const [phase, setPhase]         = useState<Phase>('ready');
  const [rounds]                  = useState<StroopRound[]>(() => generateRounds());
  const [idx, setIdx]             = useState(0);
  const [results, setResults]     = useState<RoundResult[]>([]);
  const [lastCorrect, setLast]    = useState<boolean | null>(null);

  const startTime = useRef(0);
  const fadeAnim  = useRef(new Animated.Value(1)).current;

  const currentRound = rounds[idx];

  const flashNext = useCallback((next: RoundResult[]) => {
    Animated.sequence([
      Animated.timing(fadeAnim, { toValue: 0, duration: 150, useNativeDriver: true }),
      Animated.timing(fadeAnim, { toValue: 1, duration: 200, useNativeDriver: true }),
    ]).start(() => {
      if (next.length >= NUM_ROUNDS) {
        const correct = next.filter(r => r.correct).length;
        const incongruentErrors = next.filter(r => !r.congruent && !r.correct).length;
        const avgMs  = next.reduce((s, r) => s + r.responseMs, 0) / next.length;
        const score  = Math.round((correct / NUM_ROUNDS) * 100);
        const result: GameResult = {
          gameType: 'stroop',
          completedAt: Date.now(),
          score,
          accuracy: correct / NUM_ROUNDS,
          avgResponseMs: avgMs,
          rawMetrics: { correct, incongruentErrors, total: NUM_ROUNDS },
        };
        completeGameSession(result);
        setPhase('done');
      } else {
        setIdx(next.length);
        setLast(null);
        setPhase('playing');
        startTime.current = Date.now();
      }
    });
  }, [fadeAnim, completeGameSession]);

  const handleAnswer = useCallback((choiceIdx: number) => {
    if (phase !== 'playing') return;
    const ms      = Date.now() - startTime.current;
    const correct = choiceIdx === currentRound.correctIndex;
    setLast(correct);
    setPhase('feedback');
    const next = [...results, { correct, responseMs: ms, congruent: currentRound.isCongruent }];
    setResults(next);
    setTimeout(() => flashNext(next), 600);
  }, [phase, currentRound, results, flashNext]);

  const startGame = () => {
    setPhase('playing');
    startTime.current = Date.now();
  };

  const correctCount = results.filter(r => r.correct).length;

  if (phase === 'done') {
    const acc = Math.round((results.filter(r => r.correct).length / NUM_ROUNDS) * 100);
    const resultVariant =
      acc >= 90 ? 'celebrateB' :
      acc >= 75 ? 'celebrateA' :
      acc >= 60 ? 'happy' : 'sleepy';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resultWrap}>
          <MochiCompanion
            variant={resultVariant}
            motionPreset={resultVariant === 'celebrateA' || resultVariant === 'celebrateB' ? 'celebrate' : 'home'}
            accent={colors.amber}
            size={132}
          />
          <Text style={styles.resultTitle}>Test complete</Text>
          <Text style={styles.resultScore}>
            <Text style={{ color: colors.jade }}>{acc}%</Text> accuracy
          </Text>
          <Text style={styles.resultNote}>
            {acc >= 85
              ? 'Your mind cut right through the noise. That\'s genuine clarity.'
              : acc >= 65
              ? 'You navigated something tricky — the brain did good work here.'
              : 'The challenge was real, and you stayed with it. That\'s what counts.'}
          </Text>
          <TouchableOpacity style={styles.doneBtn} onPress={() => navigation.goBack()}>
            <Text style={styles.doneBtnText}>Back to base camp</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.roundText}>{idx} / {NUM_ROUNDS}</Text>
        <Text style={styles.correctText}>{correctCount} correct</Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(idx / NUM_ROUNDS) * 100}%` }]} />
      </View>

      {phase === 'ready' ? (
        <View style={styles.playArea}>
          <View style={styles.startCard}>
            <Text style={styles.startTitle}>Mind Stroop</Text>
            <Text style={styles.startInstr}>
              A colour word appears in coloured ink.{'\n'}
              Tap the <Text style={{ color: colors.jade, fontStyle: 'normal' }}>ink colour</Text> — not the word.{'\n\n'}
              Your brain will fight you. That is the point.
            </Text>
            <TouchableOpacity style={styles.startCta} onPress={startGame}>
              <Text style={styles.startCtaText}>Begin →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.playArea}>
          {/* Word display */}
          <Animated.Text
            style={[
              styles.wordDisplay,
              { color: currentRound.inkHex, opacity: fadeAnim },
            ]}
          >
            {currentRound.word}
          </Animated.Text>

          {/* Feedback flash */}
          {phase === 'feedback' && lastCorrect !== null && (
            <Text style={[
              styles.feedbackText,
              { color: lastCorrect ? colors.driftSteady : colors.driftStrong },
            ]}>
              {lastCorrect ? '✓' : '✗'}
            </Text>
          )}

          {/* Colour buttons */}
          <View style={styles.colorGrid}>
            {STROOP_COLORS.map((c, i) => (
              <TouchableOpacity
                key={c.name}
                style={[styles.colorBtn, { backgroundColor: c.hex }]}
                onPress={() => handleAnswer(i)}
                disabled={phase !== 'playing'}
                activeOpacity={0.8}
              >
                <Text style={styles.colorBtnText}>{c.name}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg0 },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  backText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },
  roundText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  correctText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.jade,
  },
  progressTrack: {
    height: 2,
    backgroundColor: colors.border1,
    marginHorizontal: spacing.screen,
    borderRadius: 1,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.amberLight,
    borderRadius: 1,
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screen,
    gap: spacing.xl,
  },
  wordDisplay: {
    fontFamily: typography.display,
    fontSize: 52,
    letterSpacing: 6,
    textAlign: 'center',
  },
  feedbackText: {
    fontFamily: typography.display,
    fontSize: 42,
    position: 'absolute',
    top: '35%',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
    width: '100%',
  },
  colorBtn: {
    width: '47%',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    alignItems: 'center',
  },
  colorBtnText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: '#fff',
    letterSpacing: 1,
  },
  startCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.xl,
    alignItems: 'center',
  },
  startTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  startInstr: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.7,
    fontStyle: 'italic',
    marginBottom: spacing.xl,
  },
  startCta: {
    backgroundColor: colors.amberLight,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  startCtaText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textOnAccent,
  },
  resultWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.xl,
    gap: spacing.sm,
  },
  resultTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  resultScore: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  resultNote: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.7,
    fontStyle: 'italic',
    marginBottom: spacing.xl,
  },
  doneBtn: {
    backgroundColor: colors.jade,
    borderRadius: radii.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
  },
  doneBtnText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textOnAccent,
  },
});
