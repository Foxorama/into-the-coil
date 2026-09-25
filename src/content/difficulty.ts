/**
 * How hard the game is, chosen before a run and fixed for its length.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`. Behaviour
 * rides the row: nothing downstream switches on a tier's name, it reads the numbers off the row.
 *
 * ── WHY THIS IS NOT AN ASSIST, AND CANNOT BE ONE ────────────────────────────────────────────────
 *
 * ⚠️ `docs/decisions/0024-the-accessibility-floor-is-settings.md` closes the assist ladder with **no
 * assist may ever make the game harder**, and `src/sim/assist.ts` is built so that the whole product
 * of settings can be proved monotone. That makes *"harder than the default"* literally
 * unrepresentable there — correctly. A player who turns the flashing down must not be playing a
 * harder game, and the ladder is what guarantees it.
 *
 * A tier is the other axis. It is chosen deliberately, it is a property of the RUN rather than of the
 * device, and its whole purpose is to be harder. The two are orthogonal and both have to exist:
 * `docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md`.
 *
 * ── ONE TUNED ROW, AND THE OTHER TWO ARE A MARGIN FROM IT ───────────────────────────────────────
 *
 * ⚠️ **`SAVIOR` is the only multiplier row anyone edits** —
 * `docs/decisions/0356-the-tuned-tier-is-savior.md`, which supersedes 0047's *the easiest tier
 * multiplies nothing*. Asked: *"Saviour difficulty should be the difficulty saviour is now and that's
 * the optimised difficulty. Burn … way harder than saviour by about the same margin that legend is
 * easier than saviour"*, and *"so that I don't have to go through and rejig it with every change I
 * make to saviour difficulty."* So Legend is `SAVIOR ÷ MARGIN` and Burn is `SAVIOR × MARGIN`, axis by
 * axis (`fireGap` the other way, being a gap), and a change to Savior moves both.
 *
 * ⚠️ **The content is still authored at one, and still the baseline** — `AUTHORED` below, which every
 * fixture and instrument stands on. What 0047 protected survives: one baseline, every tier a stated
 * departure from it. What changed is that the baseline is no longer a tier anybody plays.
 *
 * `tests/difficulty.test.ts` holds the derivation and the ordering. It holds none of the values.
 *
 * ── WHAT IS AND IS NOT SCALED ───────────────────────────────────────────────────────────────────
 *
 * ⚠️ **Nothing here touches the player's own numbers.** `SHIP_SPEED`, the flight response and the
 * auto-fire are the same on every tier — `docs/decisions/0037-the-ship-has-mass.md` settled them by
 * playing, and a tier that also moved them would mean the hand that settled them had settled one
 * third of a game. What a tier changes is what the level sends: how much killing it takes, how often
 * it shoots, and how fast it arrives.
 *
 * ⚠️ **And it does not change the SCRIPT.** A tier that added waves would make
 * `src/content/levels.ts` three levels wearing one name, and `tests/level.test.ts`'s lane and pacing
 * guards would then be checking one of them. Density is authored; toughness is a tier.
 */

import { onFireGrid } from './cadence.ts';

/**
 * Every tier, **easiest first**.
 *
 * ⚠️ **The order IS the list, and `tests/difficulty.test.ts` walks it in pairs.** A separate ordering
 * table beside a `Record` is two descriptions of one fact, which is the mistake
 * `src/content/sprites.ts` records the cost of; and *harder than the one before* is only a
 * well-formed statement about a sequence.
 */
export const DIFFICULTY_KINDS = ['legendary', 'savior', 'burn'] as const;

/** Derived from the list, so a tier cannot exist in the union and be missing from the table. */
export type DifficultyKind = (typeof DIFFICULTY_KINDS)[number];

