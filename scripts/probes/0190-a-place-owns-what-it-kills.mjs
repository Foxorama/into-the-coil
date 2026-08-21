// The breaks behind docs/decisions/0190-a-place-owns-what-it-kills.md.
//
// ⚠️ THE MATERIAL HAS NO BREAK AND 0019 ASKS THAT BE SAID. *What a Saurian enemy death sounds like*
// is authoring, and docs/decisions/0161-the-shape-of-a-level-is-not-guarded.md refuses a threshold on
// musical shape. What IS guarded is the mechanism under it: the route, the bake and the line between
// what a place owns and what the ship does — and those are the three below.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0190',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE ROUTE IGNORING THE PLACE, WHICH IS THE ONE FAILURE NOTHING ELSE SEES. Every other
      assertion in this decision reads the TABLE — `cuedBy` walks `THEMES[theme].cues`, the empty
      check walks it, and the widened cue guards in tests/sound.test.ts would happily measure the
      base's explosion seven times over and pass. A place would state its own enemy death, the
      dashboard would list it, the decision would describe it, and the player would hear the base
      composition.

      ⚠️ IT IS 0162's OWN LESSON IN A THIRD TABLE — *"not a guard that cannot fail, but a code path
      nothing can drive"* — and the assertion it reddens exists for exactly this probe to hit.
    */
    broke: 'the cue lookup ignoring the place, so a level states its own death and does not get it',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: a cue a place states is the cue the place gets',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return THEMES[theme].cues?.[kind] ?? CUES[kind].layers;',
      replace: '  return CUES[kind].layers;',
    },
  },
  {
    decision: '0190',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE BOUNDARY BAKE LEAVING THE CUES BEHIND. `cueLayersOf` would still answer correctly, every
      content guard would stay green, and the game would swap the soundtrack at a level break while
      going on playing the previous place's enemy deaths — for the rest of the run, because nothing
      else ever calls `setCues`.

      ⚠️ A SEPARATE CLAIM FROM THE ROUTE ABOVE, AND THE REASON IS THE SEAM. One is *the table is
      consulted*; this is *the answer reaches the speaker*. docs/decisions/0126-the-dashboard-is-the-instrument.md
      is the record of what it costs to have those two disagree.
    */
    broke: 'the place’s cues left out of the boundary bake, so the level swaps its music and not its deaths',
    guard: '0190 — AND THE BOUNDARY BAKE HANDS OVER THE PLACE’S OWN CUES, sharing the rest',
    edit: {
      path: 'src/app/sound.ts',
      find: '  for (const kind of cuedBy(theme)) {',
      replace: '  for (const kind of [] as CueKind[]) {',
    },
  },
  {
    decision: '0190',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ THE LINE BETWEEN WHAT A PLACE OWNS AND WHAT THE SHIP DOES, RUBBED OUT. `PLACE_CUES` is seven
      of fourteen and the other seven are the player's: a biome that re-voiced `pulse` would make the
      one instrument carried between every place into a property of the place, which
      docs/decisions/0093-the-gun-is-on-the-grid.md and
      docs/decisions/0104-the-gun-plays-a-figure.md both assume never happens.

      ⚠️ IT IS THE PLAUSIBLE MISTAKE RATHER THAN A VANDALISM. A hand giving Saurian Belt its own
      everything is one more key in a table that already has two, and nothing about writing it looks
      wrong.
    */
    broke: 'a place re-voicing the ship’s own gun, so the player’s pulse changes with the biome',
    guard: 'THE RULE: a place may only re-voice a cue that belongs to something the level owns',
    edit: {
      path: 'src/content/saurian.ts',
      find: 'export const SAURIAN_CUES: Partial<Record<CueKind, readonly CueLayer[]>> = {',
      replace:
        'export const SAURIAN_CUES: Partial<Record<CueKind, readonly CueLayer[]>> = {\n' +
        "  pulse: [{ wave: 'saw', from: 900, to: 200, seconds: 0.05, gain: 0.4, attack: 0.001, curve: 5 }],",
    },
  },
];
