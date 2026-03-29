import React from 'react';
import Svg, {
  Circle,
  Defs,
  LinearGradient,
  Path,
  Polygon,
  Rect,
  Stop,
} from 'react-native-svg';
import { colors } from '../themes/tokens';

const SPECKS: [number, number, number][] = [
  [8, 12, 1], [15, 7, 0.8], [25, 16, 1], [35, 5, 0.7], [42, 20, 0.9], [55, 9, 0.8],
  [64, 6, 1], [75, 15, 0.7], [85, 8, 0.9], [93, 18, 0.8], [18, 24, 0.6], [46, 11, 0.9],
  [30, 22, 0.7], [60, 22, 0.8], [78, 5, 1], [50, 28, 0.6], [70, 19, 0.7], [89, 25, 0.8],
  [10, 30, 0.5], [40, 30, 0.6], [66, 30, 0.5], [82, 14, 0.8],
];

interface Props {
  width: number;
  height: number;
  accent: string;
}

export default function MountainScene({ width: w, height: h, accent }: Props) {
  const sky = h * 0.62;
  const glow = colors.jade;

  const back = [
    `0,${h}`,
    `${w * 0.12},${h * 0.52}`, `${w * 0.25},${h * 0.38}`, `${w * 0.38},${h * 0.26}`,
    `${w * 0.52},${h * 0.18}`, `${w * 0.65},${h * 0.3}`, `${w * 0.78},${h * 0.22}`,
    `${w * 0.9},${h * 0.4}`, `${w},${h}`,
  ].join(' ');

  const mid = [
    `0,${h}`,
    `${w * 0.08},${h * 0.62}`, `${w * 0.18},${h * 0.5}`, `${w * 0.3},${h * 0.6}`,
    `${w * 0.44},${h * 0.4}`, `${w * 0.55},${h * 0.21}`, `${w * 0.62},${h * 0.33}`,
    `${w * 0.72},${h * 0.25}`, `${w * 0.82},${h * 0.44}`, `${w * 0.91},${h * 0.36}`,
    `${w},${h * 0.5}`, `${w},${h}`,
  ].join(' ');

  const snow = [
    `${w * 0.55},${h * 0.21}`,
    `${w * 0.49},${h * 0.32}`, `${w * 0.61},${h * 0.31}`,
  ].join(' ');

  const front = [
    `0,${h}`,
    `${w * 0.1},${h * 0.76}`, `${w * 0.22},${h * 0.65}`, `${w * 0.34},${h * 0.71}`,
    `${w * 0.46},${h * 0.57}`, `${w * 0.56},${h * 0.65}`, `${w * 0.66},${h * 0.57}`,
    `${w * 0.78},${h * 0.68}`, `${w * 0.88},${h * 0.62}`, `${w},${h * 0.67}`, `${w},${h}`,
  ].join(' ');

  const pine1 = `${w * 0.05},${h} ${w * 0.085},${h * 0.72} ${w * 0.12},${h}`;
  const pine2 = `${w * 0.84},${h} ${w * 0.865},${h * 0.75} ${w * 0.89},${h}`;
  const pine3 = `${w * 0.24},${h} ${w * 0.265},${h * 0.78} ${w * 0.29},${h}`;
  const trailD = `M ${w * 0.55},${h} L ${w * 0.53},${h * 0.75} L ${w * 0.55},${h * 0.55} L ${w * 0.55},${h * 0.21}`;

  return (
    <Svg width={w} height={h}>
      <Defs>
        <LinearGradient id="sky" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#FFF9F2" stopOpacity="1" />
          <Stop offset="0.55" stopColor="#F7EBDD" stopOpacity="1" />
          <Stop offset="1" stopColor="#EFDCC7" stopOpacity="1" />
        </LinearGradient>
      </Defs>

      <Rect width={w} height={h} fill="url(#sky)" />

      <Circle cx={w * 0.72} cy={h * 0.18} r={h * 0.15} fill={glow} fillOpacity={0.08} />
      <Circle cx={w * 0.72} cy={h * 0.18} r={h * 0.09} fill={colors.jadeLight} fillOpacity={0.18} />
      <Circle cx={w * 0.72} cy={h * 0.18} r={h * 0.045} fill="#FFF8EF" fillOpacity={0.96} />

      {SPECKS.map(([sx, sy, op], i) => (
        <Circle
          key={i}
          cx={(sx / 100) * w}
          cy={(sy / 100) * sky}
          r={i % 5 === 0 ? 1.5 : 1}
          fill="#FFF4E6"
          fillOpacity={op * 0.45}
        />
      ))}

      <Polygon points={back} fill="#E8D6C1" />
      <Polygon points={mid} fill="#D7B79A" />
      <Polygon points={snow} fill="#FFF8EF" fillOpacity={0.96} />
      <Polygon points={front} fill="#B98E6B" />

      <Polygon points={pine1} fill="#8D674D" />
      <Polygon points={pine2} fill="#8D674D" />
      <Polygon points={pine3} fill="#8D674D" />

      <Path
        d={trailD}
        stroke={glow}
        strokeWidth={1.5}
        strokeDasharray="3,5"
        strokeOpacity={0.45}
        fill="none"
      />
    </Svg>
  );
}
