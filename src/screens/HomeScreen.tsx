// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Home Screen
// Himalayan backdrop, animated spirit, personalized greeting, games entry.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Animated, Easing, StatusBar, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useProfileStore, selectAdaptiveState, selectCDI,
  selectCDIHistory, selectName, selectSessions, selectShowCDIScore,
} from '../store/profileStore';
import { getCDILabel, WEEKLY_CHALLENGES } from '../engine/adaptiveEngine';
import { playTone, preloadTones } from '../utils/toneEngine';
import { colors, typography, spacing, radii, shadows, cdiColor } from '../themes/tokens';
import { computeBurnoutForecast } from '../engine/mathEngine';
import MountainScene from '../components/MountainScene';
import MochiCompanion from '../components/MochiCompanion';
import ScalePress from '../components/ScalePress';
import { WHOOP_PERSONAS } from '../data/whoopPersonas';
import { getStageSnapshot } from '../engine/weeklyAnalytics';

const { width: SCREEN_W } = Dimensions.get('window');
const SCENE_H = 260;

// ─────────────────────────────────────────────────────────────────────────────

export default function HomeScreen({ navigation }: any) {
  const adaptiveState     = useProfileStore(selectAdaptiveState);
  const cdi               = useProfileStore(selectCDI);
  const cdiHistory        = useProfileStore(selectCDIHistory);
  const name              = useProfileStore(selectName);
  const sessions          = useProfileStore(selectSessions);
  const showCDIScore      = useProfileStore(selectShowCDIScore);
  const fadeAnim          = useRef(new Animated.Value(0)).current;
  const slideAnim         = useRef(new Animated.Value(20)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim,  { toValue: 1, duration: 800, useNativeDriver: true }),
      Animated.timing(slideAnim, { toValue: 0, duration: 600, useNativeDriver: true }),
    ]).start();
    preloadTones();
    const introTimer = setTimeout(() => { playTone('intro'); }, 220);
    return () => clearTimeout(introTimer);
  }, []);

  const { label }        = getCDILabel(cdi);
  const challenge        = WEEKLY_CHALLENGES[adaptiveState.topDistortion];
  const isFirstSession   = adaptiveState.totalSessions === 0;
  const accent           = cdiColor(cdi);
  const adaptiveFlowNote = getAdaptiveFlowNote(adaptiveState.nextSessionMode);
  const mochiMessage     = getMochiMessage(cdi, adaptiveState.trajectory, adaptiveState.streakCount, isFirstSession);
  const burnoutForecast  = computeBurnoutForecast(cdiHistory, sessions);
  const burnoutUI        = formatBurnoutForecast(burnoutForecast);
  const wearableDemo     = WHOOP_PERSONAS.map(persona => ({
    persona,
    snapshot: getStageSnapshot(persona, 'yearEnd'),
  }));

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="dark-content" backgroundColor={colors.bg0} />
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: fadeAnim, transform: [{ translateY: slideAnim }] }}>

          {/* ── Mountain scene header ────────────────────────────────────── */}
          <View style={styles.sceneWrap}>
            <MountainScene width={SCREEN_W} height={SCENE_H} accent={accent} />

            {/* Overlay content */}
            <View style={styles.sceneOverlay}>
              {/* Top bar */}
              <View style={styles.topBar}>
                <TouchableOpacity
                  style={styles.menuBtn}
                  onPress={() => { playTone('open'); navigation.navigate('Settings'); }}
                  activeOpacity={0.75}
                >
                  <View style={styles.menuLine} />
                  <View style={[styles.menuLine, { width: 14 }]} />
                </TouchableOpacity>
                <View style={styles.topBarCenter}>
                  <View style={styles.brandLockup}>
                    <View style={styles.brandHalo} />
                    <View style={styles.brandPill}>
                      <View style={styles.brandDot} />
                      <View style={styles.brandTextWrap}>
                        <View style={styles.brandWordRow}>
                          <Text style={styles.brandCogni}>Cogni</Text>
                          <Text style={styles.brandZen}>Zen</Text>
                        </View>
                        <Text style={styles.brandTag}>Mochi's gentle check-in space</Text>
                      </View>
                    </View>
                  </View>
                </View>
                <View style={styles.topBarSpacer} />
              </View>

              {/* Greeting + Spirit */}
              <View style={styles.greetingRow}>
                <View style={styles.greetingText}>
                  <Text style={styles.greeting}>{getGreeting()}</Text>
                  <Text style={styles.personName}>
                    {name ? `Welcome back, ${name}.` : 'Welcome back.'}
                  </Text>
                </View>
                <View style={styles.spiritContainer}>
                  <MochiCompanion
                    cdi={cdi}
                    trajectory={adaptiveState.trajectory}
                    streakCount={adaptiveState.streakCount}
                    accent={accent}
                    size={130}
                  />
                </View>
              </View>
            </View>
          </View>

          {/* ── Body (dark card slides up over scene) ───────────────────── */}
          <View style={styles.body}>

            {/* Hero CTA */}
            <ScalePress
              style={[styles.heroCard, { borderColor: accent + '35' }]}
              onPress={() => { playTone('confirm'); navigation.navigate('Scenario'); }}
              pressedScale={0.992}
            >
              <View style={[styles.blob, { backgroundColor: accent + '25', top: -40, left: -40, width: 130, height: 130 }]} />
              <View style={[styles.blob, { backgroundColor: colors.jadeLight + '26', bottom: -30, right: 50, width: 110, height: 110 }]} />
              <View style={styles.heroLeft}>
                <Text style={styles.heroEyebrow}>
                  {isFirstSession ? 'First check-in' : "Today's check-in"}
                </Text>
                <View style={styles.heroFlowRow}>
                  <View style={[styles.heroFlowDot, { backgroundColor: accent }]} />
                  <Text style={styles.heroFlowText}>{adaptiveFlowNote}</Text>
                </View>
                <Text style={[styles.heroTitle, { color: accent }]}>{label}</Text>
                <Text style={styles.heroNudge}>{mochiMessage}</Text>
                <View style={[styles.heroBtn, { backgroundColor: accent }]}>
                  <Text style={styles.heroBtnText}>
                    {isFirstSession ? 'Start check-in  →' : "Today's check-in  →"}
                  </Text>
                </View>
              </View>
              <View style={styles.heroRight}>
                <AuraOrb
                  accent={accent}
                  cdi={cdi}
                  showCDIScore={showCDIScore}
                  moodLabel={label}
                />
              </View>
            </ScalePress>

            <View
              style={[
                styles.forecastCard,
                { borderColor: burnoutUI.accent + '35' },
              ]}
            >
              <View style={[styles.forecastAccentBar, { backgroundColor: burnoutUI.accent }]} />
              <View style={styles.forecastInner}>
                <View style={styles.forecastHeader}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.forecastEyebrow}>🔭  Looking ahead</Text>
                    <Text style={styles.forecastTitle}>{burnoutUI.title}</Text>
                  </View>
                  <View style={[styles.forecastPill, { backgroundColor: burnoutUI.accent + '16', borderColor: burnoutUI.accent + '30' }]}>
                    <View style={[styles.forecastPillDot, { backgroundColor: burnoutUI.accent }]} />
                    <Text style={[styles.forecastPillText, { color: burnoutUI.accent }]}>{burnoutUI.statusLabel}</Text>
                  </View>
                </View>

                <Text style={styles.forecastSummary}>{burnoutUI.summary}</Text>
                <Text style={styles.forecastFootnote}>{burnoutUI.footnote}</Text>
              </View>
            </View>

            {/* Stats */}
            {!isFirstSession && (
              <View style={styles.journeyPanel}>
                <View style={styles.journeyHeader}>
                  <View>
                    <Text style={styles.journeyEyebrow}>⭐  Journey board</Text>
                    <Text style={styles.journeyTitle}>Small wins count here.</Text>
                  </View>
                    <View style={[styles.trajectoryChip, { borderColor: colors.jade + '33' }]}>
                      <View style={[styles.trajectoryChipDot, { backgroundColor: colors.jadeDark }]} />
                    <Text style={styles.trajectoryChipText}>{trajectoryChipLabel(adaptiveState.trajectory)}</Text>
                  </View>
                </View>
                <View style={styles.miniStatsRow}>
                  <MiniStatCard
                    label="Sessions"
                    value={String(adaptiveState.totalSessions)}
                    accent={colors.jade}
                    caption="in your log"
                  />
                  <MiniStatCard
                    label="Streak"
                    value={compactStreakValue(adaptiveState.streakCount)}
                    accent={colors.violet}
                    caption={streakToneLabel(adaptiveState.streakDirection)}
                  />
                </View>
              </View>
            )}

            {/* Games entry */}
            <ScalePress
              style={styles.gamesCard}
              onPress={() => { playTone('tap'); navigation.navigate('Games'); }}
              pressedScale={0.988}
            >
              <View style={[styles.gamesIconBadge, { backgroundColor: colors.jadeLight + '30' }]}>
                <Text style={styles.gamesIconEmoji}>🎮</Text>
              </View>
              <View style={styles.gamesLeft}>
                <Text style={styles.gamesEyebrow}>Mental Terrain</Text>
                <Text style={styles.gamesTitle}>Play the games</Text>
                <Text style={styles.gamesSub}>
                  Reaction, Stroop, Memory, and more
                </Text>
              </View>
              <View style={styles.gamesArrow}>
                <Text style={[styles.gamesArrowText, { color: colors.jadeDark }]}>{'→'}</Text>
              </View>
            </ScalePress>

            <ScalePress
              style={styles.pulseCard}
              onPress={() => { playTone('tap'); navigation.navigate('WeeklySnapshot'); }}
              pressedScale={0.988}
            >
              <View style={styles.pulseHeader}>
                <View style={styles.pulseLeft}>
                  <Text style={styles.pulseEyebrow}>📈  Year in motion</Text>
                  <Text style={styles.pulseTitle}>See how a year can unfold</Text>
                  <Text style={styles.pulseSub}>
                    Three synthetic wearable paths, read through CogniZen.
                  </Text>
                </View>
                <View style={styles.pulseArrow}>
                  <Text style={[styles.gamesArrowText, { color: colors.violetDark }]}>{'→'}</Text>
                </View>
              </View>
              <View style={styles.pulsePersonaRow}>
                {wearableDemo.map(({ persona, snapshot }) => (
                  <WearablePersonaTile
                    key={persona.id}
                    label={snapshot.cdiLabel}
                    value={snapshot.cdi}
                    accent={persona.accentColor}
                  />
                ))}
              </View>
            </ScalePress>

            {/* Insights section */}
            {(challenge || cdiHistory.length > 2) && (
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionTitle}>✦ Insights</Text>
                {cdiHistory.length > 2 && (
                  <TouchableOpacity onPress={() => { playTone('tap'); navigation.navigate('History'); }}>
                    <Text style={styles.sectionLink}>See all →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            <View style={styles.cardsGrid}>
              {challenge && (
                <View style={[styles.insightCard, styles.insightCardAccented]}>
                  <View style={[styles.insightAccentBar, { backgroundColor: colors.violet }]} />
                  <View style={styles.insightCardInner}>
                    <View style={styles.insightHeaderRow}>
                      <Text style={styles.insightEyebrowEmoji}>🌿</Text>
                      <Text style={[styles.insightEyebrow, { color: colors.violet }]}>This week's anchor</Text>
                    </View>
                    <Text style={styles.insightTitleCompact}>{challenge.title}</Text>
                    <Text style={styles.insightBodyCompact} numberOfLines={2}>{challenge.prompt}</Text>
                  </View>
                </View>
              )}
              {!isFirstSession && cdiHistory.length > 1 && (
                <ScalePress
                  style={[styles.insightCard, styles.insightCardAccented]}
                  onPress={() => { playTone('tap'); navigation.navigate('History'); }}
                  pressedScale={0.988}
                >
                  <View style={[styles.insightAccentBar, { backgroundColor: colors.jade }]} />
                  <View style={styles.insightCardInner}>
                    <View style={styles.insightHeaderRow}>
                      <Text style={styles.insightEyebrowEmoji}>🌊</Text>
                      <Text style={[styles.insightEyebrow, { color: colors.jadeDark }]}>Mochi's note</Text>
                    </View>
                    <Text style={styles.insightTitleCompact}>Lately</Text>
                    <Text style={styles.insightBodyCompact} numberOfLines={2}>{driftTrendLine(cdiHistory)}</Text>
                    <Text style={[styles.insightCtaCompact, { color: colors.jadeDark }]}>
                      {'See the full story →'}
                    </Text>
                  </View>
                </ScalePress>
              )}
            </View>

          </View>
        </Animated.View>
      </ScrollView>
    </SafeAreaView>
  );
}

// ── Animated Genie Spirit ─────────────────────────────────────────────────────

function GenieSpirit({ cdi, accent }: { cdi: number; accent: string }) {
  const floatAnim   = useRef(new Animated.Value(0)).current;
  const swayAnim    = useRef(new Animated.Value(0)).current;
  const blinkAnim   = useRef(new Animated.Value(1)).current;
  const glowAnim    = useRef(new Animated.Value(0.3)).current;
  const breatheAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const floatLoop = Animated.loop(Animated.sequence([
      Animated.timing(floatAnim, { toValue: -11, duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(floatAnim, { toValue: 0,   duration: 2200, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    const swayLoop = Animated.loop(Animated.sequence([
      Animated.timing(swayAnim, { toValue: 5,  duration: 3800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
      Animated.timing(swayAnim, { toValue: -5, duration: 3800, useNativeDriver: true, easing: Easing.inOut(Easing.sin) }),
    ]));
    const glowLoop = Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 0.65, duration: 1800, useNativeDriver: true }),
      Animated.timing(glowAnim, { toValue: 0.2,  duration: 1800, useNativeDriver: true }),
    ]));
    const breatheLoop = Animated.loop(Animated.sequence([
      Animated.timing(breatheAnim, { toValue: 1.03, duration: 2800, useNativeDriver: true }),
      Animated.timing(breatheAnim, { toValue: 1,    duration: 2800, useNativeDriver: true }),
    ]));
    const blinkLoop = Animated.loop(Animated.sequence([
      Animated.delay(3500),
      Animated.timing(blinkAnim, { toValue: 0.08, duration: 90,  useNativeDriver: true }),
      Animated.timing(blinkAnim, { toValue: 1,    duration: 110, useNativeDriver: true }),
    ]));
    floatLoop.start(); swayLoop.start(); glowLoop.start(); breatheLoop.start(); blinkLoop.start();
    return () => { floatLoop.stop(); swayLoop.stop(); glowLoop.stop(); breatheLoop.stop(); blinkLoop.stop(); };
  }, []);

  const mood = getMoodExpression(cdi);

  return (
    <Animated.View style={[genieStyles.container, { transform: [{ translateY: floatAnim }, { translateX: swayAnim }] }]}>
      <Animated.View style={[genieStyles.glow, { backgroundColor: accent, opacity: glowAnim }]} />
      <Animated.View style={[genieStyles.body, { backgroundColor: accent, transform: [{ scale: breatheAnim }] }]}>
        <View style={genieStyles.shimmer} />
        <View style={genieStyles.face}>
          <View style={genieStyles.eyeRow}>
            <Animated.View style={[genieStyles.eye, { transform: [{ scaleY: blinkAnim }] }]} />
            <Animated.View style={[genieStyles.eye, { transform: [{ scaleY: blinkAnim }] }]} />
          </View>
          <View style={genieStyles[mood.mouthKey]} />
        </View>
      </Animated.View>
      <View style={[genieStyles.tail1, { backgroundColor: accent + 'CC' }]} />
      <View style={[genieStyles.tail2, { backgroundColor: accent + '90' }]} />
      <View style={[genieStyles.tail3, { backgroundColor: accent + '50' }]} />
    </Animated.View>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function AuraOrb({
  cdi,
  accent,
  showCDIScore,
  moodLabel,
}: {
  cdi: number;
  accent: string;
  showCDIScore: boolean;
  moodLabel: string;
}) {
  const breatheAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(breatheAnim, {
          toValue: 1,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(breatheAnim, {
          toValue: 0,
          duration: 3200,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const glowOpacity = breatheAnim.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.12, 0.24, 0.12] });
  const floatY = breatheAnim.interpolate({ inputRange: [0, 1], outputRange: [0, -4] });
  const meterLevel = cdi / 100;

  return (
    <View style={styles.auraWrap}>
      <Animated.View
        style={[
          styles.auraGlow,
          {
            backgroundColor: accent + '1A',
            opacity: glowOpacity,
            transform: [{ translateY: floatY }],
          },
        ]}
      />
      <LinearGradient
        colors={[accent + '18', colors.bg0]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.auraGradient}
      >
        <Text style={styles.auraEyebrow}>{showCDIScore ? "Mochi's read" : 'Private view'}</Text>
        <Text style={[styles.auraValue, !showCDIScore && styles.auraValueHidden, { color: accent }]}>
          {showCDIScore ? cdi : 'Quiet'}
        </Text>
        <Text style={styles.auraLabel}>{showCDIScore ? moodLabel : 'The number stays tucked away.'}</Text>
        <View style={styles.auraMeterRow}>
          {[0, 1, 2, 3].map((index) => {
            const segmentLevel = Math.max(0, Math.min(1, meterLevel * 4 - index));
            return (
              <View key={index} style={[styles.auraMeterTrack, { height: 18 + index * 9 }]}> 
                <Animated.View
                  style={[
                    styles.auraMeterFill,
                    {
                      backgroundColor: accent,
                      height: `${Math.max(16, segmentLevel * 100)}%`,
                      opacity: segmentLevel === 0 ? 0.14 : 0.28 + segmentLevel * 0.72,
                    },
                  ]}
                />
              </View>
            );
          })}
        </View>
      </LinearGradient>
    </View>
  );
}

function MiniStatCard({
  label,
  value,
  accent,
  caption,
}: {
  label: string;
  value: string;
  accent: string;
  caption: string;
}) {
  return (
    <View style={[styles.miniStatCard, { borderColor: accent + '2A' }]}>
      <View style={[styles.miniStatBadge, { backgroundColor: accent + '18' }]}>
        <View style={[styles.miniStatDot, { backgroundColor: accent }]} />
        <Text style={[styles.miniStatLabel, { color: accent }]}>{label}</Text>
      </View>
      <Text style={styles.miniStatValue}>{value}</Text>
      <Text style={styles.miniStatCaption}>{caption}</Text>
    </View>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function WearablePersonaTile({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <View style={styles.pulsePersonaTile}>
      <View style={[styles.pulsePersonaDot, { backgroundColor: accent }]} />
      <Text style={styles.pulsePersonaValue}>{value}</Text>
      <Text style={styles.pulsePersonaLabel}>{label}</Text>
    </View>
  );
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning.';
  if (h < 17) return 'Good afternoon.';
  return 'Good evening.';
}

type MouthKey = 'wideSmile' | 'smallSmile' | 'neutral' | 'smallFrown' | 'wideFrown';

function getMoodExpression(cdi: number): { label: string; mouthKey: MouthKey } {
  if (cdi < 20) return { label: 'Anchored & clear',  mouthKey: 'wideSmile' };
  if (cdi < 40) return { label: 'Steady',            mouthKey: 'smallSmile' };
  if (cdi < 55) return { label: 'Slightly adrift',   mouthKey: 'neutral' };
  if (cdi < 70) return { label: 'Drifting',          mouthKey: 'smallFrown' };
  return               { label: 'Deep in the drift', mouthKey: 'wideFrown' };
}

function formatStreak(count: number, dir: string): string {
  if (count <= 1) return '—';
  return `${count}${dir === 'up' ? ' ↑' : dir === 'down' ? ' ↓' : ''}`;
}

function formatTrajectory(t: string): string {
  return t === 'recovering' ? '↑' : t === 'worsening' ? '↓' : t === 'stable' ? '→' : '~';
}

function compactStreakValue(count: number): string {
  if (count <= 1) return '1';
  return String(count);
}

function trajectoryChipLabel(t: string): string {
  if (t === 'recovering') return 'Rising';
  if (t === 'worsening') return 'Heavy';
  if (t === 'stable') return 'Steady';
  return 'New';
}

function streakToneLabel(dir: string): string {
  if (dir === 'up') return 'building up';
  if (dir === 'down') return 'needs care';
  return 'warming up';
}

function getSparkNote(cdi: number, isFirstSession: boolean, trajectory: string, streakCount: number): string {
  if (isFirstSession) return 'Mochi will keep this first one gentle.';
  if (cdi >= 65 || trajectory === 'worsening') return 'Short and gentle is enough today.';
  if (trajectory === 'recovering' || streakCount >= 3) return 'Small steps still count.';
  if (trajectory === 'stable') return 'Steady rhythm. Protect the groove.';
  return 'Honest answers are enough.';
}

function getAdaptiveFlowNote(mode: string): string {
  if (mode === 'nurture') return "Mochi picked a gentle flow for today";
  if (mode === 'challenge') return 'Mochi picked a sharper flow for today';
  if (mode === 'probe') return 'Mochi is checking in on your main pattern today';
  if (mode === 'celebrate') return 'Mochi picked a light victory lap for today';
  return 'Mochi is feeling out your rhythm today';
}

function getMochiMessage(
  cdi: number,
  trajectory: string,
  streakCount: number,
  isFirstSession: boolean,
): string {
  if (isFirstSession) return "I'm proud of you for checking in today.";
  if (cdi >= 65 || trajectory === 'worsening') {
    return "Your body is working hard, let's breathe together for a moment.";
  }
  if (trajectory === 'recovering' || streakCount >= 3) {
    return "Your consistency is paying off, let's take one step at a time.";
  }
  return "I'm proud of you for checking in today.";
}

function driftTrendLine(history: { timestamp: number; score: number }[]): string {
  if (history.length < 2) return 'Mochi is still getting to know your pace.';
  const recent = history.slice(-3);
  const avg    = recent.reduce((a, b) => a + b.score, 0) / recent.length;
  const diff   = avg - history[0].score;
  if (Math.abs(diff) < 5) return 'Things have felt pretty steady lately.';
  return diff < 0
    ? 'The past few days look a little lighter.'
    : 'The past few days look a bit heavier. A gentler pace may help.';
}

// ── Genie StyleSheet ──────────────────────────────────────────────────────────

function formatBurnoutForecast(forecast: ReturnType<typeof computeBurnoutForecast>) {
  if (forecast.status === 'insufficient_data') {
    return {
      title: 'Forecast still warming up',
      summary: 'A fuller forecast appears after 5 check-ins.',
      footnote: `${forecast.sampleCount} of 5 check-ins ready`,
      accent: colors.textTertiary,
      statusLabel: 'Waiting',
    };
  }

  if (forecast.status === 'crossed') {
    return {
      title: 'Slow down if you can',
      summary: 'Your recent pattern looks heavy enough that Mochi would treat burnout risk as current.',
      footnote: `Last ${forecast.sampleCount} check-ins over ${formatSpanDays(forecast.spanDays)}. ${forecast.confidenceLabel}.`,
      accent: colors.driftStrong,
      statusLabel: 'High risk',
    };
  }

  if (forecast.status === 'watching') {
    return {
      title: 'Steady for now',
      summary: 'Nothing urgent is showing up right now. Your recent pace looks steady.',
      footnote: `Last ${forecast.sampleCount} check-ins over ${formatSpanDays(forecast.spanDays)}. ${forecast.confidenceLabel}.`,
      accent: colors.driftAnchor,
      statusLabel: 'Watching',
    };
  }

  return {
    title: 'Burnout watch',
    summary: `At this pace, burnout may be about ${forecast.projectedDays} day${forecast.projectedDays === 1 ? '' : 's'} away.`,
    footnote: `Last ${forecast.sampleCount} check-ins over ${formatSpanDays(forecast.spanDays)}. ${forecast.confidenceLabel}.`,
    accent: forecast.projectedDays !== null && forecast.projectedDays <= 14 ? colors.driftStrong : colors.driftActive,
    statusLabel: forecast.projectedDays !== null && forecast.projectedDays <= 14 ? 'Approaching' : 'Forecast',
  };
}

function formatSpanDays(spanDays: number): string {
  if (spanDays < 1) return 'less than a day';
  const rounded = Math.round(spanDays);
  return `${rounded} day${rounded === 1 ? '' : 's'}`;
}

const FC = 'rgba(0,0,0,0.45)';

const genieStyles = StyleSheet.create({
  container: { width: 100, alignItems: 'center' },
  glow:      { position: 'absolute', width: 96, height: 96, borderRadius: 48, top: 2, alignSelf: 'center' },
  body:      { width: 74, height: 82, borderTopLeftRadius: 37, borderTopRightRadius: 37, borderBottomLeftRadius: 26, borderBottomRightRadius: 26, alignItems: 'center', overflow: 'hidden' },
  shimmer:   { position: 'absolute', top: 8, left: 10, width: 18, height: 18, borderRadius: 9, backgroundColor: 'rgba(255,255,255,0.22)' },
  face:      { marginTop: 22, alignItems: 'center', gap: 7 },
  eyeRow:    { flexDirection: 'row', gap: 13 },
  eye:       { width: 10, height: 10, borderRadius: 5, backgroundColor: FC },
  wideSmile: { width: 28, height: 14, borderBottomWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5, borderTopWidth: 0, borderBottomLeftRadius: 14, borderBottomRightRadius: 14, borderColor: FC, backgroundColor: 'transparent' },
  smallSmile:{ width: 22, height: 10, borderBottomWidth: 2,   borderLeftWidth: 2,   borderRightWidth: 2,   borderTopWidth: 0, borderBottomLeftRadius: 10, borderBottomRightRadius: 10, borderColor: FC, backgroundColor: 'transparent' },
  neutral:   { width: 20, height: 3, borderRadius: 2, backgroundColor: FC },
  smallFrown:{ width: 22, height: 10, borderTopWidth: 2,   borderLeftWidth: 2,   borderRightWidth: 2,   borderBottomWidth: 0, borderTopLeftRadius: 10, borderTopRightRadius: 10, borderColor: FC, backgroundColor: 'transparent' },
  wideFrown: { width: 28, height: 14, borderTopWidth: 2.5, borderLeftWidth: 2.5, borderRightWidth: 2.5, borderBottomWidth: 0, borderTopLeftRadius: 14, borderTopRightRadius: 14, borderColor: FC, backgroundColor: 'transparent' },
  tail1:     { width: 24, height: 22, borderBottomLeftRadius: 13, borderBottomRightRadius: 13, borderTopLeftRadius: 5, borderTopRightRadius: 5, marginTop: -2 },
  tail2:     { width: 15, height: 16, borderBottomLeftRadius: 9,  borderBottomRightRadius: 9,  borderTopLeftRadius: 3, borderTopRightRadius: 3, marginTop: -2 },
  tail3:     { width: 8,  height: 11, borderRadius: 4, marginTop: -2 },
});

// ── Screen styles ─────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:   { flex: 1, backgroundColor: colors.bg0 },
  scroll: { flex: 1 },

  // Mountain scene
  sceneWrap: { height: SCENE_H, overflow: 'hidden' },
  sceneOverlay: {
    position: 'absolute',
    inset: 0,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    justifyContent: 'space-between',
    paddingBottom: spacing.lg,
  },

  // Top bar
  topBar: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', minHeight: 58, paddingTop: spacing.xs },
  menuBtn: { gap: 5, padding: 6 },
  menuLine: { height: 2, width: 20, backgroundColor: colors.textSecondary, borderRadius: 1 },
  topBarCenter: { position: 'absolute', left: 54, right: 54, top: 2, alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  topBarSpacer: { width: 36 },
  brandLockup: { alignItems: 'center', justifyContent: 'center' },
  brandHalo: { position: 'absolute', width: 184, height: 54, borderRadius: 27, backgroundColor: 'rgba(255, 248, 240, 0.38)' },
  brandPill: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radii.full, backgroundColor: 'rgba(255, 248, 240, 0.94)', borderWidth: 1, borderColor: colors.border1 },
  brandDot: { width: 10, height: 10, borderRadius: radii.full, backgroundColor: colors.jadeLight, borderWidth: 2, borderColor: colors.bg1 },
  brandTextWrap: { alignItems: 'center' },
  brandWordRow: { flexDirection: 'row', alignItems: 'flex-end' },
  brandCogni: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.sm, color: colors.textSecondary, letterSpacing: 2.2, textTransform: 'uppercase' },
  brandZen: { fontFamily: typography.displayItalic, fontSize: 24, lineHeight: 24, color: colors.textPrimary, marginLeft: 4 },
  brandTag: { fontFamily: typography.body, fontSize: 10, color: colors.textTertiary, letterSpacing: 0.9, marginTop: -1 },

  // Greeting
  greetingRow: { flexDirection: 'row', alignItems: 'center' },
  greetingText: { flex: 1 },
  greeting: { fontFamily: typography.body, fontSize: typography.sizes.md, color: colors.textSecondary, marginBottom: 2 },
  personName: { fontFamily: typography.display, fontSize: typography.sizes.xxl, color: colors.textPrimary, letterSpacing: -0.5, marginBottom: spacing.xs },
  spiritContainer: { width: 142, height: 164, alignItems: 'center', justifyContent: 'center' },

  // Body
  body: { backgroundColor: colors.bg0, borderTopLeftRadius: 26, borderTopRightRadius: 26, marginTop: -26, paddingTop: spacing.xl, paddingHorizontal: spacing.screen, paddingBottom: spacing.xxl, minHeight: 500 },

  // Hero card
  heroCard: { backgroundColor: colors.bg1, borderRadius: radii.xl, borderWidth: 1, overflow: 'hidden', minHeight: 192, flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg, ...shadows.float },
  blob: { position: 'absolute', borderRadius: radii.full },
  heroLeft: { flex: 1, padding: spacing.lg, paddingRight: spacing.md, zIndex: 1 },
  heroEyebrow: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textTertiary, letterSpacing: 1, textTransform: 'uppercase', marginBottom: spacing.xs },
  heroFlowRow: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, marginBottom: spacing.xs },
  heroFlowDot: { width: 7, height: 7, borderRadius: radii.full },
  heroFlowText: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.xs, color: colors.textSecondary },
  heroTitle: { fontFamily: typography.display, fontSize: typography.sizes.xl, marginBottom: spacing.sm, letterSpacing: -0.3 },
  heroNudge: { fontFamily: typography.body, fontSize: typography.sizes.sm, color: colors.textSecondary, lineHeight: typography.sizes.sm * typography.lineHeights.relaxed, fontStyle: 'italic', marginBottom: spacing.md },
  heroSparkChip: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: spacing.xs, paddingHorizontal: spacing.sm, paddingVertical: 7, borderRadius: radii.full, borderWidth: 1, marginBottom: spacing.md },
  heroSparkDot: { width: 7, height: 7, borderRadius: radii.full },
  heroSparkText: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.xs, color: colors.textPrimary },
  heroBtn: { alignSelf: 'flex-start', paddingHorizontal: spacing.md, paddingVertical: 11, borderRadius: radii.lg, ...shadows.inner },
  heroBtnText: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.sm, color: colors.textOnAccent, letterSpacing: 0.3 },
  heroRight: { width: 152, alignItems: 'center', justifyContent: 'center', paddingRight: spacing.md, paddingVertical: spacing.md },
  auraWrap: { width: 136, height: 152, alignItems: 'center', justifyContent: 'center' },
  auraGlow: { position: 'absolute', width: 116, height: 116, borderRadius: radii.full },
  auraGradient: { width: 128, minHeight: 140, borderRadius: radii.xl, borderWidth: 1, borderColor: colors.border1, paddingHorizontal: spacing.md, paddingVertical: spacing.md, justifyContent: 'space-between' },
  auraEyebrow: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' },
  auraValue: { fontFamily: typography.display, fontSize: 34, lineHeight: 36, color: colors.textPrimary, marginTop: spacing.xs },
  auraValueHidden: { fontSize: typography.sizes.xl, lineHeight: 28 },
  auraLabel: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textSecondary, lineHeight: typography.sizes.xs * 1.5 },
  auraMeterRow: { flexDirection: 'row', alignItems: 'flex-end', gap: 8, marginTop: spacing.sm },
  auraMeterTrack: { flex: 1, minHeight: 18, justifyContent: 'flex-end', borderRadius: radii.full, backgroundColor: 'rgba(75,49,36,0.08)', overflow: 'hidden' },
  auraMeterFill: { width: '100%', borderRadius: radii.full },

  forecastCard: { backgroundColor: colors.bg1, borderRadius: radii.xl, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden', flexDirection: 'row', ...shadows.card },
  forecastAccentBar: { width: 4 },
  forecastInner: { flex: 1, padding: spacing.lg },
  forecastHeader: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.sm },
  forecastEyebrow: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: spacing.xs },
  forecastTitle: { fontFamily: typography.displayItalic, fontSize: typography.sizes.lg, color: colors.textPrimary },
  forecastPill: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: radii.full, borderWidth: 1, paddingHorizontal: spacing.sm, paddingVertical: 6 },
  forecastPillDot: { width: 7, height: 7, borderRadius: radii.full },
  forecastPillText: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.xs },
  forecastSummary: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.md, color: colors.textPrimary, lineHeight: typography.sizes.md * 1.45, marginBottom: spacing.xs },
  forecastFootnote: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textTertiary },

  // Stats
  journeyPanel: { backgroundColor: colors.bg1, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border1, padding: spacing.md, marginBottom: spacing.lg, ...shadows.card },
  journeyHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm, marginBottom: spacing.md },
  journeyEyebrow: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textTertiary, textTransform: 'uppercase', letterSpacing: 0.8, marginBottom: 2 },
  journeyTitle: { fontFamily: typography.displayItalic, fontSize: typography.sizes.lg, color: colors.textPrimary },
  trajectoryChip: { flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderRadius: radii.full, paddingHorizontal: spacing.sm, paddingVertical: 7, backgroundColor: colors.bg2 },
  trajectoryChipDot: { width: 7, height: 7, borderRadius: radii.full },
  trajectoryChipText: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.xs, color: colors.textPrimary },
  miniStatsRow: { flexDirection: 'row', gap: spacing.sm },
  miniStatCard: { flex: 1, minHeight: 92, backgroundColor: colors.bg2, borderRadius: radii.md, borderWidth: 1, padding: spacing.sm, justifyContent: 'space-between' },
  miniStatBadge: { flexDirection: 'row', alignItems: 'center', alignSelf: 'flex-start', gap: 6, borderRadius: radii.full, paddingHorizontal: 8, paddingVertical: 5 },
  miniStatDot: { width: 6, height: 6, borderRadius: radii.full },
  miniStatLabel: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.xs },
  miniStatValue: { fontFamily: typography.display, fontSize: 28, color: colors.textPrimary, marginTop: spacing.sm },
  miniStatCaption: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textSecondary },

  // Games card
  gamesCard: { backgroundColor: colors.bg1, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border1, flexDirection: 'row', alignItems: 'center', padding: spacing.md, marginBottom: spacing.xl, gap: spacing.sm, ...shadows.card },
  gamesIconBadge: { width: 44, height: 44, borderRadius: radii.md, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  gamesIconEmoji: { fontSize: 22 },
  gamesLeft: { flex: 1 },
  gamesEyebrow: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  gamesTitle: { fontFamily: typography.display, fontSize: typography.sizes.lg, color: colors.textPrimary },
  gamesSub: { fontFamily: typography.body, fontSize: typography.sizes.sm, color: colors.textSecondary, marginTop: 3 },
  gamesArrow: { paddingLeft: spacing.sm },
  gamesArrowText: { fontFamily: typography.display, fontSize: typography.sizes.xl },

  pulseCard: { backgroundColor: colors.bg1, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border1, padding: spacing.md, marginBottom: spacing.xl, ...shadows.card },
  pulseHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md, marginBottom: spacing.md },
  pulseLeft: { flex: 1 },
  pulseEyebrow: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 2 },
  pulseTitle: { fontFamily: typography.displayItalic, fontSize: typography.sizes.lg, color: colors.textPrimary, marginBottom: spacing.xs },
  pulseSub: { fontFamily: typography.body, fontSize: typography.sizes.sm, color: colors.textSecondary },
  pulseArrow: { paddingLeft: spacing.md },
  pulsePersonaRow: { flexDirection: 'row', gap: spacing.sm },
  pulsePersonaTile: { flex: 1, minHeight: 84, backgroundColor: colors.bg2, borderRadius: radii.md, borderWidth: 1, borderColor: colors.border1, padding: spacing.sm, justifyContent: 'space-between' },
  pulsePersonaDot: { width: 8, height: 8, borderRadius: radii.full, marginBottom: spacing.xs },
  pulsePersonaValue: { fontFamily: typography.display, fontSize: typography.sizes.lg, color: colors.textPrimary, marginTop: spacing.sm },
  pulsePersonaLabel: { fontFamily: typography.body, fontSize: typography.sizes.xs, color: colors.textSecondary },

  // Section + Insight cards
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.md },
  sectionTitle: { fontFamily: typography.display, fontSize: typography.sizes.lg, color: colors.textPrimary },
  sectionLink: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.sm, color: colors.jadeDark },
  cardsGrid: { gap: spacing.sm },
  insightCard: { backgroundColor: colors.bg1, borderRadius: radii.lg, borderWidth: 1, borderColor: colors.border1, overflow: 'hidden', ...shadows.inner },
  insightCardAccented: { flexDirection: 'row', padding: 0 },
  insightAccentBar: { width: 4, borderTopLeftRadius: radii.lg, borderBottomLeftRadius: radii.lg },
  insightCardInner: { flex: 1, padding: spacing.md },
  insightHeaderRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, marginBottom: spacing.sm },
  insightDot: { width: 7, height: 7, borderRadius: radii.full },
  insightEyebrowEmoji: { fontSize: 13, lineHeight: 16 },
  insightEyebrow: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.xs, color: colors.textTertiary, letterSpacing: 0.8, textTransform: 'uppercase' },
  insightTitleCompact: { fontFamily: typography.displayItalic, fontSize: typography.sizes.md, color: colors.textPrimary, marginBottom: spacing.xs },
  insightBodyCompact: { fontFamily: typography.body, fontSize: typography.sizes.sm, color: colors.textSecondary, lineHeight: typography.sizes.sm * 1.45 },
  insightCtaCompact: { fontFamily: typography.bodyMedium, fontSize: typography.sizes.xs, marginTop: spacing.sm },
});
