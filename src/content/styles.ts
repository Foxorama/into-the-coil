/**
 * The visual style: what the game LOOKS like, and nothing else.
 *
 * `docs/decisions/0070-a-style-is-a-setting-and-the-first-one.md`. Asked for after the sky landed:
 * *"the pre-sky game was a really fun retro-sprite style game, can we add that in as our first
 * setting? Retro UI / Modern UI."*
 *
 * ── WHY THIS IS IN `content/` AND NOT IN `sim/` ─────────────────────────────────────────────────
 *
 * Because a style is **presentation**, and `src/sim/assist.ts` states the rule this table has to
 * obey: *"a player who turns the flashing down must not thereby be playing an easier game, and one
 * who turns it up must not be playing a harder one."*
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` is the decision behind it, and
 * `tests/style.test.ts` holds the ban: **no field here may reach the simulation.** A style that
 * hid a threat, changed a hitbox or slowed the world would be a difficulty setting wearing a
 * cosmetic's name.
 *
 * It is in `content/` rather than in `render/` for the reason `src/content/actions.ts` gives about
 * bindings: **a setting is SAVED**, and `save` may import `content` while it may not import
 * `render` — `docs/decisions/0015-the-layer-ladder.md`.
 *
 * ── A HUB, SO THE THIRD STYLE IS A ROW ──────────────────────────────────────────────────────────
 *
 * `docs/decisions/0016-a-hub-enumerates-kinds.md`: kinds in a closed union, behaviour on the row.
 * Adding a style is one entry here and nothing anywhere else — the title screen's buttons are built
 * by walking this list, exactly as the difficulty tiers are.
 */

/** Every style, in the order the chooser offers them. Closed. */
export const STYLE_KINDS = ['retro', 'modern'] as const;

/** Derived from the list, so a style cannot exist in the union and be missing from the table. */
export type StyleKind = (typeof STYLE_KINDS)[number];

/**
 * What a style is.
 *
 * ⚠️ **Every field is a PRESENTATION fact, and that is the closed property.** The moment a field
 * here could be read by `src/sim/` or by `src/app/frame.ts`'s step, the ban above stops being
 * checkable — so the guard is over the field list rather than over anybody's intentions.
 */
export interface StyleRow {
  /** What the chooser calls it. */
  title: string;
  /**
   * One line under it, per `docs/game.md`'s voice rule: what it is, never why it is good.
   *
   * ⚠️ **On the row rather than in the chrome that draws it**, for the reason
   * `src/content/pickups.ts` gives about the title screen's key: a second list of explanations in
   * `src/app/chrome.ts` goes on saying the old thing the day one of them changes.
   */
  hint: string;
  /**
   * Whether the parallax sky is drawn behind the game.
   *
   * ⚠️ **This is the whole of what *retro* means, and it is the ask stated exactly.** The game
   * before [0065](../../docs/decisions/0065-the-sky-is-baked-and-blitted.md) was shapes over the
   * void, and the report is that it was *"a really fun retro-sprite style game."* So retro is not a
   * filter over the modern look — it IS the earlier one, unchanged, and it stays reachable rather
   * than being replaced by the thing that came after it.
   *
   * ⚠️ **It costs the sky's blits and nothing else** — `src/app/mount.ts` builds an empty layer list
   * and `src/render/scene.ts` walks it. Nothing in the frame learns a style exists.
   */
  sky: boolean;
  /**
   * The chrome's typeface role — `pixel` for a monospaced face, `clean` for the system's own.
   *
   * ⚠️ **A ROLE and never a font stack**, on the same terms `src/content/palette.ts` gives for inks:
   * the stack is a fact about a browser and belongs in the stylesheet, and a second copy of it in a
   * content table would drift the day one of them gained a fallback.
   *
   * ⚠️ **The ask says "Retro UI / Modern UI" and this is the UI half of it.** A style that changed
   * only the sky would be a background toggle with a misleading name.
   */
  face: 'pixel' | 'clean';
}

export const STYLES: Record<StyleKind, StyleRow> = {
  /**
   * The game as it was before the sky: silhouettes over the void, and a monospaced chrome.
   *
   * ⚠️ **Not a nostalgia mode bolted on afterwards.** Everything it turns off is younger than it is,
   * which is why it can be exact rather than an impression.
   */
  retro: {
    title: 'Retro',
    hint: 'Shapes over the void, and a monospaced readout.',
    sky: false,
    face: 'pixel',
  },
  /** Everything the project has added since. The default, because it is the game as it now is. */
  modern: {
    title: 'Modern',
    hint: 'A parallax sky behind the game.',
    sky: true,
    face: 'clean',
  },
};

/**
 * The style a player who has chosen nothing gets.
 *
 * ⚠️ **Modern, because 0024 says there is one game and it is the loud one** — the default is what
 * the project currently is, and retro is the knob over it. A default that quietly shipped the older
 * look would make every later art pass invisible until somebody found a menu.
 */
export const DEFAULT_STYLE: StyleKind = 'modern';
