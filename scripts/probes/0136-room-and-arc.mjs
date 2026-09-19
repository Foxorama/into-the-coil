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
    broke: 'the hymn sung at the organ’s own height, so the opening is already where the push goes',
    guard: '0136 — EMBER NEBULA CLIMBS INTO THE SURGE AND DROPS INTO THE FIGHT',
    /*
      ⚠️ ANCHORED ON THE VOICE AND NOT ON THE MIX — docs/decisions/0147-a-place-is-a-balance.md. It
      was pinned to `hook: 1.269` and went orphaned the first time the place was re-balanced. A
      climb is a RATIO, so it flattens as readily from below as from above: the hymn `run` opens on
      is sung three octaves up, and the push it climbs into is already where it started. Not one note
      of either is removed.

      ⚠️ AND MOVING THE STARLIGHT VOICE DOWN WAS TRIED FIRST AND DID NOTHING. `pitchOf` weights a
      layer by its GAIN and not by how many notes it plays, so four stabs a phrase move the mean by
      almost nothing; `call` is a whole layer of the opening. A break has to be the size of the thing
      it is breaking.
    */
    edit: {
      path: 'src/content/nebula.ts',
      find: '      steps: HYMN,\n      pitched: true,\n      perBeat: 1,\n      octave: 2,',
      replace: '      steps: HYMN,\n      pitched: true,\n      perBeat: 1,\n      octave: 5,',
    },
  },
  /*
    ⚠️ THE SET ARITHMETIC, WHICH HAD ONLY EVER BEEN GREEN. `bakedBy` is `revoicedBy` plus the two ways
    a place's buffer differs without its notes doing — a room, and an onset. Drop either and the place
    shares the base's DRY array, so the change never arrives: no crash, no red, just a room nobody
    hears or a chord that still swells. It reads as obviously correct, which is the kind 0005 is about.

    ⚠️ **AND ONLY THE ONSET HALF CAN BE BROKEN TODAY, WHICH `npm run prove` SAID AND THE GUARD'S OWN
    COMMENT ALREADY KNEW.** A probe dropping `withAir` was written here and came back STILL GREEN,
    because *"Ember Nebula gives air only to layers it also re-voices"* — every layer with a room is in
    the set through `revoicedBy` regardless, so removing its other route changes nothing. Breaking it
    needs TWO edits: a place given air on a layer it does not re-voice, AND the term removed. A probe
    is one edit, so the air half stays unproven and this says so rather than carrying a probe that
    passes. **It becomes breakable the day a place states `air` for a layer of the base composition**,
    which is the case 0136 wrote the term for.
  */
  {
    decision: '0136',
    suite: 'tests/themes.test.ts',
    broke: 'a place that strikes a layer baking the base’s dry one, so the chords still swell',
    guard: '0136 — a place BAKES every layer it changes, and a room is a change',
    edit: {
      path: 'src/content/themes.ts',
      find: '  return [...new Set([...revoicedBy(theme), ...withAir, ...withOnset])];',
      replace: '  return [...new Set([...revoicedBy(theme), ...withAir])];',
    },
  },
];
