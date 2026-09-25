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
 * ⚠️ **Three of six.** The arc's, the shuriken's and the shield's are the next two changes on the same
 * ask (`reports/the-arsenal-planned-2026-09-26.md`); until they land, those rows' overflow buys a bomb
 * and says so on the row.
 */
export const SPECIAL_KINDS = ['bomb', 'hunt', 'overdrive'] as const;

/**
 * What the player can be carrying. Derived from the list rather than written beside it, so a kind
 * cannot exist in the union and be missing from the table — `src/content/sprites.ts` has the
 * incident that argues for deriving rather than restating.
 */
export type SpecialKind = (typeof SPECIAL_KINDS)[number];

/**
 * A surge: for `steps`, the ship wears `aura` and one of its weapons hits harder — 0373.
 *
 * ⚠️ **What it strengthens is the WEAPON, not the special's source.** A seeker surge taken and then a
 * straight tube picked up leaves the surge on the tubes: the stack is what the player carries, and
 * what they fire it through is whatever is fitted when it goes off.
 */
export interface Surge {
  /** How long it lasts, in fixed steps (0022). */
  steps: number;
  /** The bitmap drawn round the ship while it lasts — the picture of the whole effect (0036). */
  aura: number;
  /**
   * The straight gun, or `null`. `damage` multiplies a shot; `pierce` is how many landings it
   * survives, gated as a blade's are (0357) — *"bullets penetrate like shurikens."* Only the pulse
   * flies straight, so a switched gun simply does not take it.
   */
  gun: { damage: number; pierce: number } | null;
  /** The tubes, or `null`. `damage` multiplies a missile; `fuse` multiplies a seeker's life. */
  tubes: { damage: number; fuse: number } | null;
}

export interface SpecialRow {
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
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
   * The straight tube's — *"forward missiles - give you a bomb like the current bomb."*
   *
   * ⚠️ **`charges` is 2 and it was 3**, because the ask says so: *"the player starts with 2 and
   * gains one per level cleared."* It is the number a run BEGINS with; 0372 took away the clear's.
   *
   * ⚠️ **A TWENTIETH OF A BOSS — 0372**: *"increase its damage so it does 5% of max boss health
   * damage."* The larger of that and the blast's own six, so a small mid-boss is not hit softer
   * than it was; a window (0255) still multiplies it, as it multiplies everything the player fires.
   */
  bomb: { label: 'Bomb', charges: 2, shot: 'bomb', becomes: 'blast', reach: 80, bossShare: 0.05, surge: null, face: SPRITE.bomb },
  /**
   * The seeker's — *"gives the ship a glowing purple aura and supercharges the homing missiles for
   * 10secs. They travel twice as far and do 4x as much damage."* Twice as far is twice the fuse: a
   * seeker flies until its fuse is out (0246), so its life IS its range.
   */
  hunt: {
    label: 'Hunt',
    charges: 1,
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: { steps: SURGE_STEPS, aura: SPRITE.auraHunt, gun: null, tubes: { damage: 4, fuse: 2 } },
    face: SPRITE.pickupSeeker,
  },
  /**
   * The pulse's — *"supercharges the auto-gun, gives the ship a golden aura and the auto-guns damage
   * is increased by 3x and bullets penetrate like shurikens."* No length was asked for; the seeker
   * surge's ten seconds is the default until it is played.
   */
  overdrive: {
    label: 'Overdrive',
    charges: 1,
    shot: null,
    becomes: null,
    reach: 0,
    bossShare: 0,
    surge: { steps: SURGE_STEPS, aura: SPRITE.auraOverdrive, gun: { damage: 3, pierce: BLADE_EDGE }, tubes: null },
    face: SPRITE.pickupWeapon,
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
