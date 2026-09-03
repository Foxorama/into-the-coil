// The breaks behind docs/decisions/0122-the-kick-goes-under-the-music.md.
//
// ⚠️ THE FIRST ONE PUTS BACK THE STATE THE PLAYER REPORTED, and it is one number: a kick that sweeps
// from 160 Hz starts inside the 130-300 band the chords and the bass line occupy. "Not bassy enough"
// and "drowning out the subtler melody parts" were the same defect said twice.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0122',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE REPORTED STATE. At 160 Hz the kick's attack is in the harmony's band, so every strike
      ducks the chords and the bass line by masking rather than by any mechanism anybody wrote. It
      took a solo render and the player naming the layer to find, after three earlier rounds guessed
      at which layer *"the metronome"* was — 0113.
    */
    broke: 'the kick swept back down from 160Hz, which is inside the band the harmony occupies',
    guard: 'THE REPORTED ONE: the kick does not sit in the band the harmony occupies',
    edit: {
      path: 'src/content/music.ts',
      find: "note: { wave: 'sine', from: 104, to: 34, seconds: 0.46, gain: 0.6, attack: 0.001, curve: 2.1, drive: 0.3 },",
      replace: "note: { wave: 'sine', from: 160, to: 38, seconds: 0.42, gain: 0.6, attack: 0.001, curve: 2.8, drive: 0.3 },",
    },
  },
  {
    decision: '0122',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ A KICK THAT NO LONGER REACHES UNDER THE BASS LINE. *"It needs to play below the melody of the
      music to support and uplift it"* is a claim about which of the two is the floor — a kick that
      bottoms out above `groove` is not a floor, it is another middle voice, and the mix has nothing
      underneath it at all.
    */
    broke: 'the kick stopped short of the bottom, so it no longer sits under the bass line',
    guard: 'and it reaches deeper than the harmony it sits under',
    edit: {
      path: 'src/content/music.ts',
      find: 'from: 104, to: 34, seconds: 0.46,',
      replace: 'from: 104, to: 96, seconds: 0.46,',
    },
  },
  {
    decision: '0122',
    suite: 'tests/music.test.ts',
    /*
      ⚠️ THE GAP THE PLAYER ACTUALLY REPORTED — *"I don't think I've even heard groove in game."* This
      widens it from the other end, by turning the bass line down rather than the kick up, so the guard
      has to be about the DISTANCE between them rather than about either one's number.
    */
    broke: 'the bass line dropped back under the drums, where a player reports never having heard it',
    guard: 'AND THE LAYER THE PLAYER HAD NEVER HEARD IS WITHIN REACH OF THE ONE THEY HAD',
    edit: {
      path: 'src/content/music.ts',
      find: 'chords: 0.86, groove: 0.87, arp: 0, ride: 0, call: 0.65,',
      replace: 'chords: 0.86, groove: 0.2, arp: 0, ride: 0, call: 0.62,',
    },
  },
];
