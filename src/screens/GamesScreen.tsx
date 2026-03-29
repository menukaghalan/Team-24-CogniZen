// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Games Screen
// Mental terrain — mini-games mapped to cognitive dimensions.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  ScrollView, Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MountainScene from '../components/MountainScene';
import { colors, typography, spacing, radii, shadows } from '../themes/tokens';

const { width: SCREEN_W } = Dimensions.get('window');
const SCENE_H = 140;

interface GameCard {
  id: string;
  route: string | null;
  title: string;
  subtitle: string;
  dimension: string;
  accentColor: string;
  available: boolean;
  emoji: string;
}

const GAMES: GameCard[] = [
  {
    id: 'reactionTap',
    route: 'ReactionTapGame',
    title: 'Reaction Sprint',
    subtitle: 'Tap targets as they emerge from the mist.',
    dimension: 'Temporal Processing',
    accentColor: colors.driftMild,
    available: true,
    emoji: '⚡',
  },
  {
    id: 'stroop',
    route: 'StroopGame',
    title: 'Mind Stroop',
    subtitle: 'Name the colour, not the word. Confusion is data.',
    dimension: 'Cognitive Flexibility',
    accentColor: colors.jade,
    available: true,
    emoji: '🎨',
  },
  {
    id: 'patternMemory',
    route: 'PatternMemoryGame',
    title: 'Echo Sequence',
    subtitle: 'The mountain echoes a pattern. Repeat it.',
    dimension: 'Working Memory',
    accentColor: colors.violetLight,
    available: true,
    emoji: '🧩',
  },
  {
    id: 'maze',
    route: null,
    title: 'Ridge Walk',
    subtitle: 'Navigate the terrain without losing the path.',
    dimension: 'Spatial Focus',
    accentColor: colors.jadeLight,
    available: false,
    emoji: '🏔️',
  },
  {
    id: 'creative',
    route: null,
    title: 'Mood Canvas',
    subtitle: 'Paint your inner landscape. Colour carries truth.',
    dimension: 'Emotional State',
    accentColor: colors.violetLight,
    available: false,
    emoji: '🖌️',
  },
];

export default function GamesScreen({ navigation }: any) {
  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>

        {/* Mountain backdrop header */}
        <View style={styles.sceneWrap}>
          <MountainScene width={SCREEN_W} height={SCENE_H} accent={colors.jade} />
          <View style={styles.sceneOverlay}>
            <TouchableOpacity
              style={styles.backBtn}
              onPress={() => navigation.goBack()}
            >
              <Text style={styles.backText}>← back</Text>
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Mental Terrain</Text>
            <Text style={styles.headerSub}>
              Each game probes a different facet of your drift.
            </Text>
          </View>
        </View>

        <View style={styles.content}>
          {GAMES.map(game => (
            <GameCard
              key={game.id}
              game={game}
              onPress={() => game.route && navigation.navigate(game.route)}
            />
          ))}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

// ── Game Card ─────────────────────────────────────────────────────────────────

function GameCard({ game, onPress }: { game: GameCard; onPress: () => void }) {
  return (
    <TouchableOpacity
      style={[styles.card, !game.available && styles.cardDimmed]}
      onPress={onPress}
      disabled={!game.available}
      activeOpacity={0.8}
    >
      {/* Left accent bar */}
      <View style={[styles.accentBar, { backgroundColor: game.accentColor }]} />

      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={[styles.emojiBadge, { backgroundColor: game.accentColor + '22' }]}>
            <Text style={styles.emojiText}>{game.emoji}</Text>
          </View>
          <View style={styles.cardMeta}>
            <Text style={styles.cardTitle}>{game.title}</Text>
            <Text style={[styles.cardDimension, { color: game.accentColor }]}>
              {game.dimension}
            </Text>
          </View>
          {game.available ? (
            <View style={[styles.playBadge, { backgroundColor: game.accentColor + '22', borderColor: game.accentColor + '55' }]}>
              <Text style={[styles.playText, { color: game.accentColor }]}>Play →</Text>
            </View>
          ) : (
            <View style={styles.soonBadge}>
              <Text style={styles.soonText}>Soon</Text>
            </View>
          )}
        </View>
        <Text style={styles.cardSubtitle}>{game.subtitle}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  scroll: { flex: 1 },

  // Scene
  sceneWrap: {
    height: SCENE_H,
    overflow: 'hidden',
  },
  sceneOverlay: {
    position: 'absolute',
    inset: 0,
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    justifyContent: 'flex-end',
    paddingBottom: spacing.lg,
  },
  backBtn: {
    position: 'absolute',
    top: spacing.md,
    left: spacing.screen,
  },
  backText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  headerTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  headerSub: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    marginTop: 2,
  },

  // Content
  content: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.xxl,
    gap: spacing.sm,
  },

  // Card
  card: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    flexDirection: 'row',
    overflow: 'hidden',
    ...shadows.card,
  },
  cardDimmed: {
    opacity: 0.45,
  },
  accentBar: {
    width: 5,
  },
  cardBody: {
    flex: 1,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    gap: spacing.xs,
  },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  emojiBadge: {
    width: 40,
    height: 40,
    borderRadius: radii.md,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  emojiText: {
    fontSize: 20,
  },
  cardMeta: {
    flex: 1,
  },
  cardTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.lg,
    color: colors.textPrimary,
  },
  cardDimension: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    letterSpacing: 0.6,
    textTransform: 'uppercase',
    marginTop: 1,
  },
  cardSubtitle: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.5,
  },
  playBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    borderWidth: 1,
    flexShrink: 0,
  },
  playText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
  },
  soonBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radii.full,
    backgroundColor: colors.bg3,
    flexShrink: 0,
  },
  soonText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
  },
});