export interface DifficultyRow extends Multipliers, CorridorLimit {
  /**
   * What the player picks, and what they would be called for finishing it.
   *
   * ⚠️ **A title rather than a grade.** *Easy · Normal · Hard* is what every game says and it is a
   * description of the software; these are descriptions of the pilot, which is the thing the player
   * is choosing to be. `docs/game.md`'s voice rule wants terse, not flavourless.
   */
  title: string;
  /**
   * The one line under it, and it exists because the titles do not sort themselves.
   *
   * ⚠️ **Disambiguation is not the over-explaining the voice rule bans.** *Let the Galaxy Burn* is
   * the most attractive of the three names and the hardest of the three tiers; a player who picks it
   * for the name has been misled by the screen rather than by themselves.
   */
  hint: string;
  /**
   * Lives a run starts with.
   *
   * ⚠️ **The one knob here that is about the RUN rather than about what arrives**, which is why it
   * is a count and not a multiplier. `STARTING_LIVES` was the single description of this and is now
   * the easiest tier's entry — `src/state/slices/run.ts` has the note.
   */
  lives: number;
  /**
   * Shields a life opens with — at the start of a run, after a death, and after a continue — and the
   * least a level boundary leaves the ship carrying.
   *
   * ⚠️ **A count and not a multiplier, like `lives`, and for the same reason: it is about the RUN.**
   * Asked for by tier: *"saviour — no change to behaviour; burn — no shields; legend — start with 3
   * shields and you start each level with 3 shields fully renewed"*, and *"start with full"* of a
   * death. `docs/decisions/0355-a-tier-opens-on-a-shell.md`. Zero is today's game exactly — a life
   * opens on the hull (0050) and a boundary carries what it had (0058) — so a tier at zero is not a
   * branch anywhere, it is arithmetic that adds nothing.
   */
  shellOpen: number;
  /**
   * The most shields a ship may carry on this tier.
   *
   * ⚠️ **The CHARACTER, and `MAX_SHIELDS` in `src/content/ships.ts` is the CEILING** —
   * `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`. The ceiling is the
   * shell pool's size and the most pips the readout can draw; this is what a tier lets the pilot
   * wear under it. `tests/tier-shell.test.ts` holds `shellOpen ≤ shellCap ≤ MAX_SHIELDS` as a budget
   * whose owner is the pool. At zero the tier is also never OFFERED a shield: a pickup the ship cannot
   * carry is withheld rather than thrown — 0355.
   */
  shellCap: number;
}

/**
 * The six things a tier MULTIPLIES — everything on the row that `SAVIOR` states and `MARGIN` moves.
 *
 * ⚠️ **Its own interface so that `MultiplierAxis` is its keys** — 0356. A seventh axis added here
 * without a margin, a direction and a derivation is a compile error rather than a tier that quietly
 * forgot to scale; the counts (`lives`, the shell) and the corridor are per-row literals and are
 * deliberately not in it.
 */
export interface Multipliers {
  /**
   * Multiplier on the health of everything that can be shot. Rounded up, never below one.
   *
   * Rounded UP so a tier can never make something take fewer shots than the tier below it — at 1.6 a
   * one-health drifter would round to 2 either way, and at 1.2 it would round to 1 while a
   * four-health warden went to 5. Down, the drifter would go to 1 and the ordering would hold by
   * luck rather than by construction.
   */
  toughness: number;
  /**
   * Multiplier on the steps between shots, for everything that shoots at the player. **Lower is
   * faster**, because the field it multiplies is a gap.
   *
   * ⚠️ It is the one field here that is inverted, and it is named `fireGap` rather than `fireRate`
   * for exactly that reason — `src/sim/assist.ts` makes the same argument for `playerDamage` over
   * `playerToughness`. The guard walks the tiers in pairs and knows which way each field goes.
   */
  fireGap: number;
  /** Multiplier on how fast an enemy closes on the player, on top of the camera's own advance. */
  closing: number;
  /**
   * Multiplier on the speed of everything fired at the player.
   *
   * ⚠️ **Separate from `closing`, because they are two different things to be bad at.** A faster
   * enemy is less time to decide; a faster bullet is less time to move. The middle tier raises the
   * first more than the second on purpose — a shot the player cannot outrun is a coin flip, and
   * `src/content/shots.ts` says the whole of what makes `spit` dodgeable is being slower than the
   * ship.
   */
  shotSpeed: number;
  /**
   * Multiplier on how hard a body that reacts to the player steers towards them.
   *
   * ── WHY THIS IS THE TIER AXIS THE PLAY-TEST ASKED FOR BY NAME ───────────────────────────────────
   *
   * Reported: *"they need to circle, double back etc and be actively dog-fighting with the player,
   * **it can be straightforward dog-fighting depending on difficulty**."*
   * `docs/decisions/0073-an-enemy-is-a-pilot.md`. So the reactive motions in
   * `src/content/enemies.ts` author a rate, and this is what a tier does to it: the easiest tier
   * gets a body that leans towards you, the hardest gets one that stays on you.
   *
   * ⚠️ **It reaches only the three REACTIVE motions.** A weave is a shape in the world and a roam
   * turns round at a fixed band; multiplying either would change a picture the level is authored
   * against rather than change how hard something is trying, which is the distinction between this
   * field and `closing`.
   *
   * ⚠️ **Higher is harder, like everything here except `fireGap`.**
   */
  aggression: number;
  /**
   * Multiplier on HOW MUCH ARRIVES: the shots in a boss's volley, the ceiling on adds a summons may
   * keep on the field, and the shards a shattering shot may open a volley with.
   *
   * ── WHY THE TIER HAD NO REACH INTO THIS AT ALL, AND WHAT IT COST ────────────────────────────────
   *
   * ⚠️ **Every field above scales TIME or TOUGHNESS, and none of them scales COUNT.** `fireGap` says
   * how often a volley comes, `shotSpeed` how long the player has to leave it, `toughness` how long
   * the fight runs. What arrives in one volley was the same number on every tier — so a pattern
   * attack, which is a question about *where is the gap* rather than *how long have I got* (0110),
   * was identical for a Legendary Pilot and for a tier named for ending runs.
   *
   * ⚠️ **MEASURED, AND IT IS THE PLAY REPORT THIS FIELD COMES FROM.** *"They're very cool explodey
   * ice attacks, but they end up having way too much screen space too fast… it's especially
   * problematic with the rime shelf boss because the adds target the player."* Counting the widest
   * run of lane that is both safe from the next three quarters of a second and reachable at the
   * ship's own speed, the frost ship's summon phase left **26 adds on the field at Legendary against
   * 40 at Burn** — a ratio of 1.4 across the whole difficulty range, on the thing that was killing
   * the player. `docs/decisions/0270-a-shattering-volley-is-counted-in-shards.md`.
   *
   * ⚠️ **It is NOT a licence to change the script**, which is the line the file header draws and this
   * field stands on the right side of: what a level SENDS is authored (0047), and every count this
   * scales belongs to a boss's volley or to a summons' ceiling — the fight, not the level.
   *
   * ⚠️ **Higher is harder, like everything but `fireGap`.** Its margin is Savior's own departure from
   * one, so the authored counts in `src/content/bosses.ts` are still the Legendary ones — 0356 — and
   * Burn's is pinned below the derivation, with the measurement, in `PINNED`.
   */
  crowd: number;
}

