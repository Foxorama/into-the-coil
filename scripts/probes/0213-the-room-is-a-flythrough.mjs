// The breaks behind docs/decisions/0213-the-room-is-a-flythrough.md.
//
// ⚠️ THE FIRST IS THE DEFECT THAT SHIPPED, PUT BACK. 0212 gave the music room a moving camera over a
// screen that does not dim, and the field it moved over was the twelve bodies seedField deals at
// boot "so the first frame is not empty". Every screen before it either dimmed over them or spawned
// past them, so nobody had ever watched them leave. Reported: "a bunch of enemies showing that
// scroll off-screen and then there's no enemies at all showing again."
//
// ⚠️ AND THE REST ARE THINGS ONLY A PICTURE OR A PURE FUNCTION CAN SEE. A ship outside the lane, a
// field that empties over two minutes, a weave that repeats — the model is content with all three.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0213',
    suite: 'tests/room.browser.test.ts',
    /*
      ⚠️ NOT SWEEPING LOOKS LIKE THE CONSERVATIVE CHOICE. The pools belong to a run, the room is a
      menu, and leaving them alone is what a careful reader would do — which is exactly why the
      report arrived. The room is the only screen that shows the field without stepping it.
    */
    broke: 'the room opening on the boot field again, so a dozen enemies drift off and nothing follows',
    guard: 'opens on an empty lane, and keeps something in it for a whole walk',
    edit: {
      path: 'src/app/mount.ts',
      find: '    motes = makeMotes(makeRng(\'music-room\').stream(\'motes\'));',
      replace: '    motes = [];',
    },
  },
  {
    decision: '0213',
    suite: 'tests/attract.test.ts',
    /*
      ⚠️ THE ONE NUMBER IN THE WEAVE THAT IS EASY TO RAISE AND HARD TO CHECK. A bigger sweep is more
      fun right up to the point where the ship is flying through the wall 0074 draws, and no picture
      of one frame shows it — the ship is only outside the lane at the extremes of a shape that takes
      twelve seconds to get there.
    */
    broke: 'the weave widened past the lane, so the ship flies through the wall at its extremes',
    guard: 'keeps the ship inside the lane for every position of every walk',
    edit: {
      path: 'src/app/attract.ts',
      find: 'const WEAVE_REACH = 35;',
      replace: 'const WEAVE_REACH = 52;',
    },
  },
  {
    decision: '0213',
    suite: 'tests/attract.test.ts',
    /*
      ⚠️ ONE SINE IS THE OBVIOUS SIMPLIFICATION AND IT IS WHY THERE ARE TWO. A single wavelength is a
      correct-looking weave that returns to the same place every twelve seconds, which a listener
      sitting with this screen for three minutes reads as a loop. Nothing about one frame differs.
    */
    broke: 'the weave down to one sine, so the ship flies the same twelve seconds for ever',
    guard: 'does not repeat itself inside a walk',
    edit: {
      path: 'src/app/attract.ts',
      find: 'const WEAVE_SHARE = 0.74;',
      replace: 'const WEAVE_SHARE = 1;',
    },
  },
  {
    decision: '0213',
    suite: 'tests/attract.test.ts',
    /*
      ⚠️ THE WRAP IS WHAT MAKES A FIXED POOL AN ENDLESS FIELD, and dropping it reads as removing an
      unnecessary modulo — a mote's position is already a function of the camera, so why fold it. The
      answer is that the field empties out over two minutes, which is the reported defect exactly.
    */
    broke: 'the dust no longer wrapped into the band, so the field empties out as the walk goes on',
    guard: 'never empties, at any point of any walk',
    edit: {
      path: 'src/app/attract.ts',
      find: '  return from + (((raw - from) % MOTE_BAND) + MOTE_BAND) % MOTE_BAND;',
      replace: '  return raw;',
    },
  },
  {
    decision: '0213',
    suite: 'tests/attract.test.ts',
    /*
      ⚠️ A FLAT FIELD IS A FIELD, AND THAT IS THE POINT. Every mote at one depth still drifts, still
      wraps and still stays in the lane; what it loses is the only depth an entity can have here,
      because src/render/surface.ts blits everything at one scale.
    */
    broke: 'every mote on one depth, so the dust is a flat sheet rather than a field',
    guard: 'gives the field depth',
    edit: {
      path: 'src/app/attract.ts',
      find: '      depth: 0.12 + (i / ATTRACT_MOTES) * 0.66,',
      replace: '      depth: 0.4,',
    },
  },
];
