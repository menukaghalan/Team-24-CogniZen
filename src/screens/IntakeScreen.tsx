// ─────────────────────────────────────────────────────────────────────────────
// CogniZen · Intake Screen
// First-launch questionnaire. Gathers context to seed the user's CDI prior.
// Conversational, non-clinical. One question at a time.
// Steps: 0=intro, 1=name, 2=age, 3=occupation, 4=clarity,
//        5=satisfaction, 6=burnout, 7=emotional, 8=complete
// ─────────────────────────────────────────────────────────────────────────────

import React, { useRef, useState } from 'react';
import {
  Animated, ScrollView, StyleSheet, Text, TextInput,
  TouchableOpacity, View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import IntakeOptionPill from '../components/IntakeOptionPill';
import MochiCompanion from '../components/MochiCompanion';
import {
  AgeRange, BurnoutLevel, ClarityLevel, EmotionalState,
  IntakeAnswers, OccupationStatus,
} from '../engine/types';
import { AGE_MIDPOINTS } from '../engine/intakeEngine';
import { useProfileStore } from '../store/profileStore';
import { colors, radii, spacing, typography } from '../themes/tokens';

// ── Total question steps: 0=intro, 1–7=questions, 8=complete ─────────────────
const TOTAL_Q = 7;

interface Draft {
  name: string | null;
  ageRange: AgeRange | null;
  occupationStatus: OccupationStatus | null;
  careerClarity: ClarityLevel | null;
  satisfaction: number | null;
  burnout: BurnoutLevel | null;
  emotionalState: EmotionalState | null;
}

const EMPTY_DRAFT: Draft = {
  name: null,
  ageRange: null,
  occupationStatus: null,
  careerClarity: null,
  satisfaction: null,
  burnout: null,
  emotionalState: null,
};

const SATISFACTION_OPTIONS: { label: string; sublabel: string; value: number }[] = [
  { value: 1, label: 'Deeply unsatisfied',      sublabel: 'More drained than anything' },
  { value: 2, label: 'More drained than fulfilled', sublabel: '' },
  { value: 3, label: 'Somewhere in between',    sublabel: 'Some good days, some hard ones' },
  { value: 4, label: 'More fulfilled than drained', sublabel: '' },
  { value: 5, label: 'Deeply satisfied',        sublabel: 'Work or study gives me energy' },
];

export default function IntakeScreen({ navigation }: any) {
  const [step, setStep]   = useState(0);
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const fadeAnim          = useRef(new Animated.Value(1)).current;
  const completeIntake    = useProfileStore(s => s.completeIntake);

  function transition(next: () => void) {
    Animated.timing(fadeAnim, { toValue: 0, duration: 180, useNativeDriver: true }).start(() => {
      next();
      Animated.timing(fadeAnim, { toValue: 1, duration: 260, useNativeDriver: true }).start();
    });
  }

  function advance() {
    if (step === 7) {
      const answers: IntakeAnswers = {
        name:             draft.name!.trim(),
        ageRange:         draft.ageRange!,
        age:              AGE_MIDPOINTS[draft.ageRange!],
        occupationStatus: draft.occupationStatus!,
        careerClarity:    draft.careerClarity!,
        satisfaction:     draft.satisfaction!,
        burnout:          draft.burnout!,
        emotionalState:   draft.emotionalState!,
        completedAt:      Date.now(),
      };
      completeIntake(answers);
      transition(() => setStep(8));
      setTimeout(() => navigation.replace('Home'), 3400);
      return;
    }
    transition(() => setStep(s => s + 1));
  }

  function select<K extends keyof Draft>(key: K, value: Draft[K]) {
    setDraft(d => ({ ...d, [key]: value }));
  }

  function isStepReady(): boolean {
    switch (step) {
      case 0: return true;
      case 1: return (draft.name ?? '').trim().length >= 1;
      case 2: return draft.ageRange !== null;
      case 3: return draft.occupationStatus !== null;
      case 4: return draft.careerClarity !== null;
      case 5: return draft.satisfaction !== null;
      case 6: return draft.burnout !== null;
      case 7: return draft.emotionalState !== null;
      default: return false;
    }
  }

  const progressFilled = Math.max(0, step - 1);

  return (
    <SafeAreaView style={styles.safe}>
      {step > 0 && step < 8 && (
        <View style={styles.progressRow}>
          {Array.from({ length: TOTAL_Q }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.progressSegment,
                i < progressFilled && styles.progressSegmentFilled,
              ]}
            />
          ))}
        </View>
      )}

      <Animated.View style={[styles.contentWrap, { opacity: fadeAnim }]}>
        <ScrollView
          contentContainerStyle={styles.scroll}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {step === 0 && <IntroStep />}

          {step === 1 && (
            <QuestionStep eyebrow="Let's begin" question="What should we call you?">
              <TextInput
                style={styles.nameInput}
                value={draft.name ?? ''}
                onChangeText={v => select('name', v)}
                placeholder="Your first name..."
                placeholderTextColor={colors.textTertiary}
                autoFocus
                maxLength={40}
                returnKeyType="done"
                onSubmitEditing={() => { if (isStepReady()) advance(); }}
              />
            </QuestionStep>
          )}

          {step === 2 && (
            <QuestionStep eyebrow="About you" question="How old are you?">
              {(['18-21', '22-24', '25-28', '29-35', '36+'] as AgeRange[]).map(v => (
                <IntakeOptionPill
                  key={v}
                  label={v === '36+' ? '36 or older' : v}
                  isSelected={draft.ageRange === v}
                  onPress={() => select('ageRange', v)}
                />
              ))}
            </QuestionStep>
          )}

          {step === 3 && (
            <QuestionStep eyebrow="Your situation" question="What describes you right now?">
              {([
                { v: 'student',     l: 'Student',         s: 'Still studying' },
                { v: 'recentGrad',  l: 'Recent graduate', s: 'Finished within the last 2 years' },
                { v: 'earlyWorker', l: 'Working',         s: 'Less than 3 years in' },
                { v: 'other',       l: 'Something else',  s: '' },
              ] as { v: OccupationStatus; l: string; s: string }[]).map(({ v, l, s }) => (
                <IntakeOptionPill
                  key={v}
                  label={l}
                  sublabel={s}
                  isSelected={draft.occupationStatus === v}
                  onPress={() => select('occupationStatus', v)}
                />
              ))}
            </QuestionStep>
          )}

          {step === 4 && (
            <QuestionStep
              eyebrow="Direction"
              question="How clear is your sense of direction right now?"
            >
              {([
                { v: 'clear',    l: 'I know where I am heading',   s: '',                              c: colors.jade   },
                { v: 'somewhat', l: 'Somewhat clear',                   s: 'Uncertain, but moving forward', c: colors.amber  },
                { v: 'unclear',  l: 'Unclear and looking',              s: 'Searching for a path',          c: colors.amber  },
                { v: 'lost',     l: 'Completely at a crossroads',       s: '',                              c: colors.violet },
              ] as { v: ClarityLevel; l: string; s: string; c: string }[]).map(({ v, l, s, c }) => (
                <IntakeOptionPill
                  key={v}
                  label={l}
                  sublabel={s}
                  isSelected={draft.careerClarity === v}
                  onPress={() => select('careerClarity', v)}
                  accentColor={c}
                />
              ))}
            </QuestionStep>
          )}

          {step === 5 && (
            <QuestionStep
              eyebrow="Daily life"
              question="How satisfied are you with your daily work or studies?"
            >
              {SATISFACTION_OPTIONS.map(({ value, label, sublabel }) => (
                <IntakeOptionPill
                  key={value}
                  label={label}
                  sublabel={sublabel}
                  isSelected={draft.satisfaction === value}
                  onPress={() => select('satisfaction', value)}
                  accentColor={value <= 2 ? colors.violet : value === 3 ? colors.amber : colors.jade}
                />
              ))}
            </QuestionStep>
          )}

          {step === 6 && (
            <QuestionStep
              eyebrow="Energy"
              question="How often do you feel drained or exhausted by what you are doing?"
            >
              {([
                { v: 'rarely',    l: 'Rarely',           s: 'I still have energy most days', c: colors.jade   },
                { v: 'sometimes', l: 'Sometimes',         s: 'It comes and goes',             c: colors.amber  },
                { v: 'often',     l: 'Often',             s: 'It\u2019s weighing on me',      c: colors.amber  },
                { v: 'always',    l: 'Almost constantly', s: '',                              c: colors.violet },
              ] as { v: BurnoutLevel; l: string; s: string; c: string }[]).map(({ v, l, s, c }) => (
                <IntakeOptionPill
                  key={v}
                  label={l}
                  sublabel={s}
                  isSelected={draft.burnout === v}
                  onPress={() => select('burnout', v)}
                  accentColor={c}
                />
              ))}
            </QuestionStep>
          )}

          {step === 7 && (
            <QuestionStep
              eyebrow="Right now"
              question="How would you describe your emotional state lately?"
            >
              {([
                { v: 'good',       l: 'Generally good',                s: '',                   c: colors.jade          },
                { v: 'neutral',    l: 'Going through the motions',     s: 'Not bad, not great', c: colors.textSecondary },
                { v: 'struggling', l: 'Struggling, but managing',      s: '',                   c: colors.amber         },
                { v: 'hard',       l: 'It\u2019s really hard right now', s: '',                 c: colors.violet        },
              ] as { v: EmotionalState; l: string; s: string; c: string }[]).map(({ v, l, s, c }) => (
                <IntakeOptionPill
                  key={v}
                  label={l}
                  sublabel={s}
                  isSelected={draft.emotionalState === v}
                  onPress={() => select('emotionalState', v)}
                  accentColor={c}
                />
              ))}
            </QuestionStep>
          )}

          {step === 8 && <CompleteStep name={draft.name} />}
        </ScrollView>
      </Animated.View>

      {step < 8 && (
        <View style={styles.footer}>
          <TouchableOpacity
            style={[styles.ctaBtn, !isStepReady() && styles.ctaBtnDisabled]}
            onPress={advance}
            disabled={!isStepReady()}
            activeOpacity={0.8}
          >
            <Text style={[styles.ctaBtnLabel, !isStepReady() && styles.ctaBtnLabelDisabled]}>
              {step === 0 ? "Let's begin  →" : step === 7 ? 'Find my starting point  →' : 'Continue  →'}
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function IntroStep() {
  return (
    <View style={styles.introWrap}>
      <View style={styles.introMochiWrap}>
        <MochiCompanion variant="menuCalm" motionPreset="menu" accent={colors.jade} size={110} />
      </View>
      <Text style={styles.introTitle}>Before your first journey.</Text>
      <Text style={styles.introBody}>
        A few honest questions help Mochi set your starting point.
        {'\n\n'}
        There are no right answers — just true ones. This takes about two minutes.
      </Text>
      <Text style={styles.introNote}>
        🔒  Stored only on this device. Never shared.
      </Text>
    </View>
  );
}

function QuestionStep({
  eyebrow, question, children,
}: {
  eyebrow: string;
  question: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.questionWrap}>
      <View style={styles.questionTopRow}>
        <Text style={styles.eyebrow}>{eyebrow}</Text>
        <MochiCompanion variant="menuCalm" motionPreset="menu" accent={colors.jade} size={56} />
      </View>
      <Text style={styles.question}>{question}</Text>
      <View>{children}</View>
    </View>
  );
}

function CompleteStep({ name }: { name: string | null }) {
  return (
    <View style={styles.completeWrap}>
      <View style={styles.completeMochiWrap}>
        <MochiCompanion variant="celebrateA" motionPreset="celebrate" accent={colors.jade} size={120} />
      </View>
      <Text style={styles.completeTitle}>
        {name ? `Welcome, ${name.trim()} 🌿` : 'Almost there 🌿'}
      </Text>
      <Text style={styles.completeBody}>
        Mochi has your starting point. Your check-ins, games, and nudges will adapt to where you are — not where you think you should be.
      </Text>
      <Text style={styles.completeNote}>✨  Heading to your home screen now</Text>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.bg0,
  },
  progressRow: {
    flexDirection: 'row',
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.md,
    gap: spacing.xs,
  },
  progressSegment: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: colors.border1,
  },
  progressSegmentFilled: {
    backgroundColor: colors.jade,
  },
  contentWrap: {
    flex: 1,
  },
  scroll: {
    paddingHorizontal: spacing.screen,
    paddingTop: spacing.lg,
    paddingBottom: spacing.lg,
  },
  footer: {
    paddingHorizontal: spacing.screen,
    paddingBottom: spacing.xl,
    paddingTop: spacing.sm,
  },
  ctaBtn: {
    backgroundColor: colors.jade,
    borderRadius: radii.xl,
    paddingVertical: spacing.md + 4,
    alignItems: 'center',
    shadowColor: '#6B3A22',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 5,
  },
  ctaBtnDisabled: {
    backgroundColor: colors.bg3,
    shadowOpacity: 0,
    elevation: 0,
  },
  ctaBtnLabel: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.md,
    color: colors.textOnAccent,
    letterSpacing: 0.3,
  },
  ctaBtnLabelDisabled: {
    color: colors.textTertiary,
  },
  nameInput: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    borderBottomWidth: 2,
    borderBottomColor: colors.jade,
    paddingVertical: spacing.sm,
    marginTop: spacing.xs,
    letterSpacing: -0.5,
  },
  introWrap: {
    paddingBottom: spacing.lg,
  },
  introMochiWrap: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  introTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  introBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.md,
    color: colors.textSecondary,
    lineHeight: typography.sizes.md * 1.65,
    marginBottom: spacing.md,
  },
  introNote: {
    fontFamily: typography.body,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    fontStyle: 'italic',
    textAlign: 'center',
  },
  questionWrap: {
    paddingBottom: spacing.md,
  },
  questionTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  eyebrow: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.textTertiary,
    letterSpacing: 1,
    textTransform: 'uppercase',
    marginBottom: spacing.sm,
  },
  question: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xl,
    color: colors.textPrimary,
    marginBottom: spacing.lg,
    lineHeight: typography.sizes.xl * 1.3,
  },
  completeWrap: {
    paddingTop: spacing.lg,
  },
  completeMochiWrap: {
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  completeTitle: {
    fontFamily: typography.display,
    fontSize: typography.sizes.xxl,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    letterSpacing: -0.5,
  },
  completeBody: {
    fontFamily: typography.body,
    fontSize: typography.sizes.sm,
    color: colors.textSecondary,
    lineHeight: typography.sizes.sm * 1.7,
  },
  completeNote: {
    fontFamily: typography.bodyMedium,
    fontSize: typography.sizes.xs,
    color: colors.jade,
    marginTop: spacing.lg,
    textAlign: 'center',
    letterSpacing: 0.5,
  },
});
