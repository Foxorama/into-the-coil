// The breaks behind docs/decisions/0136-the-place-has-a-room-and-an-arc.md.
//
// ⚠️ THE FIRST IS THE REPORTED DEFECT AS A NUMBER. "It still needs more reverb" was said about a place
// that had none at all, and the failure mode a later hand will reintroduce is not *no room* — it is a
// room quiet enough to be inaudible while the table still says `air: 0.9`. A wet control that does
// nothing looks exactly like one that works.
//
// ⚠️ THE SECOND IS THE ONE THAT WOULD NOT SOUND LIKE A BUG. A reverb whose feedback reaches unity
// does not crash; it slowly fills the loop until every gap is a wash and the buffer clips, and it does
// it only on the layers with the most air. That is why the guard measures decay and not just presence.
//
// ⚠️ THE THIRD IS THE ARC. "Up, Up, Up, drop, sharp Down" survives only while `hook` is loud enough at
// push and surge to be missed at the approach — one number, and nothing else in the place says so.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0136',
    suite: 'tests/themes.test.ts',
    broke: 'a room quiet enough to be inaudible, which is the reported defect wearing a control',
    guard: '0136 — A ROOM ADDS ENERGY AND NOT PEAK, which is what makes it a room',
    edit: {
      path: 'src/app/music.ts',
      find: 'const ROOM_SCALE = 1 / 5;',
      replace: 'const ROOM_SCALE = 1 / 60;',
    },
  },
  {
    decision: '0136',
    suite: 'tests/themes.test.ts',
    broke: 'a room whose feedback does not decay, so the loop fills with wash and clips',
    guard: '0136 — A ROOM ADDS ENERGY AND NOT PEAK, which is what makes it a room',
    edit: {
      path: 'src/app/music.ts',
      find: '  [0.0717, 0.84],',
      replace: '  [0.0717, 1.02],',
    },
  },
  {
    decision: '0136',
    suite: 'tests/themes.test.ts',
    broke: 'the organ’s top rank pulled back, so the climb flattens and the approach stops being a drop',
    guard: '0136 — EMBER NEBULA CLIMBS INTO THE SURGE AND DROPS INTO THE FIGHT',
    edit: {
      path: 'src/content/themes.ts',
      find: '      hook: 1.35,',
      replace: '      hook: 0.5,',
    },
  },
];
