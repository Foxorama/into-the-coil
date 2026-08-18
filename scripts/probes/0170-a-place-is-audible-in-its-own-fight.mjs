// The breaks behind docs/decisions/0170-a-place-is-audible-in-its-own-fight.md.
//
// ⚠️ BOTH BREAKS ARE THE DEFECT PUT BACK, AND NEITHER IS A GAIN THE GUARD ASKED FOR. 0170 raised
// VOICE gains in src/content/core.ts because a mix multiplier could not reach the two layers the
// Black Heart is named for — so the break that matters is the material going back down, not a
// multiplier moving.
//
// ⚠️ THE SECOND ONE IS THE INTERESTING HALF. `LEADS.core.boss` said `drive`, which is near the top
// of every place in the game; with the howl and the tremolo audible, `drive` reads adrift at `boss`
// against the `part` target being the lead gives it. The first attempt at this change treated that
// as a mix fault and raised `drive` back — which would have undone the whole pass to keep a claim
// nothing had checked. What core's own fight follows is `frenzy`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0170',
    suite: 'tests/themes.test.ts',
    broke: "the howl's material back at the gain that left it 17 dB under core's own boss fight",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/core.ts',
      find: "      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.23, attack: 0.03, curve: 1.9, lowFrom: 1100, lowTo: 420, q: 2.4, drive: 0.85 },",
      replace: "      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1, gain: 0.075, attack: 0.03, curve: 1.9, lowFrom: 1100, lowTo: 420, q: 2.4, drive: 0.85 },",
    },
  },
  {
    decision: '0170',
    suite: 'tests/themes.test.ts',
    broke: "core following `drive` in its own boss fight again — a layer loud in all seven places",
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/arrangement.ts',
      find: "  core: { run: 'engine', surge: 'lead', approach: 'counter', boss: 'frenzy' },",
      replace: "  core: { run: 'engine', surge: 'lead', approach: 'counter', boss: 'drive' },",
    },
  },
];
