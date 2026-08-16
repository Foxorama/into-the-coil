/**
 * What each layer IS — and therefore what a listener should be able to do with it.
 *
 * `docs/decisions/0154-the-mix-is-authored-as-intent.md`.
 *
 * ── WHY THIS REPLACES 428 HAND-SET NUMBERS ──────────────────────────────────────────────────────
 *
 * ⚠️ **Reported 2026-08-16, after `docs/decisions/0152-a-layer-is-heard-in-the-sum.md` measured it:**
 * *"There's a whole bunch of rules and guardrails around the music that's causing a whole heap of
 * boundaries and guidelines that keep causing problems… the reason music has taken so long is because
 * of this problem, I keep asking for different things that already exist, but aren't hearable."*
 *
 * ⚠️ **WHAT A PLAYER HEARS WAS SET IN TWO INDEPENDENT TABLES THAT MULTIPLY, AND NEITHER ONE ALONE
 * MEANS ANYTHING.** `MUSIC_LADDER[rung][layer]` is 169 numbers, `THEMES[place].mix[layer]` is 259
 * more, and the product is the only quantity that matters. **Nothing anywhere stated what the
 * listener was supposed to be able to pick out**, so when something could not be heard the answer was
 * always another layer or another gain — which is how twenty-three layers and four hundred numbers
 * happened.
 *
 * ⚠️ **AND THE RULE SET FORBADE ITS OWN ANSWER.** `MIX_CEILING` is 2.6 and `mixOf` silently CLAMPS to
 * it. Solved, the layers the player could not hear want **2.9 to 5.9** — so the table could say one
 * thing and the mixer play another, with nothing reporting the difference. `arp` reads exactly 2.60
 * in two places because somebody drove it into the wall and the wall said nothing.
 *
 * ── WHAT IS AUTHORED HERE, AND WHAT IS DERIVED ──────────────────────────────────────────────────
 *
 * ⚠️ **A ROLE IS A CLAIM ABOUT THE LISTENER, NOT ABOUT A FADER.** *Follow this. Hear this under it.
 * Feel this. Do not notice this.* Those are the four things a mix can ask of a part, and they are
 * what a gain was always a clumsy proxy for.
 *
 * ⚠️ **THE ARRANGEMENT IS GLOBAL BECAUSE EVERY PLACE ALREADY DOCUMENTS THE SAME ONE.** All seven
 * headers in `src/content/` carry the same table: `run` opens the drone, sub, engine, perc, chords,
 * groove and call; `push` opens arp, ride, hook and lead; `surge` opens counter, crash and drive;
 * `approach` opens toll and dread; the boss opens stomp, frenzy, wraith and the aura. **That was
 * authored seven times and read as content once.**
 *
 * ⚠️ **A PLACE DEVIATES BY PROMOTING, WHICH IS `docs/decisions/0147-a-place-is-a-balance.md`'s OWN
 * SUBJECT.** 0147 found that *"the loud part of every place was a sub, a kick, a bass and a pad, and
 * those are the same four sounds in all seven"* and answered it with 259 numbers. What actually makes
 * Ember Nebula a different place is that **its choir is the thing you follow** — a role, not a
 * multiplier — and `PROMOTES` below says so in one line per place.
 */

import type { MusicLayer, MusicLevel } from './music.ts';
import type { ThemeKind } from './themes.ts';

/**
 * The four things a mix can ask of a part, quietest first.
 *
 * ⚠️ **CLOSED, AND THE ORDER IS THE ORDER THEY SIT IN** — `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 */
export const MUSIC_ROLES = ['air', 'bed', 'pulse', 'counter', 'part'] as const;

export type MusicRole = (typeof MUSIC_ROLES)[number];

/**
 * How far over everything else a role sits, in dB, in the best band it lives in.
 *
 * ── THE ONLY NUMBERS LEFT, AND THERE ARE FIVE ───────────────────────────────────────────────────
 *
 * ⚠️ **THESE ARE THE QUANTITY `heardAt` MEASURES** — 0152's `margin` — so the thing authored and the
 * thing guarded are one description. Every previous mix number in this project was a gain, which
 * 0140 established *"is not a loudness"*, which is why none of them could be checked against a
 * report.
 *
 * ⚠️ **A HAND'S GUESS, MARKED AS ONE, on `AUDIBLE_FLOOR_DB`'s terms.** What is defensible is the
 * ORDER and the SPACING: a part above everything, a counter-line just under it, a pulse you can pick
 * out when you attend to it, a bed you feel, and air you never notice. The absolute values want an
 * ear and have not had one yet.
 *
 * ⚠️ **`air` IS NOT A FAILURE STATE, WHICH IS THE DISTINCTION NOTHING HERE HAS EVER HAD.** `drone` is
 * the connective tissue and is *meant* to sit under everything —
 * `reports/what-the-mix-buries-2026-08-16.md` found it in the worst twenty in six places, and it is
 * the one layer there that is working as designed. A guard that says *every layer must be audible*
 * would flag it every time, which is why 0152 refused to set one.
 */
