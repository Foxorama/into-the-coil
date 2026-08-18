// The breaks behind docs/decisions/0167-a-build-does-not-duck.md.
//
// ⚠️ THE GUARD IS GREEN ON A PROPERTY NOBODY AUTHORED ON PURPOSE, which is the awkward case. The
// shipped ladder has never ducked a carried layer at an in-level boundary — largest reduction
// anywhere is 0.26 dB — and it got there without a rule saying so. A guard over an accident needs
// probes more than most: nothing in the ladder's history was defending this, so nothing in the
// ladder's future will either.
//
// ⚠️ AND THE FLOOR IS THE OTHER HALF. One decibel is a level JND, and a guard whose bound has drifted
// past what a listener can hear is a guard that has stopped being about the complaint. The second
// probe widens it until the reported defect passes.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0167',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE REPORTED DEFECT, PUT INTO THE LADDER. `mire` opens `arp`, `ride`, `hook` and `lead` at
      `push`; ducking its `sub` there to make room is exactly the trade the solved mix makes
      automatically and a hand would make deliberately — and `sub` is promoted to `pulse` in this
      place (*"still water with something under it"*), so it is the layer whose absence costs the
      place its brief.
    */
    broke: 'mire’s sub ducked at push to make room for the four layers that open there',
    guard: '0167 — A BUILD DOES NOT DUCK: nothing already sounding gets audibly quieter when a section opens',
    edit: {
      path: 'src/content/music.ts',
      // `MUSIC_LADDER.push`'s row — the whole line, so the anchor cannot match `run` or `surge`.
      find: "  push: { drone: 0.34, bass: 0, beat: 0, sub: 1.06,",
      replace: "  push: { drone: 0.34, bass: 0, beat: 0, sub: 0.62,",
    },
  },
  {
    decision: '0167',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE LAST BOUNDARY, NOT THE FIRST, AND THAT IS WHY THERE ARE TWO. Probe one ducks at
      `run→push`; a guard that walked only the first boundary in its list would still go red on it and
      would be blind to two thirds of a level. This ducks `engine` at `approach`, which is
      `surge→approach` in all seven places at once.

      ⚠️ AND A WIDENED FLOOR IS NOT PROBED, BECAUSE IT CANNOT BE. The shipped ladder's worst reduction
      is 0.26 dB, so it passes at any bound looser than that — every value from −1 to −∞ is green over
      the current subject, and no edit to the number can redden the suite. The decision says so rather
      than pretending otherwise, and names what would discriminate it: a candidate mix that ducks by
      between one and six decibels. `DUCK_FLOOR_DB` is a definition (a level JND) rather than a
      threshold read off a spread, which is the only reason that is acceptable here.
    */
    broke: 'engine ducked at `approach`, so the last in-level boundary is the one that regresses',
    guard: '0167 — A BUILD DOES NOT DUCK: nothing already sounding gets audibly quieter when a section opens',
    edit: {
      path: 'src/content/music.ts',
      find: '  approach: { drone: 0.34, bass: 0, beat: 0, sub: 1.1, engine: 1.02,',
      replace: '  approach: { drone: 0.34, bass: 0, beat: 0, sub: 1.1, engine: 0.6,',
    },
  },
  {
    decision: '0167',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE MISTAKE ANYBODY MAKES ON SEEING THE SUMMED PEAK. `rebasedLevel` does not renormalise, so
      its peak lands at 2.51 against a 2.17 ceiling — and the obvious repair is to hold each rung to
      the shipped ladder's level. That is a PER-RUNG scale, so the factor differs either side of a
      boundary and the ratios the whole construction rests on stop being preserved: 11 carried layers
      duck at `push`-based, 25 at `surge`-based. The mix still sounds balanced and still measures
      well on every other number here; the one thing it stops doing is the thing it exists for.
    */
    broke: 'the re-based mix renormalised per rung, which is the obvious fix for its headroom',
    guard: '0167 — AND THE RE-BASED MIX IS ADDITIVE TOO, which is the only reason it exists',
    edit: {
      path: 'scripts/solve-mix.mjs',
      find:
        '    for (const l of MUSIC_LAYERS) gains[l] = SOLVED_BY(l) ? shipped[l] * scale[l] : shipped[l];\n' +
        '    out[rung] = { gains, shipped };',
      replace:
        '    for (const l of MUSIC_LAYERS) gains[l] = SOLVED_BY(l) ? shipped[l] * scale[l] : shipped[l];\n' +
        '    const lvl = (g) => Math.sqrt(MUSIC_LAYERS.reduce((s, l) => s + (g[l] > 0 ? (rms[l] * g[l]) ** 2 : 0), 0));\n' +
        '    const k = lvl(shipped) / lvl(gains);\n' +
        '    for (const l of MUSIC_LAYERS) if (SOLVED_BY(l)) gains[l] *= k;\n' +
        '    out[rung] = { gains, shipped };',
    },
  },
];
