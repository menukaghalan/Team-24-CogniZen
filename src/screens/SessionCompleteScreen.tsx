// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Session Complete Screen
// The mirror. What happened, in human language. No scores. No charts yet.
// Just: "Here's what we noticed. Here's what it might mean."
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore, selectAdaptiveState, selectCDI } from '../store/profileStore';
import {
  getCDILabel, getTrajectoryNudge, WEEKLY_CHALLENGES,
} from '../engine/adaptiveEngine';
import { colors, typography, spacing, radii, shadows, cdiColor } from '../themes/tokens';

// Human-readable names for each distortion — never shown as clinical labels
const DISTORTION_NAMES: Record<string, string> = {
  temporalDiscount: 'Present-moment pull',
  negativityBias: 'Loss amplification',
  allOrNothing: 'Binary thinking',
  decisionAvoidance: 'Decision weight',
  catastrophizing: 'Worst-case focus',
  effortReward: 'Effort-return gap',
};

const DISTORTION_DESCRIPTIONS: Record<string, string> = {
  temporalDiscount: "Your mind is leaning toward the immediate — a sign it may be conserving energy.",
  negativityBias: "Losses are feeling louder than gains right now. That's a protective response, not pessimism.",
  allOrNothing: "Middle paths are getting harder to see. The mind simplifies when it's stretched.",
  decisionAvoidance: "Choices are feeling heavier than usual. That weight is real data.",
  catastrophizing: "The worst-case is taking up more space than the odds suggest. Something is worth attending to.",
  effortReward: "The gap between effort and return is widening. That imbalance has a name, and it's worth naming.",
};

