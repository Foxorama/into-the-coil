// The breaks behind docs/decisions/0120-a-rung-may-close-a-layer.md.
//
// ⚠️ 0090's ADDITIVE RULE IS GONE AND WHAT REPLACED IT IS MORE STRUCTURE, NOT LESS — the same shape
// docs/decisions/0114-the-fight-is-a-different-piece.md took when it retired the other half of that
// rule. These three are the three ways the replacement can be a hole rather than a rule.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0120',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE HOLE THE OLD RULE EXISTED TO PREVENT. Without a declared list, a layer goes quiet because
      somebody typed a zero in a row of twenty-three numbers — and nothing in the repository would say
      so. `TITLE_ONLY` and `LEVEL_ONLY` are lists for exactly this reason and this is the third.
    */
    broke: 'the closure undeclared, so a layer can go silent because somebody typed a zero',
    guard: 'opens a layer at every step and never opens one twice',
    edit: {
      path: 'src/content/music.ts',
      find: "export const RUNG_CLOSES: Partial<Record<MusicLevel, readonly MusicLayer[]>> = {\n  surge: ['call', 'arp'],\n  approach: ['groove', 'hook'],\n};",
      replace: 'export const RUNG_CLOSES: Partial<Record<MusicLevel, readonly MusicLayer[]>> = {};',
    },
  },
  {
    decision: '0120',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ A RULE THAT HAS STOPPED DESCRIBING THE MUSIC, which is what
      `docs/decisions/0113-there-is-one-composition-and-seven-levels.md` found seven decisions of. A
      name left in this list after the gain was put back reads as a section boundary that does not
      happen — and it would be invisible, because the arrangement is correct either way.
    */
    broke: 'a rung declared to close something it plays, so the list has stopped describing the piece',
    guard: 'opens a layer at every step and never opens one twice',
    edit: {
      path: 'src/content/music.ts',
      find: "  approach: ['groove', 'hook'],\n};",
      replace: "  approach: ['groove', 'hook', 'toll'],\n};",
    },
  },
  {
    decision: '0120',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE PIECE THINNING OUT, which is the way this rule could undo what 0102 bought. A section
      boundary made by taking things away is not the ask: *"backgroundy, then an increased beat and
      bass leading into the boss fight, then really pumping"* is a piece getting BIGGER, and a rung
      that subtracts on the way up sells one of the four climbs back.
    */
    broke: 'a rung that closes a layer and opens nothing, so the level gets thinner on the way up',
    guard: 'opens a layer at every step and never opens one twice',
    edit: {
      path: 'src/content/music.ts',
      find:
        "  surge: { drone: 0.33, bass: 0, beat: 0, sub: 1.04, engine: 1, perc: 0.82, chords: 0.86, groove: 0.94, arp: 0, ride: 0.68, call: 0, hook: 0.74, drive: 0.78, toll: 0, crash: 0.9, dread: 0, lead: 0.78, counter: 1.05, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.75, auraFast: 0.55 },",
      replace:
        "  surge: { drone: 0.33, bass: 0, beat: 0, sub: 1.04, engine: 1, perc: 0.82, chords: 0.86, groove: 0.94, arp: 0.7, ride: 0.68, call: 0, hook: 0.74, drive: 0, toll: 0, crash: 0, dread: 0, lead: 0.78, counter: 0, stomp: 0, frenzy: 0, wraith: 0, auraSlow: 0.75, auraFast: 0.55 },",
    },
  },
];
