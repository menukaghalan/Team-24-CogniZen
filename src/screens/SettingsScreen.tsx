// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Settings Screen
// Full-screen settings, fully scrollable.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, StyleSheet, Switch,
  ScrollView, TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  useProfileStore, selectCDI, selectName,
  selectSelectedCompanion, selectShowCDIScore,
} from '../store/profileStore';
import { getCDILabel } from '../engine/adaptiveEngine';
import { COMPANION_OPTIONS, getCompanionAccent } from '../data/companions';
import { colors, typography, spacing, radii, shadows, cdiColor } from '../themes/tokens';
import { playTone } from '../utils/toneEngine';
import MochiCompanion from '../components/MochiCompanion';
import ScalePress from '../components/ScalePress';

export default function SettingsScreen({ navigation }: any) {
  const cdi               = useProfileStore(selectCDI);
  const name              = useProfileStore(selectName);
  const showCDIScore      = useProfileStore(selectShowCDIScore);
  const selectedCompanion = useProfileStore(selectSelectedCompanion);
  const setShowCDIScore   = useProfileStore(s => s.setShowCDIScore);
  const resetProfile      = useProfileStore(s => s.resetProfile);

  const accent                 = cdiColor(cdi);
  const { label: cdiLabel }    = getCDILabel(cdi);
  const currentCompanion       = COMPANION_OPTIONS.find(o => o.key === selectedCompanion) ?? COMPANION_OPTIONS[0];
  const currentCompanionAccent = getCompanionAccent(selectedCompanion);

  const mochiMessage = getMochiMessage(cdi, name);

  const openCharacters = () => {
    playTone('confirm');
    navigation.navigate('Characters');
  };

  const startFresh = () => {
    playTone('close');
    resetProfile();
    navigation.reset({
      index: 0,
      routes: [{ name: 'Intake' }],
    });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* ── Top bar ──────────────────────────────────────────────────── */}
      <View style={styles.topBar}>
        <ScalePress
          style={styles.backBtn}
          onPress={() => { playTone('close'); navigation.goBack(); }}
        >
          <Text style={styles.backText}>← back</Text>
        </ScalePress>
        <Text style={styles.topTitle}>Settings</Text>
        <View style={styles.topSpacer} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Companion area ───────────────────────────────────────────── */}
        <View style={[styles.companionArea, { backgroundColor: currentCompanionAccent + '14' }]}>
          <MochiCompanion
            character={selectedCompanion}
            variant="menuCalm"
            motionPreset="menu"
            accent={currentCompanionAccent}
            size={120}
          />
          <Text style={[styles.companionName, { color: currentCompanionAccent }]}>
            {currentCompanion.name}
          </Text>
          <Text style={styles.companionCaption}>your current guide</Text>
        </View>

        {/* ── CDI score toggle ────────────────────────────────────────── */}
        <View style={styles.rowCard}>
          <View style={styles.rowCopy}>
            <Text style={styles.rowLabel}>📊  Show CDI score</Text>
            <Text style={styles.rowHint}>
              Turn it on for a number, leave it off for a softer view.
            </Text>
          </View>
          <Switch
            value={showCDIScore}
            onValueChange={v => { playTone('tap'); setShowCDIScore(v); }}
            trackColor={{ false: colors.border1, true: colors.jade + '88' }}
            thumbColor={showCDIScore ? colors.jadeDark : colors.bg1}
            ios_backgroundColor={colors.border1}
          />
        </View>

        {showCDIScore && (
          <View style={[styles.scoreCard, { borderColor: accent + '40' }]}>
            <View style={[styles.scoreBar, { backgroundColor: accent }]} />
            <View style={styles.scoreInner}>
              <Text style={styles.scoreEyebrow}>Current drift score</Text>
              <Text style={[styles.scoreValue, { color: accent }]}>{cdi}</Text>
              <Text style={styles.scoreLabel}>{cdiLabel}</Text>
            </View>
          </View>
        )}

        {/* ── Characters link ─────────────────────────────────────────── */}
        <ScalePress style={styles.linkCard} onPress={openCharacters}>
          <View style={[styles.linkEmoji, { backgroundColor: currentCompanionAccent + '18' }]}>
            <Text style={styles.linkEmojiText}>🐾</Text>
          </View>
          <View style={styles.linkCopy}>
            <Text style={styles.linkTitle}>Characters</Text>
            <Text style={styles.linkBody}>Browse guides and preview premium companions.</Text>
          </View>
          <View style={styles.linkMeta}>
            <Text style={[styles.linkValue, { color: currentCompanionAccent }]}>
              {currentCompanion.name}
            </Text>
            <Text style={styles.linkArrow}>→</Text>
          </View>
        </ScalePress>

        {/* ── Mochi says ──────────────────────────────────────────────── */}
        <ScalePress style={styles.resetCard} onPress={startFresh}>
          <View style={[styles.resetEmoji, { backgroundColor: colors.violetLight + '36' }]}>
            <Text style={styles.resetEmojiText}>?</Text>
          </View>
          <View style={styles.resetCopy}>
            <Text style={styles.resetTitle}>Start fresh</Text>
            <Text style={styles.resetBody}>Reset your profile and go back to the name and intro steps.</Text>
          </View>
        </ScalePress>

        <View style={styles.quoteCard}>
          <View style={[styles.quoteBar, { backgroundColor: colors.jade }]} />
          <View style={styles.quoteInner}>
            <Text style={styles.quoteEyebrow}>💬  Mochi says</Text>
            <Text style={styles.quoteText}>"{mochiMessage}"</Text>
          </View>
        </View>

        {/* ── About ────────────────────────────────────────────────────── */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutEyebrow}>🌿  About</Text>
          <Text style={styles.aboutTitle}>CogniZen</Text>
          <Text style={styles.aboutBody}>
            Mochi blends gentle check-ins, playful brain games, and your recent rhythm into support that feels caring — not clinical.
          </Text>
          <Text style={styles.aboutBody} />
          <Text style={styles.aboutBody}>
            Your data lives only on this device and is never shared.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function getMochiMessage(cdi: number, name: string | null): string {
  const first = name ? name.split(' ')[0] : null;
  if (cdi >= 65) return "Your body is working hard — let's breathe together for a moment.";
  if (cdi <= 30) return first
    ? `You're doing really well, ${first}. Keep the rhythm going.`
    : "You're doing really well. Keep the rhythm going.";
  return first
    ? `Good to see you, ${first}. Let's keep showing up.`
    : "Good to see you. Let's keep showing up.";
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg0 },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border0,
  },
  backBtn: {
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border1,
    backgroundColor: colors.bg1,
  },
  backText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  topTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    letterSpacing: -0.3,
  },
  topSpacer: { width: 72 },

  scroll: { flex: 1 },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.md,
  },

  // Companion
  companionArea: {
    borderRadius: radii.xl,
    alignItems: 'center',
    paddingVertical: spacing.xl,
    borderWidth: 1,
    borderColor: colors.border0,
  },
  companionName: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.xl,
    marginTop: spacing.sm,
  },
  companionCaption: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 3,
    letterSpacing: 0.5,
  },

  // Toggle row
  rowCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    ...shadows.inner,
  },
  rowCopy: { flex: 1 },
  rowLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    marginBottom: 3,
  },
  rowHint: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.5,
  },

  // Score card (shown when toggle is on)
  scoreCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.inner,
  },
  scoreBar: { width: 4 },
  scoreInner: { flex: 1, padding: spacing.md },
  scoreEyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    textTransform: 'uppercase',
    letterSpacing: 0.8,
    marginBottom: spacing.xs,
  },
  scoreValue: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    letterSpacing: -0.5,
  },
  scoreLabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Link card
  linkCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.inner,
  },
  linkEmoji: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  linkEmojiText: { fontSize: 22 },
  linkCopy: { flex: 1 },
  linkTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  linkBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.45,
  },
  linkMeta: {
    alignItems: 'flex-end',
    justifyContent: 'center',
    gap: spacing.xs,
    flexShrink: 0,
  },
  linkValue: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
  },
  linkArrow: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textSecondary,
    lineHeight: 24,
  },

  resetCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    ...shadows.inner,
  },
  resetEmoji: {
    width: 44,
    height: 44,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  resetEmojiText: {
    fontFamily: typography.display,
    fontSize: 24,
    color: colors.violetDark,
    lineHeight: 24,
  },
  resetCopy: { flex: 1 },
  resetTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: 2,
  },
  resetBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.45,
  },

  // Mochi quote
  quoteCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    overflow: 'hidden',
    flexDirection: 'row',
    ...shadows.inner,
  },
  quoteBar: { width: 4 },
  quoteInner: { flex: 1, padding: spacing.md },
  quoteEyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  quoteText: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.md,
    color: colors.textPrimary,
    lineHeight: typography.sizes.md * 1.6,
  },

  // About
  aboutCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    ...shadows.inner,
  },
  aboutEyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  aboutTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  aboutBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.65,
  },
});