/** A tier's corridor — a per-row literal, not a multiplier, so it rides no margin. */
export interface CorridorLimit {
  /**
   * How tight and how twisting a walled corridor is flown at this tier —
   * `docs/decisions/0350-the-corridor-turns.md`.
   *
   * ⚠️ **THE PLAYER'S OWN NUMBERS, AND THE FIRST TIME A TIER REACHES THE LEVEL'S SHAPE.** Asked, of the
   * plan's three: *"do all 3 but per difficulty, saviour is 44, burn is 34, legend is 56."* A level
   * authors its corridor's turns once, as a shape; `narrowest` is how close its walls come at the
   * shape's tightest, in lane units, and `slope` is the steepest a wall may run, across per along — a
   * ceiling applied as the corridor is laid, so it holds by construction rather than by care.
   *
   * ⚠️ **IT CHANGES WHAT THE PLAYER SEES, WHICH THE HEADER SAYS A TIER DOES NOT** — and it is the
   * player's call rather than a slip: the turns are in the same places on every tier, and only how
   * hard they are moves.
   */
  corridor: { narrowest: number; slope: number };
}

/** Every multiplier axis — the keys of `Multipliers`, so a new axis is a compile error until it has a margin. */
export type MultiplierAxis = keyof Multipliers;

/** The tier the game is tuned for, and the one every other tier is derived from — 0356. */
export const TUNED: DifficultyKind = 'savior';

/**
 * The tuned tier's multipliers — **the only multiplier row anyone edits.** Change one and Legend and
 * Burn move with it; change the content and all three move, as they always did.
 *
 * ⚠️ **PLAY-TEST NUMBERS, every one**, on the same terms as `SHIP_SPEED` and `STARTING_LIVES`. The
 * target is stated: *"this should be hard for me, I should be able to get to level 4 with challenge"*,
 * and since 2026-09-22 *"that's the optimised difficulty."* Nothing asserts on any value here.
 */
export const SAVIOR: Multipliers = {
  toughness: 1.6,
  fireGap: 0.78,
  closing: 1.2,
  shotSpeed: 1.15,
  aggression: 1.3,
  /*
    ⚠️ **The gentlest multiplier on the row, and that is deliberate rather than timid.** A count does
    not cost the player linearly once a shot shatters — one frost shard is twelve flakes (0263) — so a
    fifth more shards is a fifth more of TWELVE, and the pool guard in `tests/frost.test.ts` is what
    says how much room is left to spend. The three above are what this tier leans on.
  */
  crowd: 1.15,
};

