// The breaks behind docs/decisions/0222-the-background-is-not-black.md.
//
// ⚠️ TWO ASKS THAT ARE ONE TRADE. *"We can also highlight and brighten important objects while also
// filling the background with detail… a plain black background is a plain boring game."* Detail is
// bought with cover, cover costs contrast, and the only way to pay for it is to make the things that
// matter louder. Neither half is worth guessing at, which is why this decision starts with an
// instrument (`scripts/weigh-sky.mjs`) and not with a drawing.
//
// ⚠️ AND `cloudCover` HAD ONLY EVER COUNTED CLOUDS. 0220 and 0221 both wrote down that structure and
// ground go uncounted and neither closed it, because neither needed the headroom. Measured the moment
// something did: **Rime Shelf was under the floor at 2.67:1**, shipped the day before by the decision
// that made its blowing ice lit.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0222',
    suite: 'tests/places.test.ts',
    /*
      ⚠️ THE HOLE THE WHOLE PASS TURNED ON. 0203's band — nothing the sky draws between a bullet and
      twice the largest body — has only ever been checked against landmarks and the star fields, and
      `STRUCTURE_OF` arrived a year of decisions later drawing shapes nobody measured against it.
      Saurian Belt's belt rocks were 2.4 to 8 units across for four decisions, and their own comment
      claimed the polygon was chosen *because* of that band.
    */
    broke: 'a place given body-sized debris again, which is what the band exists to refuse',
    guard: 'no compact structure mark is the size of something that can kill you',
    edit: {
      path: 'src/render/bake.ts',
      /*
        ⚠️ Re-anchored by 0347, which took Saurian Belt's specks down — the only compact marks in the
        game, so there is no size left to turn up. The break is the debris itself coming back: one
        rock four units square in the belt's sky, squarely inside the band.
      */
      find: '  saurian: () => {\n    const out: StructureMark[] = [];',
      replace:
        '  saurian: (size) => {\n    const out: StructureMark[] = [\n' +
        '      { points: [[0, 0], [size * 0.02, 0], [size * 0.02, size * 0.02], [0, size * 0.02]], width: 0, alpha: 0.6, crosses: false, taper: false, lit: false },\n' +
        '    ];',
    },
  },
  /*
    ⚠️ TWO PROBES LEFT WITH THEIR GUARDS — docs/decisions/0342-the-hulks-come-out.md. One broke
    *"something is actually IN the far half of it"* by taking the hulks out, which is now simply what
    the game does on purpose; the other dropped a hulk's rim, and there is no hulk to drop it from.
  */
  {
    decision: '0222',
    suite: 'tests/sky.test.ts',
    /*
      ⚠️ THE REGRESSION THIS PASS FOUND IN ITS OWN PREDECESSOR. 0221 made Rime Shelf's blowing ice lit
      — correctly, because drawn dark it was black scratches over the palest sky in the game — and at
      0.5 alpha and up to 3.2 units wide it took the place to **2.67:1 against a floor of 3**. Nothing
      could see it: the contrast guard counted clouds, and this is structure.
    */
    /*
      ⚠️ THE BREAK IS THE CONTENT 0221 ACTUALLY SHIPPED, AND THAT IS NOT A STYLISTIC CHOICE. The first
      version emptied the mark list inside `skyCover` and came back **STILL GREEN** — correctly,
      because with the content fixed there is nothing for the count to catch. **A budget guard only
      fires when the budget is breached**, so the only honest break is the breach: Rime Shelf's blowing
      ice at the width and alpha it went out with, which reads 2.67:1 against a floor of 3 and which
      every guard in the repository called clear.
    */
    /*
      ⚠️ AND THE EXACT SHIPPED VALUES CAME BACK **STILL GREEN**, WHICH IS THE MOST USEFUL THING THIS
      PROBE FOUND. `0.006–0.016` at alpha 0.5 read 2.67:1 against the OLD `enemy`; against the
      brightened one it clears the floor comfortably. **The ink lift paid for the content that was
      failing** — which is the whole thesis of this decision demonstrated by a probe that refused to go
      red. The break therefore has to be a place genuinely overfilled, and *"make the blowing snow more
      visible"* is exactly the change an author reaches for on a place whose brief is *icy*.
    */
    broke: 'Rime Shelf’s blowing ice turned up until the sky is brighter than the game on it',
    guard: 'every ink clears the floor against the backdrop WITH EVERYTHING THE SKY DRAWS ON IT',
    edit: {
      path: 'src/render/bake.ts',
      find: '          width: rng.range(0.004, 0.008) * size,\n          alpha: 0.28,',
      replace: '          width: rng.range(0.012, 0.03) * size,\n          alpha: 0.8,',
    },
  },
];
