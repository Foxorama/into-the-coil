/**
 * The arsenal's vocabulary — what a ship can be carrying beyond its base weapon.
 *
 * A `Record` over a closed union, per `docs/decisions/0016-a-hub-enumerates-kinds.md`.
 *
 * ── WHY THIS EXISTS BEFORE ANYTHING FIRES ONE ───────────────────────────────────────────────────
 *
 * ⚠️ **Nothing triggers a special yet, and this table is not pretending otherwise.** No row carries
 * behaviour, `src/sim/` cannot see this file, and the arsenal is empty in every run that can
 * currently be played. What is real here is the *element type of a list*.
 *
 * `docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md` says a death empties the
 * arsenal, and the guard over that rule has to be able to put something IN one first — a test that
 * empties a list which can never be non-empty passes forever and proves nothing, which is exactly
 * the shape `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` refuses. An uninhabitable type
 * would make the rule unfalsifiable; two rows make it testable.
 *
 * ⚠️ **The two names are `docs/game.md`'s, not inventions.** It names *"a shield · bombs"* as the
 * starting-special vocabulary and lists both among the upgrades. Choosing them here is reading the
 * product definition, not authoring content — and `src/content/actions.ts` already anticipates
 * exactly this pair: *"a bomb picked up into slot 2 uses `special2`, and so does a shield."*
 *
 * What they DO is the arsenal's own work — the fourth item in `docs/state-of-play.md`. When that
 * lands, `charges` gains a consumer and a `fire` behaviour joins the row. Nothing about this file's
 * shape changes then, which is the whole reason for landing the shape early.
 */

import type { ShotKind } from './shots.ts';
import { SPRITE } from './sprites.ts';

/**
 * Every special, closed. A new one fails every `Record` over this union to BUILD until it has a row.
 *
 * ⚠️ **`shield` was here and has been RENAMED, which is the outcome
 * `docs/decisions/0045-the-player-can-see-what-they-are-carrying.md` wrote down in advance**: *"if
 * both ever exist at once it is the SPECIAL that gets renamed, because this is the word a player
 * already used for the thing that keeps them alive."* Both now exist — a shield is a pickup and a
 * shell around the ship, per
 * `docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md` — so the
 * special takes the other name `docs/game.md` already has for it: *"orbiting mines that are half
 * shield and half weapon."*
 *
 * ⚠️ **A rename and not a deletion.** 0039's rule — a death empties the arsenal — needs a list that
 * can hold two different things to be testable at all, and `src/content/specials.ts` says so; one
 * row would make the guard unfalsifiable. Nothing fires either of them yet.
 */
export const SPECIAL_KINDS = ['mines', 'bomb'] as const;

/**
 * What the player can be carrying. Derived from the list rather than written beside it, so a kind
 * cannot exist in the union and be missing from the table — `src/content/sprites.ts` has the
 * incident that argues for deriving rather than restating.
 */
export type SpecialKind = (typeof SPECIAL_KINDS)[number];

export interface SpecialRow {
  /** What the player would call it. Terse, per `docs/game.md`'s voice rule. */
  label: string;
  /**
   * What leaves the ship when the player triggers it, or `null` for a special nothing fires yet.
   *
   * ⚠️ **NULLABLE, and that is honesty rather than a loophole.** `docs/decisions/0016-a-hub-enumerates-kinds.md`
   * says behaviour rides the row and that a table forces every kind to answer — so the row answers,
   * and `mines` answers *nothing fires me*. The alternative was inventing a weapon for it in the
   * same commit as the bomb, which is exactly the *product to satisfy a shape* that
   * `src/content/ships.ts` refuses for the character roster.
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
   * `alongSpan` runs 150 to 240 units by device, so a bomb thrown *"halfway up the screen"* would be
   * a different weapon on a 21:9 monitor than on a phone — a longer reach for the player with the
   * wider display, which is the difficulty parity 0023 exists to protect.
   *
   * So it is authored in world units against the **reference view** — 16:9, 177.8 units along, the
   * aspect `src/content/levels.ts` is already written for. 80 is a little under half of it, which is
   * the stated fraction on the aspect the levels assume, and it is the same distance everywhere.
   */
  reach: number;
  /**
   * Uses before it is spent, per pickup.
   *
   * ⚠️ **Read by nothing today.** `docs/game.md` says a special is *"limited capacity"* and
   * *"manual"*, which makes a charge count the one number the row cannot avoid having; what spends
   * one is the arsenal's work. It is here rather than deferred because a row with no fields at all
   * would make `SpecialRow` a type nobody could get wrong, and the point of the table is that
   * adding a kind is forced to answer something.
   */
  charges: number;
  /**
   * Which baked bitmap says *this one*, wherever the player is shown their triggers.
   *
   * ⚠️ **On the ROW rather than derived from `shot`**, even though the bomb's face and the bomb's
   * thrown body happen to be the same bitmap. `shot` is nullable — 0016's *a table forces every kind
   * to answer*, and `mines` answers *nothing fires me* — so deriving it would leave exactly the kinds
   * that have no weapon yet with no face either, and those are the ones a player most needs told
   * apart. `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md` is what needed it.
   *
   * ⚠️ **The real art, never a drawing of it** — the same argument `src/app/chrome.ts` makes for the
   * pickup key: a hand-written glyph is a second description of a silhouette, and the day the art
   * pass moves one the key goes on showing the old shape.
   *
   * An index rather than a name, exactly as `Body.sprite` is.
   */
  face: number;
}

export const SPECIALS: Record<SpecialKind, SpecialRow> = {
  /**
   * `docs/game.md`'s *"orbiting mines that are half shield and half weapon"* — the example of a
   * special that is not only a weapon, which is the role `shield` used to hold here.
   */
  // The orbiting mark is the closest thing the art has to *half shield and half weapon*, which is
  // what `docs/game.md` calls this. It has no shot, so it could not have borrowed one.
  mines: { label: 'Mines', charges: 1, shot: null, becomes: null, reach: 0, face: SPRITE.shieldOrb },
  /**
   * The one the whole arsenal rule is named after — spent, not held.
   *
   * ⚠️ **`charges` is 2 and it was 3**, because the ask says so: *"the player starts with 2 and
   * gains one per level cleared."* It is the number a run BEGINS with and the number a death goes
   * back to — 0039's *"back to the ship's base weapon and starting special"*, which had nothing to
   * cash until now.
   */
  bomb: { label: 'Bomb', charges: 2, shot: 'bomb', becomes: 'blast', reach: 80, face: SPRITE.bomb },
};
