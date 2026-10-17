// The breaks behind docs/decisions/0611-the-keepers-stand-somewhere.md.
//
// ⚠️ Each is the reported defect or one a step from it: a keeper floating at the ship's height, one an
// arm's length over the lift, a bust drawn where a whole figure stands, two keepers drawn in one place, and
// two places whose pictures meet.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0611',
    suite: 'tests/stand.test.ts',
    broke: 'a keeper on the deck stood at the height the ship rides at, in the air — the reported float',
    guard: 'stands every keeper with their soles on the deck or the lift',
    edit: {
      path: 'src/render/port.ts',
      find: '    put(surface, view, PORT_SPRITE[row.about.figure], DOCK.ship + where.along, STAGE.deck + where.across - row.about.feet);',
      replace: '    put(surface, view, PORT_SPRITE[row.about.figure], DOCK.ship + where.along, DOCK.ride + where.across - row.about.feet);',
    },
  },
  {
    decision: '0611',
    suite: 'tests/stand.test.ts',
    broke: 'the keeper on the lift drawn a unit over its platform',
    guard: 'stands every keeper with their soles on the deck or the lift',
    edit: {
      path: 'src/render/port.ts',
      find: '    put(surface, view, PORT_SPRITE[row.about.figure], DOCK.lift + where.along, floor - row.about.feet);',
      replace: '    put(surface, view, PORT_SPRITE[row.about.figure], DOCK.lift + where.along, floor - 1 - row.about.feet);',
    },
  },
  {
    decision: '0611',
    suite: 'tests/stand.test.ts',
    broke: 'the counter figure — a bust — drawn at a place on the deck, as 0569 drew one at the ship',
    guard: 'draws each keeper where their spot says',
    edit: {
      path: 'src/render/port.ts',
      find: '    put(surface, view, PORT_SPRITE[row.about.figure], DOCK.ship + where.along,',
      replace: '    put(surface, view, PORT_SPRITE[row.figure], DOCK.ship + where.along,',
    },
  },
  {
    decision: '0611',
    suite: 'tests/stand.test.ts',
    broke: 'the draw after a run forgetting the places already taken, so two keepers can share one',
    guard: 'draws every keeper a different place after every run',
    edit: {
      path: 'src/content/keepers.ts',
      find: '    if (isDockPlace(at)) taken.push(at);',
      replace: '    void at;',
    },
  },
  {
    decision: '0611',
    suite: 'tests/stand.test.ts',
    broke: 'the place in front of the ship moved back beside the one behind it, so their pictures meet',
    guard: 'never draws two keepers whose pictures meet',
    edit: {
      path: 'src/content/keepers.ts',
      find: "  front: { floor: 'deck', along: 6, across: 14, drawn: 'over' },",
      replace: "  front: { floor: 'deck', along: -17, across: 3, drawn: 'over' },",
    },
  },
];