/**
 * How far one tier sits from the next, per axis: Legend is `SAVIOR ÷ MARGIN`, Burn `SAVIOR × MARGIN`.
 *
 * ⚠️ **ONE COLUMN, AND IT IS WHERE THE PLAYS TUNE** — *"burn … way harder than saviour by about the
 * same margin that legend is easier than saviour."* Every value is a hand's first guess against that
 * target, placed in `reports/the-tiers-planned-2026-09-22.md` with what checks each; nothing asserts
 * on any of them.
 *
 * ⚠️ **Per axis rather than one number**, because one scalar fails twice: a `toughness` margin under
 * Savior's own departure from one moves only bosses (`Math.ceil` leaves every small body where it
 * is), and `crowd` has a measured ceiling on Burn — see `PINNED`.
 *
 * - `toughness` 1.6 is Savior's own departure, so Legend is the content's health exactly — *"length
 *   is not difficulty"*, and below one it would shorten bosses and nothing else.
 * - `crowd` 1.15 likewise, so Legend's volleys are the authored counts.
 * - the four the player feels as TIME — `fireGap`, `closing`, `shotSpeed`, `aggression` — sit
 *   further out than Savior's own departure, so Legend is gentler than the content on each: *"we also
 *   need to make the bullets, enemies etc easier on legend on top of the shield changes."*
 */
export const MARGIN: Record<MultiplierAxis, number> = {
  toughness: 1.6,
  fireGap: 1.4,
  /*
    ⚠️ **1.25, AND THE PLAN'S GUESS WAS 1.3, WHICH A PLAY REPORT REFUSES.** 0105 holds nothing on
    screen for less than 1.8 seconds at the hardest tier — the charger was reported too fast at 1.38 —
    and Savior × 1.3 put Burn at 1.56, where the charger has 1.78. At 1.25 Burn is 1.5 and Legend 0.96.
    `tests/pilots.test.ts` is the ceiling on this number, and it is checked on Burn, where it binds.
  */
  closing: 1.25,
  shotSpeed: 1.25,
  aggression: 1.5,
  crowd: 1.15,
};

/**
 * Which way is harder, per axis: `1` where a bigger multiplier is harder, `-1` where it is easier.
 *
 * ⚠️ **`fireGap` is the one inverted axis**, named for being a gap (0047), and a derivation that
 * forgot it would give the hardest tier the slowest guns. Stated per axis rather than as an exception
 * so a seventh axis has to say which way it runs.
 */
export const HARDER: Record<MultiplierAxis, 1 | -1> = {
  toughness: 1,
  fireGap: -1,
  closing: 1,
  shotSpeed: 1,
  aggression: 1,
  crowd: 1,
};

/**
 * An axis a tier states rather than derives, with the measurement beside it.
 *
 * ⚠️ **A DEFAULT AND NOT A CONSTANT** — `docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md`:
 * the derivation is the fallback, and a row may override an axis where something was measured. A pin
 * does not move when Savior does, which is its cost, and why each one says what it is holding.
 */
export const PINNED: Record<DifficultyKind, Partial<Multipliers>> = {
  legendary: {},
  savior: {},
  burn: {
    /*
      ⚠️ **PINNED AT 1.8, AND THE DERIVATION SAYS 1.95 — AT WHICH A FIGHT NEVER ENDS.** Measured with
      `scripts/weigh-boss.mjs volans --difficulty=burn`, the arc, ship parked: aggression 1.7 (the old
      Burn) 132 s median; 1.8, 158 s; 1.87, 307 s; 1.95, **never** — the summons' adds hunt hard
      enough to stand between the arc and the boss for all ten minutes, 2,094 of them called. That
      is 0260's *a boss is fought to the end* broken on one gun, and it is a cliff rather than a slope,
      so the pin sits short of it. Legend keeps the whole margin.
    */
    aggression: 1.8,
    /*
      ⚠️ **PINNED AT 1.2, AND THE DERIVATION SAYS 1.32.** Every paragraph below was measured, and 1.3
      took room from ten fights of fourteen — so the margin that serves every other axis is refused
      here, on the one axis with a measured ceiling (`reports/the-tiers-planned-2026-09-22.md`).

      ⚠️ **A FIFTH MORE, AND IT WAS HALF AGAIN FOR ONE MEASUREMENT.** At 1.5 the frost ship's opening
      volley — authored at ONE shard, because one shard is twelve flakes — rounded to two, and the
      widest run of lane both safe and reachable at this tier fell to **1.5 units for a ship that is
      4 units of hurtbox**, with no answer at all for 2% of the phase. That is not a hard tier, it is
      the defect 0270 was reported for wearing a different hat. Rounding to nearest is what keeps the
      small counts where the content put them while the wide ones still grow.

      ⚠️ **AND IT CAME DOWN FROM 1.3, BECAUSE THIS AXIS REACHES FOURTEEN FIGHTS AND THE REPORT WAS
      ABOUT TWO.** `crowd` sits in `throwAttack`, so it scales every boss's volley and not only the
      ones that shatter. Measured across all fourteen at 1.3, it took room from ten of them. Nothing
      reached zero — `tests/crowd.test.ts` holds that over every fight — so this is a tuning number
      rather than a defect, and it is lower because a fix for the ice should not quietly cost a
      dozen fights room it was never about.

      ⚠️ **WHAT 1.2 ACTUALLY CHANGES IS NARROWER THAN IT LOOKS, AND SAYING SO IS THE POINT.** The
      counts are rounded to nearest, so a phase only moves where `base × 1.2` and `base × 1.3` land
      on different integers: a phase of 3 is 4 at both, of 5 is 6 against 7, of 7 is 8 against 9. The
      fight this number was first lowered FOR — the serpent's third phase, which lost thirteen units
      of reachable lane — is authored at 3 and is **unaffected by the change**. The measurement said
      so after the fact and the claim is corrected here rather than left standing: what 1.2 buys is
      the wide phases, not the tight one that prompted it. Sparing a phase of 3 needs 1.16 or below,
      which is a different decision about how much of an axis is left.
    */
    crowd: 1.2,
  },
};