export default function SessionCompleteScreen({ navigation }: any) {
  const adaptiveState = useProfileStore(selectAdaptiveState);
  const cdi = useProfileStore(selectCDI);
  const sessions = useProfileStore(s => s.profile.sessions);
  const lastSession = sessions[sessions.length - 1];

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 700, useNativeDriver: false }),
      Animated.spring(scaleAnim, { toValue: 1, tension: 40, friction: 8, useNativeDriver: false }),
    ]).start();
  }, []);

  if (!lastSession) {
    return null;
  }

  const { label, color } = getCDILabel(cdi);
  const challenge = WEEKLY_CHALLENGES[adaptiveState.topDistortion];
  const nudge = getTrajectoryNudge(adaptiveState.trajectory);
  const dominantName = DISTORTION_NAMES[lastSession.dominantDistortion] ?? lastSession.dominantDistortion;
  const dominantDesc = DISTORTION_DESCRIPTIONS[lastSession.dominantDistortion] ?? '';
  const isImproving = lastSession.trend === 'improving';
  const isDrifting = lastSession.trend === 'drifting';

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={{ opacity: fadeAnim, transform: [{ scale: scaleAnim }] }}>

          {/* Completion marker */}
          <View style={styles.completionHeader}>
            <View style={[styles.completionOrbRing, { borderColor: cdiColor(cdi) + '30' }]}>
              <View style={[styles.completionOrb, { backgroundColor: cdiColor(cdi) + '22', borderColor: cdiColor(cdi) + '55' }]}>
                <Text style={[styles.completionOrbText, { color: cdiColor(cdi) }]}>
                  {isImproving ? '↓' : isDrifting ? '↑' : '–'}
                </Text>
              </View>
            </View>
            <Text style={styles.completionTitle}>
              {isImproving ? 'Lighter today ✨' : isDrifting ? 'Heavy, but honest.' : 'Steady as you go.'}
            </Text>
            <Text style={styles.completionSubtitle}>
              {isImproving
                ? "Your patterns shifted in a healthier direction."
                : isDrifting
                ? "Your mind is carrying something right now."
                : "A stable session. Consistency matters."}
            </Text>
          </View>

          {/* Drift state */}
          <View style={[styles.stateCard, { borderColor: cdiColor(cdi) + '40' }]}>
            <View style={[styles.stateCardBar, { backgroundColor: cdiColor(cdi) }]} />
            <View style={styles.stateCardInner}>
              <Text style={styles.cardEyebrow}>🧭  Your state right now</Text>
              <Text style={[styles.stateName, { color: cdiColor(cdi) }]}>{label}</Text>
              <Text style={styles.nudgeText}>{nudge}</Text>
            </View>
          </View>

          {/* What we noticed — the dominant pattern */}
          <View style={styles.noticeCard}>
            <View style={[styles.noticeCardBar, { backgroundColor: colors.amber }]} />
            <View style={styles.noticeCardInner}>
              <Text style={styles.cardEyebrow}>🔍  What we noticed</Text>
              <Text style={styles.dominantName}>{dominantName}</Text>
              <Text style={styles.dominantDesc}>{dominantDesc}</Text>
            </View>
          </View>

          {/* Session stats — human-readable */}
          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>🎯</Text>
              <Text style={styles.statNumber}>{lastSession.choices.length}</Text>
              <Text style={styles.statLabel}>choices made</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>📅</Text>
              <Text style={styles.statNumber}>{adaptiveState.totalSessions}</Text>
              <Text style={styles.statLabel}>total sessions</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statEmoji}>⚓</Text>
              <Text style={[styles.statNumber, { color: cdiColor(cdi) }]}>
                {adaptiveState.positivityBank}
              </Text>
              <Text style={styles.statLabel}>anchor points</Text>
            </View>
          </View>

          {/* Weekly challenge */}
          {challenge && (
            <View style={styles.challengeCard}>
              <View style={[styles.challengeBar, { backgroundColor: colors.violet }]} />
              <View style={styles.challengeInner}>
                <Text style={styles.cardEyebrow}>🌿  Your practice this week</Text>
                <Text style={styles.challengeTitle}>{challenge.title}</Text>
                <Text style={styles.challengeBody}>{challenge.prompt}</Text>
              </View>
            </View>
          )}

          {/* Actions */}
          <TouchableOpacity
            style={styles.homeBtn}
            onPress={() => navigation.navigate('Home')}
            activeOpacity={0.8}
          >
            <Text style={styles.homeBtnText}>Return home  →</Text>
          </TouchableOpacity>

          {adaptiveState.totalSessions >= 3 && (
            <TouchableOpacity
              style={styles.historyBtn}
              onPress={() => navigation.navigate('History')}
              activeOpacity={0.7}
            >
              <Text style={styles.historyBtnText}>See your full drift history →</Text>
            </TouchableOpacity>
          )}

        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },

  // Completion header
  completionHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  completionOrbRing: {
    width: 96,
    height: 96,
    borderRadius: radii.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
  },
  completionOrb: {
    width: 76,
    height: 76,
    borderRadius: radii.full,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  completionOrbText: {
    fontSize: 30,
    fontFamily: typography.display,
  },
  completionTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  completionSubtitle: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    paddingHorizontal: spacing.lg,
  },

  // Cards with accent bars
  stateCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.card,
  },
  stateCardBar: { width: 4 },
  stateCardInner: { flex: 1, padding: spacing.lg },
  noticeCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.card,
  },
  noticeCardBar: { width: 4 },
  noticeCardInner: { flex: 1, padding: spacing.lg },
  cardEyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  stateName: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    marginBottom: spacing.sm,
  },
  nudgeText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
    fontStyle: 'italic',
  },
  dominantName: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.amberDark,
    marginBottom: spacing.sm,
  },
  dominantDesc: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    alignItems: 'center',
    gap: 2,
  },
  statEmoji: { fontSize: 18, marginBottom: 2 },
  statNumber: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
    textAlign: 'center',
  },

  // Challenge card
  challengeCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    marginBottom: spacing.xl,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.card,
  },
  challengeBar: { width: 4 },
  challengeInner: { flex: 1, padding: spacing.lg },
  challengeTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  challengeBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },

  // Buttons
  homeBtn: {
    backgroundColor: colors.jade,
    borderRadius: radii.xl,
    paddingVertical: spacing.md + 2,
    alignItems: 'center',
    marginBottom: spacing.md,
    ...shadows.card,
  },
  homeBtnText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textOnAccent,
    letterSpacing: 0.3,
  },
  historyBtn: {
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    backgroundColor: colors.bg1,
  },
  historyBtnText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
});
