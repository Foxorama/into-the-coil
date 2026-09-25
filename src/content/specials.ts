/**
 * The arsenal's vocabulary — what the trigger throws.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 *
 * ── A SPECIAL IS THE GUN'S OWN — `docs/decisions/0373-a-special-is-the-guns-own.md` ─────────────
 *
 * Asked for: *"if you're at max power ups and you collect up a power up of the same type it
 * increases your bomb count for that weapon/missile type … they'll all have their own unique
 * effects."* Every gun and every tube names the special its overflow buys (`special` on its row),
 * and a charge of it goes on the arsenal's stack, which the trigger throws newest first.
 *
 * Two shapes live here and a row is one of them. A **thrown** special has a `shot` that flies to
 * `reach` and `becomes` a blast. A **surge** has a `surge`: a timed aura on the ship that makes one
 * of its own weapons stronger while it lasts. Neither is a default for the other, so a row says
 * `null` for the one it is not.
 */

import { BLADE_EDGE, type ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/**
 * Every special, closed. A new one fails every `Record` over this union to BUILD until it has a row.
 *
 * ⚠️ **`mines` WAS HERE, and 0373 deleted it.** It was a name held so the arsenal could be shown
 * holding two different things, and nothing ever fired it. The typed specials are that second thing.
 *
 * ⚠️ **Five of six.** The shield's void is the next change on the same ask
 * (`reports/the-arsenal-planned-2026-09-26.md`).
 */
export const SPECIAL_KINDS = ['bomb', 'hunt', 'overdrive', 'storm', 'whirlpool'] as const;

/**
 * What the player can be carrying. Derived from the list rather than written beside it, so a kind
 * cannot exist in the union and be missing from the table — `src/content/sprites.ts` has the
 * incident that argues for deriving rather than restating.
 */
export type SpecialKind = (typeof SPECIAL_KINDS)[number];

/**
 * The two triggers, and which stack each one throws — `docs/decisions/0376-a-trigger-for-the-gun-and-one-for-the-tubes.md`.
 *
 * ⚠️ **THE ONE STACK 0373 BUILT WAS A FLAW, AND IT WAS RECORDED WHERE IT SHOULD HAVE BEEN RAISED.** One
 * trigger throwing the newest charge let a charge go through a weapon it was not earned from. Played:
 * *"having one bomb queue means that you might not even have the autofire gun equipped when you try to
 * use that bomb."* The gun's specials are on the first trigger and the tubes' on the second, each its
 * own newest-first stack. Order is the binding order: `special1` is the gun, `special2` the tubes.
 */
export const SIDES = ['gun', 'tubes'] as const;
export type Side = (typeof SIDES)[number];

/**
 * A surge: for `steps`, the ship wears `aura` and its tubes hit harder — 0373, and on the tubes
 * alone since 0375, which moved the golden one off the gun and onto the forward missiles.
 *
 * ⚠️ **What it strengthens is whatever tubes are fitted when it goes off, not the special's source.**
 * One stack behind one trigger means a surge can be thrown through tubes it was not earned from; the
 * user named that a flaw, and splitting the trigger is queued in
 * `reports/the-arsenal-planned-2026-09-26.md`.
 */
export interface Surge {
  /** How long it lasts, in fixed steps (0022). */
  steps: number;
  /** The bitmap drawn round the ship while it lasts — the picture of the whole effect (0036). */
  aura: number;
  /**
   * The tubes: `damage` multiplies a missile, `fuse` multiplies a seeker's life, and `pierce` is how
   * many landings a missile survives, gated as a blade's are (0357) — one is spent by arriving.
   */
  tubes: { damage: number; fuse: number; pierce: number };
}

/**
 * A storm: what a thrown special does when its fuse runs out, instead of becoming a blast —
 * `docs/decisions/0374-the-storm-and-the-whirlpool.md`. *"Explodes into a massive lightning blast
 * that sends lightning flickering all across the screen and chains twice for each hit."*
 */
export interface Storm {
  /** How many bodies the burst strikes first, nearest first, anywhere on the screen. */
  strikes: number;
  /** How many more each of those chains on to — *"chains twice for each hit."* One generation. */
  chains: number;
  /** How far a chain may jump from the body it came off, in world units. */
  reach: number;
  /** What a strike takes off a body. */
  damage: number;
  /** What a strike takes off a boss, as a share of its full health, when that is more — 0372's shape. */
  bossShare: number;
  /** Bolts thrown from the burst to random places on the screen, each time the flicker renews. */
  flicker: number;
  /** How long the flicker goes on renewing, in fixed steps. The picture of *"all across the screen."* */
  flickerSteps: number;
}

/**
 * A whirlpool: blades on spiral arms about a centre ahead of the ship, turning and growing until
 * none of it is on the screen — 0374. *"A huge shuriken in a whirlpool shape that gets progressively
 * bigger … it can hit bosses multiple times as it whirlpools around."*
 */
export interface Whirl {
  /** Spiral arms, evenly spaced about the centre. */
  arms: number;
  /** Blades along each arm. */
  blades: number;
  /** How far ahead of the ship the centre is set, in world units; it holds there in the camera. */
  ahead: number;
  /** The innermost blade's radius when it opens. */
  start: number;
  /** How much further out each blade along an arm sits. */
  gap: number;
  /** How far round each blade along an arm sits from the one inside it, in radians — the spiral. */
  twist: number;
  /** World units the whole thing grows by, per step. */
  grow: number;
  /** Radians it turns by, per step. */
  spin: number;
  /** What a blade takes off a body each time it lands — once per flash, as a blade's does (0357). */
  damage: number;
  /** How much bigger than the gun's own blade each blade is drawn and lands — *"huge."* */
  swell: number;
}

export interface SpecialRow {
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
  /** Which trigger throws it — 0376. The gun's overflow buys a gun special, the tubes' a tube one. */
  side: Side;
  /**
   * What leaves the ship when the player triggers it, or `null` for a surge, which throws nothing.
   *
   * ⚠️ **NULLABLE, and a row answers it.** 0016 says behaviour rides the row: a surge answers
   * *nothing leaves the ship* here and *an aura* in `surge`, and a thrown special the other way round.
   */
  shot: ShotKind | null;
  /**
   * What it becomes when its fuse runs out, or `null` for something that simply retires.
   *
   * Two rows rather than one because the thing that flies and the thing that hurts are different
   * bodies with different radii, different inks and different pairings — see `src/content/shots.ts`.
   */
  becomes: ShotKind | null;
  /**
   * How far ahead of the ship it goes off, in **world units**.
   *
   * ⚠️ **THE ASK STATED THIS AS A FRACTION OF THE SCREEN, AND 0023 REFUSES SCREEN-SPACE AUTHORING.**
   * `alongSpan` runs 178 to 240 units by device, so a bomb thrown *"halfway up the screen"* would be
   * a different weapon on a 21:9 monitor than on a phone — a longer reach for the player with the
   * wider display, which is the difficulty parity 0023 exists to protect.
   *
   * So it is authored in world units against the **reference view** — 16:9, 177.8 units along, the
   * aspect `src/content/levels.ts` is already written for. 80 is a little under half of it, which is
   * the stated fraction on the aspect the levels assume, and it is the same distance everywhere.
   */
  reach: number;
  /**
   * The share of a boss's FULL health what it `becomes` lands on the boss, when that is more than
   * the blast's own damage — `docs/decisions/0372-a-death-keeps-the-ladders.md`. Zero for a special
   * that is only ever flat.
   *
   * ⚠️ **On the special and not on the blast row**, because the pyre's rungs are the same blast and
   * are not spent: what the player chose to throw is what is worth a share of the fight.
   */
  bossShare: number;
  /** The aura and what it strengthens, or `null` for a thrown special — 0373. */
  surge: Surge | null;
  /** What a thrown special does in place of becoming a blast, or `null` — 0374. */
  storm: Storm | null;
  /** The whirlpool it opens ahead of the ship, or `null` — 0374. */
  whirl: Whirl | null;
  /**
   * Charges pushed onto the stack each time `took` stocks it — an overflowing ladder, and the run's
   * start. Each is one press of the trigger.
   */
  charges: number;
  /**
   * Which baked bitmap says *this one*, wherever the player is shown what the trigger throws next.
   *
   * ⚠️ **The real art, never a drawing of it** — the same argument `src/app/chrome.ts` makes for the
   * pickup key: a hand-written glyph is a second description of a silhouette. A surge wears its
   * source's pickup face, so the thing on the button is the thing the player overflowed to get it.
   *
   * An index rather than a name, exactly as `Body.sprite` is.
   */
  face: number;
}

/** Ten seconds of the sim's own clock — 0022. The seeker surge's length is the ask's. */
const SURGE_STEPS = 600;

export const SPECIALS: Record<SpecialKind, SpecialRow> = {
  /**
   * The pulse's since 0375 — *"let's make the auto-gun pickup the regular bomb"* — and the straight
   * tube's before it. A large forward-firing missile that goes off as the bomb's explosion.
   *
   * ⚠️ **`charges` is 2 and it was 3**, because the ask says so: *"the player starts with 2 and
   * gains one per level cleared."* It is the number a run BEGINS with; 0372 took away the clear's.
   *
   * ⚠️ **A TWENTIETH OF A BOSS — 0372**: *"increase its damage so it does 5% of max boss health
   * damage."* The larger of that and the blast's own six, so a small mid-boss is not hit softer
   * than it was; a window (0255) still multiplies it, as it multiplies everything the player fires.
   */
  bomb: {
    label: 'Bomb',
    side: 'gun',
    charges: 2,
    shot: 'bomb',
    becomes: 'blast',
    reach: 80,
    bossShare: 0.05,
    surge: null,
    storm: null,
    whirl: null,
    face: SPRITE.bomb,
  },
  /**
   * The seeker's — *"gives the ship a glowing purple aura and supercharges the homing missiles for
   * 10secs. They travel twice as far and do 4x as much damage."* Twice as far is twice the fuse: a
   * seeker flies until its fuse is out (0246), so its life IS its range.
   */
  hunt: {
    label: 'Hunt',
    side: 'tubes',
    charges: 1,
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: { steps: SURGE_STEPS, aura: SPRITE.auraHunt, tubes: { damage: 4, fuse: 2, pierce: 1 } },
    storm: null,
    whirl: null,
    face: SPRITE.pickupSeeker,
  },
  /**
   * The forward missiles' since 0375, and the pulse's before it — *"change the autogun supercharge
   * effect over to the regular forward firing missiles."* The golden aura, three times the damage,
   * and missiles that pierce like blades; ten seconds, the seeker surge's length, until it is played.
   */
  overdrive: {
    label: 'Overdrive',
    side: 'tubes',
    charges: 1,
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: { steps: SURGE_STEPS, aura: SPRITE.auraOverdrive, tubes: { damage: 3, fuse: 1, pierce: BLADE_EDGE } },
    storm: null,
    whirl: null,
    // The face of what it is earned from: the forward missiles' pickup.
    face: SPRITE.pickupMissile,
  },
  /**
   * The arc's — *"fires a glowing lightning flickering projectile forward that explodes into a
   * massive lightning blast that sends lightning flickering all across the screen and chains twice
   * for each hit."* Thrown like the bomb, to the bomb's reach, and a storm where the bomb has a blast.
   *
   * ⚠️ **A boss takes a twentieth, once, like the bomb** — 0372's share, because the ask gives the
   * storm no number of its own and it is the bomb's place in the arc's hand. Everything else it
   * reaches takes a strike that kills most bodies outright. Both are play numbers.
   */
  storm: {
    label: 'Storm',
    side: 'gun',
    charges: 1,
    shot: 'stormBall',
    becomes: null,
    reach: 80,
    bossShare: 0,
    surge: null,
    storm: { strikes: 6, chains: 2, reach: 45, damage: 12, bossShare: 0.05, flicker: 8, flickerSteps: 32 },
    whirl: null,
    face: SPRITE.pickupArc,
  },
  /**
   * The shuriken's — *"fires a huge shuriken in a whirlpool shape that gets progressively bigger, the
   * radius needs to be large enough that it lasts until every part of the whirlpool arc will no
   * longer be on screen, it can hit bosses multiple times as it whirlpools around."*
   *
   * ⚠️ **Three arms of eight, and the damage was measured, not asked for** —
   * `docs/decisions/0374-the-storm-and-the-whirlpool.md` has what one whirlpool takes off each boss.
   */
  whirlpool: {
    label: 'Whirlpool',
    side: 'gun',
    charges: 1,
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: null,
    storm: null,
    /*
      ⚠️ **AN ARM IS CONTINUOUS, AND THE FIRST ONE WAS NOT.** At a gap of 7 and a twist of 0.35 the
      blades along an arm stood eleven units apart — wider than a blade — so a body between two was
      never touched however often the arm swept it. Five and 0.25 at a blade swelled 2.2 leave no hole
      a body fits through.
    */
    whirl: { arms: 3, blades: 8, ahead: 60, start: 6, gap: 5, twist: 0.25, grow: 0.7, spin: 0.05, damage: 4, swell: 2.2 },
    face: SPRITE.pickupShuriken,
  },
};

/**
 * WHAT AN UNSPENT ARSENAL BECOMES WHEN THE SHIP CARRYING IT COMES APART — one rung per charge.
 *
 * Asked for in play: *"the player's ship (and only the player's ship) exploding on death should fire
 * all unspent bombs at the player ship's location with an expanding ring based on number of bombs —
 * 0 bombs = half current bomb explosion size, 1 bomb = bomb explosion, 2 bombs = increased explosion
 * size, 3 increased further… effectively a way to give the player some breathing space for when they
 * respawn."*
 * `docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md`.
 *
 * ⚠️ **HERE rather than in `src/content/shots.ts`, because the ladder is indexed by a fact about the
 * ARSENAL.** The rows are shots; which rung a death lights is a statement about what the player never
 * spent, and this file is what owns that.
 *
 * ⚠️ **The zeroth rung is a real rung and it is half a blast.** A player who died having spent
 * everything still gets something, which is what makes this a beat the player can read rather than a
 * reward that sometimes appears — `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`
 * from the useful direction: *the ship came apart* is an event, and it now always draws one.
 */
export const PYRES: readonly ShotKind[] = ['blastHalf', 'blast', 'blastWide', 'blastWidest'];

/**
 * Which rung a death with `charges` unspent lights.
 *
 * ⚠️ **CLAMPED at the top.** The ask names four rungs, and a run that keeps overflowing its ladders
 * carries more than that; the widest rung already covers the lane, so the top of the ask is the top
 * of the ladder, and everything above it looks the same.
 *
 * ⚠️ **Counted over the WHOLE stack rather than over bombs**: what goes up with the ship is what the
 * ship was carrying, surges included.
 */
export function pyreFor(charges: number): ShotKind {
  const rung = charges < 0 ? 0 : charges > PYRES.length - 1 ? PYRES.length - 1 : Math.floor(charges);
  return PYRES[rung] ?? PYRES[0]!;
}
