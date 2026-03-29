// Scenario Library
// Story content stays friendly. The math is in the signalWeight values.
// Difficulty 1 = gentle, 2 = moderate, 3 = cognitively demanding.

import { Scenario } from '../engine/types';

export const SCENARIOS: Scenario[] = [
  {
    id: 'td_001',
    distortion: 'temporalDiscount',
    difficulty: 1,
    realmName: "Mochi's Treat Cart",
    narrativePrompt:
      'Mochi can have one cream bun right now, or wait until tomorrow and get a full picnic basket of buns for everyone. There is enough food for tonight either way. What feels right?',
    choices: [
      { text: 'Take the bun now. Today comfort matters most.', signalWeight: 4, _signal: 'high_k_immediate' },
      { text: 'Wait for tomorrow. The picnic basket is worth it.', signalWeight: 0, _signal: 'low_k_delayed' },
      { text: 'Keep a small snack for now and plan for the basket later.', signalWeight: 1, _signal: 'moderate_k' },
      { text: 'Tell Mochi to decide tomorrow instead.', signalWeight: 3, _signal: 'avoidance_defer' },
    ],
    positiveReframe:
      'Wanting comfort right away makes sense, especially when energy is low. The helpful thing to notice is whether the now-choice is relief, or just the loudest option in the moment.',
  },
  {
    id: 'td_002',
    distortion: 'temporalDiscount',
    difficulty: 2,
    realmName: 'The Sunbeam Trail',
    narrativePrompt:
      'Mochi is heading toward a cozy window seat that is definitely open in two hours. Another cat says there might be a closer sunny spot just around the corner, but nobody has checked. Which path do you take?',
    choices: [
      { text: 'Dash for the maybe-sunbeam now. Relief might be closer.', signalWeight: 4, _signal: 'high_k_unverified' },
      { text: 'Keep going to the known sunny spot.', signalWeight: 0, _signal: 'low_k_verified' },
      { text: 'Peek around the corner while still moving toward the known spot.', signalWeight: 1, _signal: 'balanced_hedge' },
      { text: 'Curl up for a minute and decide after a break.', signalWeight: 3, _signal: 'avoidance_rest' },
    ],
    positiveReframe:
      'When you are tired, the closest relief can feel magnetic. That is not irrational. It just helps to notice when urgency starts sounding more certain than it really is.',
  },
  {
    id: 'td_003',
    distortion: 'temporalDiscount',
    difficulty: 3,
    realmName: 'The Pillow Fort Workshop',
    narrativePrompt:
      'Mochi has been building a giant pillow fort for weeks. It is cozy enough right now, but waiting one more weekend would make it truly spectacular. Everyone is tired and wants to rest in it tonight. What do you choose?',
    choices: [
      { text: 'Open the fort tonight. Enough is enough.', signalWeight: 5, _signal: 'high_k_exhaustion' },
      { text: 'Wait and finish it properly next weekend.', signalWeight: 0, _signal: 'low_k_strategic' },
      { text: 'Use it tonight, then do one last round of upgrades later.', signalWeight: 2, _signal: 'moderate_bounded' },
      { text: 'Hand the rest of the setup to someone else. Mochi is done.', signalWeight: 3, _signal: 'avoidance_withdraw' },
    ],
    positiveReframe:
      'Sometimes the gentle option really is to stop and rest. The thing to notice is whether the choice comes from wisdom, or from being too drained to imagine the fuller option.',
  },
  {
    id: 'nb_001',
    distortion: 'negativityBias',
    difficulty: 1,
    realmName: 'The Rainy Window Ledge',
    narrativePrompt:
      "There is a 60% chance tonight's wind will rattle Mochi's favorite window perch. Adding cushions now will keep it extra safe if the storm comes, but it will take time and effort if the weather stays calm. What do you do?",
    choices: [
      { text: 'Cushion everything now. The bad outcome matters too much.', signalWeight: 4, _signal: 'high_lambda_lossaverse' },
      { text: 'Wait. The odds are decent enough already.', signalWeight: 0, _signal: 'low_lambda_ev' },
      { text: 'Add a few cushions and check again later.', signalWeight: 1, _signal: 'moderate_hedge' },
      { text: 'Keep checking the clouds before deciding.', signalWeight: 3, _signal: 'avoidance_more_info' },
    ],
    positiveReframe:
      'Protecting against loss is caring, not weakness. The key is noticing when the scary possibility starts feeling bigger than the actual odds.',
  },
  {
    id: 'nb_002',
    distortion: 'negativityBias',
    difficulty: 2,
    realmName: 'The Festival Crossing',
    narrativePrompt:
      'Mochi can join a new neighborhood cat festival. There is a 70% chance it becomes a fun new routine, and a 30% chance one current cat buddy gets a little distant for a while. Home is stable, but a bit dull. What do you choose?',
    choices: [
      { text: 'Skip it. Losing the current buddy feels too risky.', signalWeight: 4, _signal: 'high_lambda_decline' },
      { text: 'Go. A 70% chance at something lovely is worth it.', signalWeight: 0, _signal: 'low_lambda_accept' },
      { text: 'Try the festival once before deciding for good.', signalWeight: 1, _signal: 'moderate_trial' },
      { text: 'Put it off. The timing feels off.', signalWeight: 3, _signal: 'avoidance_timing' },
    ],
    positiveReframe:
      'Protecting what already feels safe can be wise. It also helps to ask whether caution is protecting something real, or just protecting you from uncertainty itself.',
  },
  {
    id: 'aon_001',
    distortion: 'allOrNothing',
    difficulty: 1,
    realmName: 'The Toy Tunnel Junction',
    narrativePrompt:
      'Mochi can crawl through the long safe tunnel to get to the toy room, or zip through the short noisy tunnel that sometimes startles everyone. It looks like there are only two options. Are there?',
    choices: [
      { text: 'Take the long safe tunnel. Safety is everything.', signalWeight: 3, _signal: 'binary_safe_extreme' },
      { text: 'Take the short tunnel. The odds are fine.', signalWeight: 2, _signal: 'binary_risk_accept' },
      { text: 'Peek into the noisy tunnel first, then decide.', signalWeight: 0, _signal: 'nuanced_info_gather' },
      { text: 'Sit down and wait for the tunnels to feel clearer.', signalWeight: 4, _signal: 'avoidance_wait' },
    ],
    positiveReframe:
      'When a choice feels sharply black-and-white, the mind is often trying to simplify fast. There is often a smaller in-between move hiding in the middle.',
  },
  {
    id: 'aon_002',
    distortion: 'allOrNothing',
    difficulty: 2,
    realmName: 'The Biscuit Bakery',
    narrativePrompt:
      "Mochi has baked a batch of cat biscuits. They are 80% as pretty as the bakery's best batch, but they taste great and everyone wants them now. Do you serve them or keep fixing every little detail?",
    choices: [
      { text: "Keep baking. 80% isn't enough.", signalWeight: 4, _signal: 'binary_perfect_or_nothing' },
      { text: 'Serve them now. They are already really good.', signalWeight: 1, _signal: 'pragmatic_good_enough' },
      { text: 'Serve a few now and improve the next batch later.', signalWeight: 0, _signal: 'nuanced_partial' },
      { text: 'Ask everyone to come back much later instead.', signalWeight: 3, _signal: 'avoidance_conditional' },
    ],
    positiveReframe:
      "Wanting things to be polished is real. The gentle check is whether 'not perfect yet' has quietly turned into 'not worth sharing at all.'",
  },
  {
    id: 'da_001',
    distortion: 'decisionAvoidance',
    difficulty: 1,
    realmName: 'The Nap Nook',
    narrativePrompt:
      "Two cats both want Mochi's softest nap cushion. You have heard both sides, and there is enough information to choose. Someone will still be disappointed. What do you do?",
    choices: [
      { text: 'Give it to the cat who has waited longest.', signalWeight: 0, _signal: 'decide_direct' },
      { text: 'Give it to the cat who looks most tired today.', signalWeight: 0, _signal: 'decide_direct_alt' },
      { text: 'Make a turn-taking plan for sharing it.', signalWeight: 1, _signal: 'decide_compromise' },
      { text: 'Ask for more time even though you already know enough.', signalWeight: 5, _signal: 'avoidance_defer_enough_info' },
    ],
    positiveReframe:
      'Wanting a little more certainty is human. The useful question is whether waiting will improve the choice, or only prolong the discomfort of making it.',
  },
  {
    id: 'da_002',
    distortion: 'decisionAvoidance',
    difficulty: 2,
    realmName: 'The Window Watch Tower',
    narrativePrompt:
      'Next week Mochi can claim the quiet garden window that feels calm and predictable, or the busy street window that is exciting but noisy. Which spot do you choose?',
    choices: [
      { text: 'Take the busy window. Lean into the stimulation.', signalWeight: 0, _signal: 'decide_challenge' },
      { text: 'Take the garden window. Steadiness sounds better.', signalWeight: 1, _signal: 'decide_recovery' },
      { text: 'Ask to stay undecided a little longer.', signalWeight: 4, _signal: 'avoidance_extension' },
      { text: 'Let someone else pick for Mochi.', signalWeight: 3, _signal: 'avoidance_delegate_self' },
    ],
    positiveReframe:
      'Letting someone else choose can be wise sometimes. It helps to notice whether that move feels resourcing, or like stepping away because choosing feels too heavy.',
  },
  {
    id: 'cat_001',
    distortion: 'catastrophizing',
    difficulty: 1,
    realmName: 'The Stormy Pantry',
    narrativePrompt:
      'Mochi has had two weeks where the treat jar felt low. There is still a 75% chance supplies stay fine, but a 25% chance next week gets tight. What should happen now?',
    choices: [
      { text: 'Go into full treat-emergency mode right now.', signalWeight: 4, _signal: 'catastrophize_full_crisis' },
      { text: 'Make a modest plan and carry on as usual.', signalWeight: 0, _signal: 'calibrated_response' },
      { text: 'Set aside a small backup stash and recheck later.', signalWeight: 1, _signal: 'moderate_hedge' },
      { text: 'Ask more and more cats before doing anything.', signalWeight: 3, _signal: 'avoidance_advice_loop' },
    ],
    positiveReframe:
      'Preparing for difficulty can be wise. The thing to watch is when the preparation starts costing more energy than the likely problem itself.',
  },
  {
    id: 'er_001',
    distortion: 'effortReward',
    difficulty: 1,
    realmName: "Mochi's Craft Corner",
    narrativePrompt:
      'Mochi spent weeks making the coziest blanket nest in the house. Everyone loves using it, but hardly anyone notices who made it. A new project comes up. What now?',
    choices: [
      { text: 'No. Mochi is done giving effort without anything back.', signalWeight: 4, _signal: 'high_imbalance_withdraw' },
      { text: 'Yes. The cozy work still matters.', signalWeight: 0, _signal: 'low_imbalance_intrinsic' },
      { text: 'Yes, but ask for appreciation and support this time.', signalWeight: 1, _signal: 'renegotiate_terms' },
      { text: 'Help with a small part, not the whole thing.', signalWeight: 2, _signal: 'moderate_reduced_scope' },
    ],
    positiveReframe:
      'Wanting effort to feel seen is deeply human. The pattern to watch is when one unfair exchange starts coloring every future effort before it begins.',
  },
  {
    id: 'er_002',
    distortion: 'effortReward',
    difficulty: 2,
    realmName: 'The Star Chart Loft',
    narrativePrompt:
      "Mochi has quietly become the best stargazer in the house, but the louder cats keep getting chosen for the fun rooftop jobs. Another unpaid helper role is offered because it would 'be good exposure.' What do you do?",
    choices: [
      { text: 'Decline. Mochi is done helping for free.', signalWeight: 3, _signal: 'imbalance_refuse' },
      { text: 'Accept. Maybe it pays off later.', signalWeight: 1, _signal: 'long_term_invest' },
      { text: 'Accept only if it clearly leads to a supported role soon.', signalWeight: 0, _signal: 'renegotiate_paid' },
      { text: 'Ask for a week because it already feels draining.', signalWeight: 4, _signal: 'avoidance_overloaded' },
    ],
    positiveReframe:
      'Knowing your effort has value is healthy. The useful check is whether the situation is truly uneven, or whether depletion is making every ask feel immediately too costly.',
  },
];

