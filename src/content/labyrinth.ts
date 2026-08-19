/**
 * THE LABYRINTH'S OWN COMPOSITION — a phrase that comes back, and the thing that is one corner behind.
 *
 * `docs/decisions/0146-three-more-places-and-two-after-them.md`.
 *
 * ── WHAT WAS ASKED FOR ──────────────────────────────────────────────────────────────────────────
 *
 * > *"Level 4 will be a labyrinth style, lost in a maze being hounded and chased style effect."*
 *
 * ⚠️ **A MAZE IS A STRUCTURE AND NOT A TIMBRE, SO THIS PLACE IS BUILT OUT OF TWO STRUCTURES.** Every
 * other place in this game is characterised by what its instruments are; the two that carry this one
 * are things the notes DO, and they would still read if the whole thing were played on a piano.
 *
 * **1. THE LIMP.** Every sixteenth-note layer here is accented `3 · 3 · 3 · 3 · 4` across the bar
 * instead of `4 · 4 · 4 · 4`. It is still sixteen sixteenths, so it loops exactly and nothing drifts
 * (`docs/decisions/0090-the-music-is-four-loops.md`) — but the ear counts in threes, keeps arriving
 * one step early, and hits a wall of four at the end of every bar. That is what being lost feels like
 * written as an accent pattern, and it costs one array.
 *
 * **2. THE CANON.** `counter` plays `call`'s own phrase, displaced by four bars. It is a round: the
 * tune the player has been hearing for two minutes starts again underneath itself, one phrase behind,
 * and the two of them rub where the harmony has moved on. **Something is following you and it knows
 * the tune.** `RUNG_CLOSES` takes `call` away at `surge` (`src/content/music.ts`), so the thing behind
 * you is what you are left with.
 *
 * | the brief | the rung | the layers that carry it |
 * |---|---|---|
 * | a corridor, and something breathing in it | `run` | `drone`, `sub`, `engine`, `perc`, `chords`, `groove`, `call` |
 * | you start running | `push` | `arp`, `ride`, `hook`, `lead` |
 * | it is running too, and it knows the tune | `surge` | `counter`, `crash`, `drive` |
 * | it is not lost | `approach` | `toll`, `dread` |
 * | the hound | `boss` | `stomp`, `frenzy`, `wraith`, and the aura's two |
 *
 * ── WHY THIS PLACE IS DRY AND EMBER NEBULA IS NOT ───────────────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0136-the-place-has-a-room-and-an-arc.md` GAVE EVERY LAYER A ROOM AND THE
 * INTERESTING USE OF IT IS TO WITHHOLD ONE.** A cathedral says *this space is enormous*; a corridor
 * says the opposite, and the way to say it is a mix that is almost entirely close and dry with **two
 * layers that are not**. The music box and the horn are the only things here with any air on them, so
 * they read as coming from somewhere else in the maze — which is the whole picture, in two numbers on
 * `THEMES.labyrinth.air`.
 *
 * ── THE ONE LIMIT ───────────────────────────────────────────────────────────────────────────────
 *
 * ⚠️ **EVERY NOTE IS A TONE OF A NATURAL MINOR** — `docs/decisions/0099-the-cues-are-in-the-key.md`,
 * because the player's own gun is in it. The harmony below therefore leans on the two diatonic chords
 * that are already uncomfortable — `B°`, which is the tritone the scale contains, and the `Em` that
 * refuses to become an E major — rather than on a note the key does not have.
 */

import { BEAT_SECONDS, type MusicLayer, type MusicVoice } from './music.ts';

/** A rest, written out so a pattern reads as a rhythm rather than as a list of nulls. */
const _ = null;

/**
 * THE PROGRESSION — sixteen bars, and seven of them are the same chord.
 *
 * ⚠️ **`Am Dm Am Em · Am F Am B° · Dm Am Em Am · F Em B° Am`.** The base walks a four-bar turn four
 * ways and Saurian Belt falls through a descending seventh; this **keeps coming back to where it
 * started**. Every second bar of the first half is A minor, the second half arrives at it twice more,
 * and the loop ends on it — so the harmony has no direction at all, which is the one thing a
 * progression is normally for.
 *
 * ⚠️ **THAT IS THE PICTURE AND NOT A SHORTAGE OF IDEAS.** A listener cannot say how far through the
 * phrase they are, because the landmark is the chord that occurs most often. Bar eight and bar
 * fifteen are `B°` — B, D and F, the tritone — and they are the only two places the piece admits it
 * is somewhere.
 *
 * ⚠️ **Hoisted, because eight voices spell the same sixteen chords**, on `src/content/nebula.ts`'s
 * terms.
 */
const ROOT: readonly number[] = [0, 5, 0, -5, 0, -4, 0, 2, 5, 0, -5, 0, -4, -5, 2, 0];
const THIRD: readonly number[] = [3, 8, 3, -2, 3, 0, 3, 5, 8, 3, -2, 3, 0, -2, 5, 3];
const FIFTH: readonly number[] = [7, 12, 7, 2, 7, 3, 7, 8, 12, 7, 2, 7, 3, 2, 8, 7];

/**
 * THE LIMP — how hard each of the sixteen sixteenths in a bar is struck.
 *
 * ⚠️ **`3 · 3 · 3 · 3 · 4`, AND IT IS THE FIRST STRUCTURAL IDEA IN THIS FILE.** Positions 0, 3, 6, 9
 * and 12 carry the weight; the bar is still sixteen sixteenths long, so it loops exactly and no layer
 * can drift from any other. What changes is only where the ear thinks the beat is — and it thinks
 * wrong four times a bar and then gets caught out by a group of four.
 *
 * ⚠️ **AN ACCENT AND NOT A PATTERN, WHICH IS WHY EVERY FAST LAYER CAN SHARE IT.** A rhythm written
 * with rests in those places would be one voice's idea; a weighting is a property the groove, the arp
 * and the drive can all carry at once without playing the same notes, and that is what makes the limp
 * sound like the PLACE rather than like a part.
 *
 * ⚠️ **Sixteen entries, so it wraps at the bar** — `accents` wraps at its own length
 * (`src/content/music.ts`), so a four-entry array is one beat and this one is exactly one bar.
 */
