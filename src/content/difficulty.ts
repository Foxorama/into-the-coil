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
import type { SpecialKind } from './specials.ts';

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

export interface DifficultyRow extends Multipliers, CorridorLimit, BossHold {
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
  /**
   * Ward charges a run opens with on this tier, beside its ship's own — 0447. Empty on a tier that
   * gives none.
   *
   * ⚠️ **Burn's void, and the condition is the caddie's.** *"Let's also let them start with 1 void
   * bomb as well"*, and answered: *"only burn, and if the player starts as feather with the nova ring
   * that pops bullets, they don't get a bonus void bomb on top."* So a ship whose own special is
   * already on the ward's trigger opens without these — `startingArsenal` reads the side, not a name.
   */
  opensWith: readonly SpecialKind[];
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

/**
 * The two fights a level has — 0247: the mid-boss's and the end boss's. `src/app/frame.ts` keeps it
 * as `fight`, `0` and `1`, and names it here only where a tier reads it.
 */
export const BOSS_FIGHTS = ['mid', 'end'] as const;

/** Derived from the list, so a fight cannot exist in the union and be missing from a row. */
export type BossFight = (typeof BOSS_FIGHTS)[number];

/** How much longer a tier's bosses hold than its `toughness` says — a per-row literal, so it rides no margin. */
export interface BossHold {
  /**
   * Multiplier on a boss's health ON TOP OF `toughness`, by which fight it is —
   * `docs/decisions/0532-the-legend-holds-longer.md`.
   *
   * ⚠️ **ASKED OF ONE TIER, FROM A PLAY OF IT:** *"legendary difficulty — minibosses need probably twice
   * as much health as they do now; end bosses need about +15% health"*, then settled from a second
   * play as Legend's mid-bosses at 1.5 and Savior's at 1.125, so Savior's hold a fifth more. Burn
   * says `AS_TOUGH`, the default — 0282: the row states its version, and the fallback is shared.
   *
   * ⚠️ **NOT A `Multipliers` AXIS, AND THAT IS WHY BURN DID NOT MOVE.** An axis is Savior's value
   * moved a margin per step (0356), so raising Legend's would have moved Savior's and Burn's with it —
   * the tuned tier re-tuned by a play of another one. A literal, like `lives` and the shell, moves the
   * rows that were asked about and no other.
   */
  bossToughness: Readonly<Record<BossFight, number>>;
}

/** A boss exactly as tough as the tier's `toughness` says, in both fights — the default, 0532. */
export const AS_TOUGH: Readonly<Record<BossFight, number>> = { mid: 1, end: 1 };

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
 *   is not difficulty"*, and below one it would shorten bosses and nothing else. Its BOSSES hold
 *   longer since 0532, by a literal on its row (`bossToughness`) rather than by this margin.
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
   * on how much a volley holds — but for its bosses, which since 0532 hold longer than the content
   * on the player's word: *"minibosses need probably twice as much health … end bosses need about
   * +15% health"*.
   */
  legendary: {
    title: 'Legendary Pilot',
    // The button's voice, in the player's words — 0370.
    hint: 'Is that plot armour?',
    lives: 5,
    // Every life opens on a full shell and every level renews it — 0355, the player's words.
    shellOpen: 3,
    shellCap: 3,
    opensWith: [],
    ...multipliersFor('legendary'),
    // Never narrower than 56, and turns that lean at about 14° — 0350, the player's number.
    corridor: { narrowest: 56, slope: 0.25 },
    /*
      Half again the mid-boss and fifteen percent more end boss, over a `toughness` of one — 0532, the
      player's numbers from a play of this tier. Asked first as twice; settled at one and a half so
      Savior's mid-bosses, raised with it, hold a fifth more than these.
    */
    bossToughness: { mid: 1.5, end: 1.15 },
  },
  /**
   * The tier the game is tuned for — `SAVIOR` is its multipliers, and the other two are derived.
   */
  savior: {
    title: 'Savior of the Galaxy',
    hint: 'Be the hero you want to be',
    lives: 3,
    // *"No change to behaviour"*: a life opens on the hull and a shield is flown for — 0050, 0355.
    shellOpen: 0,
    shellCap: 3,
    opensWith: [],
    ...multipliersFor('savior'),
    // Never narrower than 44, turns at about 19° — 0350, the player's number.
    corridor: { narrowest: 44, slope: 0.35 },
    /*
      Its mid-bosses an eighth over `toughness` — 1.8 of the content against Legend's 1.5, a fifth more —
      and its end bosses as `toughness` says. 0532: the player's answer, asked for the tuned tier to stay
      above the gentle one after Legend's mid-bosses rose.
    */
    bossToughness: { mid: 1.125, end: 1 },
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
    hint: 'Best of luck mate',
    lives: 2,
    /*
      *"No shields"* — 0355. The mid-boss threw none — *"no replacement pickups, just remove them"* —
      until the shield pickup cycled; since 0447 it throws the ward pickup, the void and the nova, in
      the shield's place: *"it'll spit out a void bomb pickup in place of the shield."*
    */
    shellOpen: 0,
    shellCap: 0,
    // One void to open on — 0447 — unless the ship's own special is already the ward's.
    opensWith: ['voidMissile'],
    ...multipliersFor('burn'),
    // Never narrower than 34, turns at about 30° — 0350, the player's number.
    corridor: { narrowest: 34, slope: 0.58 },
    // As tough as `toughness` says — 0532 is a literal on Legend's and Savior's rows, so it does not ripple here.
    bossToughness: AS_TOUGH,
  },
};

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
  opensWith: [],
  toughness: 1,
  fireGap: 1,
  closing: 1,
  shotSpeed: 1,
  aggression: 1,
  crowd: 1,
  // The widest corridor any tier flies — the player's own number for `legendary`, 0350.
  corridor: { narrowest: 56, slope: 0.25 },
  // The content's bosses at the content's health — 0532 is a tier's, never the baseline's.
  bossToughness: AS_TOUGH,
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

/*
  ── THE DIAL STOPPED HERE: `dialFor`, `MULTI_HIT_DIAL` AND `singleHitOnly` — 0441 ───────────────────

  The dial counted the levels and the weapon pickups each had offered, and the one thing it spent was
  `singleHitOnly`: nothing in level one took more than one hit until two weapon pickups had been
  offered, because the gun the run opened with was the bottom rung of its ladder (0084, 0086). *"Each
  ship will start with max weapons"* removes that premise, and the player answered the rule itself
  when asked: delete it. With it gone nothing read the dial at all, so it went too rather than staying
  as a number nobody spends — `docs/decisions/0441-a-pilot-flies-their-own-ship.md`. What a rising dial
  would SEND was always owed and never authored; the levels' own scripts are what climbs.
*/

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
 * The health a boss of `base` health has on a given tier, in the level's `fight` — 0532.
 *
 * ⚠️ **`toughnessFor` with the row's boss multiplier on top, and nothing else.** Rounded up and floored
 * at one for that function's reasons; at `AS_TOUGH` the product is `toughness` exactly, so a tier that
 * says nothing about its bosses gets the very number it got before this existed.
 */
export function bossToughnessFor(base: number, tier: DifficultyRow, fight: BossFight): number {
  return Math.max(1, Math.ceil(base * tier.toughness * tier.bossToughness[fight]));
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
