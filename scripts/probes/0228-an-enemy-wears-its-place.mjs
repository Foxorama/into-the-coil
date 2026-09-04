// The breaks behind docs/decisions/0228-an-enemy-wears-its-place.md.
//
// ⚠️ NOTHING HERE BREAKS HOW A REPTILE LOOKS — docs/decisions/0192-a-guard-holds-an-invariant.md.
// Whether Saurian Belt's scales read as scales is judged on `scripts/shot-sheet.mjs`. What these
// break is what a skin may never be: the same as another place's, invisible on its own backdrop,
// mistakeable for the ship or a pickup, painted onto the palette that asked for none, or a motif
// that leaves the belly it was scattered over.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0228',
    suite: 'tests/foes.test.ts',
    /*
      ⚠️ TWO PLACES SKINNED ALIKE, which is the edit a hand makes copying a row to start a new place
      and never coming back — and it is exactly the report 0223 answered for the backdrops: *"they're
      still a solo colour."*
    */
    broke: 'a place given another place’s skin, so two levels send the same enemies',
    guard: 'THE REPORTED ONE: every place skins its enemies, and no two places skin them alike',
    edit: {
      path: 'src/content/themes.ts',
      find: "    foe: { hull: '#7f9a2e', plate: '#4a5c18', lit: '#e8d8a8', eye: '#ffb020' },",
      replace: "    foe: { hull: '#5c9ad0', plate: '#2a4a80', lit: '#d8f4ff', eye: '#ff5a7a' },",
    },
  },
  {
    decision: '0228',
    suite: 'tests/foes.test.ts',
    /*
      ⚠️ A HULL THE COLOUR OF ITS OWN SKY. Rime Shelf is the palest backdrop in the game, and a blue
      that reads on the void reads as nothing on it — this is the cell 0222 found Rime Shelf under
      the floor in, arriving on the enemies.
    */
    broke: 'Rime Shelf’s enemies painted a blue that vanishes into Rime Shelf’s sky',
    guard: 'and a skin’s hull is legible on its own backdrop',
    edit: {
      path: 'src/content/themes.ts',
      find: "    foe: { hull: '#5c9ad0', plate: '#2a4a80', lit: '#d8f4ff', eye: '#ff5a7a' },",
      replace: "    foe: { hull: '#2a4a68', plate: '#1a2a48', lit: '#d8f4ff', eye: '#ff5a7a' },",
    },
  },
  {
    decision: '0228',
    suite: 'tests/foes.test.ts',
    /*
      ⚠️ A HULL IN THE PICKUP'S OWN PALE GREEN. The Toxic Mire is green, so a green enemy is the
      obvious authoring — and `tests/palette.test.ts` names *enemy read as pickup* as the mistake
      that costs a life with a ship instead of a bullet.
    */
    broke: 'The Toxic Mire’s enemies painted the pickup’s own pale green',
    guard: 'and a skin’s hull is legible on its own backdrop and never reads as a pickup or the ship',
    edit: {
      path: 'src/content/themes.ts',
      find: "    foe: { hull: '#b85cd0', plate: '#5a2a70', lit: '#e6ff4a', eye: '#ffffff' },",
      replace: "    foe: { hull: '#c8f0c0', plate: '#5a2a70', lit: '#e6ff4a', eye: '#ffffff' },",
    },
  },
  {
    decision: '0228',
    suite: 'tests/foes.test.ts',
    /*
      ⚠️ THE SKIN HANDED TO EVERY PALETTE. `foeOf` reading the place's row and nothing else is the
      one-line simplification, and it paints a canopy and a lit strip onto the palette a player turned
      on to have neither — 0024's knob spent on scenery.
    */
    broke: 'the high-contrast palette given the place’s skin',
    guard: 'and the high-contrast palette gets the flat game, with no skin on anything',
    edit: {
      path: 'src/content/themes.ts',
      find: '  if (palette.glass === palette.space && palette.trim === palette.space) {',
      replace: '  if (false) {',
    },
  },
  {
    decision: '0228',
    suite: 'tests/accents.test.ts',
    /*
      ⚠️ A MOTIF SCATTERED WITHOUT ITS CLIP. The grid is laid over the belly's bounding box, so a mark
      kept without asking whether it fits lands on the hull's edge and past it — and, on the warden,
      in the hole. This is the reason the clip is a test and not a `clip()`: it can be taken away and
      the guard sees it go.
    */
    broke: 'a motif kept wherever the grid put it, so scales run off the hull and into its holes',
    guard: 'THE 0149 ONE: every solid mark on a body is inside its hull',
    edit: {
      path: 'src/render/bake.ts',
      find: 'function fits(belly: Belly, points: readonly Pt[]): boolean {\n  return points.every(([x, y]) => within(belly, x, y));',
      replace: 'function fits(belly: Belly, points: readonly Pt[]): boolean {\n  return points.length > 0 || within(belly, 0, 0);',
    },
  },
  {
    decision: '0228',
    suite: 'tests/foes.test.ts',
    /*
      ⚠️ ONE ENEMY LEFT UNPAINTED, which is what the charger — a needle five times longer than it is
      wide — invites: the arm that seals it and returns, exactly as it did before 0227.
    */
    broke: 'the charger sealed and left flat in every place',
    guard: 'and every enemy and boss is painted in the vivid palette, in every place',
    edit: {
      path: 'src/render/bake.ts',
      find: '      seal(ctx);\n      if (skin !== null) paintCharger(ctx, f, skin, theme);\n      return;',
      replace: '      seal(ctx);\n      return;',
    },
  },
];