const LIMP: readonly number[] = [
  1, 0.5, 0.56, 0.94, 0.48, 0.54, 0.9, 0.48, 0.52, 0.88, 0.5, 0.54, 0.96, 0.52, 0.58, 0.6,
];

/**
 * THE TUNE — the music box, and it is the same four bars four times with a different ending.
 *
 * ⚠️ **EACH PHRASE ENDS WHERE THE NEXT ONE BEGINS**, which is the maze written as a melody: the
 * listener cannot tell a repeat from a new corridor, because the last note of every phrase is the
 * first note of the one that follows it. The final bar lands on the root and the loop restarts on the
 * root, so it does not even end.
 *
 * ⚠️ **Two notes a bar and a rest on the fourth**, which leaves room for the thing that answers it.
 */
const TURN: readonly (number | null)[] = [
  0, _, 3, _,
  5, _, 3, _,
  0, _, -2, _,
  2, _, _, _,
  0, _, 3, _,
  8, _, 7, _,
  3, _, 0, _,
  5, _, 2, _,
  12, _, 10, _,
  7, _, 5, _,
  3, _, 2, _,
  0, _, _, _,
  8, _, 7, _,
  3, _, 2, _,
  5, _, 8, _,
  0, _, _, _,
];

/**
 * THE THING BEHIND YOU — `TURN`, four bars late.
 *
 * ⚠️ **THE SECOND STRUCTURAL IDEA, AND IT IS FOUR CHARACTERS OF ARITHMETIC.** A round is the oldest
 * way there is to make one line sound like two people, and it is exactly the right picture: the tune
 * that has been leading the player through the level starts again underneath, one phrase behind,
 * playing the same corners in the same order.
 *
 * ⚠️ **THE RUB IS THE POINT AND IT IS NOT AN ACCIDENT.** Displaced by four bars, phrase A's `Em` bar
 * lands over the progression's `B°` — G against F, a minor second, once a phrase. Every other bar of
 * the canon is consonant, which is what makes the one that is not sound like something got closer.
 *
 * ⚠️ **A ROTATION rather than a second hand-written array**, so the two lines cannot drift apart when
 * one of them is retuned — the same reason the progression above is hoisted.
 */
const CHASE: readonly (number | null)[] = [...TURN.slice(16), ...TURN.slice(0, 16)];

/**
 * THE FOOTSTEPS — a pizzicato eighth-note walk, and it never gets anywhere.
 *
 * ⚠️ **Root and fifth only, alternating.** A bass line that moved through the chord would be going
 * somewhere; this paces. It is the layer the limp is least audible on, deliberately, because
 * something in the mix has to be keeping honest time or the accent has nothing to be wrong against.
 */
const PACES: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const fifth = FIFTH[bar]!;
  return [root, _, fifth, _, root, _, fifth, root];
});

/**
 * THE RUN — sixteenths under everything from the opening, carrying the limp.
 *
 * ⚠️ **It walks up three and falls back one**, over and over, which is a spiral staircase written as
 * an interval pattern: real progress of two steps for every four taken, and it arrives back at the
 * root every bar having gone nowhere.
 */
const SPIRAL: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [
    root, third, fifth, third,
    fifth, root + 12, third + 12, root + 12,
    third + 12, fifth, root + 12, fifth,
    third, root, third, root,
  ];
});

/**
 * THE PURSUIT RIFF — what `push` opens: eight a bar, and it is the first thing that is not patient.
 *
 * ⚠️ **It is the limp stated as RESTS rather than as accents**, which is the one place in the piece
 * the two ideas are allowed to agree. Three, three and two eighths — so the bar's second half is
 * always a step ahead of where the first half taught the ear to expect it.
 */
const PURSUIT: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [root, _, _, fifth, _, _, third, root + 12];
});

/**
 * THE WALLS — the counter's own texture: two notes scrubbed against each other, sixteen to a bar.
 *
 * ⚠️ **A tremolo and not an arpeggio**, on `src/content/nebula.ts`'s finding: two sixteenth layers
 * that both walk through the chord are one layer played twice. `SPIRAL` climbs; this scrapes.
 */
const SCRAPE: readonly (number | null)[] = ROOT.flatMap((root, bar) => {
  const third = THIRD[bar]!;
  const fifth = FIFTH[bar]!;
  return [
    root, third, root, third,
    root, third, root, third,
    fifth, third, fifth, third,
    root, third, root, third,
  ];
});

/**
 * Everything The Labyrinth plays instead of the base composition.
 *
 * ⚠️ **TWENTY-ONE OF THE TWENTY-THREE, and the two left out are `bass` and `beat`**, which
 * `docs/decisions/0095-the-level-has-its-own-music.md` closes everywhere except the title.
 */
