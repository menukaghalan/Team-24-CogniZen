// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Distortion Radar
// A soft hexagonal radar chart showing the 6 dimensions.
// Labels are human names, never clinical terms.
// Used on the History screen and Session Complete screen.
// ─────────────────────────────────────────────────────────────────────────────

import React from 'react';
import { View, StyleSheet } from 'react-native';
import Svg, { Polygon, Line, Text as SvgText, Circle } from 'react-native-svg';
import { DistortionVector } from '../engine/types';
import { DISTORTION_HUMAN_NAMES } from '../utils/formatters';
import { colors, cdiColor } from '../themes/tokens';

const SIZE = 200;
const CENTER = SIZE / 2;
const RADIUS = 70;
const AXES = 6;

interface Props {
  vector: DistortionVector;
  dominantColor?: string;
}

export default function DistortionRadar({ vector, dominantColor = colors.violet }: Props) {
  const keys = Object.keys(vector) as Array<keyof DistortionVector>;

  // Compute polygon points for the data
  const dataPoints = keys.map((key, i) => {
    const angle = (i / AXES) * Math.PI * 2 - Math.PI / 2;
    const r = vector[key] * RADIUS;
    return {
      x: CENTER + r * Math.cos(angle),
      y: CENTER + r * Math.sin(angle),
    };
  });

  // Reference polygon at 100% (outer boundary)
  const outerPoints = keys.map((_, i) => {
    const angle = (i / AXES) * Math.PI * 2 - Math.PI / 2;
    return {
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  });

  // Reference rings at 33% and 66%
  const ring33 = keys.map((_, i) => {
    const angle = (i / AXES) * Math.PI * 2 - Math.PI / 2;
    return { x: CENTER + RADIUS * 0.33 * Math.cos(angle), y: CENTER + RADIUS * 0.33 * Math.sin(angle) };
  });
  const ring66 = keys.map((_, i) => {
    const angle = (i / AXES) * Math.PI * 2 - Math.PI / 2;
    return { x: CENTER + RADIUS * 0.66 * Math.cos(angle), y: CENTER + RADIUS * 0.66 * Math.sin(angle) };
  });

  const toPolygonStr = (pts: {x:number;y:number}[]) =>
    pts.map(p => `${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(' ');

  return (
    <View style={styles.container}>
      <Svg width={SIZE} height={SIZE}>
        {/* Reference rings */}
        <Polygon
          points={toPolygonStr(outerPoints)}
          fill="none"
          stroke={colors.border1}
          strokeWidth="0.5"
        />
        <Polygon
          points={toPolygonStr(ring66)}
          fill="none"
          stroke={colors.border0}
          strokeWidth="0.5"
        />
        <Polygon
          points={toPolygonStr(ring33)}
          fill="none"
          stroke={colors.border0}
          strokeWidth="0.5"
        />

        {/* Axis spokes */}
        {outerPoints.map((pt, i) => (
          <Line
            key={i}
            x1={CENTER}
            y1={CENTER}
            x2={pt.x}
            y2={pt.y}
            stroke={colors.border0}
            strokeWidth="0.5"
          />
        ))}

        {/* Data polygon */}
        <Polygon
          points={toPolygonStr(dataPoints)}
          fill={dominantColor}
          fillOpacity="0.15"
          stroke={dominantColor}
          strokeWidth="1.5"
          strokeLinejoin="round"
        />

        {/* Data dots */}
        {dataPoints.map((pt, i) => (
          <Circle
            key={i}
            cx={pt.x}
            cy={pt.y}
            r="3"
            fill={dominantColor}
            opacity="0.8"
          />
        ))}

        {/* Labels — human names, small and muted */}
        {keys.map((key, i) => {
          const angle = (i / AXES) * Math.PI * 2 - Math.PI / 2;
          const labelR = RADIUS + 18;
          const lx = CENTER + labelR * Math.cos(angle);
          const ly = CENTER + labelR * Math.sin(angle);
          const shortName = DISTORTION_HUMAN_NAMES[key].split(' ')[0]; // first word only
          return (
            <SvgText
              key={key}
              x={lx}
              y={ly}
              textAnchor="middle"
              alignmentBaseline="central"
              fontSize="8"
              fill={colors.textTertiary}
              fontFamily="System"
            >
              {shortName}
            </SvgText>
          );
        })}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
});
