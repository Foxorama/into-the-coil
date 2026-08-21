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
  {
    decision: '0191',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE PLACE'S OWN LEVEL DROPPED OUT OF THE PRODUCT. `trim` is the whole of how this level stops
      driving the bus into the clamp — 0.13% of samples at `surge` against a guard of 0.05% — without
      moving a single ratio the player drove. Taking it out is one `?? 1` and it is invisible in a
      diff of an expression that already has two of them.

      ⚠️ AND THE GUARD IT REDDENS IS IN THE UNIT A LISTENER IS IN — the share of samples pushed past
      full scale, which is heard as the mix flattening, rather than a model quantity defined in terms
      of the constant it guards. docs/decisions/0027-measure-the-picture-not-the-model.md.
    */
    broke: 'the place’s own level dropped out of the mix, so its balance drives the bus into the clamp',
    guard: 'and no theme at any rung drives the bus past full scale',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return (THEMES[theme].mix[layer] ?? 1) * (REBASE[theme][layer] ?? 1) * (THEMES[theme].trim ?? 1);',
      replace: '  return (THEMES[theme].mix[layer] ?? 1) * (REBASE[theme][layer] ?? 1);',
    },
  },
];
