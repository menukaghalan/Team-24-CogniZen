// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · History Screen
// The drift waveform. A heartbeat of the user's cognitive health over time.
// No numbers presented without context. Trends, not scores.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useProfileStore } from '../store/profileStore';
import { getCDILabel } from '../engine/adaptiveEngine';
import { colors, typography, spacing, radii, cdiColor } from '../themes/tokens';

const { width } = Dimensions.get('window');
const CHART_WIDTH = width - spacing.screen * 2;
const CHART_HEIGHT = 120;

const DISTORTION_NAMES: Record<string, string> = {
  temporalDiscount: 'Need relief now',
  negativityBias: 'Heavy thoughts',
  allOrNothing: 'Hard edges',
  decisionAvoidance: 'Choice fatigue',
  catastrophizing: 'Big worry',
  effortReward: 'Running on empty',
};

export default function HistoryScreen({ navigation }: any) {
  const cdiHistory = useProfileStore(s => s.profile.cdiHistory);
  const sessions = useProfileStore(s => s.profile.sessions);
  const adaptiveState = useProfileStore(s => s.profile.adaptiveState);
  const currentCDI = useProfileStore(s => s.profile.currentCDI);

  const { label, color } = getCDILabel(currentCDI);

  const trajectoryLabel: Record<string, string> = {
    recovering: 'Recovering — your patterns are improving',
    worsening: 'Drifting — worth paying attention to',
    stable: 'Stable — holding steady',
    unknown: 'Still learning your baseline',
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <Text style={styles.backText}>← Back</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Your recent story</Text>
        </View>

        {/* Trajectory summary */}
        <View style={styles.summaryCard}>
          <Text style={styles.eyebrow}>How things have felt</Text>
          <Text style={[styles.trajectoryLabel, { color: cdiColor(currentCDI) }]}>
            {trajectoryLabel[adaptiveState.trajectory]}
          </Text>
          <Text style={styles.sessionsNote}>
            Based on {sessions.length} check-in{sessions.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Waveform — CDI over time */}
        {cdiHistory.length >= 2 && (
          <View style={styles.chartCard}>
            <Text style={styles.eyebrow}>Recent rhythm</Text>
            <WaveformChart history={cdiHistory} />
            <View style={styles.chartLegend}>
              <Text style={styles.legendText}>← Earlier</Text>
              <Text style={styles.legendText}>Now →</Text>
            </View>
          </View>
        )}

        {/* Session-by-session breakdown */}
        <Text style={styles.sectionTitle}>Recent check-ins</Text>
        {sessions.slice().reverse().map((session, i) => {
          const date = new Date(session.startedAt);
          const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
          const timeStr = date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
          const domName = DISTORTION_NAMES[session.dominantDistortion] ?? session.dominantDistortion;

          return (
            <View key={session.id} style={styles.sessionRow}>
              <View style={styles.sessionLeft}>
                <Text style={styles.sessionDate}>{dateStr}</Text>
                <Text style={styles.sessionTime}>{timeStr}</Text>
              </View>
              <View style={styles.sessionMid}>
                <Text style={styles.sessionPattern}>{domName}</Text>
                <Text style={styles.sessionTrend}>
                  {session.trend === 'improving' ? '↓ improving' :
                   session.trend === 'drifting' ? '↑ drifting' : '– stable'}
                </Text>
              </View>
              <View style={styles.sessionRight}>
                <View style={[styles.cdiDot, { backgroundColor: cdiColor(session.cdiScore) }]} />
              </View>
            </View>
          );
        })}

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Waveform Chart ────────────────────────────────────────────────────────────

function WaveformChart({ history }: { history: { timestamp: number; score: number }[] }) {
  const pts = history.slice(-20);
  if (pts.length < 2) return null;

  // Build a simple bar representation (react-native-svg line chart in production)
  const maxScore = Math.max(...pts.map(p => p.score));
  const minScore = Math.min(...pts.map(p => p.score));

  return (
    <View style={styles.waveformRow}>
      {pts.map((p, i) => {
        const norm = maxScore === minScore ? 0.5 : (p.score - minScore) / (maxScore - minScore);
        const barHeight = 20 + norm * (CHART_HEIGHT - 40);
        return (
          <View
            key={i}
            style={[
              styles.waveformBar,
              {
                height: barHeight,
                backgroundColor: cdiColor(p.score),
                opacity: 0.6 + norm * 0.4,
              },
            ]}
          />
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  header: {
    marginBottom: spacing.xl,
  },
  backBtn: {
    marginBottom: spacing.md,
  },
  backText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
  },
  title: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
  },
  summaryCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  eyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  trajectoryLabel: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    marginBottom: spacing.xs,
  },
  sessionsNote: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  chartCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
    marginBottom: spacing.xl,
  },
  waveformRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: CHART_HEIGHT,
    gap: 3,
    marginTop: spacing.md,
  },
  waveformBar: {
    flex: 1,
    borderRadius: 2,
    minHeight: 8,
  },
  chartLegend: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  legendText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  sectionTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sessionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bg1,
    borderRadius: radii.md,
    borderWidth: 1,
    borderColor: colors.border0,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  sessionLeft: {
    width: 52,
  },
  sessionDate: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  sessionTime: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sessionMid: {
    flex: 1,
  },
  sessionPattern: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  sessionTrend: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 2,
  },
  sessionRight: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  cdiDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
});
