// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Weekly Snapshot Screen  (Wearable Intelligence Demo)
// Three synthetic WHOOP personas · Zen / Full view toggle
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Svg, {
  Circle,
  Line,
  Polyline,
  Rect,
  Text as SvgText,
} from 'react-native-svg';
import MochiCompanion from '../components/MochiCompanion';
import ScalePress from '../components/ScalePress';
import { WHOOP_PERSONAS } from '../data/whoopPersonas';
import {
  bestAndHardestLabels,
  getPersonaSnapshots,
  insightToneColor,
  PersonaWeekSnapshot,
  TrendDirection,
  trendLabel,
} from '../engine/weeklyAnalytics';
import { playTone } from '../utils/toneEngine';
import { colors, radii, shadows, spacing, typography } from '../themes/tokens';

const DEMO_STAGE_WEEKS = [6, 20, 34, 50] as const;
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const { width: SCREEN_W } = Dimensions.get('window');

type ViewMode = 'zen' | 'full';

function formatTrend(trend: TrendDirection, inverted = false): string {
  const label = trendLabel(trend, inverted);
  const arrow = trend === 'rising' ? '↑' : trend === 'falling' ? '↓' : '→';
  return `${arrow} ${label}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function WellnessRing({
  value,
  size = 96,
  accent,
  label = 'wellness',
}: {
  value: number;
  size?: number;
  accent: string;
  label?: string;
}) {
  const sw = 7;
  const r = (size - sw * 2) / 2;
  const circ = 2 * Math.PI * r;
  const progress = (Math.min(100, Math.max(0, value)) / 100) * circ;
  const cx = size / 2;
  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      <Svg width={size} height={size} style={StyleSheet.absoluteFill}>
        <Circle cx={cx} cy={cx} r={r} stroke={colors.bg2} strokeWidth={sw} fill="none" />
        <Circle
          cx={cx} cy={cx} r={r}
          stroke={accent} strokeWidth={sw} fill="none"
          strokeDasharray={`${progress} ${circ}`}
          strokeLinecap="round"
          transform={`rotate(-90, ${cx}, ${cx})`}
        />
      </Svg>
      <Text style={{ fontFamily: typography.display, fontSize: Math.round(size * 0.28), color: colors.textPrimary, lineHeight: Math.round(size * 0.32) }}>
        {value}
      </Text>
      <Text style={{ fontFamily: typography.body, fontSize: 10, color: colors.textSecondary }}>
        {label}
      </Text>
    </View>
  );
}

function ZenTile({
  emoji,
  label,
  value,
  trend,
  accent,
}: {
  emoji: string;
  label: string;
  value: string;
  trend: string;
  accent: string;
}) {
  return (
    <View style={styles.zenTile}>
      <Text style={styles.zenTileEmoji}>{emoji}</Text>
      <Text style={[styles.zenTileValue, { color: accent }]}>{value}</Text>
      <Text style={styles.zenTileLabel}>{label}</Text>
      <Text style={styles.zenTileTrend}>{trend}</Text>
    </View>
  );
}

function FullMetricCard({
  emoji,
  label,
  value,
  trend,
}: {
  emoji: string;
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <View style={styles.fullMetricCard}>
      <Text style={styles.fullMetricEmoji}>{emoji}</Text>
      <Text style={styles.fullMetricLabel}>{label}</Text>
      <Text style={styles.fullMetricValue}>{value}</Text>
      <Text style={styles.fullMetricTrend}>{trend}</Text>
    </View>
  );
}

function DailyChart({
  recoveries,
  hardestIdx,
  accent,
  width,
}: {
  recoveries: number[];
  hardestIdx: number;
  accent: string;
  width: number;
}) {
  const h = 72;
  const gap = 6;
  const barW = Math.floor((width - gap * 6) / 7);
  const totalUsed = barW * 7 + gap * 6;
  const offsetX = Math.max(0, (width - totalUsed) / 2);

  return (
    <Svg width={width} height={h + 36}>
      {recoveries.map((val, i) => {
        const barH = Math.max(6, Math.round((val / 100) * h));
        const x = offsetX + i * (barW + gap);
        const y = h - barH;
        const isLow = i === hardestIdx;
        return (
          <React.Fragment key={i}>
            <Rect
              x={x} y={y} width={barW} height={barH}
              rx={4} ry={4}
              fill={isLow ? colors.amberLight : accent + '88'}
            />
            <SvgText
              x={x + barW / 2} y={y - 3}
              textAnchor="middle" fontSize="9" fill={colors.textTertiary}
            >
              {val}
            </SvgText>
            <SvgText
              x={x + barW / 2} y={h + 18}
              textAnchor="middle" fontSize="10"
              fill={isLow ? colors.amberLight : colors.textTertiary}
            >
              {DAY_SHORT[i]}
            </SvgText>
          </React.Fragment>
        );
      })}
    </Svg>
  );
}

function Sparkline({
  snapshots,
  accent,
  activeWeek,
  width,
}: {
  snapshots: PersonaWeekSnapshot[];
  accent: string;
  activeWeek: number;
  width: number;
}) {
  const height = 96;
  const points = snapshots
    .map((s, i) => {
      const x = (i / (snapshots.length - 1)) * width;
      const y = height - (s.cdi / 100) * height;
      return `${x},${y}`;
    })
    .join(' ');
  const markerIdx = Math.min(activeWeek - 1, snapshots.length - 1);
  const marker = snapshots[markerIdx];
  const markerX = (markerIdx / (snapshots.length - 1)) * width;
  const markerY = height - (marker.cdi / 100) * height;

  return (
    <Svg width={width} height={height + 12}>
      <Line x1="0" y1={height} x2={width} y2={height} stroke={colors.border1} strokeWidth="1" />
      <Line x1="0" y1={height / 2} x2={width} y2={height / 2} stroke={colors.border0} strokeWidth="1" strokeDasharray="4 4" />
      <Polyline
        points={points}
        fill="none"
        stroke={accent}
        strokeWidth="3"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <Circle cx={markerX} cy={markerY} r={5} fill={accent} />
    </Svg>
  );
}

// ── Main screen ───────────────────────────────────────────────────────────────

export default function WeeklySnapshotScreen({ navigation }: any) {
  const [personaId, setPersonaId] = useState<'recoverer' | 'steady' | 'drifter'>('drifter');
  const [stageWeek, setStageWeek] = useState<number>(6);
  const [viewMode, setViewMode] = useState<ViewMode>('zen');
  const contentAnim = useRef(new Animated.Value(1)).current;
  const chartWidth = Math.max(200, SCREEN_W - spacing.screen * 2 - spacing.lg * 2);

  const selectedPersona = WHOOP_PERSONAS.find(p => p.id === personaId) ?? WHOOP_PERSONAS[0];
  const allSnapshots = getPersonaSnapshots(selectedPersona);
  const selectedSnapshot = allSnapshots[stageWeek - 1];
  const dailyRecoveries = selectedPersona.weeks[stageWeek - 1].days.map(d => d.recovery);
  const dayLabels = bestAndHardestLabels(selectedSnapshot);

  const stageTabs = DEMO_STAGE_WEEKS.map(w => ({
    week: w,
    label: allSnapshots[w - 1].cdiLabel,
  }));

  const compareCards = WHOOP_PERSONAS.map(persona => ({
    persona,
    snapshot: getPersonaSnapshots(persona)[stageWeek - 1],
  }));

  useEffect(() => {
    contentAnim.setValue(0);
    Animated.timing(contentAnim, {
      toValue: 1, duration: 240, useNativeDriver: true,
    }).start();
  }, [contentAnim, personaId, stageWeek, viewMode]);

  const contentTranslateY = contentAnim.interpolate({
    inputRange: [0, 1], outputRange: [10, 0],
  });

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Sticky header ── */}
      <View style={styles.header}>
        <ScalePress onPress={() => { playTone('tap'); navigation.goBack(); }} pressedScale={0.92}>
          <Text style={styles.backText}>←</Text>
        </ScalePress>
        <View style={styles.headerCenter}>
          <Text style={styles.headerEyebrow}>WEARABLE INTELLIGENCE</Text>
          <Text style={styles.headerTitle}>Weekly Pulse</Text>
        </View>
        <View style={styles.modePill}>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'zen' && styles.modeBtnActive]}
            onPress={() => { playTone('tap'); setViewMode('zen'); }}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeBtnText, viewMode === 'zen' && styles.modeBtnTextActive]}>
              🌸 Zen
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.modeBtn, viewMode === 'full' && styles.modeBtnActive]}
            onPress={() => { playTone('tap'); setViewMode('full'); }}
            activeOpacity={0.85}
          >
            <Text style={[styles.modeBtnText, viewMode === 'full' && styles.modeBtnTextActive]}>
              ≡ Full
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* ── Persona pills ── */}
        <View style={styles.personaRow}>
          {WHOOP_PERSONAS.map(persona => {
            const active = persona.id === personaId;
            return (
              <ScalePress
                key={persona.id}
                style={[
                  styles.personaPill,
                  active && { backgroundColor: persona.accentColor + '22', borderColor: persona.accentColor },
                ]}
                onPress={() => { playTone('tap'); setPersonaId(persona.id); }}
                pressedScale={0.95}
              >
                <View style={[styles.personaDot, { backgroundColor: persona.accentColor }]} />
                <Text style={[styles.personaPillText, active && { color: persona.accentColor }]}>
                  {persona.name}
                </Text>
              </ScalePress>
            );
          })}
        </View>

        {/* ── Stage tabs ── */}
        <View style={styles.stageTabs}>
          {stageTabs.map(tab => {
            const active = tab.week === stageWeek;
            return (
              <ScalePress
                key={tab.week}
                style={[
                  styles.stageTab,
                  active && { backgroundColor: selectedPersona.accentColor },
                ]}
                onPress={() => { playTone('tap'); setStageWeek(tab.week); }}
                pressedScale={0.94}
              >
                <Text
                  style={[styles.stageTabLabel, active && styles.stageTabLabelActive]}
                  numberOfLines={1}
                >
                  {tab.label}
                </Text>
                <Text style={[styles.stageTabWeek, active && styles.stageTabWeekActive]}>
                  Wk {tab.week}
                </Text>
              </ScalePress>
            );
          })}
        </View>

        {/* ── Animated content area ── */}
        <Animated.View
          style={[
            styles.body,
            { opacity: contentAnim, transform: [{ translateY: contentTranslateY }] },
          ]}
        >
          {viewMode === 'zen' ? (
            /* ════════════════ ZEN MODE ════════════════ */
            <>
              <View style={[styles.zenHeroCard, { borderColor: selectedPersona.accentColor + '44' }]}>
                <Text style={styles.zenHeroEyebrow}>
                  {selectedPersona.name} · {selectedSnapshot.cdiLabel}
                </Text>
                <View style={styles.zenHeroRow}>
                  <MochiCompanion
                    cdi={selectedSnapshot.cdi}
                    variant="auto"
                    motionPreset="home"
                    accent={selectedPersona.accentColor}
                    size={88}
                  />
                  <WellnessRing
                    value={selectedSnapshot.stats.wellnessScore}
                    size={108}
                    accent={selectedPersona.accentColor}
                  />
                </View>
                <View style={[styles.zenStatusChip, {
                  backgroundColor: selectedPersona.accentColor + '18',
                  borderColor: selectedPersona.accentColor + '55',
                }]}>
                  <View style={[styles.zenStatusDot, { backgroundColor: selectedPersona.accentColor }]} />
                  <Text style={[styles.zenStatusText, { color: selectedPersona.accentColor }]}>
                    {selectedSnapshot.cdiLabel}
                  </Text>
                  <Text style={styles.zenStatusSep}>·</Text>
                  <Text style={styles.zenStatusSub} numberOfLines={1}>
                    {selectedSnapshot.insight.highlightLabel}
                  </Text>
                </View>
                <Text style={styles.zenQuote}>"{selectedSnapshot.insight.quote}"</Text>
              </View>

              <Text style={styles.sectionEyebrow}>THIS WEEK AT A GLANCE</Text>

              <View style={styles.zenTileRow}>
                <ZenTile
                  emoji="🍃" label="Recovery"
                  value={`${selectedSnapshot.stats.avgRecovery}%`}
                  trend={formatTrend(selectedSnapshot.comparison.recoveryTrend)}
                  accent={selectedPersona.accentColor}
                />
                <ZenTile
                  emoji="🌙" label="Sleep"
                  value={`${selectedSnapshot.stats.avgSleepPerformance}%`}
                  trend={formatTrend(selectedSnapshot.comparison.sleepTrend)}
                  accent={selectedPersona.accentColor}
                />
                <ZenTile
                  emoji="⚡" label="HRV"
                  value={`${selectedSnapshot.stats.avgHRV}ms`}
                  trend={formatTrend(selectedSnapshot.comparison.hrvTrend)}
                  accent={selectedPersona.accentColor}
                />
              </View>

              <View style={[styles.insightCard, {
                borderColor: insightToneColor(selectedSnapshot.insight.tone) + '44',
              }]}>
                <Text style={[styles.insightQuote, {
                  color: insightToneColor(selectedSnapshot.insight.tone),
                }]}>
                  "{selectedSnapshot.insight.quote}"
                </Text>
                <Text style={styles.insightBody}>{selectedSnapshot.insight.subtext}</Text>
              </View>

              <View style={styles.nudgeCard}>
                <Text style={styles.nudgeEyebrow}>YOUR GENTLE NUDGE</Text>
                <Text style={styles.nudgeText}>{selectedSnapshot.insight.suggestion}</Text>
              </View>
            </>
          ) : (
            /* ════════════════ FULL MODE ════════════════ */
            <>
              {/* Hero card */}
              <View style={[styles.fullHeroCard, { borderColor: selectedPersona.accentColor + '44' }]}>
                <View style={styles.fullHeroLeft}>
                  <Text style={styles.fullHeroEyebrow}>WEEK {stageWeek} OF 52</Text>
                  <Text style={[styles.fullHeroTitle, { color: selectedPersona.accentColor }]}>
                    {selectedSnapshot.cdiLabel}
                  </Text>
                  <Text style={styles.fullHeroSub}>
                    {selectedPersona.name} · {selectedPersona.archetype}
                  </Text>
                </View>
                <WellnessRing
                  value={selectedSnapshot.stats.wellnessScore}
                  size={92}
                  accent={selectedPersona.accentColor}
                />
              </View>

              {/* Daily recovery chart */}
              <View style={styles.chartCard}>
                <View style={styles.chartCardHeader}>
                  <Text style={styles.chartCardTitle}>Daily Recovery</Text>
                  <View style={styles.trendBadge}>
                    <Text style={styles.trendBadgeText}>
                      {formatTrend(selectedSnapshot.comparison.recoveryTrend)}
                    </Text>
                  </View>
                </View>
                <View style={styles.chartInner}>
                  <DailyChart
                    recoveries={dailyRecoveries}
                    hardestIdx={selectedSnapshot.stats.hardestDayIndex}
                    accent={selectedPersona.accentColor}
                    width={chartWidth}
                  />
                </View>
              </View>

              {/* 2×2 metric grid */}
              <View style={styles.metricsGrid}>
                <FullMetricCard emoji="🍃" label="Recovery"
                  value={`${selectedSnapshot.stats.avgRecovery}%`}
                  trend={formatTrend(selectedSnapshot.comparison.recoveryTrend)} />
                <FullMetricCard emoji="⚡" label="HRV"
                  value={`${selectedSnapshot.stats.avgHRV}ms`}
                  trend={formatTrend(selectedSnapshot.comparison.hrvTrend)} />
                <FullMetricCard emoji="🌙" label="Sleep"
                  value={`${selectedSnapshot.stats.avgSleepPerformance}%`}
                  trend={formatTrend(selectedSnapshot.comparison.sleepTrend)} />
                <FullMetricCard emoji="🔥" label="Strain"
                  value={`${selectedSnapshot.stats.totalStrain}`}
                  trend={formatTrend(selectedSnapshot.comparison.strainTrend, true)} />
              </View>

              {/* Footer stats */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Avg Sleep</Text>
                  <Text style={[styles.statValue, { color: selectedPersona.accentColor }]}>
                    {selectedSnapshot.stats.avgSleepDuration}h
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Best Day</Text>
                  <Text style={[styles.statValue, { color: selectedPersona.accentColor }]}>
                    {dayLabels.best} {selectedSnapshot.stats.peakRecovery}%
                  </Text>
                </View>
                <View style={styles.statBox}>
                  <Text style={styles.statLabel}>Physiol. CDI</Text>
                  <Text style={[styles.statValue, { color: selectedPersona.accentColor }]}>
                    {selectedSnapshot.physiologyDrift}
                  </Text>
                </View>
              </View>

              {/* Mochi's read */}
              <View style={styles.storyCard}>
                <View style={styles.storyHeader}>
                  <View style={styles.storyCopy}>
                    <Text style={styles.storyEyebrow}>Mochi's read</Text>
                    <Text style={styles.storyTitle}>{selectedSnapshot.insight.quote}</Text>
                  </View>
                  <View style={[styles.storyToneChip, {
                    borderColor: insightToneColor(selectedSnapshot.insight.tone) + '55',
                    backgroundColor: insightToneColor(selectedSnapshot.insight.tone) + '16',
                  }]}>
                    <Text style={[styles.storyToneText, { color: insightToneColor(selectedSnapshot.insight.tone) }]}>
                      {selectedSnapshot.insight.highlightLabel}
                    </Text>
                  </View>
                </View>
                <Text style={styles.storyBody}>{selectedSnapshot.insight.subtext}</Text>
                <Text style={styles.storySuggestion}>{selectedSnapshot.insight.suggestion}</Text>
                <View style={styles.storyFooter}>
                  <Text style={styles.storyFooterText}>Best day: {dayLabels.best}</Text>
                  <Text style={styles.storyFooterText}>Hardest day: {dayLabels.hardest}</Text>
                </View>
              </View>

              {/* CDI sparkline */}
              <View style={styles.sparkCard}>
                <Text style={styles.sparkEyebrow}>CDI across the year</Text>
                <Text style={styles.sparkTitle}>Behavioral math + wearable signal</Text>
                <View style={styles.sparkWrap}>
                  <Sparkline
                    snapshots={allSnapshots}
                    accent={selectedPersona.accentColor}
                    activeWeek={stageWeek}
                    width={chartWidth}
                  />
                </View>
                <View style={styles.sparkFooter}>
                  <Text style={styles.sparkHint}>Week 1</Text>
                  <Text style={styles.sparkHint}>Week 26</Text>
                  <Text style={styles.sparkHint}>Week 52</Text>
                </View>
              </View>

              {/* Compare card */}
              <View style={styles.compareCard}>
                <Text style={styles.compareEyebrow}>At this same moment</Text>
                <Text style={styles.compareTitle}>How all three journeys look</Text>
                {compareCards.map(({ persona, snapshot }) => (
                  <View key={persona.id} style={styles.compareRow}>
                    <View style={styles.compareLeft}>
                      <View style={[styles.compareDot, { backgroundColor: persona.accentColor }]} />
                      <View>
                        <Text style={styles.compareName}>{persona.name}</Text>
                        <Text style={styles.compareSub}>{persona.archetype}</Text>
                      </View>
                    </View>
                    <View style={styles.compareRight}>
                      <Text style={styles.compareValue}>{snapshot.cdi}</Text>
                      <Text style={styles.compareLabel}>{snapshot.cdiLabel}</Text>
                    </View>
                  </View>
                ))}
              </View>
            </>
          )}
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg0 },
  scroll: { flex: 1 },
  scrollContent: { paddingBottom: spacing.xxl },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border0,
  },
  backText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.lg,
    color: colors.textSecondary,
    paddingVertical: spacing.xs,
    paddingRight: spacing.sm,
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerEyebrow: {
    fontFamily: typography.body,
    fontSize: 9,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 2,
  },
  headerTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
  },

  // Mode toggle
  modePill: {
    flexDirection: 'row',
    backgroundColor: colors.bg1,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: 2,
  },
  modeBtn: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: radii.full,
  },
  modeBtnActive: { backgroundColor: colors.amberLight },
  modeBtnText: {
    fontFamily: typography.bodyMedium,
    fontSize: 11,
    color: colors.textTertiary,
  },
  modeBtnTextActive: { color: colors.textOnAccent },

  // Persona pills
  personaRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.xs,
  },
  personaPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 9,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border1,
    backgroundColor: colors.bg0,
  },
  personaDot: { width: 7, height: 7, borderRadius: radii.full },
  personaPillText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },

  // Stage tabs
  stageTabs: {
    flexDirection: 'row',
    gap: spacing.xs,
    paddingHorizontal: spacing.screen,
    paddingVertical: spacing.sm,
  },
  stageTab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: 4,
    borderRadius: radii.md,
    backgroundColor: colors.bg1,
    borderWidth: 1,
    borderColor: colors.border1,
    overflow: 'hidden',
  },
  stageTabLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: 10,
    color: colors.textSecondary,
    textAlign: 'center',
  },
  stageTabLabelActive: { color: colors.textOnAccent },
  stageTabWeek: {
    fontFamily: typography.body,
    fontSize: 9,
    color: colors.textTertiary,
    marginTop: 2,
  },
  stageTabWeekActive: { color: colors.textOnAccent + 'CC' },

  // Animated body
  body: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    gap: spacing.lg,
  },
  sectionEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
  },

  // ── ZEN MODE ────────────────────────────────────────────

  zenHeroCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    alignItems: 'center',
    ...shadows.card,
  },
  zenHeroEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.md,
    alignSelf: 'flex-start',
  },
  zenHeroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.md,
    paddingHorizontal: spacing.lg,
  },
  zenStatusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.md,
    paddingVertical: 7,
    borderRadius: radii.full,
    borderWidth: 1,
    marginBottom: spacing.md,
    maxWidth: '100%',
  },
  zenStatusDot: { width: 7, height: 7, borderRadius: radii.full, flexShrink: 0 },
  zenStatusText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    flexShrink: 0,
  },
  zenStatusSep: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textTertiary,
    flexShrink: 0,
  },
  zenStatusSub: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    flexShrink: 1,
  },
  zenQuote: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: typography.sizes.md * 1.65,
    fontStyle: 'italic',
  },
  zenTileRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  zenTile: {
    flex: 1,
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    alignItems: 'center',
    gap: 2,
  },
  zenTileEmoji: { fontSize: 20, marginBottom: 2 },
  zenTileValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
  },
  zenTileLabel: {
    fontFamily: typography.body,
    fontSize: 10,
    color: colors.textTertiary,
  },
  zenTileTrend: {
    fontFamily: typography.bodyMedium,
    fontSize: 10,
    color: colors.textSecondary,
  },
  insightCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadows.card,
  },
  insightQuote: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    lineHeight: typography.sizes.lg * 1.5,
    marginBottom: spacing.sm,
  },
  insightBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.7,
  },
  nudgeCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
  },
  nudgeEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.9,
    marginBottom: spacing.sm,
  },
  nudgeText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * 1.6,
  },

  // ── FULL MODE ────────────────────────────────────────────

  fullHeroCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    padding: spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    ...shadows.card,
  },
  fullHeroLeft: { flex: 1, paddingRight: spacing.md },
  fullHeroEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  fullHeroTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.xxl,
    marginBottom: spacing.xs,
  },
  fullHeroSub: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  chartCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
    ...shadows.card,
  },
  chartCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  chartCardTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  trendBadge: {
    backgroundColor: colors.bg2,
    paddingHorizontal: spacing.sm,
    paddingVertical: 5,
    borderRadius: radii.full,
  },
  trendBadgeText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  chartInner: { alignItems: 'center' },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  fullMetricCard: {
    width: '47.5%',
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
  },
  fullMetricEmoji: { fontSize: 20, marginBottom: spacing.xs },
  fullMetricLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginBottom: 2,
  },
  fullMetricValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  fullMetricTrend: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  statBox: {
    flex: 1,
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.sm,
    alignItems: 'center',
  },
  statLabel: {
    fontFamily: typography.body,
    fontSize: 9,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    textAlign: 'center',
    marginBottom: 4,
  },
  statValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.md,
    textAlign: 'center',
  },
  storyCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
    ...shadows.card,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.md,
    marginBottom: spacing.sm,
  },
  storyCopy: { flex: 1 },
  storyEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  storyTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  storyToneChip: {
    borderWidth: 1,
    borderRadius: radii.full,
    paddingHorizontal: spacing.sm,
    paddingVertical: 7,
    flexShrink: 0,
  },
  storyToneText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
  },
  storyBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.7,
    marginBottom: spacing.sm,
  },
  storySuggestion: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
    lineHeight: typography.sizes.sm * 1.6,
    marginBottom: spacing.md,
  },
  storyFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  storyFooterText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  sparkCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
    ...shadows.card,
  },
  sparkEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  sparkTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  sparkWrap: { alignItems: 'center' },
  sparkFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.xs,
  },
  sparkHint: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
  },
  compareCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
    ...shadows.card,
    marginBottom: spacing.xl,
  },
  compareEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  compareTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  compareRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: colors.border0,
  },
  compareLeft: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  compareDot: { width: 10, height: 10, borderRadius: radii.full },
  compareName: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
  },
  compareSub: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
  compareRight: { alignItems: 'flex-end' },
  compareValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  compareLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textSecondary,
  },
});
