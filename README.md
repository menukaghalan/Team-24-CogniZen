# CogniZen

CogniZen is a React Native app for gentle burnout-aware check-ins. It uses playful Mochi-themed choices, lightweight cognitive games, and a private internal scoring model to estimate how mentally heavy things feel over time.

The app is designed to feel soft and supportive on the surface while still collecting meaningful behavioral signal underneath. Users interact with Mochi, take short check-ins, play games, and get calm feedback in human language.

## What the app does

- Gives users short adaptive check-ins through story-based choices
- Tracks a hidden Cognitive Drift Index, or CDI, from repeated behavior over time
- Adapts the tone and intensity of sessions based on recovery, stability, or worsening patterns
- Estimates burnout risk from recent CDI history plus recent session behavior
- Lets users hide the numeric score if they prefer a softer experience
- Includes cognitive mini-games that feed additional signal into the profile
- Uses Mochi as the emotional guide across the app

## Product experience

### Home screen

The home screen shows:

- The current state label
- A Mochi companion that changes mood based on the user's recent state
- A burnout forecast card written in plain language
- Small session and streak cards
- A settings menu with the score visibility toggle


### Check-ins

Check-ins happen through story prompts in `src/scenarios/allScenarios.ts`.

These prompts are:

- Mochi-themed
- Written to feel lighter and less jarring
- Still mapped to structured `signalWeight` values for the math engine

When the user looks more depleted, the app reduces question count and softens the flow. Heavier states use gentler check-ins instead of pushing a full demanding session.

### Mochi

Mochi is the app's guide character. Mochi appears:

- On the home screen
- In settings
- In the check-in flow
- In game result states

Different Mochi assets are used intentionally for calm, sleepy, happy, and celebration states.

### Games

The app currently includes:

- Reaction Tap
- Stroop
- Pattern Memory

Game outcomes contribute weaker but still useful evidence to the user's overall cognitive profile.

## The hidden model

The user does not need to see technical terms, but the app is built on a real internal model.

### Cognitive Drift Index

The Cognitive Drift Index, or CDI, is the app's internal 0 to 100 score for tracking drift toward burnout-associated thinking patterns.

It updates over time using:

- Recent check-in choices
- Distortion-specific signal weights
- Session history
- Game results

### Distortion dimensions

The engine tracks six distortion dimensions:

- `temporalDiscount`
- `negativityBias`
- `allOrNothing`
- `decisionAvoidance`
- `catastrophizing`
- `effortReward`

These are derived from choice behavior, not from directly asking the user to self-diagnose.

### Burnout prediction

The burnout forecast is one of the core features of the app.

It currently uses:

- The last 5 CDI readings
- A trend fit over actual elapsed time
- A blended current-risk score based on recent session distortion load
- Signals derived from recent choices such as loss aversion, temporal myopia, and response bias

The home screen shows this in plain language such as:

- "You are not currently heading toward burnout"
- "At your current pace, you may hit burnout in X days"

The UI avoids exposing technical model jargon to the user.

## Adaptive behavior

The app changes its behavior based on the user's recent trajectory.

Supported session modes include:

- `explore`
- `nurture`
- `challenge`
- `celebrate`
- `probe`

Examples of adaptation:

- Nurture sessions stay gentler
- Heavier CDI states get fewer questions
- Positive reframes appear when the user needs more care
- The home screen changes copy and Mochi mood based on recent state

## Score visibility and privacy tone

Users can choose whether to see the numeric score.

If score display is turned off:

- The raw CDI number is hidden
- The app still shows the human-readable state label
- The preference is persisted in storage

This helps the experience stay supportive instead of overly clinical.

## Tech stack

- Expo
- React Native
- TypeScript
- Zustand
- AsyncStorage
- React Navigation
- Expo Linear Gradient
- React Native SVG

## Project structure

```text
src/
  components/         Reusable UI such as Mochi, charts, insight cards, and scene art
  engine/             Core math, adaptive logic, and shared types
  navigation/         App navigation setup
  scenarios/          Mochi-themed scenario library and selection logic
  screens/            Main app screens and game screens
  store/              Zustand state and persistence
  themes/             Design tokens and palette
```

## Key files

- `src/engine/mathEngine.ts`
  Contains CDI math, distortion calculations, game signal mapping, and burnout forecasting.

- `src/engine/adaptiveEngine.ts`
  Contains trajectory analysis, user-facing labels, and adaptive session decisions.

- `src/scenarios/allScenarios.ts`
  Contains the Mochi-themed check-in scenarios and selection logic.

- `src/store/profileStore.ts`
  Stores the user profile, sessions, CDI history, preferences, and persistence logic.

- `src/screens/HomeScreen.tsx`
  Main landing screen with Mochi, settings, score visibility, and burnout forecast.

- `src/screens/ScenarioScreen.tsx`
  The adaptive check-in flow.

- `src/components/MochiCompanion.tsx`
  Mochi asset selection and animation behavior.

## Getting started

Install dependencies:

```bash
npm install
```

Start the Expo app:

```bash
npm run start
```

Open on a device or simulator:

```bash
npm run android
npm run ios
npm run web
```

## Type checking

Run:

```bash
npx tsc --noEmit
```

## Fonts

The app uses:

- Cormorant for display text
- DM Sans for body text

These are loaded through `expo-font`.

## Adding or editing scenarios

Scenarios live in `src/scenarios/allScenarios.ts`.

Each scenario includes:

- `id`
- `distortion`
- `difficulty`
- `realmName`
- `narrativePrompt`
- `choices`
- `positiveReframe`

Each choice includes:

- `text`
- `signalWeight`
- `_signal`

Important rule: keep the `signalWeight` structure intentional. The wording can feel playful and soft, but the choice values still need to preserve the behavioral meaning that the math engine depends on.

## Current UX direction

The app currently aims for:

- Cream, caramel, and cocoa colors inspired by Mochi
- Softer text and lighter emotional tone
- Small supportive stats instead of heavy dashboards
- More playful scenarios without losing analytical value
- Plain-language insights instead of technical explanations

## Notes

- The app uses persistent local storage for the profile and preferences.
- The README reflects the current `CogniZen` and Mochi-based experience.
- User-facing copy should stay human and supportive even when the underlying model gets more sophisticated.
