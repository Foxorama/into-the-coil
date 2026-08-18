// The breaks behind docs/decisions/0174-a-send-has-to-mean-something.md.
//
// ⚠️ THE FIRST ONE IS THE STATE 0173 SHIPPED IN, AND A PLAYER FOUND IT IN ONE LISTEN. Without the
// normalisation the impulse carries whatever energy 1.1 seconds of full-amplitude noise happens to
// have, so `air` is a number against an unstated scale — and the scale turned out to put the reverb
// 7.8 to 9.0 dB ABOVE the sound it was on. Every guard 0173 wrote stayed green, because all three
// measured the tail's length, width and decay and none of them measured its level.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0174',
    suite: 'tests/sound.test.ts',
    broke: 'the impulse un-normalised, which is the room 0173 shipped and a player called a tin can',
    guard: 'THE REPORTED ONE: no cue is quieter than its own reverb',
    edit: {
      path: 'src/app/sound.ts',
      find: '    const scale = energy > 0 ? 1 / Math.sqrt(energy) : 0;',
      replace: '    const scale = 1;',
    },
  },
  {
    decision: '0174',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ NORMALISED PER BUFFER RATHER THAN PER CHANNEL, WHICH IS THE PLAUSIBLE VERSION OF THIS AND IS
      WRONG BY A FACTOR OF ROOT TWO. It reads as tidier — one scale for one room — and it makes `air`
      mean something 3 dB different from what the table says, in a direction no listener could name.
    */
    broke: 'the two channels sharing one scale, so the room is 3 dB off what the table says',
    guard: 'and the impulse carries unit energy, which is what makes `air` a share of the dry',
    edit: {
      path: 'src/app/sound.ts',
      find: '    const scale = energy > 0 ? 1 / Math.sqrt(energy) : 0;',
      replace: '    const scale = energy > 0 ? 1 / Math.sqrt(energy * 2) : 0;',
    },
  },
];
