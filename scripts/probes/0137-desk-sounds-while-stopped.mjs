// The break behind docs/decisions/0137-the-desk-sounds-while-the-level-stands-still.md.
//
// ⚠️ **RETIRED BY docs/decisions/0165-the-desk-sounds-what-you-raise.md, AND REPLACED RATHER THAN
// DELETED.** This probe planted *"is anything held above zero?"* as the obvious-and-wrong
// implementation of the air condition. 0165 makes that condition **correct** — it is `deskSounds` —
// so the break is no longer a break and the anchor no longer exists. `npm run prove` refused to run
// the suite over it rather than reporting green, which is
// docs/decisions/0019-a-probe-must-be-seen-to-apply.md doing its whole job on the day it was needed.
//
// ⚠️ **WHAT MADE THE OLD VERSION WRONG WAS NEVER THE CONDITION.** It was that a layer with no hold
// went on FOLLOWING the ladder into a stopped transport, so one dragged fader started the whole piece
// underneath it. 0165 silences the followers instead, and the two probes in
// `scripts/probes/0165-the-desk-sounds-what-you-raise.mjs` hold one half of that rule each — including
// this file's own case, restored as the thing that must NOT come back.
//
// ⚠️ **THE FILE STAYS BECAUSE THE REASONING IS THE RECORD** —
// docs/decisions/0029-the-tracked-record-is-the-record.md. A deleted probe file is a decision nobody
// can find the argument for; the empty list is what stops `prove` from running a break that no longer
// breaks anything.

/** @type {import('../prove-guard.mjs').Probe[]} */
export const PROBES = [];
