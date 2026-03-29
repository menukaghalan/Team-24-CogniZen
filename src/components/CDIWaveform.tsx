// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · CDI Waveform Component
// The heartbeat of cognitive health. Shows drift over time.
// Uses react-native-svg for a smooth, animated polyline.
// ─────────────────────────────────────────────────────────────────────────────

import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated, Dimensions } from 'react-native';
import Svg, { Polyline, Circle, Defs, LinearGradient, Stop, Rect } from 'react-native-svg';
import { colors, typography, spacing, cdiColor } from '../themes/tokens';

const { width } = Dimensions.get('window');
const CHART_W = width - spacing.screen * 4;
const CHART_H = 80;
const PAD = 8;

interface Props {
  history: { timestamp: number; score: number }[];
  animated?: boolean;
}

export default function CDIWaveform({ history, animated = true }: Props) {
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (animated) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 1000,
        delay: 200,
        useNativeDriver: false,
      }).start();
    } else {
      fadeAnim.setValue(1);
    }
  }, []);

  if (history.length < 2) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyText}>Complete more sessions to see your waveform</Text>
      </View>
    );
  }

  const pts = history.slice(-24);
  const xStep = (CHART_W - PAD * 2) / (pts.length - 1);

  // Build polyline points string
  const points = pts.map((p, i) => {
    const x = PAD + i * xStep;
    const y = PAD + ((100 - p.score) / 100) * (CHART_H - PAD * 2);
    return `${x},${y}`;
  }).join(' ');

  // Last point for the live dot
  const lastPt = pts[pts.length - 1];
  const dotX = PAD + (pts.length - 1) * xStep;
  const dotY = PAD + ((100 - lastPt.score) / 100) * (CHART_H - PAD * 2);
  const dotColor = cdiColor(lastPt.score);

  // Gradient based on latest score
  const gradStart = cdiColor(pts[0].score);
  const gradEnd = cdiColor(lastPt.score);

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <Svg width={CHART_W} height={CHART_H}>
        <Defs>
          <LinearGradient id="waveGrad" x1="0" y1="0" x2="1" y2="0">
            <Stop offset="0%" stopColor={gradStart} stopOpacity="0.4" />
            <Stop offset="100%" stopColor={gradEnd} stopOpacity="1" />
          </LinearGradient>
        </Defs>

        {/* Reference lines */}
        {[25, 50, 75].map(y => (
          <Polyline
            key={y}
            points={`${PAD},${PAD + ((100 - y) / 100) * (CHART_H - PAD * 2)} ${CHART_W - PAD},${PAD + ((100 - y) / 100) * (CHART_H - PAD * 2)}`}
            stroke={colors.border0}
            strokeWidth="0.5"
            strokeDasharray="3,4"
            fill="none"
          />
        ))}

        {/* Waveform line */}
        <Polyline
          points={points}
          stroke="url(#waveGrad)"
          strokeWidth="2"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Live dot */}
        <Circle cx={dotX} cy={dotY} r="4" fill={dotColor} />
        <Circle cx={dotX} cy={dotY} r="7" fill={dotColor} opacity="0.25" />
      </Svg>

      {/* Y-axis labels */}
      <View style={styles.yLabels}>
        <Text style={styles.yLabel}>drift</Text>
        <Text style={styles.yLabel}>calm</Text>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  empty: {
    height: CHART_H,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  yLabels: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    justifyContent: 'space-between',
    paddingVertical: PAD,
  },
  yLabel: {
    fontFamily: typography.body,
    fontSize: 9,
    color: colors.textTertiary,
    textAlign: 'right',
  },
});