export const ROLE_MARGIN_DB: Record<MusicRole, number> = {
  part: 3,
  counter: -2,
  pulse: -6,
  bed: -9,
  air: -13,
};

/**
 * The arrangement: what every sounding layer is AT EACH RUNG.
 *
 * ── A ROLE BELONGS TO THE RUNG, AND THE SOLVE PROVED IT BY REFUSING TO CONVERGE ─────────────────
 *
 * ⚠️ **THE FIRST VERSION GAVE EACH LAYER ONE ROLE FOR THE WHOLE GAME, AND IT IS UNSATISFIABLE.**
 * `part` means *louder than everything else together*; three layers cannot each be 3 dB over the sum
 * of the rest. The solver ran its four-hundred-iteration ceiling and left `call`, `hook` and `chords`
 * all short of the same target — **not a bug, an over-determined system stating its own
 * contradiction**, and the clearest evidence available that a mix has ONE thing you follow at a time.
 *
 * ⚠️ **AND THE FIX IS ALREADY THIS PROJECT'S OWN FINDING.**
 * `docs/decisions/0125-the-build-starts-sooner.md` established that **only arrivals are heard**, and
 * `docs/decisions/0120-a-rung-may-close-a-layer.md` that *"a rung that closes a layer as it opens two
 * is a change of arrangement rather than a thicker one."* A layer arrives as the part and recedes as
 * the next thing arrives. That is what an arrangement IS, and it is what the seven place headers have
 * been describing in prose all along.
 *
 * ⚠️ **EXACTLY ONE `part` PER RUNG, and `tests/arrangement.test.ts` holds it** — with every sounding
 * layer named exactly once, so a layer a rung opens cannot be silently left out of the mix's
 * intentions.
 */
export const ARRANGEMENT: Record<Exclude<MusicLevel, 'calm' | 'bossPeak'>, Readonly<Record<MusicRole, readonly MusicLayer[]>>> = {
  // The hymn, over a bed. The one melodic thing in a level's opening — 0113.
  run: {
    part: ['call'],
    counter: [],
    pulse: ['perc'],
    bed: ['sub', 'engine', 'chords', 'groove'],
    air: ['drone'],
  },
  // The riff arrives and the hymn steps under it; the mixture and the lead answer.
  push: {
    part: ['hook'],
    counter: ['arp', 'lead', 'call'],
    pulse: ['perc', 'ride'],
    bed: ['sub', 'engine', 'chords', 'groove'],
    air: ['drone'],
  },
  // The counter-melody takes over — 0120's `surge` closes `call` and `arp` to make room for it.
  surge: {
    part: ['counter'],
    counter: ['hook', 'lead', 'drive'],
    pulse: ['perc', 'ride', 'crash'],
    bed: ['sub', 'engine', 'chords', 'groove'],
    air: ['drone'],
  },
  // The tritone is the subject from here on. 0120's `approach` closes `groove` and `hook`.
  approach: {
    part: ['dread'],
    counter: ['counter', 'lead', 'drive', 'toll'],
    pulse: ['perc', 'ride', 'crash'],
    bed: ['sub', 'engine', 'chords'],
    air: ['drone'],
  },
  // The fight: a different piece — 0114 — and the sparsest bed in the game under it.
  boss: {
    part: ['dread'],
    counter: ['drive', 'toll', 'frenzy', 'wraith'],
    pulse: ['perc', 'ride', 'crash', 'stomp'],
    bed: ['sub', 'engine'],
    air: ['drone'],
  },
};

/**
 * The title's own arrangement, which is two layers and a drone.
 *
 * ⚠️ **SEPARATE BECAUSE IT IS A DIFFERENT PIECE** — `TITLE_ONLY`, and
 * `docs/decisions/0095-the-level-has-its-own-music.md`'s whole subject. `bassOnly` is `part` because
 * the title screen is the one arrangement with nothing else in it to be masked by.
 */
export const TITLE_ARRANGEMENT: Readonly<Record<MusicRole, readonly MusicLayer[]>> = {
  part: ['bass'],
  counter: [],
  pulse: ['beat'],
  bed: [],
  air: ['drone'],
};

/**
 * What each place lifts, and it is the whole of how one place differs from another.
 *
 * ⚠️ **ONE LINE A PLACE, WHERE 0147 SPENT 259 NUMBERS.** A promotion moves a layer one role UP for
 * that place only — the choir you follow in Ember Nebula is a bed everywhere else, and that single
 * fact is what *"haunting hymns"* means as a mix rather than as a sentence.
 *
 * ⚠️ **IT IS ALSO WHAT KEEPS 0147's GUARD GREEN.** `apartBy` requires no two places within 3 dB of
 * each other's balance; a global arrangement with no deviations would make all seven identical and
 * fail it, which is the defect 0147 exists for arriving through its own replacement.
 */
