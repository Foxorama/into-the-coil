// The breaks behind docs/decisions/0608-freeplay-is-earned.md.
//
// ⚠️ Freeplay is earned per tier, so the breaks that matter are the ones that hand it out unearned — a
// run flown on Freeplay before its tier is finished, a chip offered on a tier that has not earned it —
// and the ones that lose it once earned: a finish that does not open its tier, a hangar that forgets
// it, and an edited document that opens a tier nobody finished.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0608',
    suite: 'tests/credits.test.ts',
    broke: 'the band’s credits flown on every tier, finished or not',
    guard: 'no tier is finished on a first visit',
    edit: {
      path: 'src/state/slices/hangar.ts',
      find: '  return state.finished[difficulty] ? chosen : DEFAULT_CREDIT;',
      replace: '  return chosen;',
    },
  },
  {
    decision: '0608',
    suite: 'tests/credits.test.ts',
    broke: 'a run finished winning its ship and not finishing its tier',
    guard: 'a run finished opens Freeplay on its own tier',
    edit: {
      path: 'src/state/root.ts',
      find: "    const hangar = reduceHangar(won, { slice: 'hangar', type: 'finished', difficulty: state.run.difficulty });",
      replace: '    const hangar = won;',
    },
  },
  {
    decision: '0608',
    suite: 'tests/credits.test.ts',
    broke: 'a document’s tiers read as finished on anything truthy',
    guard: 'only ever as finished',
    edit: {
      path: 'src/save/hangar.ts',
      find: '  for (const kind of DIFFICULTY_KINDS) if (finishedDoc?.[kind] === true) finished[kind] = true;',
      replace: '  for (const kind of DIFFICULTY_KINDS) if (finishedDoc?.[kind]) finished[kind] = true;',
    },
  },
  {
    decision: '0608',
    suite: 'tests/credits.browser.test.ts',
    broke: 'the title flying the kept Freeplay on a tier nobody has finished',
    guard: 'ends the run on the game over, with its account',
    edit: {
      path: 'src/app/mount.ts',
      find: '      creditsFor(state.hangar, state.settings.difficulty, state.settings.credits),',
      replace: '      state.settings.credits,',
    },
  },
  {
    // 0685: the chip is on every tier now; what must not happen is Freeplay OPEN on one not finished.
    decision: '0685',
    suite: 'tests/credits.browser.test.ts',
    broke: 'Freeplay open on the chip whatever the tier',
    guard: 'is shut on another',
    edit: {
      path: 'src/app/mount.ts',
      find: '    const open = CREDIT_KINDS.map((kind) => finished || !CREDITS[kind].continues);',
      replace: '    const open = CREDIT_KINDS.map(() => true);',
    },
  },
  {
    decision: '0685',
    suite: 'tests/credits.browser.test.ts',
    broke: 'the chip stepping past the shut Freeplay rather than onto it, so nothing is ever said',
    guard: 'counts a cleared run already on the table',
    edit: {
      path: 'src/app/chrome.ts',
      find: "    const lands = (i: number): boolean => (band.faces === 'chip' || band.open[i] !== false) && band.hidden[i] !== true;",
      replace: '    const lands = (i: number): boolean => band.open[i] !== false && band.hidden[i] !== true;',
    },
  },
  {
    decision: '0685',
    suite: 'tests/credits.browser.test.ts',
    broke: 'the borrowed line never written, so a press onto the shut Freeplay says nothing',
    guard: 'counts a cleared run already on the table',
    edit: {
      path: 'src/app/chrome.ts',
      find: "      band.hint.textContent = band.lent.whys[band.lent.index] ?? band.lent.why ?? '';",
      replace: '      band.hint.textContent = band.hint.textContent;',
    },
  },
];
