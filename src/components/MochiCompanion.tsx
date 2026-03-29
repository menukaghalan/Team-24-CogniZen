import React, { useEffect, useMemo, useRef } from 'react';
import {
  Animated,
  Easing,
  Image,
  ImageSourcePropType,
  StyleSheet,
  View,
} from 'react-native';
import { CompanionCharacter } from '../engine/types';
import { selectSelectedCompanion, useProfileStore } from '../store/profileStore';
import { colors, radii } from '../themes/tokens';

type Trajectory = 'recovering' | 'stable' | 'worsening' | 'unknown';
type MochiMood = 'happy' | 'alert' | 'sleepy' | 'celebrateA' | 'menuCalm' | 'celebrateB';
type MotionPreset = 'auto' | 'home' | 'menu' | 'celebrate';

interface Props {
  cdi?: number;
  trajectory?: Trajectory;
  streakCount?: number;
  accent: string;
  size?: number;
  variant?: MochiMood | 'auto';
  motionPreset?: MotionPreset;
  character?: CompanionCharacter;
}

const MOCHI_SOURCES: Record<MochiMood, ImageSourcePropType> = {
  celebrateA: require('../../assets/images/2.png'),
  menuCalm: require('../../assets/images/3.png'),
  celebrateB: require('../../assets/images/4.png'),
  alert: require("../../assets/images/Alert Mochi_ Your consistency is paying off, let's take one step at a time.png"),
  happy: require("../../assets/images/Happy Mochi- I'm proud of you for checking in today.png"),
  sleepy: require("../../assets/images/Sleepy_Wind down Mochi- Your body is working hard, let's breathe together for a moment.png"),
};

const COMPANION_SOURCES: Record<Exclude<CompanionCharacter, 'mochi'>, ImageSourcePropType> = {
  pangoro: require('../../assets/images/Pangoro.png'),
  piplup: require('../../assets/images/Piplup.png'),
};

function CompanionSprite({ character, mood, size }: { character: CompanionCharacter; mood: MochiMood; size: number }) {
  const source = character === 'mochi' ? MOCHI_SOURCES[mood] : COMPANION_SOURCES[character];

  return (
    <Image
      source={source}
      style={{ width: size, height: size, resizeMode: 'contain' }}
    />
  );
}

