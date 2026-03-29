// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Insight Card Component
// Shown after each choice. Human language only.
// Adapts its tone based on the user's current mode (nurture vs challenge).
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { colors, typography, spacing, radii } from '../themes/tokens';

interface Props {
  text: string;
  onNext: () => void;
  nextLabel?: string;
  isNurturing?: boolean;
  accentColor?: string;
}

export default function InsightCard({
  text,
  onNext,
  nextLabel = 'Continue →',
  isNurturing = false,
  accentColor = colors.violet,
}: Props) {
  const slideAnim = useRef(new Animated.Value(12)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 350, useNativeDriver: false }),
      Animated.timing(slideAnim, { toValue: 0, duration: 350, useNativeDriver: false }),
    ]).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.card,
        { borderLeftColor: accentColor, opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
      ]}
    >
      <Text style={styles.eyebrow}>
        {isNurturing ? 'A gentle reminder' : 'What your mind is doing'}
      </Text>
      <Text style={styles.body}>{text}</Text>
      <TouchableOpacity style={styles.btn} onPress={onNext} activeOpacity={0.8}>
        <Text style={styles.btnText}>{nextLabel}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.bg1,
    borderRadius: radii.lg,
    borderWidth: 1,
    borderColor: colors.border1,
    borderLeftWidth: 3,
    padding: spacing.lg,
    marginTop: spacing.sm,
  },
  eyebrow: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 0.8,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  body: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.7,
    marginBottom: spacing.lg,
  },
  btn: {
    backgroundColor: colors.bg3,
    borderRadius: radii.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  btnText: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textPrimary,
  },
});
