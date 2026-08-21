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
 * ⚠️ **AND THE RULE SET FORBADE ITS OWN ANSWER.** `MIX_CEILING` was 2.6 and `mixOf` silently CLAMPED
 * to it. Solved, the layers the player could not hear want **2.9 to 5.9** — so the table could say one
 * thing and the mixer play another, with nothing reporting the difference. `arp` read exactly 2.60
 * in two places because somebody drove it into the wall and the wall said nothing.
 *
 * ⚠️ **THIS PARAGRAPH WAS WRITTEN ON 2026-08-16 AND THE WALL CAME DOWN ON 2026-08-19** —
 * `docs/decisions/0182-a-mix-number-has-no-band.md`. Three days, three decisions and one player report
 * later: *"the music is restricted and has been for ages with gains, sound limits and all sorts of
 * what seem like artificial restrictions."* **Naming a defect is not fixing it**, and this file is
 * where the naming happened.
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
 * out when you attend to it, a bed you feel, and air you never notice.
 *
 * ⚠️ **THE VALUES HAVE STILL NOT HAD AN EAR AND THE TABLE BELOW HAS** —
 * `docs/decisions/0187-the-kick-is-the-pulse.md`. Reported: *"sub and engine in a lot of places are
 * barely audible."* Nothing was adrift, because `ARRANGEMENT` said the kick and the kit were a
 * **bed** — *a bed you feel* — so the mix was faithfully delivering an arrangement that asked for
 * exactly what the player could not hear. **The five numbers here did not move; what a layer IS did.**
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
/*
  ── `sub` AND `engine` ARE THE PULSE AT EVERY RUNG, AND THEY WERE THE BED ──────────────────────────

  ⚠️ **`docs/decisions/0187-the-kick-is-the-pulse.md`**, answering *"sub and engine in a lot of places
  are barely audible as well."* Every guard was green: a `bed` is a layer you feel rather than notice,
  so the mix was keeping a promise nobody wanted it to keep.

  ⚠️ **AND THREE PLACES HAD ALREADY WORKED AROUND IT BY HAND**, which is the part worth transferring.
  `PROMOTES` below had Saurian Belt lifting `engine` out of the bed, The Black Heart lifting `engine`,
  and The Toxic Mire lifting **both** — its comment reads *"the whole bottom steps up out of the
  bed."* **A workaround written three times is a table that is wrong**, and making it global turned
  all three into no-ops that `tests/arrangement.test.ts` caught on the next run.

  ⚠️ **WHAT IT COST IS FOURTEEN LIFTS ACROSS FIVE PLACES**, in `src/content/themes.ts`: The Labyrinth
  needed `sub` more than doubled at `surge`, `approach` and `boss`; The Black Heart needed it 2.4×
  in the fight. **The guard is the forcing function** — 0164 fails until the mix delivers what the
  arrangement now claims, which is what a role is for.
*/
export const ARRANGEMENT: Record<Exclude<MusicLevel, 'calm' | 'bossPeak'>, Readonly<Record<MusicRole, readonly MusicLayer[]>>> = {
  // The hymn, over a bed. The one melodic thing in a level's opening — 0113.
  run: {
    part: ['call'],
    counter: ['bass'],
    pulse: ['sub', 'engine', 'perc', 'beat'],
    bed: ['chords', 'groove'],
    air: ['drone'],
  },
  // The riff arrives and the hymn steps under it; the mixture and the lead answer.
  push: {
    part: ['hook'],
    counter: ['arp', 'lead', 'call', 'bass'],
    pulse: ['sub', 'engine', 'perc', 'ride', 'beat', 'crash'],
    bed: ['chords', 'groove'],
    air: ['drone'],
  },
  // The counter-melody takes over — 0120's `surge` closes `call` and `arp` to make room for it.
  surge: {
    part: ['counter'],
    counter: ['hook', 'lead', 'drive', 'bass'],
    pulse: ['sub', 'engine', 'perc', 'ride', 'crash', 'beat'],
    bed: ['chords', 'groove'],
    air: ['drone'],
  },
  // The tritone is the subject from here on. 0120's `approach` closes `groove` and `hook`.
  approach: {
    part: ['dread'],
    counter: ['counter', 'lead', 'drive', 'toll', 'bass'],
    pulse: ['sub', 'engine', 'perc', 'ride', 'crash', 'beat'],
    bed: ['chords'],
    air: ['drone'],
  },
  // The fight: a different piece — 0114 — and the sparsest bed in the game under it.
  boss: {
    part: ['dread'],
    counter: ['drive', 'toll', 'frenzy', 'wraith', 'bass'],
    pulse: ['sub', 'engine', 'perc', 'ride', 'crash', 'stomp', 'beat'],
    bed: [],
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
 * ⚠️ **AND IT IS NOT WHAT KEEPS THE PLACES APART — `LEADS` ABOVE IS.** This paragraph used to say the
 * promotions held 0147's `apartBy` guard green; they did not, and could not. Measured, a global
 * arrangement with two promotions per place collapses the seven to **0.9–2.5 dB** where that guard
 * required 3. `docs/decisions/0155-a-place-follows-its-own-instrument.md` retired the guard on its
 * own stated condition and put the differentiation where a listener can hear it: **what you are
 * following**. A promotion is colour on top of that, not the thing itself.
 */
/*
  ⚠️ **A PROMOTION NAMES THE ROLE IT WANTS, RATHER THAN MOVING ONE NOTCH.** The first version stepped
  a layer up one place in `MUSIC_ROLES`, and it could not say what Ember Nebula is: its choir is a
  `bed` everywhere else, and *"haunting hymns"* means the listener FOLLOWS it — two steps, not one.
  Naming the destination is also the version a reader can check against the place's own header
  without counting.
*/
/**
 * What each place FOLLOWS, where it disagrees with the arrangement.
 *
 * ── THE ONE THING THAT MAKES TWO LEVELS DIFFERENT, AND IT IS NOT A GAIN ─────────────────────────
 *
 * ⚠️ **Reported 2026-08-16, and it is the oldest complaint this project has:** *"one of the big
 * problems is every level sounds the same and that's what I've been trying to fix."*
 *
 * ⚠️ **[0147](../../docs/decisions/0147-a-place-is-a-balance.md) ANSWERED IT WITH 259 NUMBERS AND THE
 * REPORT SURVIVED THEM.** Its guard demanded that no two places sit within 3 dB of each other's
 * BALANCE; the seven shipped at 3.3–4.0 dB apart, satisfied it everywhere, and the player still hears
 * one level. **A place differing in how loud its layers are is not a place that sounds different** —
 * `docs/decisions/0155-a-place-follows-its-own-instrument.md` retires that guard and this replaces
 * it.
 *
 * ⚠️ **WHAT A LISTENER ACTUALLY TRACKS IS THE PART**, and until now every place tracked the same one
 * at the same moment: the hymn at `run`, the riff at `push`, the counter-melody at `surge`, the
 * tritone from the approach on. Seven places, one subject each rung, differing only in timbre and
 * level. **Here Ember Nebula follows its choir where The Black Heart follows its riff** — the same
 * rung, a different thing to listen to, which is what *somewhere else in the galaxy* means.
 *
 * ⚠️ **A LEAD DISPLACES RATHER THAN ADDS.** `roleOf` demotes the arrangement's part to a counter-line
 * wherever a place names its own, because one part per rung is what makes the solve satisfiable —
 * the invariant the first arrangement broke and spent four hundred iterations failing to.
 *
 * ⚠️ **AND A PLACE NEED NOT DISAGREE.** An empty row is a place that plays the composition's own
 * shape, which is what level one is for.
 */
export const LEADS: Record<ThemeKind, Partial<Record<MusicLevel, MusicLayer>>> = {
  // The base composition. It IS the arrangement, so it never disagrees with it.
  approach: {},
  /*
    *"Haunting hymns… pipe organs… hellish, discordant"* — the choir sings the level, the mixture
    takes the push, and the thing that arrives in the fight is the howl rather than the tritone.
  */
  nebula: { run: 'chords', push: 'arp', approach: 'toll', boss: 'wraith' },
  /*
    *"The floor arrives… full hands-in-the-air… space laser dinosaur"* — bassline, then the arp, then
    the riff.

    ⚠️ **`push` FOLLOWED `ride` AND `surge` FOLLOWED `drive`, AND NEITHER SURVIVES THE DESK** —
    `docs/decisions/0189-a-place-is-what-it-does-not-play.md`. The hats are a whisper now and the
    riff is what `surge` opens; a place that goes on naming a layer it has closed to 0.64 is
    `LEADS`' own documented failure — *"a lead the ladder never opens is a place following silence"* —
    one notch quieter and therefore not caught by that guard.

    ⚠️ **`run` IS UNCHANGED AND THE MATERIAL UNDER IT IS NOT.** `groove` is the jungle bass now
    rather than the octave bass, which is the same sentence about the level — *what you follow first
    here is the bottom* — with a different instrument saying it.
  */
  saurian: { run: 'bass', push: 'arp', surge: 'hook', approach: 'drive', boss: 'frenzy', bossPeak: 'frenzy' },
  // *"A corridor, and something breathing in it… the hound"* — footsteps, then the thing running.
  labyrinth: { run: 'perc', push: 'ride', approach: 'toll', boss: 'stomp' },
  // *"It rings… it cracks… the blizzard"* — glass, then the lead, then the weather.
  rime: { run: 'chords', push: 'lead', surge: 'lead', boss: 'wraith' },
  /*
    *"Still water with something under it… it is coming up"* — the bottom leads, which nothing else
    here does, and the thing rising takes over as it surfaces.

    ⚠️ **IT SAID `surge: 'toll'` AND THE LADDER DOES NOT OPEN `toll` UNTIL `approach`**, so the place
    was following silence for a whole section. Caught by `tests/arrangement.test.ts` on its first run
    with this table — the same class as the four no-op promotions it caught on its last.
  */
  mire: { run: 'sub', push: 'groove', surge: 'drive', approach: 'toll', boss: 'toll' },
  // *"The riff"*, *"the twin lead"*, *"inside it"* — the one place that follows what it is named for.
  core: { run: 'engine', surge: 'lead', approach: 'counter', boss: 'frenzy' },
};

/*
  ⚠️ **A PROMOTION MAY NOT NAME `part`, AND THAT IS THE ARRANGEMENT'S ONE INVARIANT PROTECTED.**
  Exactly one thing is followed at a time; a place that could appoint a second would reintroduce the
  contradiction `ARRANGEMENT` above was written to remove. A place emphasises by lifting something to
  a **counter-line** or a **pulse** — which is what *"a corridor, and something breathing in it"*
  actually means as a mix. `tests/arrangement.test.ts` refuses a `part` here.
*/
/**
 * What each place's OWN layers are, per rung. The role the shared arrangement cannot state.
 *
 * ── WHY THIS TABLE EXISTS AND WHY IT IS ONLY FOR THE FOUR ──────────────────────────────────────
 *
 * ⚠️ **`docs/decisions/0188-a-place-owns-four-slots.md`**, answering *"can we add different layers?
 * these are the exact kind of similarity issues that are blocking some of the differences I want on
 * different levels."*
 *
 * ⚠️ **`ARRANGEMENT` IS GLOBAL AND CANNOT NAME THESE.** It says what `drone` is because `drone` is
 * the same instrument in all seven places — which is the defect `node scripts/weigh-gesture.mjs`
 * measures, and the reason the four own slots carry no identity at all. Saurian Belt's `ownA` and
 * Rime Shelf's are not two versions of one thing.
 *
 * ⚠️ **A SLOT THAT SOUNDS WITHOUT A ROLE IS OUTSIDE 0164, WHICH IS THE ONLY REASON THIS IS REQUIRED
 * RATHER THAN OPTIONAL.** `roleOf` returns `null` for a layer the arrangement does not name and
 * `adriftAt` skips those, so an own layer with no role would be a layer whose audibility nothing
 * checks — which is the state
 * `docs/decisions/0172-a-place-opens-with-its-own-four.md` left seven layer-rungs in and
 * `docs/state-of-play.md` has been flagging since. **`tests/themes.test.ts` refuses it.**
 *
 * ⚠️ **IT IS NOT A SECOND `PROMOTES`.** That table lifts a SHARED layer and only ever lifts; this one
 * answers for a layer the shared table has no opinion about, and the guard holds it to the four own
 * slots alone. A place quietly demoting `sub` here would be
 * `docs/decisions/0187-the-kick-is-the-pulse.md` undone in a table nobody reads.
 */
export const OWN_ROLES: Record<ThemeKind, Partial<Record<MusicLevel, Partial<Record<MusicLayer, MusicRole>>>>> = {
  approach: {},
  nebula: {},
  /*
    ⚠️ **THE RAPTOR CALL IS A COUNTER-LINE AND NOT A PART**, which is the arithmetic and the music
    agreeing. One `part` per rung is the invariant that makes the solve satisfiable at all, and at
    `surge` this place already follows `counter`; what the call does is answer over the floor, twice
    in four bars. `src/content/saurian.ts` has what it is.
  */
  /*
    ⚠️ **`ownB` IS A `pulse` AT EVERY RUNG THE PLACE SOUNDS IT, WHICH IS FIVE** — 0189. It is the
    backbeat: a layer you keep time by rather than one you follow, which is what `pulse` means and
    is the role `beat` carries in `TITLE_ARRANGEMENT` for the same reason.

    ⚠️ **AND IT IS WHY THE BREAK IS HERE RATHER THAN IN `beat`.** `ARRANGEMENT` is global and its
    fight rungs name neither `bass` nor `beat`, so a place opening one sounds a layer `roleOf`
    answers `null` for — outside 0164 entirely, with nothing checking it can be heard. That is the
    hole `docs/decisions/0172-a-place-opens-with-its-own-four.md` left in seven layer-rungs and
    `docs/state-of-play.md` has been flagging since; 0189 does not widen it.
  */
  saurian: { surge: { ownA: 'counter' }, approach: { ownA: 'counter' } },
  labyrinth: {},
  rime: {},
  mire: {},
  core: {},
};

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

    ⚠️ **AND `engine: 'pulse'` WENT THE SAME WAY FOR THE OPPOSITE REASON** — 0187 made it true of every
    place, so the line this place wrote for itself became the arrangement's own. The same guard caught
    it, which is twice this table has been told it was documenting rather than deciding.
  */
  saurian: { groove: 'counter' },
  // *"A corridor, and something breathing in it"* — the pulse IS the place.
  labyrinth: { perc: 'counter', ride: 'counter' },
  // *"It rings… it cracks"* — the glass is a line rather than a pad, and the crack steps out of the kit.
  rime: { chords: 'counter', crash: 'counter' },
  /*
    *"Still water with something under it"* — and its promotion is EMPTY now, which is the finding
    rather than a loss. It read `{ sub: 'pulse', engine: 'pulse' }`, and 0187 made that true of every
    place: **three places had already promoted the kick or the kit out of the bed by hand**, which is
    the same conclusion the report reached by ear. A workaround written three times is a table that
    is wrong.
  */
  mire: {},
  // *"The riff"* — the metal kit is forward, which is what makes this place the loud one.
  core: { stomp: 'counter' },
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
  /*
    ⚠️ **A PLACE'S OWN SLOT IS ANSWERED HERE AND NOWHERE ELSE** — 0188. `ARRANGEMENT` is global and
    cannot name a layer whose identity differs per place, so the four own slots take their role from
    the place. **First, because there is nothing below it to fall back to**: the shared table has no
    entry for them and never will.
  */
  const own = theme === undefined ? undefined : OWN_ROLES[theme][rung]?.[layer];
  if (own !== undefined) return own;

  const at = rolesAt(rung);
  if (at === null) return null;
  let base: MusicRole | null = null;
  for (const role of MUSIC_ROLES) if (at[role].includes(layer)) base = role;
  if (base === null) return null;

  /*
    ⚠️ **THE PLACE'S OWN LEAD DISPLACES THE ARRANGEMENT'S, AND THE DISPLACED ONE STEPS DOWN.** One
    part per rung is the invariant that makes the solve satisfiable at all — so appointing a new one
    has to demote the old one in the same breath, or the place would be over-determined exactly the
    way the first arrangement was.
  */
  const lead = theme === undefined ? undefined : LEADS[theme][rung];
  if (lead !== undefined) {
    if (lead === layer) return 'part';
    if (base === 'part') return 'counter';
  }

  const lifted = theme === undefined ? undefined : PROMOTES[theme][layer];
  if (lifted === undefined) return base;
  return MUSIC_ROLES.indexOf(lifted) > MUSIC_ROLES.indexOf(base) ? lifted : base;
}
