// The breaks behind docs/decisions/0089-a-cue-has-a-body.md.
//
// ⚠️ THIS DECISION IS ABOUT HOW SOMETHING SOUNDS, which is the one thing no test in this repository
// could see before it. Every guard over the old cues — the twin, the ceiling, the hold, the voice cap,
// the envelope — was green over the table the play-test rejected outright, and every one of them
// stays green over each break below except the two that were written for this. That is the point: a
// suite that can only check the table cannot notice that the table describes an Atari.
//
// ⚠️ THE SPECTRAL GUARDS ARE WHAT MAKE THESE PROBES POSSIBLE. They measure A-weighted band loudness
// of the actual samples, so "one oscillator" and "no filter" have somewhere to go red.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0089',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE REPORTED DEFECT ITSELF: a cue that is one oscillator. Rendering only the first layer is
      the shipped behaviour of every build up to 0088 — one wave, one sweep, one envelope, which is a
      TIA voice — and it is the edit a tidy-up would make if it decided the loop was doing too much.

      The picture it produces is exactly what was reported: everything in one narrow band, which is
      *"a tin shed heard from outside"*.
    */
    broke: 'only the first layer rendered, so a cue is one oscillator again',
    guard: 'THE SHED: an explosion is spread across the spectrum rather than humped in the middle',
    edit: {
      path: 'src/app/sound.ts',
      find: '  for (const layer of row.layers) sampleLayer(layer, rate, rng, out);',
      replace: '  for (const layer of row.layers.slice(0, 1)) sampleLayer(layer, rate, rng, out);',
    },
  },
  {
    decision: '0089',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE LOWPASS DROPPED, which is the single most load-bearing line in the synthesiser. A falling
      cutoff over noise IS an explosion; the same noise without it is static. Every layer, every
      envelope and every sweep survives this edit untouched — what changes is that the game hisses.

      ⚠️ IT PASSES THE SPREAD GUARD WITH ROOM TO SPARE, which is why that guard has a counterweight:
      unfiltered noise is the widest spectrum there is. What catches it is where the weight sits.
    */
    broke: 'the lowpass dropped from the synthesiser, so every explosion is unfiltered static',
    guard: 'and its weight is not in the top octave, which is what a filter is for',
    edit: {
      path: 'src/app/sound.ts',
      find: '    if (layer.lowFrom) value = low(value, sweep(layer.lowFrom, layer.lowTo, u), layer.q ?? LOW_Q).low;',
      replace: '    if (false && layer.lowFrom) value = low(value, 0, LOW_Q).low;',
    },
  },
  {
    decision: '0089',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE BOX PUT BACK — a content edit, and the one that looks most like tidying. A highpass on a
      noise body reads as belt-and-braces next to a lowpass; it is the thing that removes 130–300 Hz,
      which is the band that reads as *inside* something.
    */
    broke: 'the highpass taken off an explosion’s body, so the boxy band comes back',
    guard: 'THE REPORTED ONE: everything that explodes has a body, and not just a hiss',
    edit: {
      path: 'src/content/cues.ts',
      find: "      { wave: 'noise', from: 0, to: 0, seconds: 0.34, gain: 0.95, attack: 0.003, curve: 3.2, lowFrom: 2100, lowTo: 420, highFrom: 110, highTo: 45, q: 0.7, drive: 0.3 },",
      replace: "      { wave: 'noise', from: 0, to: 0, seconds: 0.34, gain: 0.95, attack: 0.003, curve: 3.2, lowFrom: 2100, lowTo: 420, q: 0.7, drive: 0.3 },",
    },
  },
  {
    decision: '0089',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE RELEASE DELETED, AND 0072 ALREADY DELETED IT ONCE ON GOOD EVIDENCE. Its probe reported
      STILL GREEN when the fade went, because a single oscillator at `DECAY` 5 ends at 0.7% of peak
      and the ramp was defending nothing.

      A layer carries its own curve now, and a long rumble uses 1.4 — which ends at 25% of peak. The
      fade is load-bearing in a way it was not, and this probe is what stops it being deleted a third
      time by somebody who finds 0072's argument and not this one.
    */
    broke: 'the release taken back out, so a long tail is cut off mid-waveform',
    guard: 'starts and ends at zero, because a buffer that stops mid-waveform clicks',
    edit: {
      path: 'src/app/sound.ts',
      find: '    const fade = left < release ? left / release : 1;',
      replace: '    const fade = 1;',
    },
  },
  {
    decision: '0089',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ THE BOOM TAKEN OUT FROM UNDER AN EXPLOSION. It is a content edit and a plausible one — the
      layer looks like a duplicate of the one below it, an octave apart — and it is the difference
      between something the player feels and something they only hear.
    */
    broke: 'the low sine removed from an explosion, so there is no boom to feel',
    guard: 'THE REPORTED ONE: everything that explodes has a body, and not just a hiss',
    edit: {
      path: 'src/content/cues.ts',
      find:
        "      { wave: 'sine', from: 180, to: 58, seconds: 0.85, gain: 1.3, attack: 0.001, curve: 2.1, drive: 0.28 },\n" +
        "      { wave: 'sine', from: 90, to: 29, seconds: 0.95, gain: 0.75, attack: 0.02, curve: 1.8 },",
      replace: "      { wave: 'saw', from: 900, to: 580, seconds: 0.85, gain: 1.3, attack: 0.001, curve: 2.1, drive: 0.28 },",
    },
  },
];