export function selectScenariosForSession(
  mode: string,
  topDistortion: string,
  completedIds: string[],
  count: number = 5,
): Scenario[] {
  const unseen = SCENARIOS.filter(s => !completedIds.includes(s.id));

  const buildPool = (source: Scenario[]): Scenario[] => {
    if (mode === 'nurture') {
      return source.filter(s => s.difficulty <= 2);
    }

    if (mode === 'challenge') {
      return source.filter(s => s.difficulty >= 2);
    }

    if (mode === 'probe') {
      const focused = source.filter(s => s.distortion === topDistortion);
      const rest = source.filter(s => s.distortion !== topDistortion);
      return [...focused, ...rest];
    }

    if (mode === 'celebrate') {
      return source.filter(s => s.difficulty <= 2);
    }

    return source.filter(s => s.difficulty === 1);
  };

  let pool = buildPool(unseen);

  if (pool.length < count) {
    const recycled = buildPool(SCENARIOS).filter(s => !pool.some(existing => existing.id === s.id));
    pool = [...pool, ...recycled];
  }

  if (pool.length < count) {
    const fallback = SCENARIOS.filter(s => !pool.some(existing => existing.id === s.id));
    pool = [...pool, ...fallback];
  }

  const selected: Scenario[] = [];
  const distortionsSeen = new Set<string>();

  for (const scenario of pool) {
    if (selected.length >= count) break;
    if (!distortionsSeen.has(scenario.distortion)) {
      selected.push(scenario);
      distortionsSeen.add(scenario.distortion);
    }
  }

  for (const scenario of pool) {
    if (selected.length >= count) break;
    if (!selected.includes(scenario)) selected.push(scenario);
  }

  return selected.slice(0, count);
}
