// The fight sounds like the fight — docs/decisions/0325-the-fight-sounds-like-the-fight.md
//
// Every guard 0325 moves or newly reaches, broken on purpose. `node scripts/prove-guard.mjs 0325`.
//
// ⚠️ THIS DECISION ADDS NO HARD GUARD OF ITS OWN, AND THE TABLE IS STILL FOUR ROWS LONG. What a cue
// SOUNDS like is a taste (`0325-note` in tests/authored.ts) — a boss whose attacks are a machine is
// right to have no pitch in it, so a hard version would refuse a boss somebody may write. What IS
// invariant here belongs to guards other decisions wrote, and the breaks below are the proof that
// level one's new layer is inside every one of them rather than beside it.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [
  {
    decision: '0325',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ **THE NARROWED GUARD, SEEN TO STILL FIRE.** 0172's line read *level one states no ladder at
      all* and this decision gives it one at `boss` and `bossPeak`. The claim it was ever making is
      about an OPENING, so it now reads `ladder?.run` — and a break has to prove that the narrower
      version is not the vacuous version. The row put back here is the SHARED number, so nothing about
      the sound changes: what reddens is level one stating a `run` of its own at all.
    */
    broke: 'level one stating a `run` of its own, so there is nothing to read the other six against',
    guard: 'and six of the seven state a `run` of their own',
    edit: {
      path: 'src/content/themes.ts',
      find: '      // The fight only. A rung this table does not name falls through to `MUSIC_LADDER`\'s own number.\n      boss: { ownA: 0.9 },',
      replace: '      run: { drone: 0.34 },\n      boss: { ownA: 0.9 },',
    },
  },
  {
    decision: '0325',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ **THE SLOT OPENED WITH NOTHING IN IT.** 0188's own guard is *a slot a place OPENS has voices
      and a role at that rung*, and until this decision only Saurian Belt reached it. With the voices
      emptied, level one's fight opens a layer that is an instrument nobody wrote.
    */
    broke: 'the maracas emptied while the fight still opens the slot, so level one plays an instrument that is not there',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: a slot a place OPENS has voices and a role at that rung',
    edit: {
      path: 'src/content/themes.ts',
      // ⚠️ Re-anchored by 0331, which put `struck` between this row's voices and its ladder. The anchor
      // is the voices alone now: emptying them is the whole break and the line after it never was.
      find: '    voices: APPROACH_VOICES,',
      replace: '    voices: {},',
    },
  },
  {
    decision: '0325',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ **AND THE OTHER HALF OF THE SAME GUARD: THE ROLE.** `roleOf` answers `null` for a layer the
      arrangement does not name and `adriftAt` skips those — so a slot with no role is a layer whose
      audibility 0164 never asks about, which is the hole 0188 exists to close. *"Subtle"* said in a
      table nothing checks is *inaudible* with better manners.
    */
    broke: 'the maracas opened with no role, so nothing asks whether `subtle` came out as `not there`',
    guard: 'THE ONE THAT CANNOT BE RECOVERED FROM: a slot a place OPENS has voices and a role at that rung',
    edit: {
      path: 'src/content/arrangement.ts',
      find: "  approach: { boss: { ownA: 'pulse' }, bossPeak: { ownA: 'pulse' } },",
      replace: '  approach: {},',
    },
  },
  {
    decision: '0325',
    suite: 'tests/themes.test.ts',
    /*
      ⚠️ **THE LIFT THE NEW LAYER PAID FOR, TAKEN BACK OFF.** The rattle's best band is the `hi`, which
      is where `wraith` answers from at `bossPeak`; without the 0.6 dB handed back, that layer sits a
      whole role under the one the arrangement gave it and is not on the list of places allowed to.
      **This is the guard that would have caught the maracas being added carelessly**, and it is why
      the lift is in the ladder rather than in a line added to `STILL_ADRIFT`.
    */
    broke: 'the wraith lift taken back off, so the maracas mask the layer they were mixed around',
    guard: '0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT',
    edit: {
      path: 'src/content/themes.ts',
      find: '      bossPeak: { ownA: 0.9, wraith: 1.04 },',
      replace: '      bossPeak: { ownA: 0.9 },',
    },
  },
  {
    decision: '0325',
    suite: 'tests/sound.test.ts',
    /*
      ⚠️ **THE ACID'S NEW NOTE, SHAPED BY A GUARD RATHER THAN BY A TASTE.** A held note is a long sound
      and a cue is punctuation: at the first draft's `curve` 2.4 over 0.34 s the root was still ringing
      when the cue ended, and the whole thing measured 0.0873 against 0.0801 — louder at its end than
      at its start. This is that draft, put back.
    */
    broke: 'the acid’s root note ringing past the end of the cue, so the sound never finishes',
    guard: 'starts and ends at zero, because a buffer that stops mid-waveform clicks',
    edit: {
      path: 'src/content/cues.ts',
      /*
        ⚠️ RE-AIMED BY 0331, BECAUSE LENGTHENING THIS LAYER DEFEATED THE BREAK WITH IT. The old edit
        took `seconds` 0.3 → 0.34 to make the root note ring past the end of the cue — and this layer
        is the LONGEST in the row, so its own length is what sets the buffer's. Lengthening it moved
        the end along with the note and the note fitted again; `npm run prove` reported STILL GREEN.

        ⚠️ AND THE LAST SAMPLE CANNOT BE THE TARGET EITHER: `sampleCue` fades the summed row to zero
        over its final six milliseconds, so *ends at zero* is true of any content whatsoever. What is
        left to break is the assertion that does the work — **the energy of the last quarter against
        the first** — and the honest break for *the sound never finishes* is a decay that does not.
        Checked: it fires as `bossAcid is as loud at its end as at its start — nothing is decaying`.
      */
      find: '      { wave: \'sine\', from: inKey(0), to: inKey(0), at: 0.13, seconds: 0.3, gain: 0.484, attack: 0.005, curve: 3.6,',
      replace: '      { wave: \'sine\', from: inKey(0), to: inKey(0), at: 0.13, seconds: 0.3, gain: 0.484, attack: 0.005, curve: 0.25,',
    },
  },
];
