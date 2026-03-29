// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Pattern Memory Game (Echo Sequence)
// Watch the sequence light up. Repeat it. Each success adds one more step.
// Maps to: decisionAvoidance (working memory / cognitive load dimension)
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

const GRID_SIZE  = 4;   // 2×2 grid → 4 cells
const START_LEN  = 2;   // initial sequence length
const MAX_ROUNDS = 4;

const CELL_COLORS = [
  colors.jade,
  colors.amberLight,
  colors.violetLight,
  colors.driftSteady,
];

type Phase = 'ready' | 'showing' | 'input' | 'wrong' | 'done';

function buildSequence(length: number): number[] {
  return Array.from({ length }, () => Math.floor(Math.random() * GRID_SIZE));
}

export default function PatternMemoryGame({ navigation }: any) {
  const completeGameSession = useProfileStore(s => s.completeGameSession);

  const [phase, setPhase]             = useState<Phase>('ready');
  const [sequence, setSequence]       = useState<number[]>([]);
  const [userInput, setUserInput]     = useState<number[]>([]);
  const [highlighted, setHighlighted] = useState<number | null>(null);
  const [round, setRound]             = useState(0);
  const [maxRound, setMaxRound]       = useState(0);
  const [flashWrong, setFlashWrong]   = useState<number | null>(null);

  const cellAnims = useRef(
    Array.from({ length: GRID_SIZE }, () => new Animated.Value(1))
  ).current;

  const flashCell = useCallback((cell: number, duration = 400): Promise<void> =>
    new Promise(resolve => {
      Animated.sequence([
        Animated.timing(cellAnims[cell], { toValue: 1.18, duration: duration * 0.4, useNativeDriver: true }),
        Animated.timing(cellAnims[cell], { toValue: 1,    duration: duration * 0.6, useNativeDriver: true }),
      ]).start(() => resolve());
    }),
  [cellAnims]);

  const playSequence = useCallback(async (seq: number[]) => {
    setPhase('showing');
    setHighlighted(null);
    await new Promise(r => setTimeout(r, 500));
    for (const cell of seq) {
      setHighlighted(cell);
      await flashCell(cell, 500);
      setHighlighted(null);
      await new Promise(r => setTimeout(r, 200));
    }
    setPhase('input');
    setUserInput([]);
  }, [flashCell]);

  const startRound = useCallback((r: number) => {
    const seq = buildSequence(START_LEN + r);
    setSequence(seq);
    setRound(r);
    playSequence(seq);
  }, [playSequence]);

  const handleCell = useCallback((cell: number) => {
    if (phase !== 'input') return;

    flashCell(cell, 250);
    const next = [...userInput, cell];

    // Check this step
    if (next[next.length - 1] !== sequence[next.length - 1]) {
      setFlashWrong(cell);
      setPhase('wrong');
      // Compute result
      const score = Math.round((round / MAX_ROUNDS) * 100);
      const result: GameResult = {
        gameType: 'patternMemory',
        completedAt: Date.now(),
        score,
        accuracy: round / MAX_ROUNDS,
        avgResponseMs: 600,
        rawMetrics: { sequencesCompleted: round, maxLength: START_LEN + round },
      };
      completeGameSession(result);
      setTimeout(() => {
        setFlashWrong(null);
        setMaxRound(round);
        setPhase('done');
      }, 1200);
      return;
    }

    setUserInput(next);

    if (next.length === sequence.length) {
      // Completed this round
      const nextRound = round + 1;
      if (nextRound >= MAX_ROUNDS) {
        const score = 100;
        const result: GameResult = {
          gameType: 'patternMemory',
          completedAt: Date.now(),
          score,
          accuracy: 1,
          avgResponseMs: 500,
          rawMetrics: { sequencesCompleted: MAX_ROUNDS, maxLength: START_LEN + MAX_ROUNDS },
        };
        completeGameSession(result);
        setMaxRound(MAX_ROUNDS);
        setPhase('done');
      } else {
        setTimeout(() => startRound(nextRound), 800);
      }
    }
  }, [phase, userInput, sequence, round, flashCell, completeGameSession, startRound]);

  if (phase === 'done') {
    const resultVariant =
      maxRound >= 6 ? 'celebrateB' :
      maxRound >= 4 ? 'celebrateA' :
      maxRound >= 2 ? 'happy' : 'sleepy';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resultWrap}>
          <MochiCompanion
            variant={resultVariant}
            motionPreset={resultVariant === 'celebrateA' || resultVariant === 'celebrateB' ? 'celebrate' : 'home'}
            accent={colors.violet}
            size={132}
          />
          <Text style={styles.resultTitle}>Echo complete</Text>
          <Text style={styles.resultSeq}>
            Reached sequence of{' '}
            <Text style={{ color: colors.violetDark }}>{START_LEN + maxRound}</Text>
          </Text>
          <Text style={styles.resultNote}>
            {maxRound >= 6
              ? 'You held the whole sequence in mind. That\'s a beautiful kind of focus.'
              : maxRound >= 3
              ? 'You remembered more than you think. Every round built on the last.'
              : 'Patterns are hard. You showed up and tried — that\'s where it starts.'}
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={styles.backText}>← Exit</Text>
        </TouchableOpacity>
        <Text style={styles.roundText}>
          {phase === 'ready' ? 'Echo Sequence' : `Level ${round + 1}`}
        </Text>
        <Text style={styles.seqLen}>
          {phase !== 'ready' ? `${START_LEN + round} steps` : ''}
        </Text>
      </View>

      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(round / MAX_ROUNDS) * 100}%` }]} />
      </View>

      {phase === 'ready' ? (
        <View style={styles.playArea}>
          <View style={styles.startCard}>
            <Text style={styles.startTitle}>Echo Sequence</Text>
            <Text style={styles.startInstr}>
              The mountain shows a pattern.{'\n'}
              Repeat it. Each round adds one more step.{'\n\n'}
              Remember. Repeat. Adapt.
            </Text>
            <TouchableOpacity style={styles.startCta} onPress={() => startRound(0)}>
              <Text style={styles.startCtaText}>Begin →</Text>
            </TouchableOpacity>
          </View>
        </View>
      ) : (
        <View style={styles.playArea}>
          <Text style={styles.phaseLabel}>
            {phase === 'showing' ? 'Watch...' :
             phase === 'input'   ? 'Repeat the sequence' :
             phase === 'wrong'   ? 'Not quite.' : ''}
          </Text>

          {/* 2×2 grid */}
          <View style={styles.grid}>
            {Array.from({ length: GRID_SIZE }).map((_, i) => {
              const isLit   = highlighted === i;
              const isWrong = flashWrong === i;
              const tapped  = phase === 'input' && userInput.includes(i)
                && userInput.lastIndexOf(i) === userInput.length - 1;

              return (
                <Animated.View
                  key={i}
                  style={{ transform: [{ scale: cellAnims[i] }] }}
                >
                  <TouchableOpacity
                    style={[
                      styles.cell,
                      isLit   && { backgroundColor: CELL_COLORS[i], opacity: 1 },
                      isWrong && { backgroundColor: colors.driftStrong, opacity: 1 },
                      tapped  && { backgroundColor: CELL_COLORS[i] + 'BB' },
                    ]}
                    onPress={() => handleCell(i)}
                    disabled={phase !== 'input'}
                    activeOpacity={0.7}
                  />
                </Animated.View>
              );
            })}
          </View>

          <Text style={styles.inputProgress}>
            {phase === 'input'
              ? `${userInput.length} / ${sequence.length}`
              : ' '}
          </Text>
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
  seqLen: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.violetDark,
    minWidth: 48,
    textAlign: 'right',
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
    backgroundColor: colors.violetLight,
    borderRadius: 1,
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xl,
    paddingHorizontal: spacing.screen,
  },
  phaseLabel: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textTertiary,
    letterSpacing: 0.5,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
    width: 240,
    justifyContent: 'center',
  },
  cell: {
    width: 108,
    height: 108,
    borderRadius: radii.xl,
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border2,
    opacity: 0.7,
  },
  inputProgress: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textTertiary,
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
    backgroundColor: colors.violetLight,
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
  resultSeq: {
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
