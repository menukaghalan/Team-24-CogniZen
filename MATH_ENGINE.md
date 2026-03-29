# CogniZen Math Engine

This document explains the core scoring and prediction logic behind CogniZen.

The math engine is the crux of CDI. It turns check-in choices and game performance into a running internal estimate of cognitive drift over time.

Main implementation files:

- `src/engine/mathEngine.ts`
- `src/engine/adaptiveEngine.ts`
- `src/store/profileStore.ts`
- `src/engine/types.ts`

## What CDI is

CDI stands for Cognitive Drift Index.

It is an internal 0 to 100 score that estimates how far the user's recent behavior is drifting toward patterns associated with burnout, overload, avoidance, and reduced flexibility.

Important product rule:

- CDI is an internal modeling tool
- The UI should not present it like a diagnosis
- The app can hide the raw number and still show human-readable state labels

## High level flow

There are two main signal paths into CDI:

1. Scenario check-ins
2. Cognitive mini-games

The state pipeline looks like this:

1. A user completes a check-in or a game
2. The app converts that behavior into structured evidence
3. The evidence updates CDI
4. CDI history is appended
5. Adaptive state is recomputed
6. The home screen and next session mode adjust accordingly

## Core types

Defined in `src/engine/types.ts`.

Important types:

- `ChoiceRecord`
- `DistortionVector`
- `Session`
- `AdaptiveState`
- `BurnoutForecast`
- `GameResult`

### ChoiceRecord

Each scenario choice stores:

- `scenarioId`
- `choiceIndex`
- `distortion`
- `signalWeight`
- `responseTimeMs`
- `timestamp`

This is the atomic behavioral event used by the engine.

### DistortionVector

This is a six-dimensional score for a completed session:

- `temporalDiscount`
- `negativityBias`
- `allOrNothing`
- `decisionAvoidance`
- `catastrophizing`
- `effortReward`

Each dimension is normalized to `0..1`.

## Session scoring pipeline

Scenario session scoring is implemented in `src/engine/mathEngine.ts`.

### 1. Compute distortion vector

Function:

- `computeDistortionVector(choices)`

Logic:

- Group choices by `distortion`
- Average their `signalWeight`
- Normalize by dividing by `5`
- Clamp each dimension to `0..1`

Interpretation:

- `0` means low drift signal on that dimension
- `1` means very strong drift signal on that dimension

### 2. Update CDI with Bayesian blending

Function:

- `bayesianCDIUpdate(priorCDI, newVector, sessionCount)`

Logic:

- Compute session evidence as the average of all six distortion dimensions
- Convert that evidence to a `0..100` scale
- Blend prior CDI with new evidence

Weighting:

- Evidence weight starts at `0.15`
- It increases by `0.05` per session
- It is capped at `0.6`

Formula:

```ts
evidence = average(distortionVector)
evidenceCDI = evidence * 100
evidenceWeight = min(0.6, 0.15 + sessionCount * 0.05)
priorWeight = 1 - evidenceWeight
newCDI = round(priorWeight * priorCDI + evidenceWeight * evidenceCDI)
```

This means early sessions are conservative, and later sessions trust accumulated evidence more.

### 3. Derive session trend

Still inside `bayesianCDIUpdate`.

Trend rules:

- `improving` if `delta <= -3`
- `drifting` if `delta >= 5`
- `stable` otherwise

This trend is stored on the finished `Session`.

### 4. Build the session object

Function:

- `buildSession(choices, priorCDI, sessionCount, startedAt)`

The returned `Session` includes:

- Full choice list
- Distortion vector
- Updated CDI
- Dominant distortion
- Trend

## Distortion-specific feature functions

These are helper features used most heavily by the burnout forecast.

### Loss aversion

Function:

- `computeLossAversion(choices)`

Source signal:

- Choices tagged with `negativityBias`

Mapping:

- Average signal weight `0..5`
- Converted to lambda style range `1.0..4.0`

Formula:

```ts
1.0 + (avgWeight / 5) * 3.0
```

Baseline when no relevant data exists:

- `1.5`

### Temporal myopia

Function:

- `computeTemporalMyopia(choices)`

Source signal:

- Choices tagged with `temporalDiscount`

Mapping:

- Average signal weight `0..5`
- Converted to `0.05..0.8`

Formula:

```ts
0.05 + (avgWeight / 5) * 0.75
```

Baseline when no relevant data exists:

- `0.1`

### Response bias

Function:

- `computeResponseBias(choices)`

Purpose:

- Detect whether high-weight choices are being selected faster than low-weight ones

Logic:

- Split choices into `signalWeight >= 3` and `< 3`
- Compare average response times
- If high-weight choices are faster, bias rises

Output:

- Normalized `0..1`

Interpretation:

- `0` means no measurable bias
- `1` means strong fast-path bias toward heavier choices

## Game scoring path

Games do not create full `Session` objects. They update CDI more lightly.

Functions:

- `gameToDistortionContribution(result)`
- `buildGameCDIUpdate(priorCDI, result, sessionCount)`

### Step 1. Convert game result to partial distortion evidence

Each game maps to one or two distortion dimensions:

- `reactionTap` -> `temporalDiscount`
- `stroop` -> `allOrNothing`, `negativityBias`
- `patternMemory` -> `decisionAvoidance`
- `maze` -> `catastrophizing`
- `creative` -> `negativityBias`

### Step 2. Fill other dimensions with neutral values

The engine uses a neutral vector of `0.5` for dimensions the game did not measure.

This avoids letting one game dominate all six dimensions.

### Step 3. Apply a lighter CDI update

Game evidence weight:

