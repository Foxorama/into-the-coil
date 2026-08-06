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
   * Uses before it is spent, per pickup.
   *
   * ⚠️ **Read by nothing today.** `docs/game.md` says a special is *"limited capacity"* and
   * *"manual"*, which makes a charge count the one number the row cannot avoid having; what spends
   * one is the arsenal's work. It is here rather than deferred because a row with no fields at all
   * would make `SpecialRow` a type nobody could get wrong, and the point of the table is that
   * adding a kind is forced to answer something.
   */
  charges: number;
}

export const SPECIALS: Record<SpecialKind, SpecialRow> = {
  /**
   * `docs/game.md`'s *"orbiting mines that are half shield and half weapon"* — the example of a
   * special that is not only a weapon, which is the role `shield` used to hold here.
   */
  mines: { label: 'Mines', charges: 1 },
  /** The one the whole arsenal rule is named after — spent, not held. */
  bomb: { label: 'Bomb', charges: 3 },
};
