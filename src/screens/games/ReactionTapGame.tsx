// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Reaction Tap Game
// A target appears; tap it. Speed reveals attentional fatigue.
// Maps to: temporalDiscount (temporal processing / fatigue dimension)
// ─────────────────────────────────────────────────────────────────────────────

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Animated, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../../store/profileStore';
import { GameResult } from '../../engine/types';
import { colors, typography, spacing, radii } from '../../themes/tokens';
import MochiCompanion from '../../components/MochiCompanion';

const { width: W, height: H } = Dimensions.get('window');
const TARGET_R  = 38;
const PLAY_TOP  = 160;   // below header
const PLAY_BOT  = H - 120;
const NUM_ROUNDS = 4;
const MAX_WAIT  = 1500;   // ms before target disappears (miss)

type Phase = 'ready' | 'waiting' | 'active' | 'result' | 'done';

interface Round {
  responseMs: number;
  hit: boolean;
}

export default function ReactionTapGame({ navigation }: any) {
  const completeGameSession = useProfileStore(s => s.completeGameSession);

  const [phase, setPhase]       = useState<Phase>('ready');
  const [round, setRound]       = useState(0);
  const [position, setPosition] = useState({ x: W / 2, y: H / 2 });
  const [lastMs, setLastMs]     = useState<number | null>(null);
  const [rounds, setRounds]     = useState<Round[]>([]);

  const scaleAnim  = useRef(new Animated.Value(0)).current;
  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const appearTime = useRef(0);
  const missTimer  = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Appear animation
  const showTarget = useCallback((x: number, y: number) => {
    setPosition({ x, y });
    scaleAnim.setValue(0);
    Animated.spring(scaleAnim, {
      toValue: 1, speed: 20, bounciness: 10, useNativeDriver: true,
    }).start();
    // Pulse loop
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1.15, duration: 500, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 1,    duration: 500, useNativeDriver: true }),
      ])
    ).start();
    appearTime.current = Date.now();
  }, [scaleAnim, pulseAnim]);

  const nextRound = useCallback((prevRounds: Round[]) => {
    if (prevRounds.length >= NUM_ROUNDS) {
      const hits   = prevRounds.filter(r => r.hit);
      const avgMs  = hits.length > 0
        ? hits.reduce((s, r) => s + r.responseMs, 0) / hits.length
        : MAX_WAIT;
      const score  = Math.max(0, Math.round(100 - (avgMs - 200) / 8));
      const result: GameResult = {
        gameType: 'reactionTap',
        completedAt: Date.now(),
        score: Math.max(0, Math.min(100, score)),
        accuracy: hits.length / NUM_ROUNDS,
        avgResponseMs: avgMs,
        rawMetrics: { hits: hits.length, rounds: NUM_ROUNDS },
      };
      completeGameSession(result);
      setPhase('done');
      return;
    }

    setPhase('waiting');
    setLastMs(null);
    const delay = 900 + Math.random() * 1600;
    setTimeout(() => {
      const x = TARGET_R + Math.random() * (W - TARGET_R * 2);
      const y = PLAY_TOP + TARGET_R + Math.random() * (PLAY_BOT - PLAY_TOP - TARGET_R * 2);
      showTarget(x, y);
      setPhase('active');

      // Auto-miss after MAX_WAIT
      missTimer.current = setTimeout(() => {
        pulseAnim.stopAnimation();
        scaleAnim.setValue(0);
        const miss: Round = { responseMs: MAX_WAIT, hit: false };
        setRounds(prev => {
          const next = [...prev, miss];
          setRound(next.length);
          setLastMs(-1);
          setPhase('result');
          setTimeout(() => nextRound(next), 900);
          return next;
        });
      }, MAX_WAIT);
    }, delay);
  }, [showTarget, scaleAnim, pulseAnim, completeGameSession]);

  const handleTap = useCallback(() => {
    if (phase !== 'active') return;
    if (missTimer.current) clearTimeout(missTimer.current);
    pulseAnim.stopAnimation();
    scaleAnim.setValue(0);

    const ms = Date.now() - appearTime.current;
    const hit: Round = { responseMs: ms, hit: true };
    setLastMs(ms);
    setRounds(prev => {
      const next = [...prev, hit];
      setRound(next.length);
      setPhase('result');
      setTimeout(() => nextRound(next), 700);
      return next;
    });
  }, [phase, scaleAnim, pulseAnim, nextRound]);

  const avgMs = rounds.filter(r => r.hit).length > 0
    ? Math.round(rounds.filter(r => r.hit).reduce((s, r) => s + r.responseMs, 0) / rounds.filter(r => r.hit).length)
    : null;

  if (phase === 'done') {
    const hits = rounds.filter(r => r.hit).length;
    const resultVariant =
      avgMs && avgMs < 300 ? 'celebrateB' :
      avgMs && avgMs < 420 ? 'celebrateA' :
      avgMs && avgMs < 600 ? 'happy' : 'sleepy';
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.resultWrap}>
          <MochiCompanion
            variant={resultVariant}
            motionPreset={resultVariant === 'celebrateA' || resultVariant === 'celebrateB' ? 'celebrate' : 'home'}
            accent={colors.jade}
            size={132}
          />
          <Text style={styles.resultTitle}>Sprint complete</Text>
          <Text style={styles.resultSub}>
            {hits} of {NUM_ROUNDS} targets hit
          </Text>
          {avgMs && (
            <Text style={styles.resultAvg}>
              Avg response: <Text style={{ color: colors.jade }}>{avgMs} ms</Text>
            </Text>
          )}
          <Text style={styles.resultNote}>
            {avgMs && avgMs < 350
              ? 'You\'re in the zone — your mind moved before you even thought about it.'
              : avgMs && avgMs < 600
              ? 'Solid focus. You showed up and stayed with it — that matters.'
              : 'You kept going even when it was hard. That takes real steadiness.'}
          </Text>
          <TouchableOpacity
            style={styles.doneBtn}
            onPress={() => navigation.goBack()}
          >
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
        <Text style={styles.roundText}>
          {round} / {NUM_ROUNDS}
        </Text>
        {avgMs && <Text style={styles.avgText}>{avgMs} ms avg</Text>}
      </View>

      {/* Progress */}
      <View style={styles.progressTrack}>
        <View style={[styles.progressFill, { width: `${(round / NUM_ROUNDS) * 100}%` }]} />
      </View>

      {/* Play area */}
      <View style={styles.playArea}>
        {phase === 'ready' && (
          <TouchableOpacity style={styles.startBtn} onPress={() => nextRound([])}>
            <Text style={styles.startBtnTitle}>Reaction Sprint</Text>
            <Text style={styles.startBtnSub}>
              Tap the circle the moment it appears.{'\n'}
              {NUM_ROUNDS} rounds. Trust your instincts.
            </Text>
            <View style={styles.startBtnCta}>
              <Text style={styles.startBtnCtaText}>Begin →</Text>
            </View>
          </TouchableOpacity>
        )}

        {phase === 'waiting' && (
          <Text style={styles.waitText}>Wait for it...</Text>
        )}

        {phase === 'active' && (
          <Animated.View
            style={[
              styles.targetOuter,
              {
                left: position.x - TARGET_R * 1.6,
                top:  position.y - TARGET_R * 1.6,
                transform: [{ scale: Animated.multiply(scaleAnim, pulseAnim) }],
              },
            ]}
          >
            <TouchableOpacity
              style={styles.target}
              onPress={handleTap}
              activeOpacity={0.7}
            />
          </Animated.View>
        )}

        {phase === 'result' && lastMs !== null && (
          <View style={styles.resultPill}>
            {lastMs === -1 ? (
              <Text style={[styles.resultPillText, { color: colors.driftStrong }]}>
                Too quick!
              </Text>
            ) : (
              <Text style={[styles.resultPillText, { color: colors.jade }]}>
                {lastMs} ms
              </Text>
            )}
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg0 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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
  avgText: {
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
    backgroundColor: colors.jade,
    borderRadius: 1,
  },
  playArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  waitText: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textTertiary,
    letterSpacing: 1,
  },
  targetOuter: {
    position: 'absolute',
    width: TARGET_R * 3.2,
    height: TARGET_R * 3.2,
    borderRadius: TARGET_R * 1.6,
    backgroundColor: colors.jade + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  target: {
    width: TARGET_R * 2,
    height: TARGET_R * 2,
    borderRadius: TARGET_R,
    backgroundColor: colors.jade,
    shadowColor: colors.jade,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 12,
    elevation: 8,
  },
  resultPill: {
    backgroundColor: colors.bg2,
    borderRadius: radii.full,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  resultPillText: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
  },
  startBtn: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.xl,
    alignItems: 'center',
    marginHorizontal: spacing.xl,
  },
  startBtnTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  startBtnSub: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * 1.6,
    marginBottom: spacing.lg,
  },
  startBtnCta: {
    backgroundColor: colors.jade,
    borderRadius: radii.md,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.sm,
  },
  startBtnCtaText: {
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
  resultSub: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    marginBottom: spacing.md,
  },
  resultAvg: {
    fontFamily: typography.bodyMedium,
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