/*
  ⚠️ **A PROMOTION NAMES THE ROLE IT WANTS, RATHER THAN MOVING ONE NOTCH.** The first version stepped
  a layer up one place in `MUSIC_ROLES`, and it could not say what Ember Nebula is: its choir is a
  `bed` everywhere else, and *"haunting hymns"* means the listener FOLLOWS it — two steps, not one.
  Naming the destination is also the version a reader can check against the place's own header
  without counting.
*/
/*
  ⚠️ **A PROMOTION MAY NOT NAME `part`, AND THAT IS THE ARRANGEMENT'S ONE INVARIANT PROTECTED.**
  Exactly one thing is followed at a time; a place that could appoint a second would reintroduce the
  contradiction `ARRANGEMENT` above was written to remove. A place emphasises by lifting something to
  a **counter-line** or a **pulse** — which is what *"a corridor, and something breathing in it"*
  actually means as a mix. `tests/arrangement.test.ts` refuses a `part` here.
*/
export const PROMOTES: Record<ThemeKind, Partial<Record<MusicLayer, Exclude<MusicRole, 'part'>>>> = {
  // The base composition, which level one plays unmixed and which every promotion is measured against.
  approach: {},
  // *"Haunting hymns"* — the choir answers the hymn, the pedalboard is the pulse under it.
  nebula: { chords: 'counter', groove: 'pulse' },
  /*
    *"Full hands-in-the-air"* — the floor is the subject, so the kick steps up out of the bed and the
    bassline becomes a line you can follow rather than a foundation you stand on.

    ⚠️ **IT SAID `arp: 'counter'` AND THAT WAS A NO-OP**, caught by `tests/arrangement.test.ts` on its
    first run: `arp` is already a counter-line at `push`, which is the only rung that opens it. A
    promotion that promotes nothing is a line of documentation wearing a mix decision's clothes.
  */
  saurian: { engine: 'pulse', groove: 'counter' },
  // *"A corridor, and something breathing in it"* — the pulse IS the place.
  labyrinth: { perc: 'counter', ride: 'counter' },
  // *"It rings… it cracks"* — the glass is a line rather than a pad, and the crack steps out of the kit.
  rime: { chords: 'counter', crash: 'counter' },
  // *"Still water with something under it"* — the whole bottom steps up out of the bed.
  mire: { sub: 'pulse', engine: 'pulse' },
  // *"The riff"* — the metal kit is forward, which is what makes this place the loud one.
  core: { engine: 'pulse', stomp: 'counter' },
};

/**
 * Every layer whose gain the solve owns.
 *
 * ⚠️ **THE AURA IS EXCLUDED BECAUSE ITS GAIN IS A DISTANCE THE PLAYER STEERS** — 0091 and 0107. A
 * target margin for it would be a claim about a quantity the mix does not own, and the first solve
 * written without this exclusion spent four hundred iterations failing to out-shout a boss that was
 * not on the field yet.
 */
export const SOLVED_BY = (layer: MusicLayer): boolean => layer !== 'auraSlow' && layer !== 'auraFast';

/** What the arrangement says at `rung`, before any place has an opinion. */
export function rolesAt(rung: MusicLevel): Readonly<Record<MusicRole, readonly MusicLayer[]>> | null {
  if (rung === 'calm') return TITLE_ARRANGEMENT;
  // The peak is the fight with more of it — 0114 — so it keeps the fight's arrangement.
  return ARRANGEMENT[rung === 'bossPeak' ? 'boss' : rung] ?? null;
}

/**
 * `layer`'s role at `rung` in `theme`, or `null` if the arrangement does not sound it there.
 *
 * ⚠️ **A PROMOTION ONLY EVER LIFTS.** A place naming a role BELOW the arrangement's would be a place
 * quietly deleting a part, which is the failure `PROMOTES` is bounded to prevent; the higher of the
 * two wins and `tests/arrangement.test.ts` holds that it is a real lift.
 */
export function roleOf(theme: ThemeKind | undefined, rung: MusicLevel, layer: MusicLayer): MusicRole | null {
  const at = rolesAt(rung);
  if (at === null) return null;
  let base: MusicRole | null = null;
  for (const role of MUSIC_ROLES) if (at[role].includes(layer)) base = role;
  if (base === null) return null;
  const lifted = theme === undefined ? undefined : PROMOTES[theme][layer];
  if (lifted === undefined) return base;
  return MUSIC_ROLES.indexOf(lifted) > MUSIC_ROLES.indexOf(base) ? lifted : base;
}
