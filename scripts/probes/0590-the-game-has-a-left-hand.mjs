// The breaks behind docs/decisions/0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md.
//
// ⚠️ The mirror has three halves that must agree — the picture flipped, the pushes read back through it,
// and the world that never learns either — so each break below cuts one of them off.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0590',
    suite: 'tests/hand.test.ts',
    /*
      ⚠️ THE ONE LINE THAT MAKES THE MIRROR PLAYABLE. Without it the picture is flipped and the keys are
      not: the left arrow flies the ship to the right of a screen that scrolls to the left.
    */
    broke: 'the pushes not read back through the mirror, so every key flies the mirrored ship the wrong way',
    guard: 'turns along and only along, after every device has added',
    edit: {
      path: 'src/app/devices.ts',
      find: '      if (mirrored()) intent.along = -intent.along;',
      replace: '',
    },
  },
  {
    decision: '0590',
    suite: 'tests/hand.test.ts',
    broke: 'the step given sight of the hand, so a mirrored game could be a different one',
    guard: 'THE BAN: nothing that decides an outcome or paints the field may import the hand',
    edit: {
      path: 'src/app/frame.ts',
      find: "import type { CueKind } from '../content/cues.ts';",
      replace: "import type { CueKind } from '../content/cues.ts';\nimport { HANDS } from '../content/touch.ts';\nvoid HANDS;",
    },
  },
  {
    decision: '0590',
    suite: 'tests/hand.browser.test.ts',
    broke: 'the hand chosen and the canvas never flipped, so Left is a setting that does nothing',
    guard: 'THE ASK: Left shows the field mirrored on a desktop, and Right puts it back',
    edit: {
      path: 'src/app/mount.ts',
      find: "    canvas.style.transform = want ? 'scaleX(-1)' : '';",
      replace: "    canvas.style.transform = '';",
    },
  },
  {
    decision: '0590',
    suite: 'tests/hand.browser.test.ts',
    /*
      ⚠️ THE SIMPLER MIRROR IS THE WRONG ONE. Flipping the canvas whenever the hand is left is one
      condition shorter, and puts every one of the hangar's doors over the wrong shopfront.
    */
    broke: 'the port mirrored with the field, so its doors stand over the wrong shops',
    guard: 'and not the port, whose doors and sign are drawn to be read the right way round',
    edit: {
      path: 'src/app/mount.ts',
      find: '    const want = HANDS[state.settings.hand].mirrored && world.intro === null && world.stand === null && view.alongAxis === \'x\';',
      replace: '    const want = HANDS[state.settings.hand].mirrored;',
    },
  },
  {
    decision: '0590',
    suite: 'tests/settings.test.ts',
    broke: 'the hand offered on touch screens alone, as the trigger side was, so a desktop cannot play left-handed',
    guard: 'offers the sound, the crossing, the hand and the steering, and the look no longer',
    edit: {
      path: 'src/state/screens.ts',
      find: "        label: 'Hand',\n        options: HAND_KINDS.map((kind) => ({ label: HANDS[kind].title, hint: HANDS[kind].hint })),\n        faces: 'words',\n        on: 'all',",
      replace: "        label: 'Hand',\n        options: HAND_KINDS.map((kind) => ({ label: HANDS[kind].title, hint: HANDS[kind].hint })),\n        faces: 'words',\n        on: 'touch',",
    },
  },
];
