// The skull is longer — docs/decisions/0288-the-skull-is-longer.md
//
// Every guard 0288 adds, broken on purpose. `node scripts/prove-guard.mjs 0288`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0288',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **THE STATE OF `main` BEFORE THIS DECISION: A HURTBOX SIZED FOR THE OLD SKULL.** The head is
      drawn twenty per cent larger and the disc is not, so its edges are a place the picture says HIT
      and the model says miss — docs/decisions/0036, whose own finding is that this class gets
      reported as a collision bug that does not exist.
    */
    broke: 'the hurtbox left at the size the smaller skull had, so the head has edges a shot passes through',
    guard: 'the serpent’s skull is wider than its neck',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    radius: 8.4,',
      replace: '    radius: 7,',
    },
  },
  {
    decision: '0288',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ **AND THE OTHER END OF IT, WHICH IS THE HALF A ONE-SIDED FLOOR WOULD MISS.** A hurtbox bigger
      than the head is long takes hits off the animal's own nose — the same disagreement between the
      picture and the model, pointed the other way, and the reason the bound is the skull's own two
      axes rather than a floor.
    */
    broke: 'the hurtbox grown past the length of the drawn skull, so the head eats shots off its nose',
    guard: 'the serpent’s skull is wider than its neck',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    radius: 8.4,',
      replace: '    radius: 12,',
    },
  },
];
