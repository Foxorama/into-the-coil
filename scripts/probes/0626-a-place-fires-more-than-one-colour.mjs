// The breaks behind docs/decisions/0626-a-place-fires-more-than-one-colour.md.
//
// ⚠️ A place's raiders fire three inks, the bake draws each, the next place mostly fires another colour, every ink
// clears the floor on its own sky, none is its ship's or a thing that is always itself, and the duck holds no paint
// the place fires.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0626',
    suite: 'tests/foes.test.ts',
    broke: 'the bake drawing every bullet in the place’s one ink, as before the ask',
    guard: 'THE ASK, AS DRAWN',
    edit: {
      path: 'src/render/bake.ts',
      find: '(skin.shots?.[SHOT_OF_SPRITE.get(kind)!] ?? skin.shot)',
      replace: '(skin.shot)',
    },
  },
  {
    decision: '0626',
    suite: 'tests/foes.test.ts',
    broke: 'Ember Nebula mostly firing the hot pink again, one colour with The Approach’s crimson',
    guard: 'THE ASK, ACROSS LEVELS',
    edit: {
      path: 'src/content/themes.ts',
      find: "shot: '#5aff6a', shots: { lance: '#ff2f8f', flak: '#e8ff40' } },",
      replace: "shot: '#ff2f8f', shots: { lance: '#5aff6a', flak: '#e8ff40' } },",
    },
  },
  {
    decision: '0626',
    suite: 'tests/sky.test.ts',
    broke: 'The Saurian Belt firing its old red-orange, under the floor on its own sky',
    guard: 'every ink clears the floor against the backdrop WITH EVERYTHING THE SKY DRAWS ON IT',
    edit: {
      path: 'src/content/themes.ts',
      find: "shot: '#ff4fd8', shots: { lance: '#e8ff40', flak: '#ff6b8a' } },",
      replace: "shot: '#ff4d2e', shots: { lance: '#e8ff40', flak: '#ff6b8a' } },",
    },
  },
  {
    decision: '0626',
    suite: 'tests/foes.test.ts',
    broke: 'The Toxic Mire firing the lime of its own ships’ lit strips',
    guard: 'and no bullet a place fires is the ink of the ship firing it',
    edit: {
      path: 'src/content/themes.ts',
      find: "shots: { lance: '#ff40d8', flak: '#ff9ac8' } },",
      replace: "shots: { lance: '#ff40d8', flak: '#e6ff4a' } },",
    },
  },
  {
    decision: '0626',
    suite: 'tests/duck.test.ts',
    broke: 'the yellow paint held where the place fires lime',
    guard: 'no colour held in a place is the ink of a bullet that place fires',
    edit: {
      path: 'src/content/weapons.ts',
      find: "not: ['nebula', 'saurian', 'labyrinth', 'rime', 'core'] },",
      replace: "not: ['labyrinth'] },",
    },
  },
];