export default function MochiCompanion({
  cdi = 50,
  trajectory = 'stable',
  streakCount = 0,
  accent,
  size = 128,
  variant = 'auto',
  motionPreset = 'auto',
  character,
}: Props) {
  const selectedCompanion = useProfileStore(selectSelectedCompanion);
  const resolvedCharacter = character ?? selectedCompanion;
  const mood = useMemo(
    () => (variant === 'auto' ? selectMochiMood(cdi, trajectory, streakCount) : variant),
    [variant, cdi, trajectory, streakCount],
  );
  const resolvedMotion = motionPreset === 'auto'
    ? (mood === 'menuCalm' ? 'menu' : mood === 'celebrateA' || mood === 'celebrateB' ? 'celebrate' : 'home')
    : motionPreset;

  const floatAnim = useRef(new Animated.Value(0)).current;
  const tiltAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const floatBias = resolvedCharacter === 'piplup' ? 1.2 : resolvedCharacter === 'pangoro' ? 0.8 : 1;
    const amplitude = (
      resolvedMotion === 'menu' ? 5 :
      mood === 'sleepy' ? 4 :
      mood === 'alert' ? 8 :
      mood === 'celebrateA' || mood === 'celebrateB' ? 9 :
      6
    ) * floatBias;
    const duration =
      resolvedMotion === 'menu' ? 2800 :
      mood === 'alert' ? 1800 :
      mood === 'sleepy' ? 2600 :
      mood === 'celebrateA' || mood === 'celebrateB' ? 1500 :
      2200;

    const floatLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, {
          toValue: -amplitude,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(floatAnim, {
          toValue: 0,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );

    floatLoop.start();
    return () => floatLoop.stop();
  }, [floatAnim, mood, resolvedCharacter, resolvedMotion]);

  useEffect(() => {
    let active = true;
    let timeoutId: ReturnType<typeof setTimeout> | undefined;

    const runAccentMotion = () => {
      if (!active) return;

      const sequence = resolvedMotion === 'menu'
        ? Animated.sequence([
            Animated.timing(tiltAnim, {
              toValue: 0.4,
              duration: resolvedCharacter === 'pangoro' ? 950 : 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: -0.4,
              duration: resolvedCharacter === 'piplup' ? 950 : 1100,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 800,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        : resolvedMotion === 'celebrate'
        ? Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: resolvedCharacter === 'pangoro' ? 1.05 : 1.08,
              duration: 180,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 0.98,
              duration: 130,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: resolvedCharacter === 'piplup' ? 1.05 : 1.04,
              duration: 160,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 170,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0.8,
              duration: 130,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: -0.55,
              duration: 150,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 170,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        : mood === 'sleepy'
        ? Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.03,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 900,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: -0.45,
              duration: 700,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 700,
              easing: Easing.inOut(Easing.sin),
              useNativeDriver: true,
            }),
          ])
        : mood === 'alert'
        ? Animated.sequence([
            Animated.timing(tiltAnim, {
              toValue: 1,
              duration: 150,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: -1,
              duration: 170,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 150,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1.04,
              duration: 180,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 180,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ])
        : Animated.sequence([
            Animated.timing(scaleAnim, {
              toValue: 1.04,
              duration: 220,
              easing: Easing.out(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(scaleAnim, {
              toValue: 1,
              duration: 260,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0.35,
              duration: 220,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
            Animated.timing(tiltAnim, {
              toValue: 0,
              duration: 220,
              easing: Easing.inOut(Easing.quad),
              useNativeDriver: true,
            }),
          ]);

      sequence.start(() => {
        if (!active) return;
        const nextDelay =
          resolvedMotion === 'menu' ? 2200 :
          resolvedMotion === 'celebrate' ? 1400 :
          mood === 'alert' ? 1800 :
          mood === 'sleepy' ? 3200 :
          2600;
        timeoutId = setTimeout(runAccentMotion, nextDelay);
      });
    };

    timeoutId = setTimeout(
      runAccentMotion,
      resolvedMotion === 'celebrate' ? 500 : mood === 'alert' ? 900 : 1300,
    );

    return () => {
      active = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [mood, resolvedCharacter, resolvedMotion, scaleAnim, tiltAnim]);

  const translateY = floatAnim;
  const rotate = tiltAnim.interpolate({
    inputRange: [-1, 0, 1],
    outputRange: ['-5deg', '0deg', '5deg'],
  });
  const shadowScale = scaleAnim.interpolate({
    inputRange: [1, 1.04],
    outputRange: [1, 0.9],
  });

  return (
    <View style={[styles.frame, { width: size + 20, height: size + 26 }]}>
      <View
        style={[
          styles.glow,
          {
            backgroundColor: accent + '18',
            width: size * 0.72,
            height: size * 0.22,
          },
        ]}
      />
      <Animated.View
        style={[
          styles.shadow,
          {
            width: size * 0.46,
            transform: [{ scaleX: shadowScale }],
          },
        ]}
      />
      <Animated.View
        style={{
          transform: [{ translateY }, { rotate }, { scale: scaleAnim }],
        }}
      >
        <CompanionSprite character={resolvedCharacter} mood={mood} size={size} />
      </Animated.View>
    </View>
  );
}

function selectMochiMood(cdi: number, trajectory: Trajectory, streakCount: number): MochiMood {
  if (cdi <= 18) return 'celebrateB';
  if (cdi <= 30 || (trajectory === 'recovering' && streakCount >= 3)) return 'celebrateA';
  if (trajectory === 'worsening' || cdi >= 60) return 'sleepy';
  if (trajectory === 'recovering' || streakCount >= 3 || cdi <= 30) return 'alert';
  return 'happy';
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  glow: {
    position: 'absolute',
    bottom: 14,
    borderRadius: radii.full,
  },
  shadow: {
    position: 'absolute',
    bottom: 10,
    height: 14,
    borderRadius: radii.full,
    backgroundColor: colors.bg3,
    opacity: 0.85,
  },
});
