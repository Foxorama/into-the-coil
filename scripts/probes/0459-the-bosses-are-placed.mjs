// The bosses are placed — docs/decisions/0459-the-bosses-are-placed.md
//
// Every guard 0459 adds, broken on purpose. `node scripts/prove-guard.mjs 0459`.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0459',
    suite: 'tests/serpent.test.ts',
    // The roots run the whole length of the screen, which is a corridor and not a frame.
    broke: 'the serpent’s roots laid from behind the camera, as the stone is',
    guard: 'THE ASK: the screen stops, and the roots frame its far side',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    room: { stand: 60, settle: 150, mouth: -100, wall: SPRITE.rootWall, opens: 90 },',
      replace: '    room: { stand: 60, settle: 150, mouth: 40, wall: SPRITE.rootWall, opens: 90 },',
    },
  },
  {
    decision: '0459',
    suite: 'tests/serpent.test.ts',
    // The defect the room found: the bob on the camera's step, which is nought at rest.
    broke: 'the bob keeping time on the camera, so the serpent freezes when the screen does',
    guard: 'and the animal keeps moving while the screen is still',
    edit: {
      path: 'src/app/boss.ts',
      find: '      const rate = (TAU * pace) / wavelength;',
      replace: '      const rate = (TAU * scrollPerStep) / wavelength;\n      void pace;',
    },
  },
  {
    decision: '0459',
    suite: 'tests/serpent.test.ts',
    // A room with walls and no wreck that never opens: the camera carries the player into the roots.
    broke: 'the far roots left shut when the serpent dies',
    guard: 'and when it dies the far roots part',
    edit: {
      path: 'src/app/frame.ts',
      find: '    if (room === null || w.room === null) return;\n    if (w.roomOpen < room.opens) w.roomOpen++;',
      replace: '    return;\n    if (w.roomOpen < room!.opens) w.roomOpen++;',
    },
  },
  {
    decision: '0459',
    suite: 'tests/hydra.test.ts',
    // The fight scrolling on through the hydra, as it did before.
    broke: 'the room taken off the hydra’s row',
    guard: 'THE ASK: the camera comes to rest for the fight',
    edit: {
      path: 'src/content/bosses.ts',
      find: ' the hull every step, stays under it.\n    */\n    room: { stand: 60, settle: 150, mouth: 40, wall: null, opens: 0 },',
      replace: ' the hull every step, stays under it.\n    */\n    room: null,',
    },
  },
  {
    decision: '0459',
    suite: 'tests/hydra.test.ts',
    // Where it stood when it was reported as too far in.
    broke: 'the hydra put back at 154',
    guard: 'THE ASK: the camera comes to rest for the fight',
    edit: {
      path: 'src/content/bosses.ts',
      find: '    station: 178,',
      replace: '    station: 154,',
    },
  },
  {
    decision: '0459',
    suite: 'tests/quetzal.test.ts',
    // Every link stroked after the scene again, which is the report: a line laid over the bird.
    broke: 'the beams left out of the pass under the boss and stroked over everything',
    guard: 'THE REPORTED ONE: every beam is stroked before the hull is blitted',
    edit: {
      path: 'src/render/scene.ts',
      find: '    if (beams !== null && (e.kind === BEAM_BOLT_KIND) !== beams) continue;',
      replace: '    if (beams === true) continue;',
    },
  },
  {
    decision: '0459',
    suite: 'tests/frost.test.ts',
    // The cold that does not pulse: the row's rest, every step.
    broke: 'the cold held at its rest and never swelling',
    guard: 'THE PULSE, DRIVEN',
    edit: {
      path: 'src/content/bosses.ts',
      find: 'export function chillRadiusAt(chill: Chill, clock: number): number {\n  const t = clock % chill.pulse;',
      replace: 'export function chillRadiusAt(chill: Chill, clock: number): number {\n  if (clock >= 0) return chill.radius;\n  const t = clock % chill.pulse;',
    },
  },
  {
    decision: '0459',
    suite: 'tests/frost.test.ts',
    // The drawing pulses and the slow does not: the picture promising a cold that is not there.
    broke: 'the slow read off the row’s rest while the field is drawn at the pulse',
    guard: 'THE EFFECT, WHERE THE PLAYER IS',
    edit: {
      path: 'src/app/frame.ts',
      find: '  const radius = w.chillRadius;\n  if (radius <= 0 ||',
      replace: '  const radius = chill.radius;\n  if (radius <= 0 ||',
    },
  },
  {
    decision: '0459',
    suite: 'tests/frost.test.ts',
    // The first draft's strobe: six flashes a second over most of the screen.
    broke: 'the flicker strobing every five steps',
    guard: 'THE ASKED-FOR ONE, IN NUMBERS',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      flicker: 48,\n      blink: 12,',
      replace: '      flicker: 48,\n      blink: 5,',
    },
  },
  {
    decision: '0459',
    suite: 'tests/frost.test.ts',
    // The cold at rest where it was before the ask.
    broke: 'the cold at rest put back at 38',
    guard: 'THE ASKED-FOR ONE, IN NUMBERS',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      radius: 46,\n      reach: 108,',
      replace: '      radius: 38,\n      reach: 108,',
    },
  },
  {
    decision: '0459',
    suite: 'tests/frost.test.ts',
    // The first draft's reach, whose top covered where a ship starts.
    broke: 'the cold reaching 120 at its top',
    guard: 'THE ASKED-FOR ONE, IN NUMBERS',
    edit: {
      path: 'src/content/bosses.ts',
      find: '      radius: 46,\n      reach: 108,',
      replace: '      radius: 46,\n      reach: 120,',
    },
  },
  {
    decision: '0459',
    suite: 'tests/medusa.test.ts',
    // The glass at a fifth, as it was reported.
    broke: 'the jellyfish’s glass back at a fifth',
    guard: 'THE JELLYFISH: its glass',
    edit: {
      path: 'src/render/bake.ts',
      find: 'const MEDUSA_GLASS = 0.5;',
      replace: 'const MEDUSA_GLASS = 0.22;',
    },
  },
  {
    decision: '0459',
    suite: 'tests/medusa.test.ts',
    // The enemy pink, which is the colour of the Black Heart's own light.
    broke: 'the Black Heart’s bolts back in the enemy ink',
    guard: 'THE LIGHTNING: a hostile bolt here',
    edit: {
      path: 'src/content/themes.ts',
      find: "    bolt: '#ffe84a',",
      replace: '    bolt: null,',
    },
  },
];
