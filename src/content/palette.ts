/**
 * The palettes — the first table in `content/`, and the thing that makes
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md`'s alternate palettes free.
 *
 * `docs/decisions/0022-frame-rate-is-a-feature.md` bakes every sprite from
 * `(kind, variant, palette, view)`, so a palette is an ARGUMENT to the art rather than a filter over
 * it. Switching to high contrast is a re-bake at load, not a second art pass and not a shader.
 *
 * ⚠️ **An ink is a ROLE, never a colour name.** `enemy`, not `red`. The moment a table says `red`
 * the high-contrast palette has to lie about its own name, and the code that reads it starts
 * meaning "the red one" — which is precisely how colour ends up carrying meaning by itself.
 *
 * `tests/palette.test.ts` holds the contrast floors. Every ink is legible against `space`, and the
 * pairs a player must never confuse are separated by luminance rather than by hue, because hue is
 * the channel colour-blind players do not have.
 */

/** Which palette is in use. A setting, per 0024 — never a difficulty knob. */
export type PaletteName = 'vivid' | 'high-contrast';

/**
 * What a colour is FOR. Closed, so a new role fails to build until every palette answers it.
 *
 * ⚠️ **`impact` is not `hazard`, and it is a separate role rather than a shade of one.** The ship's
 * hit flash borrowed `hazard` when it was the only thing that flashed. Hazards are environmental and
 * are coming — `docs/game.md` has asteroids in the vocabulary — and sharing one colour between *this
 * just took damage* and *this will hurt you* is the confusion
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` exists to prevent, arriving by the
 * back door. See [0035](../../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md).
 */
/**
 * ⚠️ **`sky` is the one ink that must NOT stand out, and it is the only exception in the table.**
 * Every other role here is something the player has to be able to find; the sky is the thing they all
 * have to be findable AGAINST. `tests/palette.test.ts` holds the contrast floor for every ink and
 * holds the OPPOSITE for this one — it has to sit nearer `space` than anything that carries meaning,
 * or a starfield becomes a field of things that look like pickups.
 * `docs/decisions/0065-the-sky-is-baked-and-blitted.md`.
 */
export type Ink =
  | 'space'
  | 'sky'
  | 'player'
  | 'ally'
  | 'enemy'
  | 'bullet'
  | 'hazard'
  | 'pickup'
  /*
    ⚠️ **`blade` is the player's steel — 0238.** Played: *"shurikens need to be… steel coloured."* A
    role rather than a colour name, on this file's own rule: what it means is *a blade of mine, in
    flight*, and the high-contrast palette answers it in its own terms. It is a MEANING ink and is
    held to every floor a meaning ink is held to; it is in no critical pair, because the blade's
    silhouette (a star bigger than the ship) is the channel that separates it from everything else.
  */
  | 'blade'
  | 'impact'
  | DecorInk;

/**
 * The inks that carry NO meaning, and exist so a hull can have a cockpit.
 *
 * `docs/decisions/0194-a-hull-has-a-livery.md`.
 *
 * ⚠️ **THE WHOLE POINT IS THAT THEY MEAN NOTHING**, which is
 * `docs/decisions/0149-a-hull-has-an-interior.md`'s own argument for `space` — *"`space` means
 * nothing, which is exactly what decoration should mean"* — carried to three more colours so the
 * decoration can be something other than a hole. `docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md`
 * is about what the player must TELL APART; a canopy is not one of those things.
 *
 * ⚠️ **AND THEY ARE HELD TO A DIFFERENT RULE THAN THE REST.** A meaningful ink must clear WCAG AA
 * against the void, because it is found against the void. A decorative one is **never drawn against
 * the void** — it is laid over a hull that has already cleared that bar — so the floor it is held to
 * is the opposite one: it must be far from every ink that DOES mean something, or a cockpit reads as
 * a pickup for the eighth of a second that costs a life. `tests/palette.test.ts` holds both.
 */
export type DecorInk = 'glass' | 'flame' | 'trim';

/** Closed, and derived from nothing — the three names above, written once for the guards. */
export const DECOR_INKS: readonly DecorInk[] = ['glass', 'flame', 'trim'];

export type Palette = Record<Ink, string>;