export const LABYRINTH_VOICES: Partial<Record<MusicLayer, readonly MusicVoice[]>> = {
  /*
    ── THE CORRIDOR: a bowed low string, and the air moving down it ─────────────────────────────────

    ⚠️ **The root and the FOURTH, which is a hollow this game has not used.** Ember Nebula's pedal is
    a root and a fifth — the interval an organ is built on and the most stable one there is. A and D
    is the one immediately under it: consonant enough to sit through sixteen bars, unresolved enough
    that it never sounds like it has arrived.
  */
  drone: [
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.15, attack: 0.44, curve: 0.9, lowFrom: 380, lowTo: 240, q: 1.2 },
    },
    {
      steps: [5, 5],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.1, attack: 0.52, curve: 0.9, lowFrom: 360, lowTo: 230, q: 1.3 },
    },
    {
      steps: [0, 0],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.6, gain: 0.21, attack: 0.34, curve: 0.9 },
    },
    {
      // Air moving somewhere you cannot see. Band-limited to a narrow window, which is what makes it
      // a draught in a passage rather than weather in a sky.
      steps: [1, 1],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.055, attack: 1.2, curve: 1.3, lowFrom: 900, lowTo: 460, highFrom: 200, q: 1.1 },
    },
  ],

  /*
    ── THE PULSE: a heartbeat, and the feet under it ────────────────────────────────────────────────

    ⚠️ **THE ONE FIGURE EVERY LISTENER ALREADY KNOWS.** Two thumps close together and then a gap is
    not a drum pattern, it is a body — and it is the cheapest way there is to say *you are frightened*
    without a single melodic decision. It is also, conveniently, on the game's own grid: the pair sits
    on a sixteenth and its answer on the sixteenth after next.
  */
  sub: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.1, gain: 0.36, attack: 0.14, curve: 0.95 },
    },
    {
      /*
        THE HEART. Twice a bar, and the second pair is softer than the first — which is what stops
        sixty-four identical thumps reading as a machine, and is 0102's own finding about every drum
        in this game having been struck at one weight.
      */
      steps: ROOT.flatMap(() => [1, _, 0.66, _, _, _, _, _, 0.88, _, 0.6, _, _, _, _, _]),
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 122, to: 30, seconds: 0.42, gain: 0.44, attack: 0.003, curve: 2.6, drive: 0.24 },
    },
    {
      // THE FEET — `PACES` has the argument. Five notes a bar, plucked, and they go nowhere.
      steps: PACES,
      pitched: true,
      perBeat: 2,
      octave: 0,
      accents: [1, 0.72, 0.86, 0.7],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.3, gain: 0.26, attack: 0.004, curve: 4.2, lowFrom: 700, lowTo: 280, q: 1.4, drive: 0.18 },
    },
  ],

  /*
    ── THE KIT, WHICH IS SOMEBODY RUNNING ON STONE ─────────────────────────────────────────────────

    ⚠️ **`engine` IS THE LEVEL'S RHYTHM LAYER AND THIS ONE IS NOT A KIT AT ALL.** No kick, no clap, no
    hat — a scuffed footfall on the limp grid, a stone chip answering it, and a metal tick a long way
    off. It is the largest single reason this place does not sound like level three from the first
    bar, and it is the same choice Ember Nebula made when it put a tam-tam here.

    ⚠️ **It is still on the beat and still climbs with the ladder**, so the pace floor 0134 holds is a
    question about the mix rather than about the pattern.
  */
  engine: [
    {
      /*
        THE FOOTFALL, ON THE LIMP GRID. Sixteenths, with the weight on 0, 3, 6, 9 and 12 — so the
        runner is going as fast as the game is and is not landing where the bar says.
      */
      steps: [
        0.94, _, _, 0.86, _, _, 0.8, _, _, 0.82, _, _, 0.9, _, 0.56, _,
        0.92, _, _, 0.84, _, _, 0.78, _, _, 0.8, _, _, 0.88, _, 0.58, 0.5,
        0.94, _, _, 0.86, _, _, 0.82, _, _, 0.8, _, _, 0.9, _, 0.56, _,
        0.96, _, _, 0.88, _, _, 0.8, _, _, 0.84, _, _, 0.94, 0.6, 0.62, 0.66,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 168, to: 62, seconds: 0.17, gain: 0.36, attack: 0.002, curve: 4.6, drive: 0.3 },
    },
    {
      // The scuff — the grit under the boot, on the same instants, so it is one sound and not two.
      steps: [
        0.5, _, _, 0.4, _, _, 0.36, _, _, 0.38, _, _, 0.44, _, 0.26, _,
        0.48, _, _, 0.38, _, _, 0.34, _, _, 0.36, _, _, 0.42, _, 0.28, 0.24,
        0.5, _, _, 0.4, _, _, 0.36, _, _, 0.36, _, _, 0.44, _, 0.26, _,
        0.52, _, _, 0.42, _, _, 0.36, _, _, 0.4, _, _, 0.48, 0.28, 0.3, 0.32,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.07, attack: 0.002, curve: 4.2, lowFrom: 3600, lowTo: 1200, highFrom: 700 },
    },
    {
      /*
        THE DRIP. One tick a beat and nothing else, in a corridor: the only thing in the opening that
        is genuinely regular, so it is what the limp is heard against. Take it out and the bar has no
        reference at all and stops sounding wrong.
      */
      steps: [
        0.8, 0.44, 0.6, 0.42, 0.72, 0.44, 0.58, 0.46, 0.82, 0.44, 0.6, 0.42, 0.7, 0.46, 0.6, 0.5,
      ],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'tri', from: 3200, to: 2100, seconds: 0.05, gain: 0.095, attack: 0.0006, curve: 7.5, highFrom: 1400 },
    },
    {
      // A door, somewhere. Twice in four bars, low-mid and gone — the sound that makes a listener
      // look up, which is the whole reason it is not on a grid anybody can follow.
      steps: [_, _, _, _, _, 0.8, _, _, _, _, _, _, 0.72, _, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.085, attack: 0.004, curve: 3, lowFrom: 1400, lowTo: 420, highFrom: 180 },
    },
  ],

  /*
    ── THE SMALL THINGS: breathing, stone, and a chain ─────────────────────────────────────────────

    ⚠️ **`perc` sits at −0.45 and therefore may not be low** — `tests/themes.test.ts` refuses a placed
    layer whose weight is under 130 Hz. Breath and stone chips are what a corridor has up there
    anyway, and the breath is the part that carries the picture: filtered noise with a rise and a
    fall, twice a bar, which is a person who is not getting enough air.

    ⚠️ **EVERY ENVELOPE HERE WAS SHORTER THAN THE NUMBER BESIDE IT SAID**, which is
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md`'s finding about Ember Nebula's ride arriving
    at the layer that carries this place. The decay is `exp(-curve · u)` across `seconds`, so the real
    length is about `seconds / curve`: the exhale read 200 ms and lasted **59**, the struck frame read
    190 ms and rang for **43**. `docs/decisions/0154-the-mix-is-authored-as-intent.md`'s solve was
    asking for a gain of **4.32** at `run` — past `MIX_CEILING` as it then was (0182 retired it), and
    past what a gain can do, because
    multiplying a thing that puts out nothing is 0152's own subject.

    ⚠️ **+4.0 dB OF MATERIAL AND 3.5 dB OFF THE PEAK, WHICH IS THE WHOLE OF WHY IT FITS.**
    `scripts/weigh-mix.mjs` had `approach` at **98.2%** of the clipping ceiling before any of this, so
    a louder pulse had to be a longer one and not a bigger one. Three levers, none of them `gain` on
    its own: the tails (above), `drive: 0.75` on the skin — `saturate` is normalised, so it buys RMS
    at an unchanged peak — and 14 ms of attack, which walks the strike out of the collective onset
    thirteen layers share on beat one. Solved: **4.32 → 2.44**, and `run`'s `margin` −5.5 → **+3.3**.
  */
  perc: [
    {
      // THE BREATH IN. Slow front, quick back — the opposite envelope to everything else here.
      //
      // ⚠️ **THE CHEAPEST PLACE IN THE LAYER TO PUT LEVEL, AND THE ONE THAT CARRIES THE PICTURE.**
      // It is noise behind a 170 ms attack, so its loudest instant arrives long after the bar's, and
      // noise does not stack with a downbeat the way a sine does — which is why this is the one voice
      // here that got a plain `gain`.
      steps: [1, _, _, _, 0.7, _, _, _, 0.9, _, _, _, 0.74, _, _, 0.62],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.42, gain: 0.21, attack: 0.17, curve: 2.1, lowFrom: 2600, lowTo: 900, highFrom: 520, q: 0.9 },
    },
    {
      // THE BREATH OUT, a beat later and shorter. Two halves of one thing, and it is why they are
      // written as two voices rather than one pattern with a longer note in it.
      //
      // ⚠️ **SHORTER THAN THE BREATH IN AND NOT SHORTER THAN A BREATH.** At `curve: 3.4` over 0.2 s
      // it was a 59 ms puff, which the ear files as a hi-hat; at 125 ms it is somebody emptying their
      // lungs, and it is still the shorter of the two.
      steps: [_, _, 0.7, _, _, _, 0.6, _, _, _, 0.66, _, _, 0.58, _, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.3, gain: 0.175, attack: 0.024, curve: 2.4, lowFrom: 1800, lowTo: 700, highFrom: 400, q: 0.9 },
    },
    {
      // Stone chips: sixteenths, dry, quiet, and the only continuous thing in the layer. 9 ms of
      // decay where `curve: 7` over 0.03 s gave 4 — still a chip, and now a chip with a size.
      steps: [
        0.44, 0.24, 0.32, 0.26, 0.4, 0.24, 0.3, 0.26, 0.42, 0.24, 0.32, 0.26, 0.38, 0.26, 0.32, 0.28,
        0.44, 0.24, 0.32, 0.28, 0.4, 0.26, 0.3, 0.24, 0.42, 0.26, 0.32, 0.28, 0.38, 0.28, 0.34, 0.3,
        0.46, 0.24, 0.34, 0.26, 0.4, 0.24, 0.32, 0.26, 0.44, 0.24, 0.32, 0.28, 0.38, 0.26, 0.32, 0.28,
        0.44, 0.26, 0.34, 0.28, 0.42, 0.26, 0.32, 0.28, 0.46, 0.28, 0.36, 0.3, 0.42, 0.32, 0.38, 0.34,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.05, gain: 0.09, attack: 0.0008, curve: 5.4, lowFrom: 9000, highFrom: 3400 },
    },
    {
      /*
        THE SKIN. A struck frame, 250 Hz falling to 170 — the low-mid a place made of breath and
        chips would otherwise have nothing in at all. `src/content/nebula.ts` found that hole by
        measurement after the fact; this is the same lesson taken before it.

        ⚠️ **IT RINGS, AND AT `curve: 4.4` OVER 0.19 s IT DID NOT.** 43 ms is under eight cycles of
        its own fundamental — a frame that dead is a click with a pitch on it. At `2.4` over 0.58 s
        it rings for 242, and the pattern is under two hits a bar: the closest pair is a beat apart,
        so the most any strike lands on is a tail already down to a fifth of itself.

        ⚠️ **AND IT WAS SWEEPING 176 → 104, WHICH SPENDS HALF THE NOTE IN THE WRONG BAND TWICE OVER.**
        `lowmid` is 130–300 Hz (`tests/spectrum.ts`) and is the window this layer's margin is measured
        in (`scripts/weigh-heard.mjs`); everything under 130 landed in `low`, where A-weighting
        discounts it by another 8 dB **and** where `sub`, `engine`, `drive` and `stomp` are already
        four low sines striking the same downbeat. Moved into the band it was written for, the same
        amplitude buys margin instead of headroom — and `tests/themes.test.ts`'s rule that a layer at
        −0.45 may not be low is satisfied by construction rather than by 20 dB of luck.
      */
      steps: [1, _, _, 0.62, _, 0.68, _, _, 0.86, _, _, 0.6, _, 0.7, _, 0.64],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 250, to: 170, seconds: 0.58, gain: 0.185, attack: 0.014, curve: 2.4, drive: 0.75 },
    },
  ],

  /*
    ── THE WALLS: what a chord is when there is no room for one ────────────────────────────────────

    ⚠️ **BOWED, CLOSE, AND WITHOUT A THIRD ON TOP.** Ember Nebula's choir opens its filter as it sings
    and level three's pad sweeps down; these do neither — they arrive, sit, and stop. The character is
    that the chord is *narrow*: roots and fifths held, with the third only in the middle of the stack,
    so the harmony never quite says whether the place is major or minor even though it is plainly
    minor.
  */
  chords: [
    {
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.84, 0.92, 0.82, 0.96, 0.86, 1, 0.8],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.13, attack: 0.24, curve: 1.3, lowFrom: 900, lowTo: 620, q: 1.6 },
    },
    {
      steps: FIFTH,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.84, 0.92, 0.82, 0.96, 0.86, 1, 0.8],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.09, attack: 0.3, curve: 1.3, lowFrom: 820, lowTo: 560, q: 1.7 },
    },
    {
      steps: THIRD,
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [0.92, 0.8, 1, 0.78, 0.9, 0.84, 0.94, 0.76],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.1, attack: 0.36, curve: 1.3, lowFrom: 1100, lowTo: 760, q: 1.4 },
    },
    {
      /*
        THE TREMOLO. Bowed strings shaking on the spot — eighths, short, on the same three notes the
        pad is holding. It is the articulation `src/content/nebula.ts` learned its own choir needed:
        without something that ARRIVES, a held chord measures six notes a bar and sits still.
      */
      steps: ROOT.flatMap((root, bar) => [root, FIFTH[bar]!, root + 12, FIFTH[bar]!, root, THIRD[bar]! + 12, root + 12, FIFTH[bar]!]),
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.66, 0.84, 0.64],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.055, attack: 0.008, curve: 3.4, lowFrom: 1400, lowTo: 700, q: 1.8 },
    },
    {
      // The bottom of the wall — an octave under, nearly unfiltered, and it is what makes the
      // corridor feel like it is made of something.
      steps: ROOT,
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4, gain: 0.16, attack: 0.2, curve: 1.15, lowFrom: 460, lowTo: 300, q: 0.9 },
    },
  ],

  /*
    ── THE RUN: sixteenths from the opening, carrying the limp ──────────────────────────────────────

    ⚠️ **THE UNDERCURRENT, AND IT OPENS AT `run`** — `docs/decisions/0134-the-place-keeps-the-games-pace.md`
    says a place may be another piece and may not be a slower one, and this level's whole idea is
    somebody moving too fast in the dark. Three voices on one line: a sine for the weight, a driven
    saw for the edge and an octave up so the FIGURE is audible rather than only the pressure.
  */
  groove: [
    {
      steps: SPIRAL,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: LIMP,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.44, attack: 0.003, curve: 3.4 },
    },
    {
      steps: SPIRAL,
      pitched: true,
      perBeat: 4,
      octave: 0,
      accents: LIMP,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.17, gain: 0.17, attack: 0.003, curve: 4.4, lowFrom: 680, lowTo: 300, q: 1.5, drive: 0.3 },
    },
    {
      steps: SPIRAL,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: LIMP,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.14, gain: 0.06, attack: 0.003, curve: 5.5, lowFrom: 1500, lowTo: 660, q: 1.5 },
    },
  ],

  /*
    ── THE MUSIC BOX: the tune, and the only thing here with any room around it ────────────────────

    ⚠️ **A struck glass with a fast decay and a long room is a corridor.** The air is on
    `THEMES.labyrinth.air` rather than in this voice, because a longer note is sustain and sustain is
    not space — `docs/decisions/0136-the-place-has-a-room-and-an-arc.md` is where that distinction was
    finally made and it is the reason this layer sounds like it is coming from somewhere.

    ⚠️ **THE BOX WAS 6 dB UNDER THE LAMENT ON BOTH RMS AND PEAK, WHICH IS NOT A TRANSIENT PROBLEM.**
    `perc` and `crash` below are libelled by RMS — `docs/decisions/0140-no-layer-is-inaudible.md` —
    and this one is not: its crest factor is the same 15 dB `lead`'s is, so it is simply quiet
    material, and the solve was asking for a gain of 3.08 that `MIX_CEILING` would silently have
    clamped to 2.6 (`docs/decisions/0154-the-mix-is-authored-as-intent.md`). **The weight goes on the
    OCTAVE UNDER**, which is the voice that lives in `mid` — the band `call`'s margin is measured in —
    so the tune gets a body rather than a brighter strike, and the glass stays glass. +5.9 dB of
    material, solved **3.08 → 2.01**, and it is affordable because `call` closes at `surge`: the two
    rungs it plays sit at 53% and 70% of the clipping ceiling where the four that follow sit at 93–98.
  */
  call: [
    {
      steps: TURN,
      pitched: true,
      perBeat: 1,
      octave: 3,
      accents: [1, 0.72, 0.88, 0.7],
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.2, gain: 0.158, attack: 0.002, curve: 3.2, highFrom: 900 },
    },
    {
      // The octave under it, softer and slower to die: the part of a music box you feel in the box.
      // ⚠️ It is no longer softer — it is the body, and a box you can only hear the strike of is the
      // bell the voice below exists to prevent.
      steps: TURN,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.72, 0.88, 0.7],
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 1.8, gain: 0.155, attack: 0.006, curve: 1.9 },
    },
    {
      // The mechanism: the click of the comb before the note. Take it away and it is a bell.
      steps: TURN.map((note) => (note === null ? _ : 1)),
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.028, gain: 0.072, attack: 0.0004, curve: 7, lowFrom: 8000, highFrom: 3000 },
    },
  ],

  /*
    ── THE PURSUIT RIFF: what `push` opens, and the point the level stops being atmospheric ─────────

    ⚠️ **AN EIGHTH THAT DIES IN A QUARTER OF ITS OWN SLOT IS NOT A RIFF, IT IS A HAT.** `curve: 3` over
    `BEAT_SECONDS * 0.36` is 48 ms of note in a 200 ms step — so the thing that is supposed to stop
    this level being atmospheric was arriving as four ticks a bar with silence between them, and the
    solve wanted a gain of 3.05 to make silence audible.
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` has the arithmetic: the real length is
    `seconds / curve` and the number beside it never was.

    ⚠️ **AND EVERY `gain` BELOW WENT DOWN.** 83 ms joins the eighths into a line, `drive: 0.5` on the
    saw is `saturate` doing what it is normalised to do — level in the body of the note and none at
    the top of it — and 13 ms of attack keeps the riff's loudest instant off the beat-one pile-up that
    `scripts/weigh-mix.mjs` measures. +1.7 dB of material for **less** peak than it shipped with, and
    the solve reads **3.05 → 2.87**. `surge` is the tightest rung in the place at 98.4% of the ceiling,
    and this layer is the reason it is not tighter.
  */
  hook: [
    {
      steps: PURSUIT,
      pitched: true,
      perBeat: 2,
      octave: 1,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.5, gain: 0.142, attack: 0.013, curve: 2.4, lowFrom: 2000, lowTo: 820, q: 1.8, drive: 0.5 },
    },
    {
      steps: PURSUIT,
      pitched: true,
      perBeat: 2,
      octave: 2,
      accents: [1, 0.7, 0.88, 0.68],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.42, gain: 0.0755, attack: 0.014, curve: 2.9, lowFrom: 4200, lowTo: 2000, q: 1.5 },
    },
    {
      // The stab at the top of every fourth bar — the one place the pursuit gets a look at you.
      steps: ROOT.flatMap((root, bar) =>
        bar % 4 === 3 ? [_, _, _, _, root + 24, _, FIFTH[bar]! + 12, _] : [_, _, _, _, _, _, _, _],
      ),
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.9, gain: 0.0915, attack: 0.002, curve: 2, highFrom: 2200 },
    },
  ],

  /*
    ── THE SPIRAL, ONE OCTAVE UP: the same staircase, seen from further along it ────────────────────
  */
  arp: [
    {
      steps: SPIRAL,
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: LIMP,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.18, gain: 0.078, attack: 0.003, curve: 3.6, lowFrom: 3400, lowTo: 1900, q: 1.5 },
    },
    {
      steps: SPIRAL,
      pitched: true,
      perBeat: 4,
      octave: 3,
      accents: LIMP,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 0.14, gain: 0.044, attack: 0.003, curve: 4.6, lowFrom: 6000, lowTo: 3200, q: 1.2 },
    },
  ],

  /*
    ── THE RIDE: a chain, moving somewhere behind you ──────────────────────────────────────────────
  */
  ride: [
    {
      steps: [
        0.7, 0.28, 0.42, 0.3, 0.56, 0.28, 0.4, 0.26, 0.72, 0.3, 0.44, 0.28, 0.54, 0.3, 0.42, 0.46,
        0.68, 0.28, 0.4, 0.26, 0.58, 0.3, 0.38, 0.28, 0.74, 0.3, 0.44, 0.28, 0.56, 0.32, 0.42, 0.48,
        0.7, 0.28, 0.42, 0.26, 0.56, 0.28, 0.4, 0.3, 0.72, 0.28, 0.42, 0.3, 0.54, 0.3, 0.42, 0.44,
        0.66, 0.3, 0.4, 0.28, 0.6, 0.3, 0.4, 0.26, 0.76, 0.32, 0.46, 0.3, 0.58, 0.34, 0.46, 0.52,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      // ⚠️ 17 ms of decay where `curve: 8.5` over 0.026 s gave 3, and the gain comes down as the note
      // grows — `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` has the argument and the reason
      // the attack and the band do not move. Six places carried this one line.
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.07, gain: 0.1, attack: 0.0004, curve: 4, lowFrom: 10000, highFrom: 4800 },
    },
  ],

  /*
    ── THE LAMENT: the one line in the place that is not afraid, and it is four bars long ───────────
  */
  lead: [
    {
      steps: [
        12, _, _, _, 10, _, 12, _,
        15, _, _, _, 14, _, _, _,
        12, _, _, _, 10, _, 8, _,
        7, _, _, _, _, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.9, gain: 0.13, attack: 0.11, curve: 1.25, lowFrom: 2200, lowTo: 1100, q: 1.4 },
    },
    {
      steps: [
        12, _, _, _, 10, _, 12, _,
        15, _, _, _, 14, _, _, _,
        12, _, _, _, 10, _, 8, _,
        7, _, _, _, _, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 1.9, gain: 0.09, attack: 0.14, curve: 1.2 },
    },
  ],

  /*
    ── THE CANON: `surge`, and it is the whole idea of the level arriving as a section ──────────────

    ⚠️ **`RUNG_CLOSES` TAKES `call` AWAY IN THE SAME BREATH** — `src/content/music.ts` — so the tune
    does not double, it HANDS OVER. What the player has been following stops, and the same tune starts
    again a phrase behind, played by something with a harder edge on it. That is a section boundary
    made of an arrangement rather than of a gain, which is
    `docs/decisions/0120-a-rung-may-close-a-layer.md`'s own subject.
  */
  counter: [
    {
      steps: CHASE,
      pitched: true,
      perBeat: 1,
      octave: 2,
      accents: [1, 0.7, 0.9, 0.72],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.1, gain: 0.19, attack: 0.012, curve: 2, lowFrom: 3200, lowTo: 1300, q: 1.7 },
    },
    {
      steps: CHASE,
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.7, 0.9, 0.72],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.1, gain: 0.1, attack: 0.02, curve: 1.9, lowFrom: 1500, lowTo: 700, q: 1.5 },
    },
    {
      steps: SCRAPE,
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: LIMP,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.065, attack: 0.004, curve: 3.2, lowFrom: 1250, lowTo: 560, q: 1.5 },
    },
  ],

  /*
    ── THE DOOR: a slam, and the room it happens in ────────────────────────────────────────────────

    ⚠️ **A HIT AND NOT A SWELL, which is the opposite choice to Ember Nebula's.** A cathedral swells
    because there is somewhere for the sound to go; a corridor does not, so what arrives at `surge`
    here is an impact with a short tail on it — stone, and then nothing.

    ⚠️ **AND IT WAS A POLITE ONE: 14 dB UNDER `stomp`'s PEAK AND 24 dB UNDER `sub`'s MATERIAL.** Two
    events every four bars is the sparsest pattern in the place, so RMS libels it exactly as
    `docs/decisions/0140-no-layer-is-inaudible.md` describes — but the PEAK agreed with the RMS here,
    which is what separates this from `perc`: the door was genuinely being shut quietly. +6.2 dB, and
    the solve reads **4.52 → 2.35**.

    ⚠️ **IT IS OFF THE BEAT NOW, AND THAT IS WHY IT CAN BE LOUD.** On beat one it landed inside the
    collective onset of thirteen layers — `scripts/weigh-mix.mjs` had `approach` at 98.2% of the
    clipping ceiling **before** any of this, and every decibel added to the slam went straight into
    that one millisecond. Moved to the middle of the bar it costs the ceiling almost nothing, and the
    picture is better for it twice over: a door that shuts on the downbeat is a drum, and this place's
    own `engine` already says why the interesting one is *"the sound that makes a listener look up,
    which is the whole reason it is not on a grid anybody can follow."* Eighths, so it can sit in the
    gap rather than on either side of it.

    ⚠️ **THE TAIL IS WHERE THE REST OF THE MATERIAL WENT.** `curve: 3.4` over 0.85 s was 250 ms of
    decay; the slam now runs 440, which is a stone corridor and not a swell —
    `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` for why the number beside `seconds` was never
    the length.
  */
  crash: [
    {
      steps: [
        _, _, _, _, _, 1, _, _, _, _, _, _, _, _, _, _,
        _, _, _, 0.84, _, _, _, _, _, _, _, _, _, _, _, _,
      ],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 1.15, gain: 0.145, attack: 0.0012, curve: 2.6, lowFrom: 5200, lowTo: 900, highFrom: 300 },
    },
    {
      // The ring the slam leaves in the metal of the door. It is the tail the corridor does not give.
      steps: [
        _, _, _, _, _, 7, _, _, _, _, _, _, _, _, _, _,
        _, _, _, 2, _, _, _, _, _, _, _, _, _, _, _, _,
      ],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 3.6, gain: 0.115, attack: 0.004, curve: 1.5, lowFrom: 3400, lowTo: 1400, q: 2.2 },
    },
  ],

  /*
    ── THE DRIVE: sixteenths that do not stop, and they are two bars so they say nothing ────────────
  */
  drive: [
    {
      steps: [
        0, 3, 7, 3, 7, 12, 7, 12, 7, 3, 7, 3, 0, 3, 0, 3,
        0, 3, 7, 3, 7, 12, 7, 12, 7, 12, 7, 3, 0, 3, 0, 12,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: LIMP,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.17, gain: 0.055, attack: 0.003, curve: 3.8, lowFrom: 2800, lowTo: 1400, q: 2 },
    },
    {
      // The thud under it, so `approach` still has a floor when `groove` closes.
      steps: [1, _, 0.7, _, 0.88, _, 0.68, 0.64, 1, _, 0.72, _, 0.86, _, 0.7, 0.8],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'sine', from: 164, to: 56, seconds: 0.3, gain: 0.56, attack: 0.001, curve: 3.4, drive: 0.26 },
    },
  ],

  /*
    ── THE HORN: the thing that is hunting you, calling to something else ──────────────────────────

    ⚠️ **`toll` SITS AT −0.5 AND MAY NOT BE LOW**, so the size comes from the harmonics and not from
    the fundamental — a rasping saw an octave over where the instinct puts it, with the air of a very
    large lung behind it. `src/content/nebula.ts` learned this from a bell that was 49% under 130 Hz
    and passed every guard in the repository.

    ⚠️ **THE INTERVAL IS A FOURTH, WHICH IS WHAT A HUNTING HORN CAN ACTUALLY PLAY.** A natural horn
    has no valves; it sounds a harmonic series, and the two notes below are two of its members. It is
    also the one interval the drone has been holding for the whole level, arriving loud.
  */
  toll: [
    {
      steps: [0, _, 5, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.25, attack: 0.16, curve: 1.2, lowFrom: 1400, lowTo: 760, q: 1.7, drive: 0.18 },
    },
    {
      steps: [7, _, 12, _],
      pitched: true,
      perBeat: 0.25,
      octave: 2,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.12, attack: 0.24, curve: 1.2, lowFrom: 1800, lowTo: 1000, q: 1.5 },
    },
    {
      steps: [0, _, 5, _],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      note: { wave: 'tri', from: 0, to: 0, seconds: BEAT_SECONDS * 4, gain: 0.13, attack: 0.2, curve: 1.3, lowFrom: 860, lowTo: 500, q: 1.1 },
    },
    {
      // The wind in it — a horn this size is mostly moving air, and the air is what makes it an
      // animal answering rather than an instrument playing.
      steps: [1, _, 0.84, _],
      pitched: false,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 3.8, gain: 0.085, attack: 0.85, curve: 1.3, lowFrom: 800, lowTo: 2800, highFrom: 340, q: 0.8 },
    },
  ],

  /*
    ── THE DREAD: the tritone the scale already contains, held, and it is in bar eight already ─────
  */
  dread: [
    {
      steps: [2, 8, 2, 8],
      pitched: true,
      perBeat: 0.25,
      octave: 1,
      accents: [1, 0.92, 0.98, 1],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 4.2, gain: 0.1, attack: 0.46, curve: 1.05, lowFrom: 300, lowTo: 760, q: 2.6 },
    },
    {
      steps: [8, 2, 8, 2],
      pitched: true,
      perBeat: 0.25,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 4.4, gain: 0.19, attack: 0.44, curve: 1 },
    },
  ],

  /*
    ── THE HOUND ────────────────────────────────────────────────────────────────────────────────────

    ⚠️ **IT IS FASTER THAN YOU AND THAT IS SAID WITH A GALLOP.** Everything under this level has been
    a two-legged run — a footfall on the limp grid, a heartbeat in pairs. The fight opens on four legs:
    a `da-da-DUM` at thirty-seconds, which is the same acceleration
    `docs/decisions/0136-the-place-has-a-room-and-an-arc.md` asked for and is also, plainly, a
    different animal.
  */
  stomp: [
    {
      /*
        THE GALLOP. Two light and one heavy, twice a bar, with the heavy one on the half-bar rather
        than on the beat — so the fight is not the floor speeding up, it is something arriving from a
        direction the level has not used.
      */
      steps: [
        0.62, _, 0.68, 1, _, _, 0.6, _, 0.66, 0.96, _, _, 0.64, 0.7, 0.9, _,
        0.62, _, 0.68, 1, _, _, 0.62, _, 0.68, 0.98, _, 0.6, 0.66, 0.74, 0.94, 0.8,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'sine', from: 126, to: 28, seconds: 0.4, gain: 0.42, attack: 0.001, curve: 2.6, drive: 0.44 },
    },
    {
      /*
        THE CLAWS. Thirty-seconds of dry metal on stone — the fastest thing in the game by a factor of
        two, and it exists only in the fight, so the tempo has not moved and the level plainly has.
      */
      steps: [
        _, 0.3, _, 0.42, _, 0.28, 0.34, 0.26, _, 0.32, _, 0.44, _, 0.3, 0.36, 0.28,
        _, 0.3, 0.26, 0.42, _, 0.28, 0.34, 0.24, _, 0.34, _, 0.4, 0.26, 0.32, 0.38, 0.3,
        _, 0.32, _, 0.44, _, 0.28, 0.36, 0.26, _, 0.3, 0.26, 0.42, _, 0.3, 0.34, 0.26,
        _, 0.3, 0.28, 0.42, 0.26, 0.32, 0.36, 0.28, 0.3, 0.34, 0.32, 0.46, 0.28, 0.34, 0.42, 0.38,
      ],
      pitched: false,
      perBeat: 8,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.04, gain: 0.115, attack: 0.0006, curve: 6.5, lowFrom: 6200, lowTo: 2400, highFrom: 900 },
    },
    {
      steps: [
        0.38, _, 0.3, _, 0.34, _, 0.28, _, 0.38, _, 0.3, _, 0.34, _, 0.3, 0.32,
        0.38, _, 0.3, _, 0.36, _, 0.28, _, 0.4, _, 0.32, _, 0.36, _, 0.32, 0.34,
      ],
      pitched: false,
      perBeat: 4,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: 0.022, gain: 0.05, attack: 0.0004, curve: 8, lowFrom: 12000, highFrom: 6200 },
    },
  ],

  frenzy: [
    {
      /*
        THE SCRABBLE. The spiral, taken apart — sixteenths that snap between the tritone's two notes
        with the fourth leaning on them, over eight bars, so the figure is longer than the four-bar
        phrase the listener has been counting in and the fight stops fitting the level's own shape.
      */
      steps: [
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, 2, _,
        5, _, 2, 5, 8, _, 5, _, 2, 5, _, 2, 5, 8, _, 5,
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, 8, _,
        3, _, 2, 3, 8, _, 3, _, 2, 3, _, 2, 3, 8, _, 3,
        2, _, 8, 2, 8, _, 2, _, 8, 2, 8, 2, 8, 2, 8, 2,
      ],
      pitched: true,
      perBeat: 4,
      octave: 1,
      accents: LIMP,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.085, attack: 0.002, curve: 4.6, lowFrom: 2800, lowTo: 1000, q: 2.4, drive: 0.55 },
    },
    {
      steps: [
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, 8, _,
        2, _, 5, 2, 8, _, 2, _, 5, 2, _, 5, 2, 8, _, 2,
        8, _, 2, 8, 7, _, 8, _, 2, 8, _, 2, 8, 7, _, 8,
        2, _, 8, 2, 5, _, 2, _, 8, 2, _, 8, 2, 5, 2, _,
        8, _, 3, 8, 2, _, 8, _, 3, 8, _, 3, 8, 2, _, 8,
        8, _, 2, 8, 2, _, 8, _, 2, 8, 2, 8, 2, 8, 2, 8,
      ],
      pitched: true,
      perBeat: 4,
      octave: 2,
      accents: LIMP,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 0.16, gain: 0.05, attack: 0.002, curve: 4.8, lowFrom: 4800, lowTo: 2000, q: 1.9, drive: 0.48 },
    },
  ],

  wraith: [
    {
      /*
        THE BAYING. Held notes a minor second apart — E against F, then B against C — driven until the
        tone comes apart. It is the same construction Ember Nebula's screaming choir uses, and it is
        here because a howl and a scream fail in the same way: the fundamental survives and everything
        above it turns to noise.
      */
      steps: [
        8, _, 7, _, 8, _, 7, _,
        3, _, 2, _, 3, _, 2, _,
        8, _, 7, _, 8, _, 7, 8,
        2, _, 3, _, 2, _, 3, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 1,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 1.05, gain: 0.07, attack: 0.09, curve: 1.7, lowFrom: 1700, lowTo: 600, q: 2.6, drive: 0.8 },
    },
    {
      steps: [
        7, _, 8, _, 7, _, 8, _,
        2, _, 3, _, 2, _, 3, _,
        7, _, 8, _, 7, _, 8, 7,
        3, _, 2, _, 3, _, 2, _,
      ],
      pitched: true,
      perBeat: 1,
      octave: 0,
      accents: [1, 0.7, 0.88, 0.66],
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 1.1, gain: 0.048, attack: 0.1, curve: 1.6, lowFrom: 1150, lowTo: 460, q: 2.1, drive: 0.7 },
    },
  ],

  /*
    ── THE AURA: how many corners away it is ────────────────────────────────────────────────────────

    ⚠️ **These two are the only layers in the game whose gain is a DISTANCE** —
    `docs/decisions/0091-the-boss-has-an-aura.md` — and in a maze that is the only question the player
    has. The slow one is baying somewhere ahead; the fast one is panting, and it is the one that says
    *it is in this corridor*.
  */
  auraSlow: [
    {
      steps: [8, _, 2, _, 8, _, 2, _],
      pitched: true,
      perBeat: 1,
      octave: 1,
      note: { wave: 'saw', from: 0, to: 0, seconds: BEAT_SECONDS * 2.4, gain: 0.26, attack: 0.3, curve: 1.5, lowFrom: 320, lowTo: 720, q: 1.5 },
    },
    {
      steps: [2, _, 8, _, 2, _, 8, _],
      pitched: true,
      perBeat: 1,
      octave: 0,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 2.5, gain: 0.34, attack: 0.34, curve: 1.35 },
    },
    {
      // The room the baying comes down. Broad, slow, and it is the one thing in this place that is
      // allowed to sound large.
      steps: [1, _, 1, _, 1, _, 1, _],
      pitched: false,
      perBeat: 1,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 2.3, gain: 0.1, attack: 0.36, curve: 1.4, lowFrom: 560, lowTo: 1800, highFrom: 200, q: 0.7 },
    },
  ],

  auraFast: [
    {
      // THE PANTING. Two short breaths a beat, doubling as it closes — the fast aura's whole job is
      // to be a rate rather than a note, and this is the rate of something that has been running.
      steps: [1, 0.66, 1, 0.66, 1, 0.68, 1, 0.66, 1, 0.7, 1, 0.66, 1, 0.72, 1, 0.7],
      pitched: false,
      perBeat: 2,
      octave: 0,
      note: { wave: 'noise', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.14, attack: 0.02, curve: 3.6, lowFrom: 2400, lowTo: 800, highFrom: 420, q: 0.9 },
    },
    {
      steps: [2, _, 2, _, 2, _, 2, _, 8, _, 8, _, 8, _, 8, _],
      pitched: true,
      perBeat: 2,
      octave: 2,
      note: { wave: 'square', from: 0, to: 0, seconds: BEAT_SECONDS * 0.24, gain: 0.15, attack: 0.004, curve: 5.5, lowFrom: 2600, lowTo: 800, q: 1.9 },
    },
    {
      steps: [_, 8, _, 8, _, 8, _, 8, _, 2, _, 2, _, 2, _, 2],
      pitched: true,
      perBeat: 2,
      octave: 3,
      note: { wave: 'sine', from: 0, to: 0, seconds: BEAT_SECONDS * 0.2, gain: 0.12, attack: 0.003, curve: 6.5 },
    },
  ],
};
