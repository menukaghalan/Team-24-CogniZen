import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Dimensions,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import MochiCompanion from '../components/MochiCompanion';
import ScalePress from '../components/ScalePress';
import { COMPANION_OPTIONS, getCompanionAccent, type CompanionOption } from '../data/companions';
import { selectSelectedCompanion, useProfileStore } from '../store/profileStore';
import { colors, radii, shadows, spacing, typography } from '../themes/tokens';
import { playTone } from '../utils/toneEngine';

const { width: SCREEN_W } = Dimensions.get('window');
const CARD_GAP = spacing.md;
const CARD_WIDTH = (SCREEN_W - spacing.screen * 2 - CARD_GAP) / 2;

export default function CharacterSelectScreen({ navigation }: any) {
  const selectedCompanion = useProfileStore(selectSelectedCompanion);
  const setSelectedCompanion = useProfileStore(s => s.setSelectedCompanion);
  const introAnim = useRef(new Animated.Value(0)).current;
  const cardAnims = useRef(COMPANION_OPTIONS.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    Animated.sequence([
      Animated.timing(introAnim, {
        toValue: 1,
        duration: 260,
        useNativeDriver: true,
      }),
      Animated.stagger(
        90,
        cardAnims.map((anim) => Animated.spring(anim, {
          toValue: 1,
          damping: 16,
          stiffness: 180,
          mass: 0.9,
          useNativeDriver: true,
        })),
      ),
    ]).start();
  }, [cardAnims, introAnim]);

  const handleCompanionPress = (option: CompanionOption) => {
    if (option.locked) {
      playTone('tap');
      return;
    }

    if (selectedCompanion !== option.key) {
      playTone('confirm');
      setSelectedCompanion(option.key);
      return;
    }

    playTone('tap');
  };

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.topRow}>
          <ScalePress style={styles.backButton} onPress={() => { playTone('close'); navigation.goBack(); }}>
            <Text style={styles.backText}>← back</Text>
          </ScalePress>
          <Text style={styles.topEyebrow}>characters</Text>
        </View>

        <Animated.View
          style={[
            styles.heroCard,
            {
              opacity: introAnim,
              transform: [
                {
                  translateY: introAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [14, 0],
                  }),
                },
              ],
            },
          ]}
        >
          <Text style={styles.heroEyebrow}>🐾  Choose your guide</Text>
          <Text style={styles.heroTitle}>Who walks with you?</Text>
          <Text style={styles.heroBody}>
            Your guide shows up in check-ins, games, and quiet moments. Pick the one that feels right.
          </Text>
        </Animated.View>

        <View style={styles.grid}>
          {COMPANION_OPTIONS.map((option, index) => {
            const isSelected = selectedCompanion === option.key;
            const accent = getCompanionAccent(option.key);
            const anim = cardAnims[index];

            return (
              <Animated.View
                key={option.key}
                style={[
                  styles.gridItem,
                  {
                    opacity: anim,
                    transform: [
                      {
                        translateY: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [20, 0],
                        }),
                      },
                      {
                        scale: anim.interpolate({
                          inputRange: [0, 1],
                          outputRange: [0.94, 1],
                        }),
                      },
                    ],
                  },
                ]}
              >
                <ScalePress
                  style={[
                    styles.card,
                    isSelected && { borderColor: accent, borderWidth: 2, backgroundColor: accent + '08' },
                    option.locked && styles.cardLocked,
                  ]}
                  onPress={() => handleCompanionPress(option)}
                  pressedScale={0.985}
                >
                  {option.locked ? (
                    <View style={styles.paywallBadge}>
                      <Text style={styles.paywallText}>🔒</Text>
                    </View>
                  ) : null}
                  {isSelected && !option.locked ? (
                    <View style={[styles.currentBadge, { backgroundColor: accent }]}>
                      <Text style={styles.currentText}>✓ Active</Text>
                    </View>
                  ) : null}

                  <View style={[styles.artShell, { backgroundColor: accent + (isSelected ? '22' : '12') }]}>
                    <MochiCompanion
                      character={option.key}
                      variant={option.key === 'mochi' && isSelected ? 'celebrateA' : option.key === 'mochi' ? 'menuCalm' : 'auto'}
                      motionPreset={isSelected ? 'celebrate' : option.key === 'mochi' ? 'menu' : 'home'}
                      accent={accent}
                      size={92}
                    />
                  </View>

                  <Text style={[styles.cardTitle, isSelected && { color: accent }]}>{option.name}</Text>
                  <View style={styles.cardNoteRow}>
                    <View style={[styles.cardNoteDot, { backgroundColor: option.locked ? colors.amber : colors.jade }]} />
                    <Text style={[styles.cardNote, { color: option.locked ? colors.amber : colors.jadeDark }]}>
                      {option.locked ? 'Premium' : 'Included'}
                    </Text>
                  </View>
                </ScalePress>
              </Animated.View>
            );
          })}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxl,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  backButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radii.full,
    borderWidth: 1,
    borderColor: colors.border1,
    backgroundColor: colors.bg1,
  },
  backText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
  topEyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  heroCard: {
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.lg,
    marginBottom: spacing.lg,
    ...shadows.lifted,
  },
  heroEyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 0.9,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  heroTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    letterSpacing: -0.5,
  },
  heroBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * typography.lineHeights.relaxed,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: CARD_GAP,
  },
  gridItem: {
    width: CARD_WIDTH,
  },
  card: {
    position: 'relative',
    minHeight: 236,
    backgroundColor: colors.bg1,
    borderRadius: radii.xl,
    borderWidth: 1,
    borderColor: colors.border1,
    padding: spacing.md,
    ...shadows.card,
  },
  cardLocked: {
    opacity: 0.7,
  },
  paywallBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 28,
    height: 28,
    borderRadius: radii.full,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg2,
    borderWidth: 1,
    borderColor: colors.border1,
    zIndex: 2,
  },
  paywallText: {
    fontSize: 14,
  },
  currentBadge: {
    position: 'absolute',
    top: 10,
    right: 10,
    paddingHorizontal: 9,
    paddingVertical: 5,
    borderRadius: radii.full,
    zIndex: 2,
  },
  currentText: {
    fontFamily: typography.bodyMedium,
    fontSize: 10,
    color: colors.textOnAccent,
  },
  artShell: {
    minHeight: 132,
    borderRadius: radii.lg,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.md,
    overflow: 'hidden',
  },
  cardTitle: {
    fontFamily: typography.displayItalic,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
    marginBottom: 6,
  },
  cardNoteRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  cardNoteDot: {
    width: 6,
    height: 6,
    borderRadius: radii.full,
  },
  cardNote: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
  },
});