/**
 * One tier's value on one axis, before any pin: Savior's, moved a margin per step away from Savior.
 *
 * ⚠️ **Steps are read off `DIFFICULTY_KINDS`**, so a fourth tier past Burn is a margin squared with
 * nothing else written, and a tier's place in the list is the only thing that says how hard it is.
 *
 * ⚠️ **Rounded to four places, because `toughnessFor` rounds UP.** Savior × margin in floating point
 * is 2.5600000000000005 on Burn's toughness, and `Math.ceil` of a body whose health × 2.56 is a whole
 * number would then add a hit nobody chose. Four places is finer than any number a hand places here.
 */
export function derivedFor(kind: DifficultyKind, axis: MultiplierAxis): number {
  const steps = DIFFICULTY_KINDS.indexOf(kind) - DIFFICULTY_KINDS.indexOf(TUNED);
  return Math.round(SAVIOR[axis] * MARGIN[axis] ** (steps * HARDER[axis]) * 1e4) / 1e4;
}

/** A tier's six multipliers: derived from Savior, except where the tier pins one. */
function multipliersFor(kind: DifficultyKind): Multipliers {
  const pin = PINNED[kind];
  return {
    toughness: pin.toughness ?? derivedFor(kind, 'toughness'),
    fireGap: pin.fireGap ?? derivedFor(kind, 'fireGap'),
    closing: pin.closing ?? derivedFor(kind, 'closing'),
    shotSpeed: pin.shotSpeed ?? derivedFor(kind, 'shotSpeed'),
    aggression: pin.aggression ?? derivedFor(kind, 'aggression'),
    crowd: pin.crowd ?? derivedFor(kind, 'crowd'),
  };
}

export const DIFFICULTIES: Record<DifficultyKind, DifficultyRow> = {
  /**
   * The gentlest tier: Savior a margin down on every axis, and a life in hand.
   *
   * Asked for, first: *"this should provide me no challenge, but still require concentration"*; and
   * on 2026-09-22 *"playable by anyone and they should be able to have fun."* Since 0356 it is gentler
   * than the content on the four axes the player feels as time, and exactly the content on health and
   * on how much a volley holds.
   */
  legendary: {
    title: 'Legendary Pilot',
    // What is different, in the player's words — *"no explanations for the different difficulties"*.
    // The lives and the shields are said by `factsOf`, from the numbers below; this is the rest.
    hint: 'Slower enemies and bullets, wide corridors',
    lives: 5,
    // Every life opens on a full shell and every level renews it — 0355, the player's words.
    shellOpen: 3,
    shellCap: 3,
    ...multipliersFor('legendary'),
    // Never narrower than 56, and turns that lean at about 14° — 0350, the player's number.
    corridor: { narrowest: 56, slope: 0.25 },
  },
  /**
   * The tier the game is tuned for — `SAVIOR` is its multipliers, and the other two are derived.
   */
  savior: {
    title: 'Savior of the Galaxy',
    hint: 'What the game is tuned for',
    lives: 3,
    // *"No change to behaviour"*: a life opens on the hull and a shield is flown for — 0050, 0355.
    shellOpen: 0,
    shellCap: 3,
    ...multipliersFor('savior'),
    // Never narrower than 44, turns at about 19° — 0350, the player's number.
    corridor: { narrowest: 44, slope: 0.35 },
  },
  /**
   * The tier that is supposed to end runs: Savior a margin up on every axis but `aggression` and
   * `crowd`, which are pinned short of the derivation where a measurement refused it — `PINNED`.
   *
   * ⚠️ Against a stated target: *"I should be able to get to maybe the end boss of level 2"*, and since
   * 2026-09-22 *"way harder than saviour."* Two lives rather than three is deliberate — a tier that only
   * made things tougher would lengthen every fight without changing what a mistake costs, and length is
   * not difficulty.
   *
   * ⚠️ **THE SPIT, SAID BEFORE IT IS PLAYED.** `SHOTS.spit` flies at 1.4 and the ship at 1.7, and
   * `src/content/shots.ts` says the whole of what makes spit dodgeable is being slower than the ship.
   * At `shotSpeed` 1.4375 it flies at about 2.0 — faster than the ship, as it already was at 1.3.
   * Whether a shot you cannot outrun is unfair or learnable is the play's question, not this file's.
   */
  burn: {
    title: 'Let the Galaxy Burn',
    hint: 'Tougher, faster enemies, tight corridors',
    lives: 2,
    // *"No shields"*, and the mid-boss throws none: *"no replacement pickups, just remove them"* — 0355.
    shellOpen: 0,
    shellCap: 0,
    ...multipliersFor('burn'),
    // Never narrower than 34, turns at about 30° — 0350, the player's number.
    corridor: { narrowest: 34, slope: 0.58 },
  },
};

