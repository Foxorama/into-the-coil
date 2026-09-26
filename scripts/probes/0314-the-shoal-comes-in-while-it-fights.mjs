// The shoal comes in while it fights — docs/decisions/0314-the-shoal-comes-in-while-it-fights.md
//
// Every guard 0314 adds, broken on purpose. `node scripts/prove-guard.mjs 0314`.
//
// ⚠️ FIVE OF SEVEN PROBES WENT WITH THE FEED — docs/decisions/0373-the-fish-spits-its-adds.md. The
// minnow's swim for the fish, the eating, the ceiling on the feed and the shoal's side all held a
// mechanism 0373 deleted; a probe with no guard is a stranded probe, and the harness says so before
// anything runs. What is left is the half of 0314 that survived: an escort is a horde called WHILE
// the boss fights, on a clock of its own.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ THE ESCORT CALLING NOBODY, which is the shape the phase had before this decision minus the
      summons: the fish throws and the field stays empty. `standing: 0` rather than a huge `every`,
      because the first call of a phase lands a gape after it opens — a gap nobody reaches is a thing
      this mechanism deliberately does not have.
    */
    broke: 'the escort keeping nobody standing, so the phase throws into an empty field',
    guard: 'THE ASKED-FOR ONE: the adds come in WHILE it is throwing',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0317 onto the FIRST escorted phase, by 0373, which spits it from the mouth,
      // and by 0380, which made the first stage the rake with the kites.
      find: "escort: { enemy: 'kite', count: 3, formation: 'vee', from: 'mouth', standing: 5, every: 150 } },",
      replace: "escort: { enemy: 'kite', count: 3, formation: 'vee', from: 'mouth', standing: 0, every: 150 } },",
    },
  },
  {
    decision: '0314',
    suite: 'tests/volans.test.ts',
    /*
      ⚠️ AND THE OTHER HALF OF THE SAME CLAIM: the phase back to a summons, with the escort still on
      it. Adds arrive, so *did anything come in* is greener than ever — and the volley that called them
      throws nothing, which is the whole of what was reported.
    */
    broke: 'the escorted phase made a summons again, so the adds ARE the attack after all',
    guard: 'THE ASKED-FOR ONE: the adds come in WHILE it is throwing',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0317 onto the FIRST escorted phase, which the guard reads: it is the breaker
      // and its shoal now, where it was the rake and its kites.
      // And by 0380: the first escorted stage is the opening rake now.
      find: "patrolScale: 1.3, stance: { kind: 'volley' }, look: KINDLED, shot: null, attack: null, escort:",
      replace: "patrolScale: 1.3, stance: { kind: 'volley' }, look: KINDLED, shot: null, attack: { kind: 'summon', enemy: 'kite', count: 3, formation: 'vee', from: 'mouth', standing: 6 }, escort:",
    },
  },
];
