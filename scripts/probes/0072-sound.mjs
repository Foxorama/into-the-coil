// The breaks behind docs/decisions/0072-a-cue-is-baked-and-played.md.
//
// ⚠️ Four of these are about WHEN a sound happens and four are about whether one happens at all, and
// the split matters: a build where every cue fires on the right step and nothing reaches a speaker
// passes every unit test in tests/sound.test.ts. The last two can only be seen in a browser, for the
// same reason 0070's could — the chain from a gesture to a source node has no seam a node test can
// stand in.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0072',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE BAN, and it is the same break 0070's probe makes against the style table because it is
      the same failure: a comfort setting read by the thing that decides what hits what. Nothing
      about it looks wrong at the call site — the frame already names cues — and afterwards, turning
      the sound off is a difficulty setting nobody can tell apart from one.
    */
    broke: 'the step given sight of the sound setting, so silence could become a difficulty',
    guard: 'THE BAN: nothing that decides an outcome may import the sound setting',
    edit: {
      path: 'src/app/frame.ts',
      find: "import type { CueKind } from '../content/cues.ts';",
      replace: "import type { CueKind } from '../content/cues.ts';\nimport { SOUNDS } from '../content/sound.ts';\nvoid SOUNDS;",
    },
  },
  {
    decision: '0072',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE ONE A REVIEWER WOULD WAVE THROUGH. Beside the spawn is exactly where a cue belongs, and
      for eleven of the twelve it is. For the pulse it means five identical clicks on one step at a
      full loadout — which is not five times as loud, it is a different and worse sound.
    */
    broke: 'the pulse cue moved inside the barrel loop, so a five-barrel volley is five clicks',
    guard: 'says one thing per volley and not one per barrel',
    edit: {
      path: 'src/app/frame.ts',
      // ⚠️ Re-anchored by 0233: the cue is the flight's, asked of `cueOfFlight`, since the same
      // barrel loop fires every gun that flies a body.
      find: "    if (i === 0) w.onCue(cueOfFlight(w.weapon.flight), w.ship.across);",
      replace: "    w.onCue(cueOfFlight(w.weapon.flight), w.ship.across);",
    },
  },
  {
    decision: '0072',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE CAP COUNTING THE WRONG THING, and it is the subtlest failure in the change: four
      retriggers of one held cue fill the step's budget and lock out the different cues behind them,
      so the voice cap causes precisely the failure it was added to prevent — on the busiest steps
      only, where nobody is listening for an absence.

      ⚠️ This probe replaced one that broke the ORDER of the two checks and reported STILL GREEN.
      That was the harness being right: whichever runs first, a held repeat returns before `voices`
      moves, so the ordering was a claim about nothing. What is real is what is counted.
    */
    broke: 'the voice cap counting cues that were dropped, so repeats of one sound lock out the others',
    guard: 'does not let a cue held back spend the step’s budget anyway',
    edit: {
      path: 'src/app/sound.ts',
      // ⚠️ Re-anchored by 0104: the two gates moved out of `play` into `emit`, because a gridded cue
      // has to be asked the same questions at the moment it SOUNDS rather than when it was asked for.
      // ⚠️ RE-ANCHORED BY 0183, WHICH DELETED THE CAP THIS BREAK USED TO DEFEAT. The claim survives
      // one refusal down: a held repeat must be a no-op. Counting the ASK rather than the SOUNDING is
      // still the mistake, and it is now visible in the duck rather than in a lost slot.
      find: '    if (clock - (lastAt[index] ?? 0) < CUES[CUE_KINDS[index]!]!.hold) return;\n    if (!out.ready()) return;\n    lastAt[index] = clock;',
      replace: '    lastAt[index] = clock;\n    if (clock - (lastAt[index] ?? 0) < CUES[CUE_KINDS[index]!]!.hold) return;\n    if (!out.ready()) return;',
    },
  },
  {
    decision: '0072',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE LOUDEST EVENT IN THE GAME, ANNOUNCED TWICE AND THEREFORE AT RISK OF NOT AT ALL. A boss
      death that also fires the ordinary kill cue puts a fourth voice on a step that already has the
      pulse, the threat and the hit — and the boss's own cue is emitted last, so the cap eats it.

      ⚠️ **RE-AIMED AT THE LOGS BY 0263, WHICH IS WHERE THE INVARIANT LIVES NOW.** This used to strike
      out `&& !bossJustDied(w)` from the kill cue; that decision gives the boss a `bossDeaths` log of
      its own, so a boss death never reaches `w.deaths` and the clause it struck was protecting
      nothing — the probe applied and the suite STAYED GREEN. What keeps the boss out of the ordinary
      cue is the SPLIT, so the break is putting it back in one log: the shots' collision logs the
      boss's death where every other death goes, and the kill cue finds it there.
    */
    /*
      ⚠️ **RE-AIMED AGAIN BY 0283, AND THE REASON IS WORTH THE PARAGRAPH.** This guard drives THE
      APPROACH, whose boss is the serpent, and a serpent has a body now: the player's fire lands on
      eleven nodes as well as on the skull, and whatever lands there is spent on the head by
      `drainChain`'s own `strike`. So the fatal blow no longer comes through the collision this used
      to edit — the probe applied and **the suite stayed green**, which is the third time in two days
      that a guard has quietly stopped asking its question because the thing underneath it moved.

      ⚠️ **THE HEAD'S OWN COLLISION LOGS TO THE SAME PLACE AND IS THE SAME CLAIM.** It cannot carry a
      probe of its own while this guard fights a boss with a body, because the sweep gets there first;
      what holds it meanwhile is that both paths name `w.bossDeaths`, thirty lines apart in one file.
      A guard driving one of the thirteen bosses without a body would probe the other half.

      ⚠️ **AND BACK TO THE HEAD BY 0307, WHICH ARMOURED THE BODY.** The serpent's flank passes nothing
      to the head now, so the sweep never lands a blow and the fatal one comes through the skull's own
      collision again — the probe on the sweep applied and the suite STAYED GREEN, exactly as the
      paragraph above said it would the moment the body stopped getting there first. So this breaks
      the half it could not reach before; the sweep's half is still held by the one log name it shares.
    */
    broke: 'the boss logged into the ordinary death log again, so the kill cue fires for it and the cap eats its own',
    guard: 'THE ONE THAT WOULD BE EATEN BY THE CAP: a boss dying is heard, through a real speaker',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (shootable) killedByShots += collideInto(w.playerShots, w.bossPool, 1, open, IMPACT_FLASH_STEPS, w.bossDeaths, bladeHits);',
      replace: '    if (shootable) killedByShots += collideInto(w.playerShots, w.bossPool, 1, open, IMPACT_FLASH_STEPS, w.deaths, bladeHits);',
    },
  },
  {
    decision: '0072',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ A CUE THAT NEVER DIES AWAY, which is a click at the end of every sound in the game and also
      a mix that never clears. Without the decay each buffer ends at full amplitude and the next one
      starts on top of it.

      ⚠️ This probe replaced one that deleted a fade-out and reported STILL GREEN — the decay had
      already brought the tail a hundred times below audibility, so the fade was defending a
      discontinuity that was not there. The fade is gone and the guard now stands over the mechanism
      that was doing the work all along.
    */
    broke: 'the envelope never falling, so every cue ends at full amplitude and clicks into the next',
    guard: 'starts and ends at zero, because a buffer that stops mid-waveform clicks',
    edit: {
      path: 'src/app/sound.ts',
      // ⚠️ RE-ANCHORED by `docs/decisions/0089-a-cue-has-a-body.md`: the envelope is per LAYER now and
      // the shared `DECAY` is its default rather than its value. Same break, same guard — and 0089
      // added a second assertion to that guard, because the release it restored would otherwise
      // satisfy *ends at zero* on its own.
      find: '    let envelope = Math.exp(-curve * u);',
      replace: '    let envelope = 1;\n    void DECAY;',
    },
  },
  {
    decision: '0072',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ DECISION 0021, IN A CHANNEL IT WAS NOT WRITTEN ABOUT. A stream taken by position rather than
      by name couples every cue to every cue before it, so inserting a thirteenth row in the middle
      of the list silently re-rolls the noise in everything after it. Every other assertion in the
      suite stays green.
    */
    broke: 'the noise stream taken by position rather than by name, so a new cue re-rolls the old ones',
    guard: 'takes its stream from the cue’s NAME, so a thirteenth row cannot change the twelve above it',
    edit: {
      path: 'src/app/sound.ts',
      // Re-anchored by 0190, which routed the bake through `cueRowOf` so a place may re-voice a cue.
      // The break is unchanged: the stream taken by POSITION rather than by name.
      find:
        "  return CUE_KINDS.map((kind) => {\n" +
        "    const row = cueRowOf(theme, kind);\n" +
        "    return velocitiesOf(row).map((v) => sampleCue(row, rate, root.stream(kind), v));\n" +
        "  });",
      replace: 'return CUE_KINDS.map((kind, i) => sampleCue(CUES[kind], rate, root.stream(String(i))));',
    },
  },
  {
    decision: '0072',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE BUG A ONE-FIELD SLICE COULD NOT HAVE HAD. `{ sound }` type-checked perfectly while there
      was one setting; with two it silently resets the other one, so the player's chosen look
      disappears every time they touch the sound.
    */
    broke: 'the settings slice rebuilt without the other field, so choosing a sound throws the style away',
    guard: 'and does not take the style with it, which a slice of two fields makes possible for the first time',
    edit: {
      path: 'src/state/slices/settings.ts',
      find: '      return state.sound === action.sound ? state : { ...state, sound: action.sound };',
      replace: '      return state.sound === action.sound ? state : { style: DEFAULT_STYLE, sound: action.sound };',
    },
  },
  {
    decision: '0072',
    suite: 'tests/layering.test.ts',
    /*
      ⚠️ THE HOLE THE CAPABILITY TABLE HAD UNTIL AUDIO ARRIVED. `AudioContext` is not `window`, not
      the clock, not randomness and not storage — so before this change the model could have reached
      for a device, and the layer scan would have said nothing at all.
    */
    broke: 'the model reaching for an audio device, which no capability pattern used to match',
    guard: 'no layer reaches for a capability it was not granted',
    edit: {
      path: 'src/sim/flight.ts',
      find: 'export function holdStation(',
      replace: 'export function noise(): AudioContext {\n  return new AudioContext();\n}\n\nexport function holdStation(',
    },
  },
  {
    decision: '0072',
    suite: 'tests/sound.browser.test.ts',
    /*
      ⚠️ THE HALF NO UNIT TEST CAN REACH, and the one that would actually ship. Every cue fires on
      the right step, the table is perfect, the speaker's arithmetic is right — and the context is
      never resumed, so the game is silent on every device in the world. Nothing else goes red.
    */
    broke: 'the unlock never wired up, so every cue is correct and the game is silent everywhere',
    guard: 'THE WHOLE CHAIN: a press unlocks it, the cues bake once, and a run makes voices',
    edit: {
      path: 'src/app/mount.ts',
      find: "  window.addEventListener('pointerdown', unlock, { capture: true });",
      replace: '',
    },
  },
  {
    decision: '0072',
    suite: 'tests/sound.browser.test.ts',
    /*
      ⚠️ THE SETTING THAT DISPATCHES PERFECTLY AND CHANGES NOTHING — 0070's fourth probe, in the
      other channel. The slice moves, the chooser marks the right button, and the game goes on making
      exactly as much noise as before.
    */
    broke: 'the sound setting never reaching the speaker, so Off is a button that does nothing',
    guard: 'and choosing Off makes it silent without making it any less unlocked',
    edit: {
      path: 'src/app/mount.ts',
      find: "    speaker.setOn(state.settings.sound === 'on');",
      replace: '    speaker.setOn(true);',
    },
  },
];