/**
 * What a tier gives the player, in a line — its lives and its shields, read off the row.
 *
 * ⚠️ **SAID FROM THE NUMBERS, NEVER WRITTEN BESIDE THEM.** Asked for: *"no explanations for the
 * different difficulties."* A sentence typed next to `lives: 5` is a second description of it, and the
 * day a tier gains a life the button would go on saying the old number. The row's `hint` carries what
 * is not a count.
 */
export function factsOf(row: DifficultyRow): string {
  const lives = `${row.lives} ${row.lives === 1 ? 'life' : 'lives'}`;
  const shields =
    row.shellOpen > 0
      ? `${row.shellOpen} ${row.shellOpen === 1 ? 'shield' : 'shields'} every level`
      : row.shellCap > 0
        ? 'shields to find'
        : 'no shields';
  return `${lives} · ${shields}`;
}

/**
 * The content exactly as authored: every multiplier 1, and a life that opens on the hull.
 *
 * ⚠️ **NOT A TIER, and it is not in `DIFFICULTY_KINDS`, so it gets no button.** It is the baseline
 * the fixtures and the instruments stand on — `tests/world.ts`'s `playableWorld` and the title
 * field before a run is chosen. Those used to stand on `legendary`, which was the same numbers; since
 * `docs/decisions/0355-a-tier-opens-on-a-shell.md` a Legendary life opens on three shields, and a
 * default that moved with it would have silently armoured the ship under every guard in the suite —
 * a hull that is one hit (0050) tested against a ship that takes four.
 *
 * ⚠️ **Written out rather than spread from `legendary`**, because the easiest tier has since moved off
 * the content — `docs/decisions/0356-the-tuned-tier-is-savior.md` — and the baseline did not move
 * with it. It is also what the instruments mean by `--difficulty=authored`.
 * `tests/tier-shell.test.ts` holds that it multiplies nothing and opens on no shell.
 */
export const AUTHORED: DifficultyRow = {
  title: 'As authored',
  hint: 'The content, multiplied by nothing',
  // Read by nothing: a fixture has no run, and this row never begins one.
  lives: 5,
  shellOpen: 0,
  shellCap: 3,
  toughness: 1,
  fireGap: 1,
  closing: 1,
  shotSpeed: 1,
  aggression: 1,
  crowd: 1,
  // The widest corridor any tier flies — the player's own number for `legendary`, 0350.
  corridor: { narrowest: 56, slope: 0.25 },
};

/*
  ── THE DIAL: A SECOND DIFFICULTY AXIS, AND IT MOVES DURING A LEVEL ──────────────────────────────

  `docs/decisions/0084-the-dial-is-the-level-and-the-guns.md`. Everything above is a TIER — chosen
  before a run and fixed for its length (0047). The dial is the other half of what the play-test asked
  for, and the project had no mechanism for it at all:

  > *"There should be progression of mission and difficulty from one level to the next… It's a dial
  > that starts at 1 and should be at 11 when the player is dealing with the last boss at the end of
  > the last level."*

  > *"Level 1 -> dial starts at 1, increases to 2 when the player gets their first weapon power up,
  > increases again when they get their next, until they get to the boss which should be difficulty 4
  > or so on the dial. Level 2 starts by dialing it back 2 notches to give the player a breathing
  > space and then dials it up per power up spawn so it should be around 5 at the end of the level.
  > That pattern then repeats."*

  ⚠️ **The two axes multiply and neither replaces the other.** A tier says *how hard is this run*; the
  dial says *how far into it are we*. `legendary` at dial 11 and `burn` at dial 1 are different games
  and both have to be reachable, which is why this is not a fourth tier.
*/

/** Where a run opens. The first level's first screen, before anything has been offered. */
export const DIAL_MIN = 1;

/**
 * Where the last boss sits, and it is the ask's own number.
 *
 * ⚠️ **REACHED EXACTLY, and that is arithmetic rather than luck** — see `dialFor`. A ceiling the
 * content stops short of would make the top of the dial a thing nobody ever sees, and one the content
 * runs past would make the clamp the real ending.
 */
