// The breaks behind docs/decisions/0331-the-heart-beats-under-it.md.
//
// ⚠️ THE TWO THAT CANNOT BE HEARD FROM INSIDE THE GAME are both here. A shared buffer kept beside the
// place's own is inaudible — it is 52 MB of audio nobody plays — and a shared buffer that is never baked
// again after a release is the previous level's instrument arriving under this one at the next phrase,
// twenty-five seconds after the boundary that caused it. Neither shows up in a listen.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0331',
    suite: 'tests/sound.test.ts',
    broke: 'the shared copy kept beside the place that replaced it, which is what 0133 left unfinished',
    guard: '0331 — and the shared copy of what it re-voices is let go, and baked again when it is wanted',
    edit: {
      path: 'src/app/sound.ts',
      // ⚠️ Anchored at the indentation the block actually has — four spaces, not six. This was written
      // from the shape of the change rather than from the file, which is the one way a probe can be
      // stranded on the day it is authored. `for (const layer of mine) {` appears twice in `bakePlace`,
      // so the whole block is what makes it unambiguous.
      find: `    for (const layer of mine) {
      if (own[layer] === base[layer]) continue;
      base[layer] = RELEASED;
      released.add(layer);
    }`,
      replace: `    // The place's own is playing; the shared one underneath it stays, as it did until 0331.`,
    },
  },
  {
    decision: '0331',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE HALF THAT SOUNDS LIKE MUSIC RATHER THAN LIKE A CRASH. A released layer that is never baked
      again hands the next place a zero-length buffer: the layer goes silent where that place expects the
      shared line, and the mix simply has a hole in it at the level after The Black Heart.
    */
    broke: 'a layer released by one place never baked again for the next place that shares it',
    guard: '0331 — and the shared copy of what it re-voices is let go, and baked again when it is wanted',
    edit: {
      path: 'src/app/sound.ts',
      find: '    if (mine.includes(layer) || !released.has(layer)) continue;',
      replace: '    if (mine.includes(layer) || released.has(layer)) continue;',
    },
  },
  {
    decision: '0331',
    suite: 'tests/sound.test.ts',
    broke: "the ballad's loops doubled, which is what the per-place budget is for",
    guard: '0331 — AND WHAT A PLACE HOLDS WHILE IT PLAYS, WHICH IS THE NUMBER NOBODY WAS MEASURING',
    edit: {
      path: 'src/content/themes.ts',
      find: 'bars: { groove: 42, counter: 42, beat: 42, bass: 16, ownB: 8, ownC: 18, ownD: 8 },',
      replace: 'bars: { groove: 84, counter: 84, beat: 84, bass: 16, ownB: 8, ownC: 18, ownD: 8 },',
    },
  },
];
