// One pilot a level — docs/decisions/0258-one-pilot-a-level.md
//
// Every guard 0258 adds, broken on purpose. `node scripts/prove-guard.mjs 0258`.
//
// ⚠️ Four of these restore what SHIPPED from 0073 and 0111 — a hunting lancer, a stalking harrow,
// an aiming fish, a looper that turns on the ship — which is what a probe is for.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0258',
    suite: 'tests/pilot.test.ts',
    // 0073's lancer put back: a shared kind that hunts, in every level.
    broke: 'the lancer hunting again, so every level has two pilots',
    guard: 'THE REPORTED ONE: in every level, the only kind that reacts',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    attack: { kind: 'spray', shots: 1, spread: 0 },\n    motion: { kind: 'weave', amplitude: 10, wavelength: 110 },",
      replace: "    attack: { kind: 'spray', shots: 1, spread: 0 },\n    motion: { kind: 'hunt', agility: 0.35 },",
    },
  },
  {
    decision: '0258',
    suite: 'tests/pilot.test.ts',
    // The picket back on its line: the Approach with no pilot at all.
    broke: 'the picket holding its line again, so the Approach has no pilot',
    guard: 'and every signature reacts',
    edit: {
      path: 'src/content/enemies.ts',
      find: "    attack: { kind: 'spray', shots: 2, spread: 0.55 },\n    motion: { kind: 'hunt', agility: 0.35 },",
      replace: "    attack: { kind: 'spray', shots: 2, spread: 0.55 },\n    motion: { kind: 'drift', roam: 0.2 },",
    },
  },
  {
    decision: '0258',
    suite: 'tests/pilot.test.ts',
    // 0111's harrow put back: a mid-boss that stalks.
    broke: 'the harrow stalking again',
    guard: 'THE MID-BOSSES: every one flies a pattern',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    move: { kind: 'bob', amplitude: 22, wavelength: 140, rear: 0 },\n    attack: { kind: 'spray' },",
      replace: "    move: { kind: 'stalk', agility: 0.24 },\n    attack: { kind: 'spray' },",
    },
  },
  /*
    ⚠️ **NO PROBE FOR *a boss aiming again*, and the reason is worth a line.** The `aimed` arm is
    deleted from `BossAttack`, so the break does not compile — which the harness reports as STILL
    GREEN, 0019's own trap. The type is the guard, and `tests/level.test.ts` holds that every arm
    left in the union is flown.
  */
  {
    decision: '0258',
    suite: 'tests/pilot.test.ts',
    // The frost ship stalking too: two end bosses reacting, which is the report.
    broke: 'the frost ship stalking as well as the fish',
    guard: 'among the end bosses exactly one stalks',
    edit: {
      path: 'src/content/bosses.ts',
      find: "    move: { kind: 'patrol' },\n    attack: { kind: 'wall', gap: 10 },",
      replace: "    move: { kind: 'stalk', agility: 0.18 },\n    attack: { kind: 'wall', gap: 10 },",
    },
  },
  {
    decision: '0258',
    suite: 'tests/pilot.test.ts',
    // The fish on a patrol as well: no boss reacts, and the fight is weather.
    broke: 'the fish on a patrol, so no boss reacts to the player at all',
    guard: 'among the end bosses exactly one stalks',
    edit: {
      path: 'src/content/bosses.ts',
      // ⚠️ Re-anchored by 0262, which gave the fish the rake, and by 0317, which wrote a comment between
      // the flight and the fan.
      find: "    move: { kind: 'stalk', agility: 0.22 },\n    // An arc since 0317",
      replace: "    move: { kind: 'patrol' },\n    // An arc since 0317",
    },
  },
  {
    decision: '0258',
    suite: 'tests/pilot.test.ts',
    // 0073's loop put back: the turn on the ship's position rather than on the box's end.
    broke: 'the looper turning where the ship is rather than at the back of the box',
    guard: 'THE LOOP: a charger turns at the back of the player’s box',
    edit: {
      path: 'src/app/frame.ts',
      find: '        if (outward ? inView >= PLAYER_LEAD - LOOP_TURN_ROOM : inView <= PLAYER_ALONG_MARGIN + LOOP_TURN_ROOM) {',
      replace: '        if (outward ? inView >= PLAYER_LEAD - LOOP_TURN_ROOM : e.along <= ship.along) {',
    },
  },
];