export const DIAL_MAX = 11;

/**
 * What a level boundary adds, and what each weapon pickup the level OFFERS adds.
 *
 * ── THE SAWTOOTH IS THESE TWO NUMBERS AND NOTHING ELSE ──────────────────────────────────────────
 *
 * A level ends `DIAL_PER_WEAPON × weapons` above where it began, and the next begins
 * `DIAL_PER_LEVEL` above where the last one BEGAN — which is the *"dial it back a couple of notches
 * to give the player a breathing space"* the ask describes, expressed as a rise rather than as a drop
 * so that nothing has to remember where the previous level ended.
 *
 * ⚠️ **Both are derived rather than chosen, and the level's step is a fraction since 0256.** They
 * were both 1 while `src/content/levels.ts` offered four weapon pickups a level:
 * `DIAL_MIN + 6×DIAL_PER_LEVEL + 4×DIAL_PER_WEAPON` = **11**, the ask's number to the notch.
 * `docs/decisions/0256-a-pickup-keeps-the-count.md` cut a level to two weapons — one authored and
 * one the mid-boss drops — and three in level one, so the last boss would have sat at 9. The weapon's
 * step stays 1, because `MULTI_HIT_DIAL` is written in it; the level's step is what is left over:
 * `(DIAL_MAX − DIAL_MIN − 2×DIAL_PER_WEAPON) / 6` = **4/3**, and the sawtooth still holds — level
 * one's boss at 4, level two opening at 2⅓ and its boss at 4⅓ — with every boss harder than the last
 * only because level one's third weapon is worth less than a level's step. `tests/dial.test.ts`
 * recomputes all of it from the content rather than restating it, so a level that gains a weapon
 * pickup fails there rather than silently moving the top of the dial.
 */
export const DIAL_PER_LEVEL = 4 / 3;
export const DIAL_PER_WEAPON = 1;

/**
 * Where the dial is, given how far into the run and how much the level has already put on the field.
 *
 * ── OFFERED, NOT HELD — AND THE ASK SAYS BOTH ───────────────────────────────────────────────────
 *
 * ⚠️ **This counts what the LEVEL HAS SPAWNED, not what the player picked up**, and the ask uses both
 * words: *"increases to 2 when the player **gets** their first weapon power up"* and *"dials it up
 * **per power up spawn**"*. They are different mechanisms and only one of them can sawtooth.
 *
 * **Held cannot.** Upgrades cross a level boundary
 * (`docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md`), so a player entering level
 * two with four weapon tiers would carry those four notches with them and the dial would climb
 * monotonically to the end of the run — no breathing space, ever. Offered restarts with the script,
 * which is what makes the shape the ask drew possible at all.
 *
 * ⚠️ **What that costs is written down rather than hidden**: a player who ignores every pickup still
 * faces a rising dial. 0084 argues that the gap is small — a pickup waits seven seconds and reaches
 * 6% of the lane (0064, 0056), and a death now hands everything back (0083) — and names it as the
 * first thing a play-test should disagree with.
 *
 * ⚠️ **Clamped at both ends.** A level index past the roster is a shell bug and a black screen is a
 * worse way to report it than a hard fight — `src/app/lifecycle.ts` clamps the index for the same
 * reason.
 */
export function dialFor(levelIndex: number, weaponsOffered: number): number {
  const raw = DIAL_MIN + levelIndex * DIAL_PER_LEVEL + weaponsOffered * DIAL_PER_WEAPON;
  return raw < DIAL_MIN ? DIAL_MIN : raw > DIAL_MAX ? DIAL_MAX : raw;
}

/**
 * The dial below which nothing the player meets takes more than one hit.
 *
 * ⚠️ **THE SMALLEST PROOF THE DIAL CAN CARRY, and it is a reported defect rather than a demo.**
 * *"At the start of the game there should be no multiple hit enemies until after the 2nd upgrade has
 * been spawned — the difficulty curve currently has a massive spike at the start, then it also
 * immediately scales out and then drops off to super easy based on buffs the player has."*
 *
 * ⚠️ **Three, and it is the ask's *after the 2nd upgrade has been spawned* in dial units.** Level one
 * opens at `DIAL_MIN` = 1; the second weapon pickup puts it at 3. Written as a dial threshold rather
 * than as *two pickups* so that it means the same thing in every level — the clamp is a property of
 * how far into the run the player is, and level two opens past it.
 */
export const MULTI_HIT_DIAL = 3;