- Starts at `0.05`
- Increases by `0.01` per session
- Is capped at `0.12`

This is intentionally much weaker than scenario-session evidence.

## Burnout forecast

Function:

- `computeBurnoutForecast(history, sessions = [], threshold = 0.75)`

This is the engine behind the home screen forecast card.

### Inputs

- Last 5 CDI readings from `cdiHistory`
- Last 5 sessions
- Recent choice records from those sessions

### Output states

- `insufficient_data`
- `watching`
- `approaching`
- `crossed`

### Forecast steps

#### 1. Require 5 CDI readings

If there are fewer than 5 readings, the forecast returns `insufficient_data`.

#### 2. Fit a time-based linear trend

The engine:

- Converts timestamps into elapsed days
- Normalizes CDI readings to `0..1`
- Computes slope using covariance over variance
- Computes `rSquared` as fit quality

This provides a directional trend and a fit confidence basis.

#### 3. Compute composite burnout risk

Function:

- `calibrateBurnoutRisk(latestCI, recentSessions, recentChoices)`

This is where the forecast becomes more than a simple trend line.

It blends:

- Latest normalized CDI, weight `0.45`
- Average recent distortion load, weight `0.20`
- Avoidance-heavy load, weight `0.15`
- Normalized loss aversion, weight `0.10`
- Normalized temporal myopia, weight `0.06`
- Response bias, weight `0.04`

Avoidance-heavy load itself gives more emphasis to:

- `decisionAvoidance`
- `catastrophizing`
- `effortReward`

#### 4. Adjust effective current risk and slope

The forecast uses:

```ts
effectiveCurrentCI = max(latestCI, compositeRisk)
effectiveSlopePerDay = slopePerDay * (0.85 + compositeRisk * 0.6)
```

So if the recent session pattern looks heavier than CDI alone, the forecast becomes more cautious.

#### 5. Project threshold crossing

Default burnout threshold:

- `0.75`

Projection rules:

- If effective current CI is already above threshold -> `crossed`
- If slope is flat or downward -> `watching`
- If projected crossing is over 180 days away -> `watching`
- Otherwise -> `approaching`

#### 6. Derive confidence level

Function:

- `forecastConfidence(rSquared, spanDays, sessionCount)`

Rules:

- `high` if `rSquared >= 0.75`, `spanDays >= 5`, and `sessionCount >= 3`
- `moderate` if `rSquared >= 0.4` and `spanDays >= 2`
- `low` otherwise

## Adaptive engine relationship

The CDI does not just sit in storage. It drives behavior.

Implemented in `src/engine/adaptiveEngine.ts`.

Function:

- `computeAdaptiveState(sessions, currentState)`

It uses recent session history to derive:

- `trajectory`
- `streakCount`
- `streakDirection`
- `topDistortion`
- `nextSessionMode`
- `positivityBank`
- `totalSessions`

### Trajectory logic

Based on the last 3 CDI session scores:

- `recovering` if average delta is `<= -3`
- `worsening` if average delta is `>= 4`
- `stable` otherwise

### Next session mode logic

Rules:

- First 2 sessions -> `explore`
- Worsening or CDI above 65 -> `nurture`
- Recovering with streak >= 3 -> `celebrate`
- CDI below 30 -> `challenge`
- Otherwise -> `probe`

This is how the scoring model changes the feel of the app.

## Store integration

Implemented in `src/store/profileStore.ts`.

### Scenario completion

`completeSession(choices, startedAt)` does this:

1. Calls `buildSession(...)`
2. Appends the session to `profile.sessions`
3. Recomputes adaptive state with `computeAdaptiveState(...)`
4. Appends CDI to `cdiHistory`
5. Persists the updated profile

### Game completion

`completeGameSession(result)` does this:

1. Calls `buildGameCDIUpdate(...)`
2. Updates `currentCDI`
3. Appends CDI to `cdiHistory`
4. Persists the updated profile

Important distinction:

- Scenario sessions create full session records
- Games only adjust CDI history directly

## Intake baseline

The profile store also sets an initial CDI from intake.

Function path:

- `completeIntake(...)` in `profileStore.ts`
- `computeIntakeCDI(...)` in `src/engine/intakeEngine.ts`

That gives the app a starting baseline before enough behavioral data exists.

## Why this implementation is defensible

The current engine is more defensible than a plain score label because it:

- Separates different distortion domains instead of flattening everything immediately
- Tracks actual behavior instead of relying only on self-report
- Uses repeated history instead of a single snapshot
- Blends prior state with new evidence conservatively
- Uses game signals lightly rather than over-trusting them
- Uses forecast calibration from recent session structure, not just CDI trend

## Current limitations

This is still a heuristic engine, not a clinical model.

Important limitations:

- Signal weights are hand-authored, not learned from labeled outcome data
- Forecasting uses a simple linear fit, not a trained predictive model
- Game contributions are intentionally lightweight proxies
- Some distortions may be under-sampled depending on scenario coverage
- CDI is useful as a within-user signal over time, not as a diagnosis

## If you want to extend it

Good next steps:

- Add more scenarios per distortion to improve coverage
- Add more game types with carefully bounded mappings
- Separate short-term volatility from long-term baseline
- Train a real predictive model if labeled burnout outcome data becomes available
- Revisit weights in `calibrateBurnoutRisk(...)` with empirical validation

## Summary

If you want the shortest possible description:

- The scenario library produces weighted choice events
- The math engine converts those into a six-dimensional distortion vector
- The vector updates CDI through Bayesian blending
- CDI history and recent session behavior drive burnout forecasting
- Adaptive state uses recent CDI movement to decide how the app should respond next

That full chain is what makes CDI the core of CogniZen.
