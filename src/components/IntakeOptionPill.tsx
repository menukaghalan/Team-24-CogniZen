// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · IntakeOptionPill
// Reusable animated selection pill for the intake questionnaire.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { colors, radii, spacing, typography } from '../themes/tokens';

interface IntakeOptionPillProps {
  label: string;
  sublabel?: string;
  isSelected: boolean;
  onPress: () => void;
  accentColor?: string;
}

export default function IntakeOptionPill({
  label,
  sublabel,
  isSelected,
  onPress,
  accentColor = colors.jade,
}: IntakeOptionPillProps) {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const borderAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Both animations must use the same driver on this view.
    // useNativeDriver: false is required for color interpolation (borderColor, bgColor),
    // so scale must also use JS driver to avoid "moved to native" conflicts.
    Animated.spring(scaleAnim, {
      toValue: isSelected ? 1.02 : 1,
      friction: 6,
      tension: 120,
      useNativeDriver: false,
    }).start();
    Animated.timing(borderAnim, {
      toValue: isSelected ? 1 : 0,
      duration: 180,
      useNativeDriver: false,
    }).start();
  }, [isSelected]);

  const borderColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.border1, accentColor],
  });

  const bgColor = borderAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [colors.bg2, colors.bg3],
  });

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75}>
      <Animated.View
        style={[
          styles.pill,
          {
            transform: [{ scale: scaleAnim }],
            borderColor,
            backgroundColor: bgColor,
          },
        ]}
      >
        <Text style={[styles.label, isSelected && styles.labelSelected]}>
          {label}
        </Text>
        {!!sublabel && (
          <Text style={styles.sublabel}>{sublabel}</Text>
        )}
      </Animated.View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  pill: {
    borderRadius: radii.md,
    borderWidth: 1.5,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.sm,
  },
  label: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
  },
  labelSelected: {
    color: colors.textPrimary,
  },
  sublabel: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    marginTop: 3,
  },
});