/**
 * Whether the run is still in the opening stretch where everything dies to one shot.
 *
 * ── THE `levelIndex === 0` TERM IS NOT BELT AND BRACES, AND A GUARD CAUGHT ITS ABSENCE ───────────
 *
 * ⚠️ **A dial threshold ALONE cannot express this, and the first draft assumed it could.** The
 * sawtooth reuses low dial values by construction: level two opens at `DIAL_MIN + 1` = 2, which is
 * under `MULTI_HIT_DIAL` — so a plain `dial < MULTI_HIT_DIAL` brings the clamp back at the start of
 * level two, and again at the start of level three's first weapon. The opening of most of the game
 * would have had no multi-hit enemies in it.
 *
 * ⚠️ **And no threshold fixes it, which is worth writing down so nobody tries.** The clamp must be
 * OFF at dial 2 (level two's opening) and ON at dial 2 (level one, one weapon in). Those are the same
 * number. The dial says *how hard*; it does not say *how far in*, and this rule is about the second.
 *
 * ⚠️ **It still reads the dial rather than counting pickups**, so the threshold stays a dial fact and
 * moves with it. What the level term adds is *and only during the opening*.
 *
 * ⚠️ **A predicate rather than an arm inside `toughnessFor`, because it must not reach a BOSS.** The
 * dial at every boss is far past the threshold, so folding it in would be dead code that only looked
 * safe — and the day somebody authored a boss earlier, a one-health boss would be the result.
 * `src/app/frame.ts` applies it at the one spawn site that is an enemy in a wave.
 */
export function singleHitOnly(levelIndex: number, weaponsOffered: number): boolean {
  return levelIndex === 0 && dialFor(levelIndex, weaponsOffered) < MULTI_HIT_DIAL;
}

/**
 * The health a body of `base` health has on a given tier — at least one, always.
 *
 * ⚠️ **A function rather than a multiply at every call site.** There are three of them (an enemy, a
 * boss, and whatever the next thing that can be shot turns out to be), and *"rounded up, floored at
 * one"* stated three times is the shape of second description this project has already paid for.
 * It allocates nothing and is called at spawn, never per step.
 */
export function toughnessFor(base: number, tier: DifficultyRow): number {
  return Math.max(1, Math.ceil(base * tier.toughness));
}

/**
 * The steps between shots a body with a `base` gap has on a given tier.
 *
 * Floored for the same reason `toughnessFor` is floored: a gap of zero is a body that fires every
 * step forever, which is not a hard tier but a broken one. The floor is one grid unit rather than
 * one step, because a cadence off the grid is the thing this function exists to prevent.
 *
 * ⚠️ **SNAPPED, AND THIS IS THE STEP THAT WOULD OTHERWISE UNDO THE WHOLE DECISION** —
 * `docs/decisions/0096-the-enemies-play-along.md`. Every cadence in `src/content/enemies.ts` and
 * `src/content/bosses.ts` is authored on the grid and guarded there; **0.7 of a grid value is not a
 * grid value**, so a tier would take content that was carefully in time and put all of it back off
 * the beat. There is exactly one multiplier in the game and this is it.
 *
 * ⚠️ **The ladder compresses at the fast end on the harder tiers, and that is accepted rather than
 * missed.** Two late boss phases can land on the same grid position once multiplied — 0096 has the
 * table — because the grid is 100ms and the phases are 30 steps apart before scaling.
 * `tests/level.test.ts` holds *never slower than the phase before, and the last strictly faster than
 * the first* rather than strict monotonicity at every rung of every tier.
 */
export function fireGapFor(base: number, tier: DifficultyRow): number {
  return onFireGrid(base * tier.fireGap);
}

/**
 * How many of something a tier gets, where the content authors `base` — at least one, always.
 *
 * The shots in a boss's volley, the ceiling on adds a summons keeps up, and the shards a shattering
 * shot may open a volley with all come through here, on `toughnessFor`'s own argument: *"rounded,
 * floored at one"* stated at four call sites is the shape of second description this project has
 * already paid for. It allocates nothing and is called at the volley rather than per step.
 *
 * ⚠️ **ROUNDED TO NEAREST AND NOT UP, WHICH IS THE ONE PLACE THIS DIFFERS FROM `toughnessFor`.**
 * That one rounds up because its ordering has to hold by construction against a rounding that could
 * otherwise put a tougher tier below a gentler one. Here the ordering is already free: `crowd` is
 * non-decreasing up the tiers and `Math.round` is monotone, so `round(base × crowd)` cannot fall.
 * What rounding UP would cost is the small counts, which are exactly the ones 0263 spent a decision
 * settling — a phase authored to throw ONE shard would throw two on every tier above the easiest,
 * and the frost ship's opening volley would be twice the size on a tier that is a fifth harder.
 *
 * `tests/difficulty.test.ts` walks the tiers in pairs and holds the ordering. It holds no value.
 */
export function crowdFor(base: number, tier: DifficultyRow): number {
  return Math.max(1, Math.round(base * tier.crowd));
}
