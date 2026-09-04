// The breaks behind docs/decisions/0191-a-place-sits-somewhere.md.
//
// ⚠️ THE REVERT HAS NO PROBE AND THAT IS docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md.
// *Saurian Belt opens `bass` and not `groove`* is an arrangement, and re-opening `groove` goes green
// because it is a legal shape that a place is allowed to have. What is guarded is the two mechanisms
// that made the wrong one the only writable one.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0191',
    suite: 'tests/arrangement.test.ts',
    /*
      ⚠️ THE ARRANGEMENT BACK ON THE SHARED ROW, WHICH IS THE DEFECT THAT COST A LEVEL. With this
      read restored, a layer only one place opens can never be given a role — so `bass` and `beat`
      fall outside docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md, and the only way to
      keep this suite green is to move the sound into a slot every place already opens. That is
      exactly what 0189 did, and the player's verdict on it was *"back to the sameness of the previous
      levels."*

      ⚠️ IT REDDENS ON THE PLACE'S OWN DATA RATHER THAN ON A FIXTURE, which is what makes it a real
      break: Saurian Belt opens `bass` at five rungs and the shared row opens it at none.
    */
    broke: 'the arrangement asking the shared ladder again, so a layer one place opens can have no role',
    guard: 'names every layer the rung actually sounds, exactly once',
    edit: {
      path: 'tests/arrangement.test.ts',
      find:
        '        const openSomewhere =\n' +
        '          MUSIC_LADDER[rung][layer] > 0 || THEME_KINDS.some((theme) => rungOf(theme, rung, layer) > 0);',
      replace: '        const openSomewhere = MUSIC_LADDER[rung][layer] > 0;',
    },
  },
  {
    decision: '0191',
    suite: 'tests/arrangement.test.ts',
    /*
      ⚠️ THE LEAD CHECKED AGAINST THE SHARED ROW, which is the same defect one assertion down and
      fails in BOTH directions: it refuses Saurian Belt the right to follow `bass` — the layer that
      makes it different — and it would pass a place that had closed its own lead, because the shared
      row would answer for a layer nobody sounds there.
    */
    broke: 'a place’s lead checked against the shared ladder, so it may not follow what only it opens',
    guard: '0155 — A PLACE FOLLOWS ITS OWN INSTRUMENT, and it is still exactly one',
    edit: {
      path: 'tests/arrangement.test.ts',
      find: '          rungOf(theme, level, lead),',
      replace: '          MUSIC_LADDER[level][lead],',
    },
  },
  /*
    ── A SECOND PROBE STOOD HERE AND 0226 RETIRED IT ───────────────────────────────────────────────

    ⚠️ "THE PLACE'S OWN LEVEL DROPPED OUT OF THE MIX" took `trim` out of `mixOf` and expected Saurian
    Belt's `surge` to drive the bus past full scale on 0.13% of samples, as it did the day 0191 was
    written. Under docs/decisions/0226-the-level-holds-one-loudness.md that rung is held 1.3 dB down
    and its loudest sample reaches **0.969** of full scale with the trim in; without it the share past
    the clamp stays under the guard's 0.05%, and `npm run prove` reported STILL GREEN. The trim's
    claim survives — *this place is loud*, a hand's level over the whole place — but its role as the
    thing between Saurian Belt and the clamp is the hold's now, and a break the tree cannot see is
    what docs/decisions/0005-a-guard-must-be-seen-to-fail.md says not to keep.
  */
];