export const PALETTES: Record<PaletteName, Palette> = {
  /** The default game, per 0024: there is one game and it is the loud one. */
  vivid: {
    space: '#0b0b14',
    // A dim blue-grey: visibly not the void, and nowhere near anything the player has to find.
    sky: '#2a2c44',
    player: '#7ae7ff',
    ally: '#c9a7ff',
    /*
      ⚠️ **BRIGHTENED FROM `#ff4d6d`, AND IT IS WHAT PAYS FOR THE BACKGROUND** —
      `docs/decisions/0222-the-background-is-not-black.md`. Asked for: *"we can also highlight and
      brighten important objects while also filling the background with detail… a plain black
      background is a plain boring game."* Those are one trade rather than two requests: detail is
      bought with cover, cover costs contrast, and **`enemy` is the worst ink in all fourteen
      place-by-palette cells**, so it alone decides how much background the game can afford.

      Measured with `scripts/weigh-sky.mjs`, worst ratio across all seven places against a floor of 3,
      and how much more cover the tightest place could then carry:

        `#ff4d6d`  3.11  → **+0.06**   the sky is full, and Rime Shelf was UNDER the floor at 2.67
        `#ff667f`  3.55  → +0.27
        **`#ff7286`  3.83  → +0.40**
        `#ff8093`  4.17  → +0.51       and visibly pink rather than red

      ⚠️ **THE HUE IS THE THING BEING SPENT, WHICH IS WHY THIS IS NOT SIMPLY THE BRIGHTEST OPTION.**
      Every step towards white buys background and costs the colour the player has learned means
      *this can kill you*. `#ff7286` is a lift that still reads as the same red at a glance and buys
      two thirds of what going full pink would.
    */
    enemy: '#ff7286',
    bullet: '#ff9f1c',
    hazard: '#ffd23f',
    pickup: '#d9ffd0',
    // Near-white and deliberately the brightest thing in the palette: a flash reads as an impact
    // because it is momentarily louder than everything around it, not because of its hue.
    impact: '#fff4e6',
    // Steel: a cool light grey, lighter than `player` and cooler than `impact`, so a ring of blades
    // reads as metal round the ship rather than as more of the ship or as a field of flashes. 0238.
    blade: '#cfd8e3',
    /*
      ── THE THREE THAT MEAN NOTHING — 0194 ────────────────────────────────────────────────────────

      ⚠️ **ALL THREE ARE DARKER THAN EVERY HULL THEY ARE DRAWN ON, AND THAT IS THE DESIGN.** A
      decoration that is BRIGHTER than its hull is a thing on the screen; one that is darker is a
      detail in an object. It is also what keeps them away from `pickup` and `impact`, which are the
      two the player is scanning for.
    */
    // A deep cold blue: a canopy, a viewport, a lit screen seen from outside.
    glass: '#12314a',
    // A banked ember. Deliberately far below `bullet` in lightness — an exhaust must never read as
    // something that has been fired.
    flame: '#8f2f10',
    // Slate. Panel lines, keels, the seam down a hull.
    trim: '#37445c',
  },
  /**
   * Maximum separation on the luminance channel, which is the one that survives every kind of
   * colour blindness. Not simply "brighter" — `bullet` is deliberately held DOWN so that it cannot
   * be mistaken for `pickup`, which is the confusion that costs a life.
   */
  'high-contrast': {
    space: '#000000',
    /*
      ⚠️ **Darker here than in the vivid palette, not brighter.** A high-contrast palette maximises the
      separation between the things that MATTER and the background; a louder sky would spend exactly
      that separation on scenery. It is still above the void, so the parallax is still readable as
      motion — which is the whole of what the sky is for.
    */
    sky: '#1a1a1a',
    player: '#00ffff',
    ally: '#8080ff',
    enemy: '#ff0000',
    bullet: '#ff8000',
    hazard: '#ff00ff',
    pickup: '#ffffff',
    impact: '#ffffff',
    // A step below the two whites, so a blade and a pickup are apart on the one channel this
    // palette exists for, and still far above the void. 0238.
    blade: '#c0c0c0',
    /*
      ⚠️ **DECORATION IS THE VOID HERE, WHICH IS THE SETTING DOING ITS JOB RATHER THAN A GAP** —
      `docs/decisions/0024-the-accessibility-floor-is-settings.md`: *there is one game and it is the
      loud one, and accessibility is knobs over that default.* On high contrast every livery mark
      collapses to the same hole `docs/decisions/0149-a-hull-has-an-interior.md` already punched, so
      **this palette's art is byte-identical to what it was before 0194** and the separation the
      player chose this palette FOR is spent on nothing decorative.
    */
    glass: '#000000',
    flame: '#000000',
    trim: '#000000',
  },
};

/** The default. Named here rather than in `state/` so the bake has one without a reducer. */
export const DEFAULT_PALETTE: PaletteName = 'vivid';
