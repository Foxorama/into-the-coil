/**
 * The screens the player reads, as DOM over the canvas.
 *
 * ── WHY DOM AND NOT PAINTED INTO THE CANVAS ─────────────────────────────────────────────────────
 *
 * `docs/decisions/0024-the-accessibility-floor-is-settings.md` puts **actions, not keys** and an
 * operable interactive surface in the unconditional tier. A real `<button>` is focusable, reachable
 * by tab, announced by a screen reader, and activated by the platform's own conventions on three
 * device classes. A rectangle painted into a canvas is none of those, and every one of them would
 * have to be rebuilt by hand — badly, and only for the cases somebody remembered.
 *
 * It is also the precedent already set next door: `src/app/mount.ts` builds the rotate prompt as an
 * element for the same reason, and says so.
 *
 * ── WHY CLASSES, WHEN THE ROTATE PROMPT USES INLINE STYLES ──────────────────────────────────────
 *
 * ⚠️ **Because a focus ring cannot be written inline.** `:focus-visible` and `:hover` are states, and
 * an inline style has no way to express one. The rotate prompt has no control on it, so it never
 * needed a stylesheet; a screen with a button does, and a button whose focus is invisible fails the
 * floor above in the specific way keyboard players notice first.
 *
 * ── AND THEREFORE THE PREFIX RULE, WHICH 0017 DEFERRED TO EXACTLY THIS MOMENT ───────────────────
 *
 * `docs/decisions/0017-the-state-is-slices.md` deferred a class-prefix rule *"in the same commit as
 * the first screen's chrome, when there is real usage to prove the extraction against"*. This is that
 * commit. Every class here is `itc-<screen>-…`, because CSS class names and DOM ids are global while
 * the modules that write them cannot see each other — the predecessor took a real regression from
 * `.gs-hud` being shared between two different HUDs, and its own constitution cites the incident
 * twice. `tests/chrome.test.ts` is the guard.
 */

import { SCREENS, STEPS_PER_SECOND, type ChoiceName, type Screen } from '../state/screens.ts';
import type { Palette, PaletteName } from '../content/palette.ts';
import { PICKUPS, PICKUP_CYCLE_STEPS, PICKUP_KINDS, faceOf } from '../content/pickups.ts';
import { SIDES, SIDE_LABELS } from '../content/specials.ts';
import { SHIP_BOX, SPRITE, SPRITE_KINDS } from '../content/sprites.ts';
import { RIMS } from '../content/rims.ts';
import { bakeAtlas, bakeGlyph, bakeShipFit, chartTileX, chartTileY, drawChart, mix, shade, withFit } from '../render/bake.ts';
import { DICE, HUD_MOTIFS, SHIPS, SHIP_KINDS, ownFit, sameFit, type Fit, type HudInk, type ShipKind, type ShipRow } from '../content/ships.ts';
import { DANGLE_KINDS, type DangleKind } from '../content/dangles.ts';
// 0513: the pilot card names the gun the pilot's ship carries, and says it in a line.
import { WEAPONS } from '../content/weapons.ts';
import { paintPortrait } from '../render/golfer-art.ts';
import { GOLFERS, GOLFER_KINDS, type GolferKind } from '../content/golfers.ts';
import { DEFAULT_BINDINGS } from '../content/actions.ts';
import { PAD_SPECIAL_BUTTONS } from './pad.ts';
// The trigger buttons' geometry, from the file that hit-tests them. One table, or the picture and the
// hit region disagree — `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md`, and the button
// that replaced the strip is `docs/decisions/0358-a-trigger-is-a-button.md`.
import { TRIGGER_BUTTON } from './touch.ts';
import type { HandKind } from '../content/touch.ts';
/**
 * The drawn disc's diameter as the stylesheet says it — 0465: the table's share of the glass's short
 * edge, held between its floor and its ceiling in pixels. One string, used for the disc's box and for
 * each disc's place up the edge, so `triggerRadius` and the picture cannot round differently.
 */
const TRIGGER_DISC = `clamp(${TRIGGER_BUTTON.min}px, ${TRIGGER_BUTTON.size * 100}cqmin, ${TRIGGER_BUTTON.max}px)`;
// The boss's phase table, so the bar can mark where the fight turns — 0360.
import type { BossRow } from '../content/bosses.ts';
import { MULTIPLIER_CAP, STREAK_STEP, multiplierFor } from '../content/score.ts';

/**
 * The class prefix a screen's chrome owns.
 *
 * ⚠️ **The single description of the rule**, called by the builder below and by the guard in
 * `tests/chrome.test.ts` — never restated in either. An earlier draft of a guard in this repository
 * wrote its rule out twice, once in the scan and once in the fixture proving the scan, so the proof
 * tested a copy and would have gone on passing after the real one broke;
 * `docs/decisions/0017-the-state-is-slices.md` records that mistake against itself.
 *
 * Lowercased, because `itc-gameOver-heading` puts a capital in the middle of a CSS class for no
 * reason a stylesheet cares about.
 */
export function prefixFor(screen: Screen): string {
  return 'itc-' + screen.toLowerCase() + '-';
}

/**
 * The attribute naming which setting a strip of options belongs to.
 *
 * Exported for the same reason `prefixFor` is: it is a contract with a browser test, and a second
 * spelling of it in the test file is a contract kept in step by hand.
 */
export const SETTING_ATTR = 'data-itc-setting';

/**
 * The stylesheet, as one string.
 *
 * ⚠️ **Every selector in here is a class, and every class is prefixed.** No element selectors, no
 * ids, nothing that could reach outside this overlay — the page is also hosting a canvas and, on
 * itch.io, an iframe inside somebody else's document.
 */
/**
 * The screens that draw an overlay panel, and therefore need styling.
 *
 * ⚠️ **DERIVED, AND IT WAS EIGHT HAND-WRITTEN LISTS UNTIL 0210.** Every selector below used to name
 * the four screens explicitly — `.itc-title, .itc-gameover, .itc-cleared, .itc-victory` — in eight
 * places. Adding a fifth screen produced one that **routed correctly, mounted correctly, reported
 * itself shown, and was completely invisible**, because `display: none` is the default and the rule
 * that lifts it did not name it. Nothing failed; there was simply nothing on the screen.
 *
 * `playing` is the one screen with no heading and no controls — it IS the game — so the predicate is
 * what a panel is rather than a list of which screens have one.
 */
// ⚠️ `hasChrome` and not the condition written out again: it was, and 0340 had to change it in two
// places in one file. The function is a declaration further down, so it is hoisted to here.
const PANELLED: readonly Screen[] = (Object.keys(SCREENS) as Screen[]).filter(hasChrome);

/**
 * `.itc-title-action, .itc-gameover-action, …` — one selector list, for any part of a panel.
 *
 * ⚠️ **THROUGH `prefixFor`, AND THE FIRST DRAFT INTERPOLATED THE SCREEN NAME RAW.** That emitted
 * `.itc-gameOver-shown` while the DOM carries `itc-gameover-shown` — a capital in the middle of a
 * class, matching nothing, on the one screen whose name is camelCase. **`tests/chrome.test.ts` caught
 * it on the first run**, which is the prefix rule earning its keep against the very refactor that
 * was meant to make screens safer to add.
 */
const each = (part = ''): string => PANELLED.map((screen) => `.${prefixFor(screen).slice(0, -1)}${part}`).join(', ');

/**
 * The screens with a band of faces and the pilot card under it — 0513's title, and since 0521 the
 * hangar. Read off the rows, on `PANELLED`'s terms, so a third screen offering the pilots is styled.
 */
const FACED: readonly Screen[] = PANELLED.filter((screen) => SCREENS[screen].choices.some((c) => c.faces === 'portraits'));

/**
 * `rule` once per screen with faces, as one selector list.
 *
 * ⚠️ **THE WHOLE SELECTOR PER SCREEN, WHICH `each` CANNOT DO.** `each` is a comma list, so a part
 * written after it binds to its last selector only — the trap the face rules below were spelled out by
 * hand to avoid. A function of the prefix writes the compound once and the list repeats all of it.
 */
const faced = (rule: (p: string) => string): string => FACED.map((screen) => rule(prefixFor(screen))).join(', ');

/** The screens with a band on them — the title, Settings and the hangar — on `FACED`'s terms. */
const BANDED: readonly Screen[] = PANELLED.filter((screen) => SCREENS[screen].choices.length > 0);

/** `rule` once per screen with a band, on `faced`'s terms. */
const banded = (rule: (p: string) => string): string => BANDED.map((screen) => rule(prefixFor(screen))).join(', ');

/**
 * The title's star sky — 0437: three layers, far to near, each a handful of soft dots on a tile of
 * its own size, drifting a whole number of tiles per loop at its own speed. Placed by a fixed hash
 * rather than a stream: it is the stylesheet's, written once at load, and the same sky every time.
 */
function starSky(): string {
  const layers = [
    { tile: 320, count: 9, size: 1, alpha: 45, tiles: 1 },
    { tile: 240, count: 6, size: 1.5, alpha: 65, tiles: 2 },
    { tile: 180, count: 3, size: 2, alpha: 85, tiles: 5 },
  ];
  const images: string[] = [];
  const sizes: string[] = [];
  const from: string[] = [];
  const to: string[] = [];
  let n = 0;
  for (const layer of layers) {
    for (let i = 0; i < layer.count; i++) {
      n++;
      const x = Math.round((((n * 7919) % 997) / 997) * layer.tile);
      const y = Math.round((((n * 104729) % 991) / 991) * layer.tile);
      images.push(
        `radial-gradient(${layer.size}px ${layer.size}px at ${x}px ${y}px, ` +
          `color-mix(in srgb, var(--itc-shine, #fff) ${layer.alpha}%, transparent), transparent)`,
      );
      sizes.push(`${layer.tile}px ${layer.tile}px`);
      from.push('0 0');
      to.push(`${-layer.tile * layer.tiles}px 0`);
    }
  }
  return (
    `.${prefixFor('title')}sky { background-image: ${images.join(', ')}; background-size: ${sizes.join(', ')}; ` +
    `animation: ${prefixFor('title')}drift 60s linear infinite; }\n` +
    `@keyframes ${prefixFor('title')}drift { from { background-position: ${from.join(', ')}; } to { background-position: ${to.join(', ')}; } }`
  );
}

/**
 * The pickup key's turns — 0432, on How to play since 0458: one keyframe set per number of faces a pickup has, read off the table,
 * so a pickup given a fourth face turns through four without an edit here. Each face is up for its
 * share of the turn and crossfades over the last few percent of it.
 */
function faceTurns(): string {
  const counts = [...new Set(PICKUP_KINDS.map((kind) => PICKUPS[kind].faces.length))].filter((n) => n > 1);
  return counts
    .map((n) => {
      const share = 100 / n;
      const fade = 3;
      return (
        `@keyframes ${prefixFor('guide')}key-face-${n} { ` +
        `0% { opacity: 1; visibility: visible; } ${share - fade}% { opacity: 1; visibility: visible; } ` +
        `${share}% { opacity: 0; visibility: hidden; } ${100 - fade}% { opacity: 0; visibility: hidden; } ` +
        `100% { opacity: 1; visibility: visible; } }`
      );
    })
    .join('\n');
}

/**
 * The strip across the top of play — 0439's one height, 0465's type — as numbers rather than as
 * literals in the stylesheet, because since 0500 the camera keeps a bar for it on a desktop and the
 * bar must be exactly the strip. The stylesheet interpolates these; `hudBar` reads the same ones.
 */
export const STRIP = {
  /** The strip's type: a share of the host's height in hundredths (cqh), between a floor and a cap in rem. */
  fontFloorRem: 0.75,
  fontCqh: 2.9,
  fontCapRem: 1.3,
  /** Every plate's height, in the strip's em. */
  plateEm: 2.6,
  /** The air above the plates, in the strip's em — and, in the bar, below them too. */
  padEm: 0.5,
} as const;

/**
 * How tall the bar at the top of a desktop's screen is, in CSS pixels — 0500: the strip's plates with
 * the strip's own air above and the same below, for a host `hostHeight` tall at a root type of `remPx`.
 *
 * ⚠️ **A desktop's only.** The shell asks for none on a touch screen, where the HUD stays over the
 * field as it always has: the phone was the screen the player said looks right.
 */
export function hudBar(hostHeight: number, remPx: number): number {
  const font = Math.min(STRIP.fontCapRem * remPx, Math.max(STRIP.fontFloorRem * remPx, (STRIP.fontCqh * hostHeight) / 100));
  return font * (STRIP.padEm + STRIP.plateEm + STRIP.padEm);
}

/**
 * ⚠️ **EXPORTED SINCE 0210, AND IT IS A CONTRACT WITH `tests/chrome.test.ts` RATHER THAN A CONVENIENCE.**
 * The guards used to regex this literal out of the source file. That worked while every selector was
 * spelled out; the moment `${each()}` interpolated one, a source scan started reading the template
 * hole instead of the classes — **so the prefix guard would have gone on passing over a stylesheet it
 * could no longer see.** A guard that reads source cannot follow a template, and the fix is to hand
 * it the evaluated string, on the same terms `prefixFor` is exported.
 */
export const STYLE = `
/*
  ⚠️ **THE OVERLAY IS A SCROLL CONTAINER AND A QUERY CONTAINER, AND BOTH ARE LOAD-BEARING.**
  Decision 0049. It is a query container so every size below can be a fraction of THIS BOX rather
  than of the viewport — the box is the one the player is looking at, and on a page that embeds the
  game those are not the same number. It scrolls so that content which does not fit is reachable
  rather than lost, which is what the reported bug actually was.

  ⚠️ **No font here, and no padding either.** A container cannot query itself: a length in cq units
  written on this element resolves against its own nearest ANCESTOR container, which is the page.
  Everything sized against the short axis therefore lives on the panel below.
*/
${each()} {
  position: absolute;
  inset: 0;
  display: none;
  overflow: auto;
  container-type: size;
}
${each('-shown')} { display: flex; }
/*
  ── A SCREEN THAT DOES NOT DIM ──────────────────────────────────────────────────────────────────

  Decision 0063. The level break keeps the world running behind it, so its overlay must not paint
  over the scene and must not take the pointer — a full-bleed box across the playfield would swallow
  every drag the player makes with the thumb they are still steering with.

  ⚠️ **The CONTROL takes pointer events back**, so *Onward* is still pressable by a hand that wants
  to skip the break. That pair — none on the box, auto on the button — is the whole mechanism, and it
  is the same one the HUD uses one rule down.

  The background is set inline per screen by the builder, so nothing here has to know which is which.
*/
.itc-cleared { pointer-events: none; }
.itc-cleared-action { pointer-events: auto; }
/*
  ⚠️ **Centred by AUTO MARGINS, not by justify-content, and that is the fix rather than a style.** A
  flex item centred by the container is centred when it overflows too — half of it pushed off the
  START edge, where no scrollbar can reach it. That is precisely what the title screen did on a phone:
  the heading was off the top of the screen and the third tier was off the bottom. Auto margins
  distribute POSITIVE free space only, so an overflowing panel falls back to the top and scrolls.
*/
${each('-panel')} {
  margin: auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: min(1.5rem, 3.5cqh);
  /*
    ⚠️ **4cqh and not 5, and the change is about the SHORTEST screen only.** Both terms are a min, so
    a desktop is unaffected past a container about 800px tall; what moves is the phone, where 5cqh
    was spending 32 of 320 pixels on the margin of a full-bleed overlay. Decision 0049 says the chrome
    is authored against the short axis, and padding is the first thing that should give on it — ahead
    of type, which has a floor, and ahead of content, which is the screen.
  */
  padding: min(2rem, 4cqh) min(2rem, 4cqw);
  max-width: 100%;
  text-align: center;
  /*
    ⚠️ **A clamp and not a bare min: type has a FLOOR.** Sizing purely as a fraction of the box means
    a short enough box has 5px buttons, which "fit" in the sense that a photograph of them fits —
    decision 0024's accessibility floor is about the opposite of that. Below the floor the screen
    overflows instead, which is what the scroll container is for and what the suite asserts
    separately. (No file paths in this block: the prefix guard reads every dotted token here as a CSS
    class, so an extension fails as an unprefixed class name.)
  */
  font: 600 clamp(0.85rem, 5.4cqh, 1.25rem)/1.35 system-ui, sans-serif;
}
.itc-title-heading { font-size: clamp(1.25rem, min(6cqw, 9cqh), 3.5rem); letter-spacing: 0.02em; margin: 0; }
/*
  ── THE WORDMARK — 0436 ──────────────────────────────────────────────────────────────────────────

  The name was set as a heading in the panel's own type, the same cyan as every button under it, so
  the one thing on the screen that is the game's name read as a label. Heavier, spaced, and run from
  the ally violet into the ship's ink — the two inks of the player's side, in the studio banner's
  order since 0440 — with a halo in the cyan, so it is lit the way the playfield is lit. Both inks come off the palette, so a high-contrast palette
  still sets it in its own colours. The size is 0049's and untouched.
*/
/*
  The badge beside the name — 0437. As tall as the name's cap height and a little more, so it reads
  as one lockup rather than an icon standing next to a heading; its ring is the painting's own.
*/
.itc-title-mark, .itc-splash-mark { display: flex; align-items: center; justify-content: center; gap: 0.4em; }
.itc-title-badge { width: clamp(1.8rem, min(9cqw, 13cqh), 5rem); height: auto; aspect-ratio: 1; }
.itc-splash-badge { width: clamp(2.6rem, min(13cqw, 20cqh), 7rem); height: auto; aspect-ratio: 1; animation: itc-splash-in 1.2s ease-out both; }
/*
  ── THE TITLE'S SKY — 0437 ───────────────────────────────────────────────────────────────────────

  Three layers of stars drifting left at three speeds, as the game's own sky scrolls, and the pilot's
  ship crossing low every sixteen seconds with its exhaust lit. Behind the panel, taking no pointer.
  Each layer moves a whole number of its own tiles per loop, so the loop has no seam. The buttons get a
  backing of the void, because a ship passing behind a label is a label nobody can read.
*/
.itc-title-sky {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}
${starSky()}
.itc-title-panel { position: relative; z-index: 1; }
.itc-title-flyer {
  position: absolute;
  left: 0;
  top: 88%;
  width: clamp(2.2rem, 7cqmin, 4rem);
  height: clamp(2.2rem, 7cqmin, 4rem);
  transform: translateX(-20cqw);
  animation: itc-title-fly 16s linear infinite;
  filter: drop-shadow(0 0 0.35em var(--itc-ink));
}
.itc-title-flyer > canvas { display: block; width: 100%; height: 100%; }
/* The exhaust: a streak of the bullet's orange running back from the tail. */
.itc-title-flyer::before {
  content: '';
  position: absolute;
  right: 72%;
  top: 46%;
  width: 180%;
  height: 8%;
  border-radius: 999px;
  background: linear-gradient(to left, var(--itc-hot, #ff9f1c), transparent);
}
@keyframes itc-title-fly {
  0% { transform: translate(-20cqw, 0); }
  40% { transform: translate(120cqw, -5cqh); }
  100% { transform: translate(120cqw, -5cqh); }
}
/*
  The buttons only. The settings stay hollow, because hollow against filled is how the chosen one is
  told (0024, and the style suite holds it), and the ship's lane is below them.
*/
.itc-title-panel .itc-title-action { background-color: color-mix(in srgb, var(--itc-void) 82%, transparent); }
@media (prefers-reduced-motion: reduce) {
  .itc-title-sky { animation: none; }
  .itc-title-flyer { display: none; }
}
/*
  ⚠️ **VIOLET INTO CYAN, AND IT RAN THE OTHER WAY — 0440.** The studio's banner runs its name from the
  ally violet on the left into the ship's cyan on the right; 0436 had it backwards. Every screen's
  heading wears it since 0440, not only the name's: the golfers', the break's, the run over's, the
  victory's and the music room's were the panel's plain cyan, a second voice beside the title's.
*/
.itc-title-heading, .itc-splash-heading, .itc-settings-heading, .itc-guide-heading,
.itc-paused-heading, .itc-gameover-heading, .itc-ended-heading, .itc-cleared-heading, .itc-victory-heading, .itc-music-heading {
  font-weight: 800;
  letter-spacing: 0.06em;
  background: linear-gradient(100deg, var(--itc-ally, var(--itc-ink)) 15%, var(--itc-ink) 85%);
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 0.3em color-mix(in srgb, var(--itc-ink) 40%, transparent));
}
.itc-gameover-heading, .itc-ended-heading, .itc-cleared-heading, .itc-victory-heading, .itc-music-heading, .itc-settings-heading, .itc-guide-heading {
  font-size: clamp(1.1rem, min(5cqw, 8cqh), 2.75rem);
  margin: 0;
}
/*
  THE TITLE SCREEN'S TWO COLUMNS — the table beside the rows, not above them. 0458.

  ⚠️ **The long axis is where a list goes.** Landscape is the shipped orientation
  (docs/decisions/0031), so the screen the game is read on is wide and SHORT — a phone gives about
  320 to 400 CSS pixels of height and two or three times that of width. The table and the rows are
  independent, so they sit side by side and the scarce axis carries whichever is taller.

  ⚠️ **A GRID WITH FRACTIONAL COLUMNS, AND THE FIRST VERSION WAS A WRAPPING FLEX ROW THAT CI CAUGHT.**
  A flex row wraps when its items' NATURAL widths do not fit, and a natural width is a text
  measurement — so the layout held on the machine it was written on and stacked on the CI runner,
  where system-ui is a different font with wider metrics. Fractional tracks are a fraction of the
  container and cannot be pushed wider by their contents. minmax(0, Nfr) and not a bare fr, because a
  track's default floor is its content's min-content width. (No backticks in this block: it is a
  template literal.)

  With no table yet the rows stand alone in the middle: a column kept for nothing is a screen that
  looks unfinished.

  ⚠️ **THE BARE RULE NAMES BOTH CLASSES, AND WITH ONE IT LOST ON EVERY PHONE.** The phone block
  further down sets the two columns again on the body's one class, and later in the file at the same
  weight wins — so with no table the rows got five sixteenths of a phone beside a column holding
  nothing, the tier names stood four words tall under their own step arrows, and the faces were cut at
  both ends. The layout guard only ever measured the title with a table seeded, so the screen every
  first-time player sees was the one screen it had not looked at.
*/
.itc-title-body {
  display: grid;
  grid-template-columns: minmax(0, 7fr) minmax(0, 11fr);
  align-items: center;
  gap: min(1rem, 2.4cqh) min(2.5rem, 4cqw);
  width: 100%;
}
.itc-title-body.itc-title-body-bare { grid-template-columns: minmax(0, 1fr); }
.itc-title-body-bare > .itc-title-board { display: none; }
/* The bands over Launch and Settings, as one column of rows: the order the pad walks them in. */
.itc-title-main {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: min(1rem, 2.4cqh);
  min-width: 0;
  width: min(100%, 34em);
  justify-self: center;
}
${each('-choices')} {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: min(1.5rem, 3.5cqh);
}
/*
  ── THE MUSIC ROOM WRAPS, BECAUSE NINE CONTROLS DO NOT STACK — 0210 ─────────────────────────────

  ⚠️ **NO BACKTICKS IN THIS COMMENT, AND THE FIRST DRAFT HAD THREE.** The stylesheet is a JS template
  literal, so a backtick in a CSS comment closes it and the file stops parsing — which is exactly the
  hazard decision 0200 is about, met inside
  the file rather than in a shell.

  ⚠️ **the layout guard REFUSED THE COLUMN ON EVERY DEVICE IT CHECKS**, down to the
  480×320 landscape phone and up to a 1280×720 laptop. Seven places, *Play all* and *Back* in one
  column is taller than any of them, and that guard's own words are *scrolling is the net and not the
  design* — the overlay scrolls so nothing is ever lost, not so a screen can be built too tall.

  A wrapping row costs nothing on a wide screen and is the whole fix on a short one. The buttons are
  narrower here than on the title screen for the same reason: a place's name is two or three words,
  where a tier's is a sentence with a hint under it.
*/
/*
  ── AND THE TITLE WRAPS ON A SHORT SCREEN, FOR THE SAME REASON — 0210 ───────────────────────────

  ⚠️ **THE FOURTH CONTROL IS WHAT COST THIS.** Three tiers fitted a 480x320 landscape phone with the
  cq-clamped type and gaps this file already uses; a fourth did not, on four of the six devices
  the layout guard checks. Dropping the hint was tried first and was not enough — the
  button itself is the height, not its second line.

  ⚠️ **A CONTAINER QUERY AND NOT A MEDIA QUERY, AND IT IS THE FIRST IN THE FILE.** Decision 0049 put
  container-type: size on the overlay precisely so the chrome is authored against THE BOX THE PLAYER
  IS LOOKING AT rather than the viewport — on a page that embeds the game those are different
  numbers, and a media query would answer for the wrong one.

  460px is above every phone height the guard checks and below the tablet, so a desktop is untouched.
*/
.itc-music-choices {
  flex-direction: row;
  flex-wrap: wrap;
  justify-content: center;
  gap: min(0.6rem, 2cqh) min(0.6rem, 1.5cqw);
  max-width: min(100%, 60ch);
}
.itc-music-action { width: min(100%, 18ch); }
/*
  ── THE SPLASH — decision 0415, and a press since 0513 ───────────────────────────────────────────

  The name, large, fading up while the game loads behind it. Once it has loaded the sweep under the
  name stops and Press to begin breathes in its place: a button, so a click and a tap reach it, though
  any key or tap anywhere does the same. The golfers' four cards that followed it are gone.
*/
.itc-splash-heading {
  font-size: clamp(1.8rem, min(9cqw, 14cqh), 5rem);
  letter-spacing: 0.04em;
  margin: 0;
  animation: itc-splash-in 1.2s ease-out both;
}
@keyframes itc-splash-in { from { opacity: 0; transform: scale(0.96); } to { opacity: 1; transform: none; } }
/*
  ⚠️ **THE SPLASH SAYS IT IS WORKING — 0436.** It was the name alone on the void for as long as the
  load took, which on a slow machine is long enough to wonder whether anything is happening. A light
  runs along a line under the name for as long as the splash is up. It is deliberately a sweep and not
  a bar that fills: the boot does not know its own fraction, and a bar that guessed would be a claim.
*/
.itc-splash-panel::after {
  content: '';
  display: block;
  width: min(60%, 24rem);
  height: 3px;
  border-radius: 2px;
  /*
    On the panel and not on the heading: the heading's fill is clipped to its letters (the wordmark),
    and a line hung off it was clipped with them into a speck.
  */
  background:
    linear-gradient(90deg, transparent, var(--itc-ink), transparent) no-repeat,
    color-mix(in srgb, var(--itc-ink) 18%, transparent);
  background-size: 35% 100%, auto;
  animation: itc-splash-load 1.4s ease-in-out infinite;
}
@keyframes itc-splash-load { from { background-position: -60% 0, 0 0; } to { background-position: 160% 0, 0 0; } }
@media (prefers-reduced-motion: reduce) {
  .itc-splash-panel::after { animation: none; background-position: 50% 0, 0 0; }
}
/* Loaded: the sweep has said what it was for, and the prompt takes its place. */
.itc-splash-panel:has(.itc-splash-action:not([hidden]))::after { display: none; }
.itc-splash-action {
  border: none;
  background: none;
  box-shadow: none;
  font-size: clamp(1rem, min(3cqw, 5cqh), 1.6rem);
  letter-spacing: 0.3em;
  text-transform: uppercase;
  animation: itc-splash-breathe 2.4s ease-in-out infinite;
}
@keyframes itc-splash-breathe { 0%, 100% { opacity: 0.45; } 50% { opacity: 1; } }
@media (prefers-reduced-motion: reduce) {
  .itc-splash-action { animation: none; }
}
/*
  ── THE NOW PLAYING READOUT — decision 0212, and no extension on that path ──────────────────────
  (0210's own note: the prefix scanner reads every dotted token in this template as a class name.)

  ⚠️ **THE MUSIC ROOM IS THE ONE SCREEN THAT DOES NOT DIM, AND THAT IS THE FEATURE.** Every other
  panelled screen paints the space colour over the scene; this one is a window onto the place being
  auditioned, scrolling past at the rate a run would. So the panel needs a backing of its own or the
  words sit on a moving star field and cannot be read — which is what a dim used to do for free.

  ⚠️ **A translucent backing and not the space colour at full strength.** The point of the screen is
  that you can see where you are; a solid box is the dim back again with extra steps.
*/
.itc-music-panel {
  background: color-mix(in srgb, var(--itc-void) 78%, transparent);
  border-radius: 0.6em;
  /*
    ⚠️ **CAPPED, BECAUSE THE PANEL WAS 1280 WIDE OVER ABOUT 480 OF CONTENT** — 0213. On every other
    screen that costs nothing, because every other screen paints over the scene anyway. Here the
    backing IS the thing between the player and the flythrough, so a panel two and a half times wider
    than its content hides two and a half times as much of the picture.

    ⚠️ **A LENGTH AND NOT fit-content, WHICH WAS TRIED FIRST AND RESOLVED TO 1216px.** The readout and
    the button box both size themselves with a percentage of this element, so its max-content is
    indefinite and fit-content has nothing to shrink to. **66ch is the widest thing in it** — the
    choices box caps at 60ch and the padding is the rest — so this states the same width those two
    already agree on rather than a new opinion about it.
  */
  max-width: min(100%, 66ch);
}
/*
  ── THE CROSSING IS A CAPTION OVER A GAME THAT IS STILL BEING FLOWN — 0340 ─────────────────────

  ⚠️ **THE LEVEL BREAK'S RULES, FOR THE LEVEL BREAK'S REASON.** The first build of this screen
  stopped the world and drew a chart in place of it, and was played as: it takes the player out of the
  game. It is a burn the ship makes now, with the player's hands still on it — so the overlay paints
  nothing and takes no pointer, exactly as the break one rule up does, and a full-bleed box here would
  swallow the thumb that is still steering.

  ⚠️ **AND THERE IS NO CONTROL TO HAND THE POINTER BACK TO.** The break gives its one button pointer
  events again; this has no button, on purpose, so the whole tree is inert.
*/
.itc-travel, .itc-travel * { pointer-events: none; }
/*
  ── THE PLATE — decision 0341 ───────────────────────────────────────────────────────────────────

  The burn was played and called great; this was called pretty basic, graphically. It was a dark
  rounded box with a heading in it. It is a nav plate now: cut corners, a hairline frame, scanlines,
  and ALL of it lit in the colour of the place the ship is burning towards, so six crossings are six
  plates rather than one box with six names in it.

  ⚠️ **AT THE TOP, WHERE THE BREAK'S BANNER WAS A MOMENT AGO, AND NOT IN THE MIDDLE.** The middle of
  the screen is where the ship is, and decision 0063 moved the break's own banner off it for that
  reason after measuring where it had actually landed. Auto on the bottom only: the shared panel rule
  is auto on every side, so what moves this is the top margin being SMALL — the one-line mechanism
  decision 0340's probe found by coming back green against a redundant second line.

  ⚠️ **THE ACCENT ARRIVES AS A CUSTOM PROPERTY AND FALLS BACK TO THE INK.** The shell pushes the
  place's colour with the words; until it has, or if it never does, every rule here resolves to the
  player's own ink and the plate is merely cyan rather than broken.

  ⚠️ **THE FRAME IS A BORDER PLUS TWO DIAGONAL HAIRLINES, BECAUSE A CLIPPED CORNER HAS NO BORDER.**
  The clip path cuts two corners off, and takes the border with them — the cut edges would be the
  backing simply stopping. Each cut is a square the size of the cut with one diagonal line through it,
  drawn as a background layer in the corner it belongs to, so the frame goes all the way round.

  ⚠️ **NO BLUR BEHIND IT, ON PURPOSE.** A backdrop filter over a canvas repainting sixty times a
  second at full burn is a full-screen effect per frame to soften a caption. The backing is a colour.
*/
.itc-travel-panel {
  margin-top: min(1.25rem, 4cqh);
  margin-bottom: auto;
  --itc-cut: 0.9em;
  --itc-edge: color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 72%, transparent);
  --itc-hairline: linear-gradient(
    135deg,
    transparent calc(50% - 1px),
    var(--itc-edge) calc(50% - 1px),
    var(--itc-edge) calc(50% + 1px),
    transparent calc(50% + 1px)
  );
  background:
    var(--itc-hairline) top left / var(--itc-cut) var(--itc-cut) no-repeat,
    var(--itc-hairline) bottom right / var(--itc-cut) var(--itc-cut) no-repeat,
    repeating-linear-gradient(0deg, rgba(255, 255, 255, 0.04) 0 1px, transparent 1px 3px),
    linear-gradient(180deg, color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 16%, transparent), transparent 60%),
    color-mix(in srgb, var(--itc-void) 80%, transparent);
  border: 1px solid var(--itc-edge);
  border-radius: 0;
  clip-path: polygon(
    var(--itc-cut) 0,
    100% 0,
    100% calc(100% - var(--itc-cut)),
    calc(100% - var(--itc-cut)) 100%,
    0 100%,
    0 var(--itc-cut)
  );
  max-width: min(100%, 62ch);
  /*
    ⚠️ **TIGHTER THAN THE SHARED PANEL PADDING, BECAUSE THIS PANEL IS OVER A GAME.** Every other one
    is over a dim, where padding costs nothing. Measured in a browser, the first version of this banner
    reached 34.8 percent of the way down the screen and the ship rests at fifty: its own guard holds it
    to the top third, and what gave was the banner rather than the line.
  */
  padding: min(1rem, 2.5cqh) min(1.6rem, 3cqw);
  text-align: left;
  animation: itc-travel-in 0.55s cubic-bezier(0.2, 0.8, 0.2, 1) both;
  transition: opacity 1.1s ease-in, transform 1.1s ease-in;
}
/*
  ⚠️ **IT ARRIVES WITH THE BURN AND LEAVES WITH IT, AND NEITHER IS A CUT.** A keyframe on the way in,
  because the overlay goes from display none and a transition cannot start from that; a transition on
  the way out, because the shell marks the banner as leaving on the step the burn starts to trail off,
  and it is gone before the level is entered. It comes DOWN from the top edge and goes back up to it,
  which is the direction the screen edge it belongs to is in.
*/
@keyframes itc-travel-in { from { opacity: 0; transform: translateY(-0.9em); } to { opacity: 1; transform: none; } }
@keyframes itc-travel-rise { from { opacity: 0; transform: translateY(0.45em); } to { opacity: 1; transform: none; } }
@keyframes itc-travel-draw { from { transform: scaleX(0); } to { transform: scaleX(1); } }
@keyframes itc-travel-pulse { from { opacity: 0.9; transform: scale(1); } to { opacity: 0; transform: scale(2.8); } }
.itc-travel-leaving .itc-travel-panel { opacity: 0; transform: translateY(-0.6em); }
/* The chart beside the words, not above them: the long axis is where a list goes (decision 0049). */
.itc-travel-crossing {
  display: flex;
  flex-direction: row;
  align-items: center;
  gap: min(1.4rem, 3cqw);
}
/*
  ⚠️ **SIZED OFF THE SHORT AXIS, AND SQUARE.** The canvas is drawn at a fixed pixel size and shown at
  a fraction of the container's height, so it is the same share of every screen and the browser does
  the scaling once. No flex shrink: a chart squeezed by a long place name is an ellipse.

  ⚠️ **A DISC OF THE PLACE'S OWN LIGHT BEHIND IT, AND A RING ROUND THAT**, so the route sits in an
  instrument rather than floating on the plate. The canvas and the overlay both fill the box exactly,
  one over the other, which is what puts the ship's marker on the stroked line.
*/
.itc-travel-crossing-chartbox {
  position: relative;
  width: clamp(4.5rem, 19cqh, 9rem);
  height: clamp(4.5rem, 19cqh, 9rem);
  flex: none;
  border-radius: 50%;
  background: radial-gradient(circle, color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 20%, transparent), transparent 72%);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 38%, transparent);
}
.itc-travel-crossing-chart, .itc-travel-crossing-overlay {
  position: absolute;
  inset: 0;
  width: 100%;
  height: 100%;
}
/*
  ⚠️ **THE SHIP IS THE PLAYER'S INK ON A CHART OF PLACES' COLOURS, AND OUTLINED IN THE VOID.** It is
  the one thing on the route that is not somewhere, so it is the one thing not in a place's colour;
  the dark outline is what keeps it readable as it crosses a leg drawn in something bright.
*/
.itc-travel-crossing-marker {
  fill: color-mix(in srgb, var(--itc-ink) 70%, white);
  stroke: var(--itc-void);
  stroke-width: 0.9;
  paint-order: stroke;
}
/*
  ⚠️ **SCALED ABOUT ITS OWN BOX, WHICH AN SVG ELEMENT DOES NOT DO UNLESS TOLD.** A transform on an SVG
  shape is about the viewport's origin by default, so an untold pulse grows away towards the bottom
  right of the chart instead of out from the stop it is on.
*/
.itc-travel-crossing-pulse {
  fill: none;
  stroke: var(--itc-accent, var(--itc-ink));
  stroke-width: 0.9;
  transform-box: fill-box;
  transform-origin: center;
  animation: itc-travel-pulse 1.5s ease-out infinite;
}
.itc-travel-crossing-words {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: min(0.3rem, 1cqh);
  min-width: 0;
}
/*
  ⚠️ **EACH LINE RISES IN TURN, A FEW HUNDREDTHS APART.** The plate arriving as one slab is what read
  as basic; the same five elements arriving in reading order is a readout coming up. The delays are
  short enough that the whole of it is there well inside the second the engines take to build.
*/
.itc-travel-crossing-kicker, .itc-travel-crossing-place, .itc-travel-crossing-voyage {
  animation: itc-travel-rise 0.5s ease-out both;
}
.itc-travel-crossing-kicker {
  margin: 0;
  font-size: 0.62em;
  font-weight: 600;
  letter-spacing: 0.24em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 60%, white);
  animation-delay: 0.12s;
}
.itc-travel-crossing-kicker::before {
  content: '';
  display: inline-block;
  width: 0.6em;
  height: 0.6em;
  margin-right: 0.7em;
  background: var(--itc-accent, var(--itc-ink));
}
/*
  ⚠️ **MIXED TOWARDS WHITE, BECAUSE A PLACE'S COLOUR IS NOT PROMISED TO BE LEGIBLE.** The Black
  Heart's accent is a deep maroon and The Approach's is a dim teal; set in them raw, two of the seven
  names are dark type on a dark plate. Half way to white keeps the hue and clears the backing on every
  one, and the glow behind the letters is where the raw colour goes.
*/
.itc-travel-crossing-place {
  margin: 0;
  font-size: clamp(1.1rem, min(4.4cqw, 7cqh), 2.3rem);
  line-height: 1.1;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 45%, white);
  text-shadow: 0 0 0.7em color-mix(in srgb, var(--itc-accent, var(--itc-ink)) 70%, transparent);
  animation-delay: 0.2s;
}
.itc-travel-crossing-rule {
  align-self: stretch;
  height: 1px;
  background: linear-gradient(90deg, var(--itc-edge), transparent);
  transform-origin: left center;
  animation: itc-travel-draw 0.6s 0.3s ease-out both;
}
/*
  ⚠️ **LIGHTER THAN THE NAME AND NOT SMALLER THAN THE REST OF THE CHROME.** It is one sentence read
  once, so weight is the channel that separates it from the name; type has a floor (the panel rule
  says why).
*/
.itc-travel-crossing-voyage { font-weight: 400; margin: 0; opacity: 0.92; max-width: 40ch; animation-delay: 0.36s; }
/*
  The wait, which is almost never shown — the travel content hub has when. Dimmed, because it is the
  one line here that is about the game rather than about the place.
*/
.itc-travel-crossing-waiting { font-weight: 400; margin: 0; opacity: 0.6; }
.itc-travel-crossing-waiting[hidden] { display: none; }
/*
  ⚠️ **AND A PLAYER WHO ASKED THE PLATFORM FOR LESS MOTION GETS THE PLATE WITHOUT THE CHOREOGRAPHY.**
  The burn itself is the game; this is chrome over it, and the stagger, the drawn rule and the pulse are
  decoration that says nothing the still plate does not. The shell parks the marker on its stop for the
  same player.
*/
@media (prefers-reduced-motion: reduce) {
  .itc-travel-panel, .itc-travel-crossing-kicker, .itc-travel-crossing-place, .itc-travel-crossing-voyage,
  .itc-travel-crossing-rule, .itc-travel-crossing-pulse { animation: none; }
}
/*
  ⚠️ **THE TWO BOXES EVERY PANEL IS BUILT WITH ARE EMPTY HERE, AND AN EMPTY FLEX CHILD STILL TAKES A
  GAP.** The builder appends a choices box and a settings box to every panel so that a row gaining a
  setting needs no new code; this row has neither, and measured on the bench they padded a banner 173
  pixels tall out to 278 — a hundred pixels of backing over the sky for nothing.
*/
.itc-travel-choices, .itc-travel-settings-box { display: none; }
/*
  The place, the section it has reached, and how far through it is. One block so the gap rules above
  space it like any other part of the panel.
*/
.itc-music-now {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: min(0.4rem, 1.2cqh);
  width: min(100%, 44ch);
}
/*
  ⚠️ **AN AUTHOR display BEATS THE hidden ATTRIBUTE, AND THE ROOM OPENED WITH AN EMPTY BAR ON IT.**
  hidden is a User Agent rule of display: none, so the flex above outranks it on specificity alone and
  the readout was visible before anything was playing — an outlined bar under the heading, reading
  nothing. Caught by looking at the screen; no guard here could have, because the element was in the
  DOM, was marked hidden, and said so to everything that asked.
*/
.itc-music-now[hidden] { display: none; }
.itc-music-now-head {
  display: flex;
  justify-content: space-between;
  align-items: baseline;
  gap: 1ch;
}
.itc-music-now-place { font-weight: 700; }
/*
  ⚠️ **The rung is what the MIXER is doing, so it is the thing that changes without being pressed.**
  It gets the emphasis a label does not: the place is chosen and stays, the section arrives.
*/
.itc-music-now-section {
  opacity: 0.85;
  font-variant-numeric: tabular-nums;
}
/*
  ⚠️ **THE BAR TAKES THE POINTER AND THE ARROW KEYS, AND IT IS NOT IN THE PAD'S CONTROL RING.**
  decision 0046 makes the ring a ring of buttons; a slider in it would answer a stick press by seeking
  rather than by moving on, and every place on this screen is already reachable by a button. The seek
  is the convenience, not the way through the screen.
*/
.itc-music-now-bar {
  position: relative;
  height: 0.75em;
  border: 2px solid currentColor;
  border-radius: 0.4em;
  cursor: pointer;
  overflow: hidden;
  touch-action: none;
}
.itc-music-now-fill {
  position: absolute;
  inset: 0 auto 0 0;
  width: 0%;
  background: currentColor;
  opacity: 0.55;
}
/*
  One tick per section the level opens, plus the fight. Absolutely placed off the same fraction the
  fill is, so the boundary the player can see is the boundary the mixer moves on.
*/
.itc-music-now-tick {
  position: absolute;
  top: 0;
  bottom: 0;
  width: 2px;
  background: currentColor;
  opacity: 0.9;
}
/*
  The section names under the bar. Absolutely placed so they cannot make the row taller than one line
  however many there are, and hidden on a short screen by the block at the end of this sheet.
*/
.itc-music-now-legend {
  position: relative;
  height: 1.1em;
  font-size: 0.62em;
  opacity: 0.72;
}
.itc-music-now-name {
  position: absolute;
  top: 0;
  transform: translateX(-50%);
  white-space: nowrap;
}
.itc-music-now-time {
  display: flex;
  justify-content: space-between;
  gap: 1ch;
  font-size: 0.7em;
  opacity: 0.8;
  font-variant-numeric: tabular-nums;
}
/*
  ⚠️ **What is coming, and it is EMPTY unless Play all is running.** Asked for as an indication of
  which track is playing when play all is selected; a single place loops, so there is no next and the
  middle of the row stays blank rather than saying so.
*/
.itc-music-now-next {
  opacity: 0.9;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
${each('-action')} {
  font: inherit;
  padding: 0.55em 1em;
  border-radius: 0.4em;
  border: 2px solid currentColor;
  background: transparent;
  color: inherit;
  cursor: pointer;
}
/*
  The hint under a control's label. A block, so it takes its own line inside the button rather than
  running on after it — three tiers whose names wrap into each other is a choice nobody can read at a
  glance, and the choice is the whole screen.
*/
.itc-title-action-hint, .itc-music-action-hint {
  display: block;
  /* A floor, so the smallest phone's card does not set its hint at eight pixels — 0370. */
  font-size: max(0.62em, 0.7rem);
  font-weight: 400;
  opacity: 0.72;
  margin-top: 0.3em;
}
/*
  ── ONE THING STARTS A RUN — 0458 ─────────────────────────────────────────────────────────────────

  Launch is the screen's one primary control: full width, the loudest rim, a size up. Settings sits
  under it, quieter, because it is a place to go rather than the thing a player came to press. The
  width is a fraction of the column with a character cap, so a desktop does not draw a button the
  width of a table.
*/
/*
  ⚠️ **34em SINCE 0521, AND IT WAS 26 FOR THREE.** The hangar made the row four — the chip, Fly, the
  hangar and Settings, one line each. At 26em it had 31 pixels to spare on this machine's fonts, which
  CI's wider ones spent and 30 more: Settings off a 1024x768's edge.

  ⚠️ **AND THE QUIET THREE A STEP SMALLER, BECAUSE THE CAP WAS NOT THE CASE THAT FAILED.** With the
  table up, a 1024x768's column is 562 pixels, not the cap, and CI's fonts set the row about a quarter
  wider than this machine's — so it went off the edge again at 34em. Measured with ten rows on the
  table: 31 % of the row spare at 1024x768, 23 % at 480x320 (whose row CI already passed on with less),
  and more everywhere else.
*/
/*
  ⚠️ **FLY ALONE, AND THE QUIET ROW AT ONE SIZE — 0538.** It was four controls at three sizes in one
  row: the chip, a double-ringed Fly twice its neighbours' height, and the hangar and Settings a step
  smaller. Fly is the row's whole width now, over a row of three that are all the same button, so the
  one thing that starts a run is the one thing that looks like it.
*/
.itc-title-choices { width: min(100%, 34em); gap: min(0.7rem, 1.8cqh); flex-wrap: wrap; }
.itc-title-action { width: 100%; }
.itc-title-choices > .itc-title-action-lead { flex: 1 0 100%; order: -2; font-size: 1.2em; letter-spacing: 0.08em; padding: 0.5em 1em; }
.itc-title-choices > :not(.itc-title-action-lead) { font-size: 0.8em; padding: 0.4em 0.55em; opacity: 0.9; }
/*
  ⚠️ **AND THE QUIET ROW CANNOT WRAP, ON ANY FONT.** Measured with 22 % of the row spare at 480x320 on
  this machine's fonts, CI's wrapped it and Settings went under the fold. A button may shrink to nothing
  and cut its words short rather than push the row onto a second line — the music room's answer (0210),
  for its reason: a row that holds by a margin of fonts is not a rule.
*/
.itc-title-choices > :not(.itc-title-action-lead) { min-width: 0; overflow: hidden; text-overflow: ellipsis; }
${each('-action:hover')} {
  background: rgba(255, 255, 255, 0.12);
}
/*
  ⚠️ An outline OFFSET from the border, not a colour change. A focus ring that only recolours is
  invisible to the high-contrast and colour-blind palettes 0024 promises, and those palettes exist
  precisely so no cue is carried by colour alone.

  ⚠️ **The -cursor classes sit in the SAME rule, and that is not tidiness.** A browser decides
  :focus-visible from how the focus arrived, and focus moved by the menu reader arrives by script —
  which most engines classify as not-visible, so a pad player would navigate a menu with no cursor
  in it at all. The chrome therefore sets a class of its own; and it has to draw the IDENTICAL ring,
  because two devices reaching the same control must not produce two pictures. A second rule saying
  the same thing in the same words is a second description, and this one was written that way first
  and immediately broke 0039's probe — which anchors on this declaration precisely because there was
  only ever one of it. See decision 0046.

  ⚠️ Neither backticks NOR file paths in here. It is a template literal, so a backtick ends the
  string; and the prefix guard reads every dotted token in this block as a CSS class, so a path with
  an extension on it fails as an unprefixed class name. Both were hit while writing this comment.
*/
${each('-action:focus-visible')},
${each('-action-cursor')} {
  outline: 3px solid currentColor;
  outline-offset: 3px;
}
/*
  The countdown on a screen that expires. Small and beneath the control, because it is a fact about
  the screen rather than something to do — the voice rule in the product definition: say the one
  thing and stop.
*/
.itc-gameover-timer {
  font-size: clamp(0.7rem, min(2cqw, 3.2cqh), 1rem);
  font-weight: 400;
  opacity: 0.7;
  /* Reserves its own line so the button does not jump a pixel as the digit changes. */
  min-height: 1.4em;
}
/*
  ── HOW TO PLAY — 0458 ────────────────────────────────────────────────────────────────────────────

  The pickup key left the title for here, and grew the half it never had: HOW a pickup is taken, under
  WHAT it gives. Two columns, the pickups and the controls, side by side on the long axis for 0049's
  reason. Every word on it is a content row's.
*/
.itc-guide-body {
  display: grid;
  grid-template-columns: minmax(0, 3fr) minmax(0, 2fr);
  gap: min(1rem, 2.4cqh) min(2.5rem, 4cqw);
  align-items: start;
  width: min(100%, 68em);
  text-align: left;
  font-size: clamp(0.62rem, min(1.9cqw, 3.4cqh), 0.95rem);
  font-weight: 400;
}
.itc-guide-lead { grid-column: 1 / -1; margin: 0; opacity: 0.85; text-align: center; }
.itc-guide-section { display: flex; flex-direction: column; gap: 0.5em; min-width: 0; }
.itc-guide-section-heading { margin: 0; font-size: 1.05em; letter-spacing: 0.18em; color: var(--itc-gold, #ffd23f); }
.itc-guide-key {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 0.35em 0.8em;
  align-items: center;
}
/*
  One row per pickup, cycling — 0432. The row is not a box of its own: its cells sit in the key's grid.
  Each cell stacks its faces in one grid area, so it is as wide as its widest face and a turn moves
  nothing beside it. The third cell carries what the face gives and, under it, how the pickup is taken.
*/
.itc-guide-key-row { display: contents; }
.itc-guide-key-cell { display: grid; align-items: center; }
.itc-guide-key-cell > * { grid-area: 1 / 1; }
.itc-guide-key-face { animation-timing-function: linear; animation-iteration-count: infinite; }
${faceTurns()}
.itc-guide-key-icon { display: block; width: 2.2em; height: 2.2em; }
.itc-guide-key-name { font-weight: 600; }
.itc-guide-key-about { display: flex; flex-direction: column; min-width: 0; }
.itc-guide-key-hint { font-weight: 600; opacity: 0.95; }
.itc-guide-key-how { opacity: 0.7; }
.itc-guide-controls {
  display: grid;
  grid-template-columns: repeat(4, auto);
  justify-content: start;
  gap: 0.35em 0.8em;
  align-items: baseline;
}
.itc-guide-controls-head { font-weight: 600; opacity: 0.7; }
.itc-guide-controls-what { font-weight: 600; }
.itc-guide-controls-device-on { color: var(--itc-gold, #ffd23f); opacity: 1; }
/*
  ⚠️ The HUD is NOT inside a screen's overlay. Those are absolutely positioned over the whole page
  and would swallow every pointer event on the playfield; this sits in a corner and takes no pointer
  events at all, because nothing on it is a control.

  ⚠️ **THE READOUT AND THE BOSS BAR SHARE ONE ROW, AND THE ROW IS A GRID SO THEY CANNOT MEET.** Played
  on a phone: *"the boss bars overlap the bomb numbers on mobile."* Both were placed absolutely — the
  bar from 31% of the width, the readout about fourteen of its own em wide — and on a phone the em is
  2.4vw, so the readout is a third of the width and ran under the bar at every phone size. A width
  written for one screen is wrong on the next pip, digit or face, so the columns do it: the bar is
  38% and centred while there is room, and when there is not the readout keeps its width and the bar
  is what gives.
*/
.itc-playing-top {
  position: absolute;
  inset: 0;
  /*
    ⚠️ **ITS OWN CONTAINER, EXACTLY THE HOST'S SIZE — 0465**, as the trigger discs' is, so the strip
    inside it is sized against the SHORT AXIS of the box the player is looking at. It was a strip
    pinned to the top and typeset in vw, and a landscape phone has the desktop's width and half its
    height: at 844×390 the readout wore the desktop's font to within half a pixel and the strip was
    16 % of the picture where the desktop's is 9 %. 0049's rule, one screen over.
  */
  container-type: size;
  pointer-events: none;
}
.itc-playing-strip {
  display: grid;
  grid-template-columns: 1fr minmax(0, 38%) 1fr;
  column-gap: 0.6em;
  align-items: start;
  /*
    2.9 % of the box's height is the desktop's 20.8 px at 720 tall, so 1280×720 does not move
    (0153); the cap holds a tall monitor where it was. The floor is a phone's, read at a hand's
    length and at a device scale of two — 0361's 0.95 rem was sized for a monitor at arm's length.
  */
  font: 600 clamp(${STRIP.fontFloorRem}rem, ${STRIP.fontCqh}cqh, ${STRIP.fontCapRem}rem)/1 system-ui, sans-serif;
  pointer-events: none;
}
.itc-playing-hud {
  grid-column: 1;
  justify-self: start;
  display: none;
  gap: 1.5em;
  align-items: center;
  padding: 0.8em 1.1em;
  /*
    Read at arm's length rather than leaned into — 0361. The readout was two thirds of this and the
    smallest text in the game while a fight is on; it is the one piece of chrome the player reads
    without looking away from the ship. The type is the strip's, inherited, since 0465 — declared once
    above, so the three plates cannot be sized apart.
  */
  /* A halo of the void, so the ink stays legible over a bright place's land. */
  text-shadow: 0 0 0.4em var(--itc-void, #000), 0 0 0.15em var(--itc-void, #000);
  pointer-events: none;
}
.itc-playing-hud-shown { display: flex; }
.itc-playing-hud-group { display: flex; gap: 0.4em; align-items: center; }
/*
  On a touch screen the discs say the stacks' counts, so the readout's two say nothing new — 0437.
  Taken off the glass and NOT out of the page: the discs are a picture (0060) and hidden from a reader,
  so these labels are the only place a screen reader hears the charges.
*/
.itc-playing-hud-touch > .itc-playing-hud-stack {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/*
  The counts in the score's type — 0433: its weight, its spacing and its fixed-width figures, so the
  corner and the score read as one readout and a count going from 9 to 10 does not shove the row.
*/
.itc-playing-hud-group > span, .itc-playing-trigger-button > span { font-weight: 800; font-variant-numeric: tabular-nums; letter-spacing: 0.05em; }
.itc-playing-hud-icon { display: block; width: 1.7em; height: 1.7em; filter: drop-shadow(0 0 0.15em var(--itc-void, #000)); }
/* The ship in reserve — 0430. A hull is long and thin where a pickup's face is round, so it is given the room a round face spends on its bubble. */
.itc-playing-hud-ship { width: 2.2em; height: 2.2em; margin: -0.25em -0.1em; }
/*
  ── WHAT THE BOSS HAS LEFT ──────────────────────────────────────────────────────────────────────

  Decision 0360. Top centre, over the six units of lane the ship can never enter, in the ENEMY's ink
  because the thing it measures is the enemy's — the same argument that put the wall in the player's.
  A hollow frame and a fill, so full and empty differ in shape and not only in colour (0024). The
  notches are the row's own phase thresholds: where the fight turns.

  pointer-events: none, like everything over the playfield that is not a control.
*/
.itc-playing-boss {
  position: relative;
  grid-column: 2;
  margin-top: 0.9em;
  height: 0.6em;
  display: none;
  box-sizing: border-box;
  border: 2px solid currentColor;
  border-radius: 0.4em;
  filter: drop-shadow(0 0 0.2em var(--itc-void, #000));
  pointer-events: none;
}
.itc-playing-boss-shown { display: block; }
.itc-playing-boss-fill {
  position: absolute;
  inset: 1px;
  border-radius: 0.3em;
  background: currentColor;
  transform-origin: left center;
  opacity: 0.85;
}
.itc-playing-boss-notch {
  position: absolute;
  top: -0.45em;
  width: 2px;
  height: 0.35em;
  margin-left: -1px;
  background: currentColor;
  opacity: 0.8;
}
/*
  ── THE SCORE — 0428 ─────────────────────────────────────────────────────────────────────────────

  Asked for: *"points counter top right that should look flashy."* The third column of the row the
  readout and the boss bar share, so nothing can run under it on any width.

  ⚠️ **THE DIGITS ARE A CSS COUNTER OVER A REGISTERED INTEGER, AND THAT IS WHY THEY ROLL FOR FREE.**
  The shell writes the new total into one custom property on a change; the property is registered as
  an integer, so a transition interpolates it and the counter redraws every frame the browser paints —
  the count-up costs no script at all, and nothing is written per frame. Padded to eight places, as a
  cabinet pads a score. The number is also the element's label, which is its twin for a reader (0024).

  Flash: a sweep of light through gold, a pop on every gain, the multiplier in a badge that heats as
  the streak climbs and a bar that fills toward the next step, and a shake when a hit breaks it.
*/
@property --itc-playing-points { syntax: '<integer>'; inherits: true; initial-value: 0; }
@counter-style itc-playing-digits { system: extends decimal; pad: 8 "0"; }
.itc-playing-score {
  /* Placed by the corner it shares with the pause plate, which holds the third column (0511). */
  display: none;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.25em;
  padding: 0.7em 1.1em;
  /* The strip's type (0465), at the score's own weight. */
  font-weight: 800;
  pointer-events: none;
}
.itc-playing-score-shown { display: flex; }
.itc-playing-score-pop { transform-origin: right center; }
.itc-playing-score-gain-a { animation: itc-playing-score-gain-a 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.4); }
.itc-playing-score-gain-b { animation: itc-playing-score-gain-b 0.32s cubic-bezier(0.2, 0.9, 0.3, 1.4); }
@keyframes itc-playing-score-gain-a { from { transform: scale(1.22); filter: brightness(1.8); } to { transform: none; filter: none; } }
@keyframes itc-playing-score-gain-b { from { transform: scale(1.22); filter: brightness(1.8); } to { transform: none; filter: none; } }
.itc-playing-score-value {
  display: block;
  font-size: 1.75em;
  font-variant-numeric: tabular-nums;
  letter-spacing: 0.05em;
  counter-reset: itc-playing-points var(--itc-playing-points);
  transition: --itc-playing-points 0.5s cubic-bezier(0.2, 0.7, 0.2, 1);
  background: linear-gradient(100deg, var(--itc-hot, #ff9f1c) 0%, var(--itc-gold, #ffd23f) 38%, var(--itc-shine, #fff) 50%, var(--itc-gold, #ffd23f) 62%, var(--itc-hot, #ff9f1c) 100%);
  background-size: 300% 100%;
  -webkit-background-clip: text;
  background-clip: text;
  color: transparent;
  filter: drop-shadow(0 0 0.18em var(--itc-hot, #ff9f1c)) drop-shadow(0 0 0.1em var(--itc-void, #000));
  animation: itc-playing-score-shine 2.8s linear infinite;
}
.itc-playing-score-value::after { content: counter(itc-playing-points, itc-playing-digits); }
@keyframes itc-playing-score-shine { from { background-position: 100% 0; } to { background-position: -50% 0; } }
.itc-playing-score-streak {
  display: flex;
  align-items: center;
  gap: 0.45em;
  font-size: 0.8em;
}
.itc-playing-score-bar {
  width: 4.5em;
  height: 0.3em;
  border: 1px solid currentColor;
  border-radius: 0.2em;
  overflow: hidden;
  opacity: 0.85;
}
.itc-playing-score-fill {
  height: 100%;
  background: var(--itc-gold, #ffd23f);
  transform-origin: left center;
  transition: transform 0.2s ease-out;
}
.itc-playing-score-times {
  padding: 0.12em 0.45em;
  border: 2px solid currentColor;
  border-radius: 0.4em;
  background: var(--itc-void, #000);
  font-variant-numeric: tabular-nums;
  transition: color 0.3s, box-shadow 0.3s;
}
.itc-playing-score-hot .itc-playing-score-times { color: var(--itc-gold, #ffd23f); box-shadow: 0 0 0.5em var(--itc-hot, #ff9f1c); }
.itc-playing-score-max .itc-playing-score-times { animation: itc-playing-score-throb 0.6s ease-in-out infinite alternate; }
@keyframes itc-playing-score-throb { from { box-shadow: 0 0 0.3em var(--itc-hot, #ff9f1c); } to { box-shadow: 0 0 1.1em var(--itc-gold, #ffd23f); } }
.itc-playing-score-broke .itc-playing-score-streak { animation: itc-playing-score-broke 0.45s ease-out; color: var(--itc-lost, #ff7286); }
@keyframes itc-playing-score-broke {
  0%, 100% { transform: none; }
  20% { transform: translateX(-0.3em); }
  40% { transform: translateX(0.3em); }
  60% { transform: translateX(-0.2em); }
  80% { transform: translateX(0.1em); }
}
/*
  ── A LEVEL'S ACCOUNT, AND THE RUN'S — 0428 ──────────────────────────────────────────────────────

  The same sheet on the break, the victory and the run over: a label and a number to a line, each
  line arriving after the one above it and its number counting up from nothing on the counter trick
  the score uses. The rank is stamped rather than counted. The real number is in the line as text for
  a reader, clipped out of sight, and the counter draws what the eye sees.
*/
/*
  ── THE HANGAR'S BALANCE — 0522 ─────────────────────────────────────────────────────────────────

  One line, the Star Shards held, pinned in the top right corner where the run's score stands in play,
  so it costs the screen no height: as a line under the heading it put Back under a 480x320's fold.
  The readout has the other corner.
*/
/* 0523: and Cosmo's, the hangar's other tab, wears the same balance in the same corner. */
.itc-hangar-sheet, .itc-parts-sheet, .itc-shop-sheet {
  position: absolute;
  top: min(0.9rem, 2.5cqh);
  right: min(1.2rem, 2.5cqw);
  display: flex;
  align-items: baseline;
  gap: 0.5em;
  padding: 0.35em 0.9em;
  border-radius: 999px;
  background: color-mix(in srgb, var(--itc-ink) 8%, transparent);
  border: 1px solid color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 45%, transparent);
}
.itc-hangar-sheet-label, .itc-parts-sheet-label, .itc-shop-sheet-label { font-size: 0.75em; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; opacity: 0.8; }
.itc-hangar-sheet-value, .itc-parts-sheet-value, .itc-shop-sheet-value { font-size: 1.2em; font-weight: 800; font-variant-numeric: tabular-nums; }
@property --itc-sheet-n { syntax: '<integer>'; inherits: false; initial-value: 0; }
.itc-cleared-sheet, .itc-victory-sheet, .itc-gameover-sheet, .itc-ended-sheet {
  display: grid;
  grid-template-columns: auto auto;
  gap: 0.3em 0;
  align-items: baseline;
  font-variant-numeric: tabular-nums;
  text-shadow: 0 0 0.4em var(--itc-void, #000), 0 0 0.15em var(--itc-void, #000);
}
.itc-cleared-sheet-label, .itc-victory-sheet-label, .itc-gameover-sheet-label, .itc-ended-sheet-label {
  text-align: left;
  padding-right: 2em;
  font-weight: 500;
  opacity: 0;
  animation: itc-cleared-sheet-in 0.3s ease-out forwards;
  animation-delay: calc(var(--itc-sheet-i, 0) * 0.28s);
}
.itc-cleared-sheet-value, .itc-victory-sheet-value, .itc-gameover-sheet-value, .itc-ended-sheet-value {
  text-align: right;
  opacity: 0;
  counter-reset: itc-sheet var(--itc-sheet-n);
  animation: itc-cleared-sheet-in 0.3s ease-out forwards, itc-cleared-sheet-count 0.7s cubic-bezier(0.2, 0.7, 0.2, 1) backwards;
  animation-delay: calc(var(--itc-sheet-i, 0) * 0.28s);
}
.itc-cleared-sheet-count::after, .itc-victory-sheet-count::after, .itc-gameover-sheet-count::after, .itc-ended-sheet-count::after { content: counter(itc-sheet); }
.itc-cleared-sheet-said, .itc-victory-sheet-said, .itc-gameover-sheet-said, .itc-ended-sheet-said {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
.itc-cleared-sheet-total, .itc-victory-sheet-total, .itc-gameover-sheet-total, .itc-ended-sheet-total {
  font-size: 1.25em;
  font-weight: 800;
  color: var(--itc-gold, #ffd23f);
}
/* A total under other lines is ruled off from them; a total that is the whole sheet is not. */
.itc-cleared-sheet-total:nth-child(n+3), .itc-victory-sheet-total:nth-child(n+3), .itc-gameover-sheet-total:nth-child(n+3), .itc-ended-sheet-total:nth-child(n+3) {
  padding-top: 0.25em;
  border-top: 2px solid currentColor;
}
.itc-cleared-sheet-rank, .itc-victory-sheet-rank, .itc-gameover-sheet-rank, .itc-ended-sheet-rank {
  font-size: 2em;
  font-weight: 900;
  line-height: 0.9;
  color: var(--itc-gold, #ffd23f);
  filter: drop-shadow(0 0 0.2em var(--itc-hot, #ff9f1c));
  animation: itc-cleared-sheet-in 0.01s linear forwards, itc-cleared-sheet-stamp 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.5) backwards;
  animation-delay: calc(var(--itc-sheet-i, 0) * 0.28s);
}
/*
  On a short screen the sheet is set tighter: the break's seven lines, its heading and *Onward* were
  21 pixels past the smallest landscape phone at the panel's own size. The title's container query's
  threshold, for its reason.
*/
@container (max-height: 460px) {
  .itc-cleared-sheet, .itc-victory-sheet, .itc-gameover-sheet, .itc-ended-sheet { font-size: 0.82em; row-gap: 0.1em; }
  .itc-cleared-sheet-rank, .itc-victory-sheet-rank, .itc-gameover-sheet-rank, .itc-ended-sheet-rank { font-size: 1.5em; }
}
@keyframes itc-cleared-sheet-in { from { opacity: 0; transform: translateY(0.4em); } to { opacity: 1; transform: none; } }
@keyframes itc-cleared-sheet-count { from { --itc-sheet-n: 0; } }
@keyframes itc-cleared-sheet-stamp { from { transform: scale(3); opacity: 0; } to { transform: none; opacity: 1; } }
/*
  ── THE TABLE ON THE TITLE — 0429, and STILL since 0458 ──────────────────────────────────────────

  Asked for as a rolling table, and played: *"the high scores scroll too fast and are hard to read and
  the flashing in and out is awkward, could just be the top 5."* So the best five, standing still, in
  the column the key used to share with it: no roll, no seam, no cross-fade. The device still keeps
  ten (TABLE_SIZE), so a run that drops into sixth is kept for the day it climbs back.
*/
.itc-title-board {
  display: flex;
  flex-direction: column;
  align-items: center;
  font-size: clamp(0.7rem, min(2.1cqw, 3.8cqh), 1.05rem);
  font-weight: 500;
  font-variant-numeric: tabular-nums;
  min-width: 0;
}
.itc-title-board-heading {
  flex: none;
  margin: 0 0 0.4em;
  font-size: 1.1em;
  letter-spacing: 0.3em;
  color: var(--itc-gold, #ffd23f);
}
.itc-title-board-rows {
  display: grid;
  grid-template-columns: auto auto auto auto;
  justify-content: center;
  gap: 0.3em 0.9em;
}
.itc-title-board-place { text-align: right; opacity: 0.6; }
.itc-title-board-score { text-align: right; font-weight: 700; }
.itc-title-board-pilot { text-align: left; }
.itc-title-board-reached { text-align: left; opacity: 0.7; }
.itc-title-board-fresh { color: var(--itc-gold, #ffd23f); animation: itc-title-board-lit 0.9s ease-in-out infinite alternate; }
@keyframes itc-title-board-lit { from { text-shadow: none; } to { text-shadow: 0 0 0.6em var(--itc-hot, #ff9f1c); } }
@media (prefers-reduced-motion: reduce) {
  .itc-playing-score-value { transition: none; animation: none; background-position: 50% 0; }
  .itc-playing-score-gain-a, .itc-playing-score-gain-b, .itc-playing-score-max .itc-playing-score-times,
  .itc-playing-score-broke .itc-playing-score-streak, .itc-title-board-fresh { animation: none; }
  .itc-cleared-sheet-label, .itc-victory-sheet-label, .itc-gameover-sheet-label, .itc-ended-sheet-label,
  .itc-cleared-sheet-value, .itc-victory-sheet-value, .itc-gameover-sheet-value, .itc-ended-sheet-value,
  .itc-cleared-sheet-rank, .itc-victory-sheet-rank, .itc-gameover-sheet-rank, .itc-ended-sheet-rank { animation: none; opacity: 1; }
  /* The key still turns — it is how a cycling pickup is told — but it cuts rather than fades. 0432. */
  .itc-guide-key-face { animation-timing-function: steps(1, end); }
}
/*
  ── THE INTRO'S SKIP ─────────────────────────────────────────────────────────────────────────────

  Decision 0412. Bottom right, over the deck and the stars rather than over anything that moves, and
  hidden until the game behind the intro has finished loading — a skip offered before then would land
  the player on a title that froze on their next press. It fades in rather than appearing, because it
  arrives in the middle of a shot.
*/
.itc-intro-skip {
  position: absolute;
  right: 1.4em;
  bottom: 1.4em;
  display: none;
  padding: 0.45em 1.1em;
  font: 600 clamp(0.95rem, 2.2vw, 1.25rem)/1 system-ui, sans-serif;
  letter-spacing: 0.06em;
  border: 2px solid currentColor;
  border-radius: 0.5em;
  background: var(--itc-void, #000);
  cursor: pointer;
}
.itc-intro-skip-shown { display: block; animation: itc-intro-skip-in 0.5s ease-out both; }
.itc-intro-skip:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.itc-intro-skip.itc-intro-face-pixel { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
@keyframes itc-intro-skip-in { from { opacity: 0; } to { opacity: 0.9; } }
/*
  ── THE FINALE'S SPEECH BUBBLE — 0418 ──────────────────────────────────────────────────────────────

  Light ink on the dark, the space colour for the words, and a tail toward the mouth it comes from. Its
  corner sits at the mouth, to the right of it with the tail on its left: hung above the ship speaking,
  or below it — 0426, since the two ships fly one over the other and each bubble needs the sky on its
  own side. Sized off the short axis on the chrome's own terms, so a phone gets a bubble it can read.
*/
.itc-outro-bubble {
  position: absolute;
  display: none;
  max-width: min(22em, 40vw);
  padding: 0.7em 0.95em;
  font: 600 clamp(0.85rem, 3.2vh, 1.35rem)/1.3 system-ui, sans-serif;
  background: var(--itc-ink, #fff);
  border-radius: 0.9em;
  transform: translate(0.6em, -100%);
  pointer-events: none;
  box-shadow: 0 0.2em 0.9em rgba(0, 0, 0, 0.45);
}
.itc-outro-bubble::after {
  content: '';
  position: absolute;
  left: -0.55em;
  bottom: 0.5em;
  border: 0.45em solid transparent;
  border-right: 0.7em solid var(--itc-ink, #fff);
  border-left: 0;
}
.itc-outro-bubble-below { transform: translate(0.6em, 0); }
.itc-outro-bubble-below::after { bottom: auto; top: 0.5em; }
.itc-outro-bubble-shown { display: block; animation: itc-outro-bubble-in 0.25s ease-out both; }
.itc-outro-bubble-unsaid { visibility: hidden; }
.itc-outro-bubble-who {
  display: block;
  margin-bottom: 0.2em;
  padding-left: 0.45em;
  border-left: 0.35em solid transparent;
  font-size: 0.72em;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  opacity: 0.8;
}
.itc-outro-bubble.itc-outro-face-pixel { font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace; }
@keyframes itc-outro-bubble-in { from { opacity: 0; } to { opacity: 1; } }
/*
  ⚠️ A filled shield against a HOLLOW one, not two colours. Decision 0024 puts "colour never carries
  meaning alone" in the unconditional tier, and a shield readout is the most tempting place in the
  game to break it — full and empty are the same shape in two inks everywhere else in the genre.

  ⚠️ A SHIELD AND NOT A DISC, since 0430: *"the shields should look like shields."* A disc was also the
  bullet's shape. Two masks cut from one outline: the pip's own mask is the rim and a core inset from
  it, and its background fills them — the ink when the shield is held, nothing when it is spent. The
  rim is the pseudo-element, in the ink in both states, so a spent shield is an empty outline of the
  same shape. The halo is on the row, because a filter on a masked box is masked away with it. The
  namespace's dots are escaped as %2E, because a dot before a letter anywhere in this sheet is a class
  name to the chrome guard's scan, and a data URL's host is not one.

  ⚠️ No backticks anywhere in this stylesheet. It is a template literal, and the house style's
  backtick-quoted file paths end the string — twice, while this block was being written.
*/
.itc-playing-hud-shields { gap: 0.3em; filter: drop-shadow(0 0 0.15em var(--itc-void, #000)); }
.itc-playing-hud-pip {
  position: relative;
  width: 1.05em;
  height: 1.25em;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www%2Ew3%2Eorg/2000/svg' viewBox='0 0 20 24'><path d='M4 1H16L19 4V12C19 17 15 20.5 10 23C5 20.5 1 17 1 12V4Z' fill='none' stroke='black' stroke-width='2'/><path d='M6 5H14L15.5 6.5V12C15.5 15 13 17.5 10 19C7 17.5 4.5 15 4.5 12V6.5Z'/></svg>") center / contain no-repeat;
  mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www%2Ew3%2Eorg/2000/svg' viewBox='0 0 20 24'><path d='M4 1H16L19 4V12C19 17 15 20.5 10 23C5 20.5 1 17 1 12V4Z' fill='none' stroke='black' stroke-width='2'/><path d='M6 5H14L15.5 6.5V12C15.5 15 13 17.5 10 19C7 17.5 4.5 15 4.5 12V6.5Z'/></svg>") center / contain no-repeat;
}
.itc-playing-hud-pip::after {
  content: '';
  position: absolute;
  inset: 0;
  background: currentColor;
  -webkit-mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www%2Ew3%2Eorg/2000/svg' viewBox='0 0 20 24'><path d='M4 1H16L19 4V12C19 17 15 20.5 10 23C5 20.5 1 17 1 12V4Z' fill='none' stroke='black' stroke-width='2'/></svg>") center / contain no-repeat;
  mask: url("data:image/svg+xml;utf8,<svg xmlns='http://www%2Ew3%2Eorg/2000/svg' viewBox='0 0 20 24'><path d='M4 1H16L19 4V12C19 17 15 20.5 10 23C5 20.5 1 17 1 12V4Z' fill='none' stroke='black' stroke-width='2'/></svg>") center / contain no-repeat;
}
.itc-playing-hud-spent { background: transparent; }
/*
  The readout's events — 0433. A shield lost flares in the hazard gold and drops back into its socket;
  one gained pops in from small; a life lost shakes the ship and flashes it. Short, because the
  player's eyes are on the lane and the corner of the eye only needs to be told something moved.
*/
.itc-playing-hud-lost-a { animation: itc-playing-hud-lost-a 0.6s ease-out; }
.itc-playing-hud-lost-b { animation: itc-playing-hud-lost-b 0.6s ease-out; }
@keyframes itc-playing-hud-lost-a { 0% { transform: scale(1.5); color: var(--itc-gold, #ffd23f); } 30% { transform: translateY(0.15em) scale(1.1); } 100% { transform: none; } }
@keyframes itc-playing-hud-lost-b { 0% { transform: scale(1.5); color: var(--itc-gold, #ffd23f); } 30% { transform: translateY(0.15em) scale(1.1); } 100% { transform: none; } }
.itc-playing-hud-gained-a { animation: itc-playing-hud-gained-a 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.5); }
.itc-playing-hud-gained-b { animation: itc-playing-hud-gained-b 0.45s cubic-bezier(0.2, 0.9, 0.3, 1.5); }
@keyframes itc-playing-hud-gained-a { from { transform: scale(0.3); filter: brightness(2); } to { transform: none; filter: none; } }
@keyframes itc-playing-hud-gained-b { from { transform: scale(0.3); filter: brightness(2); } to { transform: none; filter: none; } }
.itc-playing-hud-group.itc-playing-hud-lost-a { animation: itc-playing-hud-life-a 0.9s ease-out; }
.itc-playing-hud-group.itc-playing-hud-lost-b { animation: itc-playing-hud-life-b 0.9s ease-out; }
@keyframes itc-playing-hud-life-a {
  0%, 30%, 60% { transform: translateX(-0.15em); color: var(--itc-lost, #ff7286); }
  15%, 45%, 75% { transform: translateX(0.15em); }
  100% { transform: none; }
}
@keyframes itc-playing-hud-life-b {
  0%, 30%, 60% { transform: translateX(-0.15em); color: var(--itc-lost, #ff7286); }
  15%, 45%, 75% { transform: translateX(0.15em); }
  100% { transform: none; }
}
/* Still told without motion, because the event is the point: the colour flares and nothing moves. */
@media (prefers-reduced-motion: reduce) {
  .itc-playing-hud-lost-a, .itc-playing-hud-lost-b, .itc-playing-hud-gained-a, .itc-playing-hud-gained-b,
  .itc-playing-hud-group.itc-playing-hud-lost-a, .itc-playing-hud-group.itc-playing-hud-lost-b {
    animation-name: itc-playing-hud-still;
  }
}
@keyframes itc-playing-hud-still { from { color: var(--itc-gold, #ffd23f); } }
/*
  ⚠️ **BELOW THE SHARED PANEL RULE, AND THAT IS THE WHOLE OF WHY IT WORKS.** The panel rule near the
  top sets margin: auto to centre every screen's content, so this has to beat it on source order —
  written earlier it lost the cascade silently and the banner went on sitting exactly where it was
  not wanted. Caught by measuring where the button actually landed, which is the only thing that
  could have caught it. Anything after it is free to be here as long as it is not about margins.

  The level break sits at the TOP because the middle is where the ship is: a banner centred over a
  playfield the player is still flying in covers the one part of the screen they cannot look away
  from. Auto on the bottom only, so it is a top margin rather than a centred box.
*/
.itc-cleared-panel { margin-top: min(1.5rem, 5cqh); margin-bottom: auto; }
/*
  ── A SETTING IS A BAND — 0458 ───────────────────────────────────────────────────────────────────

  Decision 0070: a choice is not an action — it has a current value, the player can see which one is
  on, and pressing it leaves them where they were. It was a labelled strip of small chips, which the pad
  stopped on once per chip; it is a BAND now, one row the cursor stops on once and moves along: its
  label over a track of segments with the live one filled, a step at each end, and the live option's
  hint written under it, which a chip could only put in a tooltip.

  ⚠️ **Generic, by the each() list**, so a screen that grows a choice gets its band the way its actions
  got their plates. The title's two and Settings' three are the same rule.
*/
${each('-settings-box')} {
  display: flex;
  flex-direction: column;
  align-items: stretch;
  gap: min(0.8rem, 2cqh);
  width: 100%;
}
${each('-band')} {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr) auto;
  grid-template-areas: 'label label label' 'less track more' 'hint hint hint';
  align-items: center;
  gap: 0.25em 0.4em;
  padding: 0.35em 0.5em;
  border-radius: 0.6em;
  min-width: 0;
}
${each('-band-label')} { grid-area: label; font-size: 0.72em; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.7; }
${each('-band-hint')} { grid-area: hint; font-size: max(0.66em, 0.7rem); font-weight: 400; opacity: 0.75; min-height: 1.35em; }
${each('-options')} { grid-area: track; display: flex; gap: 0.4em; justify-content: center; min-width: 0; }
${each('-band-step')} {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 0;
  padding: 0 0.3em;
  cursor: pointer;
  font-size: 1.3em;
  line-height: 1;
  opacity: 0.8;
}
${each('-band-less')} { grid-area: less; }
${each('-band-more')} { grid-area: more; }
${each('-band-step:disabled')} { opacity: 0.2; cursor: default; }
/*
  A shut option — 0521, a dash not yet won: drawn, so the player knows it is there, and told by its
  outline as well as its fade, so it is not a matter of contrast alone.
*/
${banded((p) => `.${p}option:disabled`)} { opacity: 0.38; border-style: dashed; cursor: not-allowed; }
/*
  ⚠️ A FILLED segment against a HOLLOW one, not two colours — decision 0024 puts "colour never carries
  meaning alone" in the unconditional tier, and which setting is on is exactly the kind of state a
  hue alone would hide.
*/
${each('-option')} {
  font: inherit;
  color: inherit;
  background: transparent;
  border: 2px solid currentColor;
  border-radius: 0.4em;
  padding: 0.3em 0.7em;
  cursor: pointer;
  opacity: 0.75;
  /*
    ⚠️ **A NAME WRAPS BETWEEN ITS WORDS, AND NEVER INSIDE ONE.** *Savior of the Galaxy* is the name of
    the tier: an ellipsis made it *Savior of the Ga…* on the desktop and *Savio…* on a phone, and a
    break anywhere made it *Legend / ary* — the band could no longer say what it offered. So a
    segment's floor is its longest word (a flex item's own min-content), and it shares the rest.
  */
  flex: 1 1 0;
  line-height: 1.15;
}
/*
  ⚠️ **The fill comes from a CUSTOM PROPERTY and not from currentColor, and the difference is a
  black-on-black button.** currentColor in a background resolves against the element's OWN colour —
  which this rule has just set to the void — so the two lines would cancel and the label would
  vanish. The pair is set on the overlay by the builder, where the palette is.
*/
${each('-option-on')} {
  background: var(--itc-ink);
  color: var(--itc-void);
  opacity: 1;
}
/*
  ── THE PILOT BAND IS FACES — 0458 ───────────────────────────────────────────────────────────────

  *"The pilots could be smaller with profile pics … it's going to be an expanded roster."* A segment is
  the golfer's own portrait, round, at a thumbnail; the one flying is ringed, lifted and full strength,
  and the rest wait at a lower contrast. Their name, ship and gun are the band's hint line. The track
  scrolls sideways once a roster outgrows it, with the chosen face kept in view, so a longer table is
  the same row and nothing else on the screen moves.

  ⚠️ **SAFE CENTRE, AND A PLAIN ONE CUT THE FIRST FACE OFF FOR GOOD.** A centred row wider than its
  box overflows BOTH ends, and a scroll box cannot scroll to before its own start — so the first face
  was half drawn and no scroll reached the rest of it. Safe centring centres a row that fits and
  starts one that does not at the start, where the scroll can reach all of it.
*/
${faced((p) => `.${p}options-faces`)} { justify-content: safe center; overflow-x: auto; scrollbar-width: none; padding: 0.3em; gap: 0.7em; }
/*
  ⚠️ **SPELLED OUT AND NOT BY each(), AND THE FIRST VERSION WAS.** each() is a comma list, so a part
  written after it — a child, a second class — binds to its LAST selector only, and the portraits drew
  as 585-pixel ovals. Since 0521 the hangar has faces too, and faced() writes each rule whole per screen.
*/
/*
  ⚠️ **A CARD SINCE 0513: THE FACE, AND THE NAME THEY GO BY UNDER IT.** The button is the card and the
  canvas is the round face inside it, so the ring is drawn round the face and the name stands clear of it.
*/
${faced((p) => `.${p}option.${p}option-face`)} {
  flex: 0 0 auto;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.2em;
  padding: 0.2em 0.3em;
  border-radius: 0.6em;
  background: none;
  opacity: 0.6;
  transition: transform 0.15s ease-out, opacity 0.15s ease-out;
}
${faced((p) => `.${p}option-face > canvas`)} {
  display: block;
  width: clamp(2.4rem, 11cqh, 3.6rem);
  height: clamp(2.4rem, 11cqh, 3.6rem);
  border-radius: 50%;
}
${faced((p) => `.${p}option-name`)} { font-size: 0.72em; font-weight: 600; letter-spacing: 0.04em; white-space: nowrap; }
${faced((p) => `.${p}option-face.${p}option-on`)} { opacity: 1; transform: scale(1.06); }
/* The band's own line is the panel's to say to the eye, and stays for a reader. */
${faced((p) => `.${p}band-faces .${p}band-hint`)} {
  position: absolute;
  width: 1px;
  height: 1px;
  overflow: hidden;
  clip-path: inset(50%);
  white-space: nowrap;
}
/*
  ── THE PILOT CARD — 0513 ──────────────────────────────────────────────────────────────────────

  Under the faces: the ship drawn large beside the words, which are the name, the pronouns and home on
  one line, who they are, and the craft and its gun. Left-aligned words in a centred card, so a longer
  line wraps under its own start rather than round the middle.
*/
${faced((p) => `.${p}pilot-card`)} {
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 0.2em 1em;
  padding: 0.5em 0.9em;
  border-radius: 0.75em;
  background: color-mix(in srgb, var(--itc-ink) 6%, transparent);
  text-align: left;
}
${faced((p) => `.${p}pilot-ship`)} { display: flex; align-items: center; justify-content: center; width: clamp(4rem, 18cqh, 9rem); }
${faced((p) => `.${p}pilot-ship > canvas`)} { display: block; width: 100%; height: auto; filter: drop-shadow(0 0 0.6em color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 35%, transparent)); }
/*
  0527: a car on spinners turns them on the card too, as it does in the fight — each wheel its own
  picture laid over the tyre the car's row names, turned here rather than baked, at the rim's rates.
  Still for a reader who asks for less motion, as every other turning thing in the chrome is.
*/
${faced((p) => `.${p}pilot-ship`)} { position: relative; }
${faced((p) => `.${p}pilot-ship > .${p}pilot-wheel`)} { position: absolute; height: auto; filter: none; transform: translate(-50%, -50%); animation: itc-wheel-turn var(--itc-turn, 0.7s) linear infinite; }
@keyframes itc-wheel-turn { from { transform: translate(-50%, -50%) rotate(0deg); } to { transform: translate(-50%, -50%) rotate(360deg); } }
@media (prefers-reduced-motion: reduce) {
  ${faced((p) => `.${p}pilot-ship > .${p}pilot-wheel`)} { animation: none; }
}
${faced((p) => `.${p}pilot-words`)} { display: flex; flex-direction: column; gap: 0.15em; min-width: 0; }
${faced((p) => `.${p}pilot-name`)} { font-size: 1.25em; font-weight: 800; letter-spacing: 0.02em; }
${faced((p) => `.${p}pilot-who`)} { font-size: 0.8em; opacity: 0.7; letter-spacing: 0.06em; }
${faced((p) => `.${p}pilot-bio`)} { margin: 0.2em 0; font-size: 0.85em; line-height: 1.3; opacity: 0.9; }
${faced((p) => `.${p}pilot-craft`)} { font-size: 0.8em; font-weight: 700; letter-spacing: 0.12em; text-transform: uppercase; color: var(--itc-ally, var(--itc-ink)); }
${faced((p) => `.${p}pilot-gun`)} { font-size: 0.8em; opacity: 0.85; }
/*
  ── THE LINE — 0538 ─────────────────────────────────────────────────────────────────────────────────

  Under the title's faces: the name, the craft and the gun on one line, the run the pilot is about to
  fly. Each part stands off the last by a middot rather than a wrap, and the line is cut short rather
  than wrapped, because it is the one row of the plate whose length is a pilot's and not the screen's.
*/
.itc-title-pilot-line {
  max-width: 100%;
  font-size: 0.85em;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}
/* The card's parts share these names, and its sizes and its phone's hiding are written for every faced screen. */
.itc-title-pilot-line > [class] { display: inline; font-size: 1em; letter-spacing: normal; text-transform: none; white-space: nowrap; overflow: visible; }
.itc-title-pilot-line > .itc-title-pilot-name { font-weight: 800; letter-spacing: 0.02em; }
.itc-title-pilot-line > .itc-title-pilot-craft { color: var(--itc-ally, var(--itc-ink)); font-weight: 700; }
.itc-title-pilot-line > .itc-title-pilot-gun { opacity: 0.85; font-weight: 500; }
.itc-title-pilot-line > * + *::before { content: '·'; margin: 0 0.55em; color: var(--itc-ink); opacity: 0.5; }
/*
  ── THE TITLE'S TWO PLATES — 0538 ──────────────────────────────────────────────────────────────────

  The table and the rows, each in the cut-corner frame the crossing's plate wears (0341), with the
  title's run of the two inks for a rim (0440): violet at the top-left cut, cyan at the bottom-right.
  It was five things of five shapes on the void with no edge between the table and the column beside it.

  ⚠️ **THE FRAME IS A RIM UNDER A GLASS, AND THE TWO CUTS ARE DRAWN.** The rim is a background clipped
  to the border box under a glass clipped to the padding box, which is how every control here wears a
  gradient edge; the clip path cuts two corners and takes the rim with them, so each cut is a square
  with one diagonal drawn through it, in the ink of the end of the run it is at.

  ⚠️ **AN EMPTY TABLE DRAWS NO PLATE**: the board is not displayed while the body is bare, and its
  frame is the board's own.
*/
.itc-title-board, .itc-title-main {
  --itc-cut: 0.9em;
  --itc-plate-glass: color-mix(in srgb, var(--itc-void) 84%, transparent);
  border: 1px solid transparent;
  background:
    linear-gradient(135deg, transparent calc(50% - 1px), var(--itc-ally, var(--itc-ink)) calc(50% - 1px), var(--itc-ally, var(--itc-ink)) calc(50% + 1px), transparent calc(50% + 1px)) top left / var(--itc-cut) var(--itc-cut) no-repeat border-box,
    linear-gradient(135deg, transparent calc(50% - 1px), var(--itc-ink) calc(50% - 1px), var(--itc-ink) calc(50% + 1px), transparent calc(50% + 1px)) bottom right / var(--itc-cut) var(--itc-cut) no-repeat border-box,
    linear-gradient(180deg, color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 9%, transparent), transparent 45%) padding-box,
    linear-gradient(var(--itc-plate-glass), var(--itc-plate-glass)) padding-box,
    linear-gradient(100deg, var(--itc-ally, var(--itc-ink)), var(--itc-ink)) border-box;
  clip-path: polygon(var(--itc-cut) 0, 100% 0, 100% calc(100% - var(--itc-cut)), calc(100% - var(--itc-cut)) 100%, 0 100%, 0 var(--itc-cut));
  padding: min(1rem, 2.4cqh) min(1.1rem, 2cqw);
  box-sizing: border-box;
}
/*
  ⚠️ **THE FACES CLOSER IN THE PLATE.** The plate's sides came out of the faces' track, and at 1024x768
  it had 10 % spare on this machine's fonts: CI's set the names under the faces wider and the fourth was
  cut. The names are what grow with a font, so they and the gaps between the cards are what give.
*/
.itc-title-main .itc-title-options-faces { gap: 0.4em; }
.itc-title-main .itc-title-option-face { padding-left: 0.15em; padding-right: 0.15em; }
.itc-title-main .itc-title-option-name { font-size: 0.64em; letter-spacing: 0; }
/*
  ── THE HANGAR — 0521, two columns at every size since 0523 ─────────────────────────────────────

  The pilot and their card on the left, the ship's slots stacked on the right: the dash, and what hangs
  from it. Stacked down one column, three bands, the card, the tabs and Back were taller than a
  1280x720, and on a phone the dash's column was already beside the pilot's (0521). A slot's options
  are a grid, two to a row, so a long name keeps its line. The band is placed by the slot its options
  belong to, read off the attribute the chrome gives every strip.
*/
.itc-hangar-settings-box {
  display: grid;
  width: min(100%, 64em);
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  /*
    0524: and the special under what hangs, the card beside both. 0526: and the gun beside the special,
    under the card — a fourth band down the right column put the tabs under the readout on a 1280x720
    and Back under an 844x390's fold, and the arms are a pair the player reads across.
  */
  grid-template-areas: 'pilot dash' 'card hanging' 'gun special';
  align-items: center;
  gap: min(0.9rem, 2cqh) min(1.5rem, 2.5cqw);
}
.itc-hangar-band-faces { grid-area: pilot; }
.itc-hangar-pilot-card { grid-area: card; }
.itc-hangar-band:has([${SETTING_ATTR}="plate"]) { grid-area: dash; }
.itc-hangar-band:has([${SETTING_ATTR}="dangle"]) { grid-area: hanging; }
.itc-hangar-band:has([${SETTING_ATTR}="special"]) { grid-area: special; }
.itc-hangar-band:has([${SETTING_ATTR}="gun"]) { grid-area: gun; }
/*
  ── PAINT AND PARTS — 0527, the hangar's second tab ────────────────────────────────────────────────

  The hangar's own columns: the pilot and their card on the left, the ship's looks down the right —
  its wheels, and the plan's nose art, livery and flame as they land. The wheels' three stand in a row.
  0528: and the art under the wheels, its three in a row too.
  0529: and the paint under the art — the colour one at a time on every screen, as a phone shows every
  slot, because thirteen in a grid were the column's height; the tone's three in a row.
*/
.itc-parts-settings-box {
  display: grid;
  width: min(100%, 64em);
  /*
    0530: and the flame beside the tone, the right column's last row split three to two — a fifth band
    down it put Back under a 1280x720's fold.
  */
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.6fr) minmax(0, 0.4fr);
  grid-template-areas: 'pilot wheels wheels' 'pilot art art' 'card livery livery' 'card tone flame';
  align-items: center;
  gap: min(0.9rem, 2cqh) min(1.5rem, 2.5cqw);
}
.itc-parts-band-faces { grid-area: pilot; }
.itc-parts-pilot-card { grid-area: card; }
.itc-parts-band:has([${SETTING_ATTR}="rim"]) { grid-area: wheels; }
.itc-parts-band:has([${SETTING_ATTR}="art"]) { grid-area: art; }
.itc-parts-band:has([${SETTING_ATTR}="livery"]) { grid-area: livery; }
.itc-parts-band:has([${SETTING_ATTR}="tone"]) { grid-area: tone; }
.itc-parts-band:has([${SETTING_ATTR}="flame"]) { grid-area: flame; }
.itc-parts-band:has([${SETTING_ATTR}="rim"]) .itc-parts-options,
.itc-parts-band:has([${SETTING_ATTR}="art"]) .itc-parts-options,
.itc-parts-band:has([${SETTING_ATTR}="tone"]) .itc-parts-options { grid-template-columns: repeat(3, minmax(0, 1fr)); }
/*
  The colour and the flame one at a time, the one on filling the band: a grid of one column, since every
  slot's options are a grid (below) and a flex here lost to it and left the chip its word's width. The
  flame's two names are wider than its half of the row could hold side by side.
*/
.itc-parts-band:has([${SETTING_ATTR}="livery"]) .itc-parts-options,
.itc-parts-band:has([${SETTING_ATTR}="flame"]) .itc-parts-options { grid-template-columns: minmax(0, 1fr); }
.itc-parts-band:has([${SETTING_ATTR}="livery"]) .itc-parts-option:not(.itc-parts-option-on),
.itc-parts-band:has([${SETTING_ATTR}="flame"]) .itc-parts-option:not(.itc-parts-option-on) { display: none; }
/*
  0526: and the panel stands a little lower than the centre, its rows a little closer. Four slots made
  the screen tall enough that, centred, its tabs met the readout's corner on a 1280x720 — with CI's
  wider type, over it — and the room they need was under Back and between the rows.
*/
.itc-hangar-panel, .itc-parts-panel, .itc-shop-panel { padding-top: 8cqh; gap: min(1rem, 2cqh); }
/*
  0530: Cosmo's shelf in rows of three, as what hangs is — five wares since the thrusters joined, and in
  one row CI's wider type put the fifth off a 667x375's edge.
*/
.itc-shop-band .itc-shop-options { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 0.3em; }
.itc-shop-band .itc-shop-option { font-size: 0.85em; padding-left: 0.3em; padding-right: 0.3em; }
/*
  0524: with three slots the right column was a desktop's height — two to a row put the tabs under the
  readout's corner on a 1280x720 — so the dash's four and the special's four stand in one row each, and
  what hangs, five, in rows of three. A phone shows only the one that is on, below.
*/
.itc-hangar-band:has([${SETTING_ATTR}="plate"]) .itc-hangar-options,
.itc-hangar-band:has([${SETTING_ATTR}="gun"]) .itc-hangar-options,
.itc-hangar-band:has([${SETTING_ATTR}="special"]) .itc-hangar-options { grid-template-columns: repeat(4, minmax(0, 1fr)); }
.itc-hangar-band:has([${SETTING_ATTR}="dangle"]) .itc-hangar-options { grid-template-columns: repeat(3, minmax(0, 1fr)); }
.itc-hangar-band:not(.itc-hangar-band-faces) .itc-hangar-option, .itc-parts-band:not(.itc-parts-band-faces) .itc-parts-option { font-size: 0.85em; padding-left: 0.3em; padding-right: 0.3em; }
.itc-hangar-band:not(.itc-hangar-band-faces) .itc-hangar-options, .itc-parts-band:not(.itc-parts-band-faces) .itc-parts-options { display: grid; gap: 0.3em; }
/*
  ⚠️ **AND THE PILOT SCREEN GIVES BACK THE HEIGHT THE CARD TAKES — 0513.** The card is new and the
  screen is the height it was, so two things the card made redundant go: the bands' labels — the faces
  are the pilots and the tier's line names the tier, and each band still names itself to a reader —
  and the second row of buttons, *Fly* and *Settings* standing side by side as they do on a phone.
*/
.itc-title-band { grid-template-areas: 'less track more' 'hint hint hint'; }
.itc-title-band-label { display: none; }
.itc-title-choices { flex-direction: row; }
.itc-title-choices > :not(.itc-title-action-lead) { flex: 1 1 0; }
/*
  ⚠️ **ONE LINE A BUTTON — 0521.** The hangar's name is two words, and with three buttons and the chip
  in the row it wrapped: a button two lines tall, and on the smallest phone a row taller than the tiers.
*/
.itc-title-choices > * { white-space: nowrap; }
/* The highlighted card's name is the card's ink, not the fill's: the fill is the face's ring now. */
${faced((p) => `.${p}option-face.${p}option-on .${p}option-name`)} { color: var(--itc-ink); }
/*
  The band the cursor is on. The ring is the shared focus outline further down (the -action-cursor
  class is set on the band itself), and a faint glass behind the row says which row a step moves.
*/
${banded((p) => `.${p}band.${p}action-cursor`)} {
  background: color-mix(in srgb, var(--itc-ink) 8%, transparent);
}
/*
  ── TABS — 0458 ───────────────────────────────────────────────────────────────────────────────────

  Settings and How to play are two tabs of one place. A strip under the heading, the open tab filled
  as a chosen option is, so it is told by fill and not by hue.
*/
/*
  The strip stands where the heading would, so it is set a size up and heavier: it is the screen's
  name as well as its way across.
*/
${each('-tabs')} { display: flex; gap: 0.6em; justify-content: center; font-size: clamp(0.95rem, min(3cqw, 6cqh), 1.5rem); }
${each('-tab')} {
  font: inherit;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: inherit;
  background: transparent;
  border: 2px solid currentColor;
  border-radius: 999px;
  padding: 0.25em 1.1em;
  cursor: pointer;
  opacity: 0.75;
}
${each('-tab-on')} { background: var(--itc-ink); color: var(--itc-void); opacity: 1; }
${each('-tab:focus-visible')}, ${each('-band:focus-visible')} { outline: 3px solid currentColor; outline-offset: 3px; }
/*
  0527: the hangar's strip holds three since Paint & Parts, and on a phone each wrapped to two lines and
  put Back under the fold. One line each, the strip sized to the width a little more tightly; on a
  desktop it is the size it was, the cap.
*/
.itc-hangar-tabs, .itc-parts-tabs, .itc-shop-tabs { font-size: clamp(0.75rem, min(2.6cqw, 6cqh), 1.5rem); gap: 0.5em; }
.itc-hangar-tab, .itc-parts-tab, .itc-shop-tab { white-space: nowrap; padding: 0.25em 0.8em; }
/* Settings' bands and its two buttons, at the title's column width. */
.itc-settings-settings-box, .itc-settings-choices { width: min(100%, 34em); }
.itc-settings-choices { flex-direction: row; justify-content: center; gap: min(0.8rem, 2cqw); }
.itc-settings-action, .itc-guide-action { min-width: 9em; }
/*
  ── WHICH PLACE IS PLAYING — decision 0216, and no extension on that path ────────────────────────

  ⚠️ **THE SAME FILL A CHOSEN SETTING TAKES**, because it is the same question asked of a different
  row: *which of these is on*. A player who has learned that a filled button is the live one on the
  title screen reads this without being taught it twice.

  ⚠️ **AND IT MUST NOT BE THE FOCUS RING.** The ring is an outline and says *this is what a press
  would do*; the fill says *this is what you are hearing*. During Play all the two are usually on the
  same button and have to stay legible together — which is why one is an outline and the other a
  background rather than both being colour.

  ⚠️ **IT SITS DOWN HERE, AFTER the shared action rule, AND THAT IS THE WHOLE REASON IT WORKS.** That
  rule sets background: transparent at the same specificity, so written next to the music room's own
  block it lost on source order and the button did not fill — visibly nothing, exactly the failure
  0210 recorded twice while fitting the title screen. Caught by looking at the screen.
*/
.itc-music-action-playing {
  background: var(--itc-ink);
  color: var(--itc-void);
}
/*
  ── THE FACE, WHICH IS THE UI HALF OF A STYLE ───────────────────────────────────────────────────

  Decision 0070: the ask is *"Retro UI / Modern UI"*, and a style that changed only the background
  would be a sky toggle with a misleading name. The stack lives here rather than in the style table
  for the reason the palette gives about inks: a font stack is a fact about a browser, and a second
  copy of it in a content row drifts the day one of them gains a fallback.

  ⚠️ No file paths in this stylesheet — the prefix guard reads every dotted token as a class name.
*/
.itc-title-face-pixel,
.itc-settings-face-pixel,
.itc-guide-face-pixel,
.itc-gameover-face-pixel,
.itc-ended-face-pixel,
.itc-cleared-face-pixel,
.itc-victory-face-pixel,
.itc-travel-face-pixel,
.itc-playing-face-pixel {
  font-family: ui-monospace, SFMono-Regular, Menlo, Consolas, monospace;
  letter-spacing: 0.06em;
}
/*
  ── THE TRIGGER BUTTONS, DRAWN ──────────────────────────────────────────────────────────────────

  Decision 0060, and 0358 for the shape. Reported from play: *"how do you fire bombs on mobile? I can
  do one and then can't fire any more."* Half of that was a dead band; this is the other half — the
  live one was never drawn, so where to press was a guess. Then: *"on mobile add a bomb button"*, and
  the quarter-screen strip with its dashed edge became a disc under the thumb.

  ⚠️ **pointer-events: none, on every part of it.** The buttons are a PICTURE of where the canvas is
  listening, not controls of their own. A real button element here would take the tap away from the
  touch source, which is also what owns not-stealing-the-drag — and the two would then disagree about
  what a second finger means.

  ⚠️ **The geometry is the hit test's, read from the same table.** TRIGGER_BUTTON gives the disc's
  size and its insets as fractions of the short edge, and the count comes from bandCount, so the
  picture cannot drift from the hit test.

  ⚠️ No file paths anywhere in this stylesheet: the prefix guard reads every dotted token in it as a
  CSS class, so an extension fails as an unprefixed class name. Hit again while writing this block.
*/
.itc-playing-trigger {
  position: absolute;
  inset: 0;
  display: none;
  pointer-events: none;
  /*
    ⚠️ Its own container, exactly the host's size, so cqmin below is the SHORT EDGE OF THE GLASS —
    the same number the hit test in the touch source measures its discs against. Decision 0358.
  */
  container-type: size;
  font: 600 clamp(0.8rem, 2.2vw, 1.1rem)/1 system-ui, sans-serif;
}
.itc-playing-trigger-shown { display: block; }
/*
  A disc with a rim and a faint fill: the shape of a thing to press, in the player's own ink, sat
  where a right thumb rests. Its size and its insets are the touch source's table, interpolated —
  one description of where the button is. Its vertical place is set per button, because the buttons
  stack up the leading edge.
*/
.itc-playing-trigger-button {
  position: absolute;
  right: ${TRIGGER_BUTTON.inset * 100}cqmin;
  /*
    A thumb's size, and no more — 0465. The disc was 0.17 of the short edge, sized when there were
    two and played at three as *"too big"*: 66 px on a 390 px phone, three of them 61 % of the height
    up the edge every threat enters by. The table's floor and ceiling are pixels because a thumb is
    the same size on every phone; between them the disc is a share of the short edge.
  */
  width: ${TRIGGER_DISC};
  height: ${TRIGGER_DISC};
  font-size: clamp(0.7rem, 3cqmin, 1.1rem);
  box-sizing: border-box;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 0.1em;
  border: 2px solid currentColor;
  border-radius: 50%;
  background: color-mix(in srgb, currentColor 18%, transparent);
  opacity: 0.85;
}
.itc-playing-trigger-icon { display: block; width: 1.8em; height: 1.8em; }
/* Up the left edge for a left thumb, at the same inset (0512): the hit test reads the same setting. */
.itc-playing-trigger-left .itc-playing-trigger-button { right: auto; left: ${TRIGGER_BUTTON.inset * 100}cqmin; }
/* A band the device has no use for is off the screen, whatever display the band rule gives it. */
${each('-band[hidden]')} { display: none; }
/*
  ⚠️ **ON A TOUCH SCREEN SETTINGS IS TWO COLUMNS, AND THE SECOND IS THE TOUCH SECTION — 0512.** Five
  bands in one column were 505 px of content on a 390 px phone and 39 px too many on a touch laptop;
  the width every landscape screen has to spare is the room. Filled down the columns, three to a
  column, so down from the last of the three goes to the first of the touch section's, which is the
  order the walk takes them in.
*/
.itc-settings-touch .itc-settings-settings-box {
  display: grid;
  grid-template-rows: repeat(3, auto);
  grid-auto-flow: column;
  grid-auto-columns: minmax(0, 1fr);
  column-gap: min(1rem, 2cqw);
  width: min(100%, 64em);
}
@container (max-height: 460px) {
  /*
    ── THE TITLE ON A PHONE — 0370, and rows since 0458 ──────────────────────────────────────────

    The same two columns as the desktop, set tighter: a landscape phone has width to spare and height
    to none, so the table keeps its column and the rows are what give. A band's label sits beside its
    track rather than over it, which is a line of the short axis back per band; the step arrows and the
    segments stay a thumb tall. The hint stays — 0370's report was a tier with no explanation.
  */
  .itc-title-body { grid-template-columns: minmax(0, 5fr) minmax(0, 11fr); gap: min(0.6rem, 2cqh) min(1.5rem, 3cqw); }
  .itc-title-main, .itc-settings-settings-box { gap: min(0.45rem, 1.6cqh); }
  /*
    Half a phone's width each, so the band's furniture gives back what the words need, on 0460's terms:
    a segment's floor is its longest word, and *Gentle · Standard · Quick* beside a label is the widest.
  */
  .itc-settings-touch .itc-settings-options { gap: 0.25em; }
  /*
    ⚠️ **ON A TOUCH PHONE A BAND IS ITS SEGMENTS: THE STEPS AND THE LABEL GO, AT EVERY WIDTH.** A thumb
    taps the segment it wants, so the arrows say nothing a segment does not, and a pad still steps a band
    without them; the label is the band's name, which its hint says in other words and its aria-label
    says to a reader. It went by width first — 760 and then wider — and CI's fonts found the steering
    words under the arrows at 480 and again at 812, each a few pixels past where this machine's ended.
    A rule that holds by a margin of fonts is not a rule; this one holds at any width.
  */
  .itc-settings-touch .itc-settings-band-step, .itc-settings-touch .itc-settings-band-label { display: none; }
  /* One column with the steps gone, or their empty columns keep their gaps — six pixels a side, measured. */
  .itc-settings-touch .itc-settings-band { grid-template-columns: minmax(0, 1fr); grid-template-areas: 'track' 'hint'; gap: 0.1em; padding: 0.2em 0.25em; }
  .itc-settings-touch .itc-settings-option { font-size: 0.8em; padding: 0.3em 0.25em; }
  ${each('-band')} {
    grid-template-columns: max-content auto minmax(0, 1fr) auto;
    grid-template-areas: 'label less track more' '. hint hint hint';
    gap: 0.1em 0.4em;
    padding: 0.2em 0.4em;
  }
  ${each('-band-label')} { text-align: right; }
  ${each('-option')} { padding: 0.35em min(0.7em, 1.2cqw); }
  /*
    ⚠️ **THE TITLE'S BANDS DROP THEIR LABEL ON EVERY PHONE, AND IT WAS ONLY THE NARROWEST.** CI's fonts
    are wider than this machine's, and at 667x375 the label's column pushed *Let the Galaxy Burn* eight
    pixels off the right edge — a segment's floor is its longest word, so the track cannot give. The
    title's two bands say what they are without it: the tier's line names the tier, the faces are the
    pilots, and each band still names itself to a reader. Settings keeps its labels while it is wide.
  */
  .itc-title-band { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: 'less track more' 'hint hint hint'; }
  .itc-title-band-label { display: none; }
  .itc-title-option { font-size: 0.92em; }
  ${faced((p) => `.${p}option-face > canvas`)} { width: clamp(1.9rem, 9cqh, 2.6rem); height: clamp(1.9rem, 9cqh, 2.6rem); }
  /*
    ── THE HANGAR ON A PHONE — 0521 ────────────────────────────────────────────────────────────────

    Two columns, on the title's terms: the pilot and their card on the left, the dash beside them, the
    dash's four in two rows of two. Stacked, the pilot, the card, the dash and Back were a desktop's
    height and Back went under an 844x390's fold. The bands drop their labels as the title's do; each
    still names itself to a reader.
  */
  .itc-hangar-settings-box, .itc-parts-settings-box { gap: min(0.45rem, 1.6cqh) min(1rem, 2cqw); }
  /*
    0529: Paint & Parts' four slots, on a phone: the colour and its tone side by side across both columns,
    under the card and the art — four down the right put Back twenty pixels under an 844x390's fold.
  */
  /*
    0530: and with the flame, five, which beside the card are a desktop's height; on a phone the card
    goes, as it goes on the shortest, and the slots pair off under the faces. The faces say whose ship.
  */
  .itc-parts-pilot-card { display: none; }
  .itc-parts-settings-box { grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr); grid-template-areas: 'pilot wheels' 'art livery' 'tone flame'; }
  .itc-hangar-band, .itc-parts-band { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: 'less track more' 'hint hint hint'; }
  .itc-hangar-band-label, .itc-parts-band-label { display: none; }
  .itc-hangar-option, .itc-parts-option { font-size: 0.8em; }
  .itc-hangar-band:not(.itc-hangar-band-faces) .itc-hangar-option, .itc-parts-band:not(.itc-parts-band-faces) .itc-parts-option { padding: 0.25em 0.3em; }
  /*
    ⚠️ **ON A PHONE A SLOT SHOWS THE ONE THAT IS ON, AND ITS ARROWS STEP IT — 0523.** Two bands of four
    and five, each name two lines in half a phone, were the column's height three times over and put
    Back under a 480x320's fold; three to a row cut the names off. The arrows were always there, and a
    step passes over what is shut, so the band's line — which says why a thing is shut — is what tells
    the player there is more to win or buy. One line, cut short rather than wrapped.
  */
  .itc-hangar-band:not(.itc-hangar-band-faces) .itc-hangar-options, .itc-parts-band:not(.itc-parts-band-faces) .itc-parts-options { display: flex; justify-content: center; }
  .itc-hangar-band:not(.itc-hangar-band-faces) .itc-hangar-option:not(.itc-hangar-option-on), .itc-parts-band:not(.itc-parts-band-faces) .itc-parts-option:not(.itc-parts-option-on) { display: none; }
  .itc-hangar-band:not(.itc-hangar-band-faces) .itc-hangar-option, .itc-parts-band:not(.itc-parts-band-faces) .itc-parts-option { width: 100%; white-space: nowrap; }
  .itc-hangar-band:not(.itc-hangar-band-faces) .itc-hangar-band-hint, .itc-parts-band:not(.itc-parts-band-faces) .itc-parts-band-hint { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* The balance a step smaller, so it keeps its corner clear of the tabs on a narrow phone. */
  /*
    And in the bottom corner rather than the top. On a phone the tabs are the heading's size and reach
    the top right, where the balance stood over Cosmo's own tab at 844x390; beside Back is clear.
  */
  .itc-hangar-sheet, .itc-parts-sheet, .itc-shop-sheet { font-size: 0.8em; top: auto; bottom: min(0.9rem, 2.5cqh); }
  /*
    The pilot card on a phone: the ship smaller beside the words, and the line about who they are kept
    to the lines it needs — 0513. The height is the axis that ran out on every phone this screen has met.
  */
  /*
    ⚠️ **ON A PHONE THE PILOT SCREEN IS TWO ROWS OF TWO AND TWO ACROSS — 0513.** With the card under
    the faces the title ran 80 px past a 390 px phone and 150 past a 320 one. The main column and its
    box of bands stand aside (display: contents), so the faces, the card, the tier and the buttons are
    the body's own cells: the table on the left, as wide as its rows and each row one line, with the
    faces and the card beside it; then the tier across both columns, where its three names fit a line
    each; then Fly and Settings. The DOM is untouched, so the walk's order is.

    ⚠️ **ONE LAYOUT AT EVERY PHONE WIDTH, AND IT WAS TWO.** The first put the card under the table
    wherever there was width for it, and the table's names wrapped at 667 and doubled its height: a
    breakpoint moves a problem to the width beside it, so there is none.
  */
  /*
    ⚠️ **TWO PLATES ON A PHONE TOO, AND THE CELLS WERE THE BODY'S — 0538.** 0513 stood the main column
    aside so the faces, the card, the tier and the buttons were four cells of the body, the tier and the
    buttons across both columns. With the card a line and its row gone, the rows fit their own plate
    beside the table's, and a plate cannot be drawn round cells that belong to its parent.
  */
  .itc-title-body:not(.itc-title-body-bare) { grid-template-columns: max-content minmax(0, 1fr); align-items: center; }
  .itc-title-main { width: 100%; padding: min(0.6rem, 2cqh) min(0.9rem, 2cqw); }
  .itc-title-board { padding: min(0.6rem, 2cqh) min(0.9rem, 2cqw); }
  /*
    The cut a step smaller: Settings stands in the plate's bottom-right corner and the faces in its
    top-left, and with the plate's phone padding their focus rings reached into a 0.9em cut on every
    phone the guard holds — the ring is clipped by the plate before it is drawn.
  */
  .itc-title-main, .itc-title-board { --itc-cut: 0.45em; }
  /*
    ⚠️ **AND THE ROWS IN IT GIVE BACK WHAT FLY'S ROW COSTS.** Measured at 667x375 with a full table, the
    rows' plate was 20 pixels taller than the screen: Fly's row is one more than the title had, and the
    tier's names take two lines in a column beside the table where they took one across the body. The
    faces a little smaller and closer to their track, Fly a thumb tall and no taller, the tier's names a
    step down — padding and type above their floors, and no row of the screen.
  */
  .itc-title-options-faces { padding: 0.15em 0.3em; }
  .itc-title-option-face > canvas { width: clamp(1.7rem, 8cqh, 2.3rem); height: clamp(1.7rem, 8cqh, 2.3rem); }
  .itc-title-body .itc-title-band:not(.itc-title-band-faces) { padding-top: 0.1em; padding-bottom: 0.1em; }
  ${faced((p) => `.${p}pilot-card`)} { padding: 0.3em 0.6em; gap: 0.1em 0.6em; font-size: 0.76em; }
  ${faced((p) => `.${p}pilot-gun`)} { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
  /* The pronouns and the home on the name's line, and the line about them one line long. */
  ${faced((p) => `.${p}pilot-words`)} { flex-direction: row; flex-wrap: wrap; align-items: baseline; column-gap: 0.6em; }
  ${faced((p) => `.${p}pilot-bio, .${p}pilot-gun, .${p}pilot-craft`)} { flex-basis: 100%; }
  .itc-title-board-score, .itc-title-board-pilot { white-space: nowrap; }
  /* How far each run got goes on every phone, and the table is the height of the faces and card beside it. */
  .itc-title-body .itc-title-board-reached { display: none; }
  .itc-title-body .itc-title-board-rows { grid-template-columns: auto auto auto; }
  .itc-title-body .itc-title-board { font-size: 0.72em; }
  /*
    The tier's three names on one line each where they fit — two lines each was the band's height twice
    over — and the buttons a thumb tall and no taller, with room left for CI's wider fonts.
  */
  .itc-title-body .itc-title-band:not(.itc-title-band-faces) .itc-title-option { font-size: 0.72em; padding: 0.25em 0.35em; }
  .itc-title-body .itc-title-choices > * { padding-top: 0.3em; padding-bottom: 0.3em; }
  /*
    ⚠️ **AND A NARROWER SIDE TO EACH BUTTON — 0521.** On a phone the row is the column's whole width
    and four one-line buttons stand in it; the side padding is the one part of a button no word needs,
    and CI's wider fonts took the row's last 38 pixels at 480x320.
  */
  .itc-title-body .itc-title-choices > * { padding-left: 0.5em; padding-right: 0.5em; }
  /*
    The names under the faces go on a phone: the card beside them names the highlighted pilot, each
    face names itself to a reader, and the line they took was the margin CI's wider fonts need.
  */
  ${faced((p) => `.${p}option-name`)} { display: none; }
  ${faced((p) => `.${p}pilot-ship`)} { width: clamp(3rem, 16cqh, 5rem); }
  ${faced((p) => `.${p}pilot-name`)} { font-size: 1.05em; }
  ${faced((p) => `.${p}pilot-bio`)} {
    margin: 0.1em 0;
    font-size: 0.78em;
    line-height: 1.2;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
  /* The craft's name is the picture beside it; the gun's line says what it fires. */
  ${faced((p) => `.${p}pilot-craft`)} { display: none; }
  ${faced((p) => `.${p}pilot-who`)} { font-size: 0.72em; }
  /*
    ⚠️ **ON THE SHORTEST PHONES THE LINE ABOUT WHO THEY ARE GOES**, and the card is a name, a home and
    a gun beside the ship. Below 360 tall there is no row of the screen to give it without the tier or
    *Fly* going under the fold, and those are the two things a run cannot start without.
  */
  @container (max-height: 360px) {
    ${faced((p) => `.${p}pilot-bio`)} { display: none; }
    /* And the tier's names, the buttons and the ship a step smaller, which is the room CI's fonts need. */
    .itc-title-body .itc-title-band:not(.itc-title-band-faces) .itc-title-option { font-size: 0.7em; }
    .itc-title-body .itc-title-choices > * { font-size: 0.85em; }
    ${faced((p) => `.${p}pilot-ship`)} { width: 2.6rem; }
    /*
      0538: and the title's panel gives back its own top and bottom, which is padding before it is
      anything the player reads. With Fly's row added, 480x320 had 19 px spare on this machine's fonts and
      one with every letter spaced wider — measured — scrolled by a pixel.
    */
    .itc-title-panel { padding-top: 2cqh; padding-bottom: 2cqh; }
    /*
      0523: and the hangar's card goes — the faces say who is on the stand and the readout's lives icon
      is their ship — because three bands, the tabs and Back are the whole of a 480x320, and the panel
      starts under the readout's corner rather than behind it.
    */
    .itc-hangar-pilot-card { display: none; }
    /*
      0524: and the special goes under the faces, in the room the card gave, so Back keeps the screen.
      0526: and the gun under the faces, the special under it; the third row was five pixels past a
      480x320's floor, given back from over the tabs, which still clear the readout.
    */
    .itc-hangar-settings-box { grid-template-areas: 'pilot dash' 'gun hanging' 'special .'; }
    /* 0529: and Paint & Parts the same — its card goes, the faces say whose ship is being dressed. */
    .itc-parts-pilot-card { display: none; }
    .itc-parts-settings-box { grid-template-areas: 'pilot wheels' 'art livery' 'tone flame'; }
    .itc-hangar-panel, .itc-parts-panel, .itc-shop-panel { padding-top: 15cqh; }
  }
  /*
    ⚠️ **THE NARROWEST PHONES DROP THE BAND'S LABEL, AND KEEP ITS HINT.** At 480 wide the label's
    column took the width three tier names needed, and they stacked a letter to a line. The hint under
    the track says what the band is set to and the faces say what the pilot band is, and the row still
    names itself to a reader (aria-label), so the word beside it is the one thing that can go.
  */
  @container (max-width: 620px) {
    ${each('-band')} { grid-template-columns: auto minmax(0, 1fr) auto; grid-template-areas: 'less track more' 'hint hint hint'; }
    ${each('-band-label')} { display: none; }
    ${each('-option')} { font-size: 0.85em; padding: 0.3em 0.4em; }
    /*
      ⚠️ **AND THE BAND'S OWN FURNITURE GIVES BACK ITS WIDTH — 0460.** Beside a table at 480x320 the
      tier track had four pixels over its three longest words on this machine's fonts, and CI's put
      *Legendary Pilot* and *Let the Galaxy Burn* under the step arrows. The arrows, the gaps and the
      band's own padding were seventy pixels of a 294-pixel column; the words are the thing on the band
      that cannot give, so these do.
    */
    ${each('-band')} { gap: 0.1em 0.15em; padding: 0.2em 0.15em; }
    ${each('-band-step')} { padding: 0; }
    ${each('-options')} { gap: 0.25em; }
    .itc-title-board { font-size: 0.85em; }
    .itc-title-board-heading { letter-spacing: 0.12em; white-space: nowrap; }
    .itc-title-board-reached { display: none; }
    .itc-title-board-rows { grid-template-columns: auto auto auto; }
    /*
      0538: and on the narrowest the quiet row had 5 % of its row spare at 480x320 after the rest of
      this block — so the plates' own sides, the panel's, and the gap between the two plates give
      theirs, which is width beside the words rather than any of the words; and the quiet row a step down.
    */
    .itc-title-main, .itc-title-board { padding: 0.35em 0.45em; }
    .itc-title-main { padding-top: 0.6em; padding-bottom: 0.6em; }
    .itc-title-panel { padding-left: 2cqw; padding-right: 2cqw; }
    .itc-title-body { column-gap: 2cqw; }
    .itc-title-body .itc-title-choices { column-gap: 0.35em; }
    .itc-title-panel .itc-title-body .itc-title-choices > :not(.itc-title-action-lead) { font-size: 0.66em; }
  }
  /*
    ⚠️ **ON A PHONE THE TABLE GIVES BACK ITS WIDTH, AND THE QUIET ROW ITS SIDES — 0538.** The rows' plate
    stands beside the table's now, where the tier and the buttons used to run across both, and measured
    with a full table the quiet row's three one-line buttons had 1 % of their row spare at 667x375 and
    3 % at 480x320 — CI's fonts set a row about a quarter wider than this machine's (0521), so it would
    have wrapped there. The places' numbers go — the five stand best first and say their order by
    standing in it — the heading is spaced closer, and the quiet row is set a step down with narrower sides.
  */
  .itc-title-body .itc-title-board-place { display: none; }
  .itc-title-body .itc-title-board-rows { grid-template-columns: auto auto; }
  .itc-title-body .itc-title-board-heading { letter-spacing: 0.12em; white-space: nowrap; }
  .itc-title-body .itc-title-choices > :not(.itc-title-action-lead) { padding-left: 0.3em; padding-right: 0.3em; font-size: 0.7em; }
  .itc-title-body .itc-title-chip .itc-title-option { padding: 0.3em 0.45em; }
  .itc-title-choices { flex-direction: row; gap: min(0.45rem, 1.4cqh) min(0.6rem, 1.5cqw); }
  .itc-title-body .itc-title-choices > .itc-title-action-lead { font-size: 1em; padding: 0.2em 0.8em; }
  .itc-title-choices > :not(.itc-title-action-lead) { flex: 1 1 0; }
  .itc-guide-body { gap: min(0.5rem, 1.6cqh) min(1.5rem, 3cqw); }
  .itc-guide-key, .itc-guide-controls { gap: 0.15em 0.6em; line-height: 1.2; }
  .itc-guide-key-icon { width: 1.8em; height: 1.8em; }
  /*
    ⚠️ **AND ON A PHONE, THE TWO SECTION HEADINGS GO.** At 480x320 How to play scrolled by nine
    pixels on CI's fonts and fitted on this machine's. The headings are the one line on it that says
    nothing the rows under them do not: the pickups are their icons, and the controls have a device in
    every column's head.
  */
  .itc-guide-panel .itc-guide-section-heading { display: none; }
  /*
    The panel's own gap is the one thing above the rows with any give, and it is already authored
    against the short axis, so tightening it here is the same argument one step further.
  */
  .itc-title-panel, .itc-settings-panel, .itc-guide-panel { gap: min(0.6rem, 1.6cqh); }
  /*
    ⚠️ **THE HEADING IS DELIBERATELY NOT OVERRIDDEN HERE, AND IT WAS AT FIRST.**
    docs/decisions/0049 has a probe that breaks the heading's own rule — typesetting it at a fixed
    size instead of a fraction of the box — and expects the layout guard to catch it. An override in
    this block WINS ON EVERY SHORT SCREEN, which is exactly where that guard measures, so the probe's
    break stopped having any effect and the suite **stayed green over it**. npm run prove said so:
    *the guard does not fire on the thing it exists to catch.*

    A rule that shadows another rule on the only devices a guard tests has disabled that guard, and
    nothing about writing it looks like disabling a guard. The grid above is what buys the space
    instead.
  */
  /*
    ⚠️ **AND THE MUSIC ROOM TIGHTENS FURTHER, BECAUSE IT HAS NINE CONTROLS TO THE TITLE'S FOUR.** At
    18ch a 667px-wide phone fits four to a row, which is three rows plus a heading, and *Back* landed
    26px below the fold. Narrower buttons put five to a row and bring it back inside.
  */
  .itc-music-panel { gap: min(0.6rem, 1.6cqh); }
  .itc-music-heading { font-size: clamp(0.9rem, min(4.5cqw, 5.5cqh), 1.8rem); }
  /*
    ⚠️ **A GRID WITH A FIXED COLUMN COUNT, BECAUSE A ch-WIDTH WRAP IS NOT PORTABLE.** The first
    version sized these buttons in ch and let flex decide how many fitted a row. That passed here and
    FAILED IN CI BY 64 PIXELS — a headless runner resolves a different font, ch is a font metric, and
    a wider one puts fewer buttons on a row and adds whole rows. Nine controls over three columns is
    three rows on any font, which is the only version of this that is the same everywhere.

    ⚠️ **AND IT IS THE SECOND TIME THIS SESSION A LOCAL GREEN WAS NOT A GREEN.** The lesson is the
    one decision 0199 is about, one layer out: a check that passes on one machine has told you about
    that machine.
  */
  .itc-music-choices {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    max-width: min(100%, 72ch);
  }
  /*
    ⚠️ **nowrap IS THE OTHER HALF OF MAKING THIS PORTABLE.** Fixing the column count fixes how many
    ROWS there are; it does not fix how tall a row is, because a wider font can wrap a place's name
    onto a second line inside its own button and double it. One line per button, clipped inside the
    button if it must be, keeps the height a property of the layout rather than of the runner.
  */
  .itc-music-action {
    width: 100%;
    font-size: clamp(0.55rem, min(2.4cqw, 3.4cqh), 0.95rem);
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  /*
    The last 15px on a 480x320, and it comes out of the buttons' own padding rather than anything
    the player reads. 0.55em to 0.35em is four pixels a button at this type size, over four buttons
    plus the settings row below them. The touch target stays above the floor because the border and
    the line box carry most of the height.
  */
  ${each('-action')} { padding: 0.35em 0.8em; }
  /*
    ⚠️ **THE LEGEND IS THE FIRST THING TO GO ON A SHORT SCREEN, AND THE BAR IS THE LAST** — 0212, on
    the same ladder the padding above comes off. Five section names under a bar 300px wide are five
    names that overlap each other; what the readout is FOR survives without them, because the head
    already says which section is playing and the ticks still say where the boundaries are.
  */
  .itc-music-now-legend { display: none; }
  .itc-music-now { width: 100%; }
}
/*
  ── ONE VOICE — 0440 ─────────────────────────────────────────────────────────────────────────────

  The title was lit (0436, 0437) and the screens around it were not: every control was a 2px outline
  of the cyan on nothing, the golfers' cards and the break's *Onward* and the run over's *Continue* the
  same scaffold the review called out. The studio's banner is the reference — a name run from violet
  into cyan with a glow, a rule with a diamond at each end — and every control now speaks it.

  **A plate**: a glass of the void, a rim run violet into cyan, and a halo of the cyan that rises
  under the pointer. **A chosen option**: filled with the same run, so it is still told by fill and not
  by hue (0024). **A heading**: the wordmark, and under it the banner's diamond-tipped rule, drawn out
  of flow so no screen gains a pixel of height (0049's guard is the arbiter of that, not this note).

  ⚠️ **LAST IN THE SHEET, AND IT SETS NO SIZE.** It wins on source order over the rules it restyles and
  touches only paint — rims, fills, shadows — so the phone's own sizes under 0370's query stand, and
  the probes that anchor on the rules above still find them.

  ⚠️ **The rim is a second background clipped to the border box**, because a border cannot hold a
  gradient and keep its radius. That is also why the glass is a background IMAGE: background-color
  stays whatever the rule above set, which is what 0070's guard reads to tell filled from hollow.
*/
${each('-action')}, .itc-intro-skip {
  --itc-glass: color-mix(in srgb, var(--itc-void) 80%, transparent);
  border-color: transparent;
  background-image:
    linear-gradient(var(--itc-glass), var(--itc-glass)),
    linear-gradient(100deg, var(--itc-ally, var(--itc-ink)), var(--itc-ink));
  background-origin: border-box;
  background-clip: padding-box, border-box;
  box-shadow: 0 0 0.8em color-mix(in srgb, var(--itc-ink) 16%, transparent), inset 0 0 1.2em color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 10%, transparent);
  transition: box-shadow 0.15s ease-out, filter 0.15s ease-out;
}
${each('-action:hover')}, .itc-intro-skip:hover {
  --itc-glass: color-mix(in srgb, var(--itc-void) 70%, var(--itc-ally, var(--itc-ink)));
  box-shadow: 0 0 1.2em color-mix(in srgb, var(--itc-ink) 38%, transparent), inset 0 0 1.2em color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 18%, transparent);
}
/* Launch is the screen's one way into a run: its rim glows brighter than Settings under it. 0458. */
.itc-title-choices > .itc-title-action-lead { box-shadow: 0 0 1.2em color-mix(in srgb, var(--itc-ink) 30%, transparent), inset 0 0 1.2em color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 14%, transparent); }
/* A chosen setting, the open tab and the place that is playing are filled with the run, the void's ink on it. */
${each('-option-on')}, ${each('-tab-on')}, .itc-music-action-playing {
  background-image: linear-gradient(100deg, var(--itc-ally, var(--itc-ink)), var(--itc-ink));
  border-color: transparent;
  background-clip: border-box;
}
/* The card's ring is the run as well, drawn round the portrait rather than over the card (0513). */
${faced((p) => `.${p}option-face.${p}option-on`)} { background-image: none; box-shadow: none; }
${faced((p) => `.${p}option-face.${p}option-on > canvas`)} { box-shadow: 0 0 0 3px var(--itc-ink), 0 0 0.8em color-mix(in srgb, var(--itc-ink) 50%, transparent); }
${banded((p) => `.${p}option:not(.${p}option-on)`)} { border-color: color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 45%, var(--itc-ink)); }
${faced((p) => `.${p}option-face, .${p}option-face:not(.${p}option-on)`)} { border-color: transparent; }
/*
  ── THE CHIP — 0517 ───────────────────────────────────────────────────────────────────────────────

  A two-way choice drawn as one button beside Settings, saying the option that is on: the others are
  not drawn, and a press steps it round. It wears an action's glass and rim rather than a chosen
  segment's fill, because beside Fly and Settings it reads as one of them, and the words are the state.
*/
/*
  On one line: a mode in three lines of a button is the band again, sideways.

  ⚠️ **DRAWN FIRST IN THE QUIET ROW, AND WALKED AFTER THE ACTIONS.** The boxes decide inside a row of
  buttons (0214), so left from the hangar is the chip wherever the DOM has it. The walk still opens on
  Fly, which is first in the row the cursor reads.

  ⚠️ **AND IT SHRINKS WITH THE REST OF THE QUIET ROW — 0538.** It was as wide as its words; beside Fly
  that cost nothing, and in a row of three the size of the screen it was the word that wrapped the row.
*/
.itc-title-choices > .itc-title-chip { display: flex; flex: 1 1 0; min-width: 0; padding: 0; opacity: 1; order: -1; }
.itc-title-chip .itc-title-options { flex: 1 1 auto; min-width: 0; }
.itc-title-chip .itc-title-option { white-space: nowrap; min-width: 0; overflow: hidden; text-overflow: ellipsis; }
.itc-title-chip .itc-title-option:not(.itc-title-option-on) { display: none; }
.itc-title-chip .itc-title-option {
  --itc-glass: color-mix(in srgb, var(--itc-void) 80%, transparent);
  color: inherit;
  opacity: 0.9;
  padding: 0.4em 0.9em;
  border-color: transparent;
  background-color: transparent;
  background-image:
    linear-gradient(var(--itc-glass), var(--itc-glass)),
    linear-gradient(100deg, var(--itc-ally, var(--itc-ink)), var(--itc-ink));
  background-origin: border-box;
  background-clip: padding-box, border-box;
}
.itc-title-chip .itc-title-option:hover { --itc-glass: color-mix(in srgb, var(--itc-void) 70%, var(--itc-ally, var(--itc-ink))); }
/* A card lights under the pointer. */
${faced((p) => `.${p}option-face:hover > canvas`)} { box-shadow: 0 0 0 2px color-mix(in srgb, var(--itc-ink) 60%, transparent); }
/*
  The banner's rule, under every heading but the name's — which has the badge, and on the splash the
  loading light, as its line. Out of flow, hung from the heading, so the panel is the height it was.
*/
.itc-paused-heading, .itc-gameover-heading, .itc-ended-heading, .itc-cleared-heading, .itc-victory-heading, .itc-music-heading, .itc-settings-heading, .itc-guide-heading { position: relative; }
.itc-paused-heading::after, .itc-gameover-heading::after, .itc-ended-heading::after, .itc-cleared-heading::after, .itc-victory-heading::after, .itc-music-heading::after,
.itc-settings-heading::after, .itc-guide-heading::after {
  content: '';
  position: absolute;
  left: 50%;
  bottom: -0.32em;
  width: min(14em, 120%);
  height: 0.32em;
  transform: translateX(-50%);
  pointer-events: none;
  /*
    The run of the two inks, cut by a mask into a line with a diamond at each end — so the whole rule is
    one pseudo-element and the palette still colours it. A gradient cannot draw a diamond (a conic one
    draws a bow tie, which is what the first version shipped to the screenshot); the mask's diamond is
    an SVG, and its colour is irrelevant because a mask reads only coverage. The namespace's dots are
    escaped because the prefix guard reads a dotted token here as a class.
  */
  --itc-diamond: url("data:image/svg+xml,%3Csvg xmlns='http://www%2Ew3%2Eorg/2000/svg' viewBox='0 0 2 2'%3E%3Cpath d='M1 0 2 1 1 2 0 1z'/%3E%3C/svg%3E");
  background: linear-gradient(90deg, var(--itc-ally, var(--itc-ink)), var(--itc-ink));
  -webkit-mask:
    var(--itc-diamond) left center / 0.32em 0.32em no-repeat,
    var(--itc-diamond) right center / 0.32em 0.32em no-repeat,
    linear-gradient(#000, #000) center / calc(100% - 0.5em) 1.5px no-repeat;
  mask:
    var(--itc-diamond) left center / 0.32em 0.32em no-repeat,
    var(--itc-diamond) right center / 0.32em 0.32em no-repeat,
    linear-gradient(#000, #000) center / calc(100% - 0.5em) 1.5px no-repeat;
  opacity: 0.85;
}
/* The splash's loading line runs the same two inks. */
.itc-splash-panel::after {
  background:
    linear-gradient(90deg, transparent, var(--itc-ink), transparent) no-repeat,
    linear-gradient(90deg, color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 30%, transparent), color-mix(in srgb, var(--itc-ink) 30%, transparent));
  background-size: 35% 100%, auto;
}
/*
  The title's void carries the banner's two washes: violet in from the left, the deep blue from the right.

  ⚠️ **ON A LAYER OF THEIR OWN, AND ON THE SKY ITSELF THEY ATE IT.** A background shorthand on the
  sky reset the star rule's images and sizes, so 0437's stars were gone and its drift — sixty
  seconds of background-position — slid these two washes left instead, at the size of the screen,
  repeating: their seam was an edge creeping in from the right that jumped back every minute.
*/
.itc-title-sky::before {
  content: '';
  position: absolute;
  inset: 0;
  background:
    radial-gradient(60% 90% at 0% 40%, color-mix(in srgb, var(--itc-ally, var(--itc-ink)) 16%, transparent), transparent 70%),
    radial-gradient(55% 90% at 100% 60%, color-mix(in srgb, var(--itc-ink) 10%, transparent), transparent 70%);
}
/* A touch screen's trigger discs are controls under the thumb, so they wear the rim too. */
.itc-playing-trigger-button {
  border-color: transparent;
  background:
    linear-gradient(color-mix(in srgb, var(--itc-void) 35%, transparent), color-mix(in srgb, var(--itc-void) 35%, transparent)) padding-box,
    linear-gradient(135deg, var(--itc-ally, var(--itc-ink)), var(--itc-ink)) border-box;
  box-shadow: 0 0 0.9em color-mix(in srgb, var(--itc-ink) 25%, transparent);
}
/*
  ── ONE STRIP ACROSS THE TOP — 0439 ──────────────────────────────────────────────────────────────

  Asked for: *"the top in game elements, ship info etc boss bars and score aren't cohesive design and
  don't all sit on the same line across the top of the screen."* They did not: the readout was a row
  of bare icons, the bar a 0.6em pill hung 0.9em down, the score three lines tall with its caption over
  it. Now each is a plate of ONE height on ONE centre line — the strip's height, set once below —
  with one rim, the studio's, and each keeps its own ink inside: the cyan readout, the enemy's bar,
  the gold score. The grid, its columns and its guards are 0360's and 0428's and are untouched.
*/
.itc-playing-strip {
  --itc-strip: ${STRIP.plateEm}em;
  padding: ${STRIP.padEm}em 0.6em 0;
  align-items: center;
}
.itc-playing-hud, .itc-playing-boss, .itc-playing-score {
  --itc-glass: color-mix(in srgb, var(--itc-void) 66%, transparent);
  box-sizing: border-box;
  height: var(--itc-strip);
  margin: 0;
  border: 1.5px solid transparent;
  border-radius: 0.75em;
  background:
    linear-gradient(var(--itc-glass), var(--itc-glass)) padding-box,
    linear-gradient(100deg, var(--itc-ally, var(--itc-ink)), var(--itc-ink)) border-box;
  box-shadow: 0 0 0.9em color-mix(in srgb, var(--itc-ink) 14%, transparent);
}
.itc-playing-hud { padding: 0 0.9em; gap: 1.1em; }
/*
  ── THE READOUT WEARS THE SHIP — 0451 ──────────────────────────────────────────────────────────────

  The predecessor's bridges, carried to the one plate: the fighter's gunsight corners, the saucer's
  probe deck, the Firebird's racing dash and the estate's woody one. The ship's inks are set on the
  plate by the shell (--itc-ink, --itc-ally for the trim, --itc-lit for the light); the dressing is
  painted under the counts, so it can never cover a number, and every moving part holds still for a
  player who has asked the system for less motion.
*/
.itc-playing-hud { position: relative; isolation: isolate; }
.itc-playing-hud::before, .itc-playing-hud::after {
  content: none;
  position: absolute;
  pointer-events: none;
  z-index: -1;
}
/* The fighter: four lit corners, a gunsight's, just outside the rim. */
.itc-playing-hud-bracket::before {
  content: '';
  inset: -0.3em;
  --itc-arm: 0.8em;
  --itc-bar: 2px;
  background:
    linear-gradient(var(--itc-ink), var(--itc-ink)) left top / var(--itc-arm) var(--itc-bar) no-repeat,
    linear-gradient(var(--itc-ink), var(--itc-ink)) left top / var(--itc-bar) var(--itc-arm) no-repeat,
    linear-gradient(var(--itc-ink), var(--itc-ink)) right top / var(--itc-arm) var(--itc-bar) no-repeat,
    linear-gradient(var(--itc-ink), var(--itc-ink)) right top / var(--itc-bar) var(--itc-arm) no-repeat,
    linear-gradient(var(--itc-ink), var(--itc-ink)) left bottom / var(--itc-arm) var(--itc-bar) no-repeat,
    linear-gradient(var(--itc-ink), var(--itc-ink)) left bottom / var(--itc-bar) var(--itc-arm) no-repeat,
    linear-gradient(var(--itc-ink), var(--itc-ink)) right bottom / var(--itc-arm) var(--itc-bar) no-repeat,
    linear-gradient(var(--itc-ink), var(--itc-ink)) right bottom / var(--itc-bar) var(--itc-arm) no-repeat;
  filter: drop-shadow(0 0 0.25em var(--itc-ink));
}
/* The saucer: a rounder plate, a dashed orbit about it, and a bloom that breathes. */
.itc-playing-hud-orbit { border-radius: 1.3em; }
.itc-playing-hud-orbit::before {
  content: '';
  inset: -0.45em -0.9em;
  border: 1.5px dashed color-mix(in srgb, var(--itc-ink) 62%, transparent);
  border-radius: 50%;
  opacity: 0.55;
  transform: rotate(-3deg);
  animation: itc-hud-orbit 11s ease-in-out infinite alternate;
}
.itc-playing-hud-orbit::after {
  content: '';
  inset: 0;
  border-radius: inherit;
  background: radial-gradient(ellipse at 18% 50%, color-mix(in srgb, var(--itc-ink) 22%, transparent), transparent 70%);
  animation: itc-hud-bloom 3.4s ease-in-out infinite;
}
@keyframes itc-hud-orbit { from { transform: rotate(-3deg); } to { transform: rotate(3deg); } }
@keyframes itc-hud-bloom { 0%, 100% { opacity: 0.5; } 50% { opacity: 1; } }
/* The Firebird: a sharper plate, a chequered flag fading off its leading end, and a carbon weave. */
.itc-playing-hud-checker { border-radius: 0.45em; padding-left: 1.5em; --itc-glass: color-mix(in srgb, var(--itc-void) 88%, transparent); }
.itc-playing-hud-checker::before {
  content: '';
  inset: 0 auto 0 0;
  width: 1.2em;
  border-radius: 0.45em 0 0 0.45em;
  background: repeating-conic-gradient(var(--itc-lit) 0 25%, var(--itc-void) 0 50%) 0 0 / 0.5em 0.5em;
  -webkit-mask-image: linear-gradient(90deg, #000 30%, transparent);
  mask-image: linear-gradient(90deg, #000 30%, transparent);
  opacity: 0.8;
}
.itc-playing-hud-checker::after {
  content: '';
  inset: 0;
  border-radius: inherit;
  background:
    repeating-linear-gradient(45deg, color-mix(in srgb, var(--itc-lit) 6%, transparent) 0 2px, transparent 2px 5px),
    repeating-linear-gradient(-45deg, color-mix(in srgb, var(--itc-lit) 4%, transparent) 0 2px, transparent 2px 5px);
}
/* The estate: walnut grain under the counts, a chrome lip along its top, and fuzzy dice hung from its middle. */
.itc-playing-hud-walnut {
  border-radius: 0.6em;
  box-shadow: 0 0 0.9em color-mix(in srgb, var(--itc-ink) 14%, transparent), inset 0 0.14em 0 color-mix(in srgb, var(--itc-lit) 55%, transparent);
}
.itc-playing-hud-walnut::after {
  content: '';
  inset: 0;
  border-radius: inherit;
  background: repeating-linear-gradient(
    96deg,
    color-mix(in srgb, var(--itc-ally) 30%, transparent) 0 0.4em,
    color-mix(in srgb, var(--itc-ally) 12%, transparent) 0.4em 0.85em
  );
}
/*
  The dice — 0461: a pair on two strings from the middle of the plate's lower edge, each as big as a
  count and showing its pips. The outer element drifts; the inner swings against a lurch, back from a
  push and forward from a stop, and settles. Two classes a way, swapped, so a second lurch swings again.

  ⚠️ **ONE SWING AT A TIME, AND THE FRAME HOLDS IT — 0466.** The swap restarts the animation from its
  first keyframe, so a lurch inside a swing snapped the dice from thirty degrees to straight; the frame
  refuses every lurch until the swing's own length has run, and that length is the dice row's
  swing length in the ships table, written here once for the four swings so the two cannot drift
  apart.

  And they are plush — 0466, *"the dice on the hud need to look a bit cooler"*: a cube seen from a
  corner, a top face lit and a side face shaded so it reads as a solid rather than a tile, the classic
  red fur (the enemy's ink warmed with the shot's orange, mixed by the shell — no palette role is this
  red), a soft bloom of
  its own colour round the whole cube, which is what fuzzy looks like at twenty pixels, and pips in the
  light ink with a shadow under each.
*/
.itc-playing-hud-dice { display: none; position: absolute; left: 50%; top: 100%; width: 0; height: 0; pointer-events: none; }
/*
  0523: the mount shows whenever anything hangs, on any plate — it was the walnut plate's alone — and
  of its bodies only the one the readout says hangs.
*/
.itc-playing-hud-hanging .itc-playing-hud-dice { display: block; animation: itc-hud-dice 3.6s ease-in-out infinite alternate; }
.itc-playing-hud-dice-swing { position: absolute; left: 0; top: 0; }
.itc-playing-hud-hang { display: none; position: absolute; left: 0; top: 0; }
${DANGLE_KINDS.map((kind) => `.itc-playing-hud-hangs-${kind} .itc-playing-hud-hang-${kind}`).join(', ')} { display: block; }
/*
  ── WHAT ELSE HANGS — 0523 ──────────────────────────────────────────────────────────────────────

  One strand each, a little longer than the dice's, and a thing on it the size of a count: the
  eucalyptus tree a car-air-freshener pine, the family three of the alien's own in a gilt frame, the
  golf ball dimpled. Each with the dice's hairline and void halo, so it is found on any sky.
*/
.itc-playing-hud-hang-strand { height: 1.25em; transform: rotate(5deg); }
.itc-playing-hud-tree, .itc-playing-hud-frame, .itc-playing-hud-ball {
  position: absolute;
  top: 100%;
  left: 50%;
  transform: rotate(-5deg);
  filter:
    drop-shadow(0 0 0.05em color-mix(in srgb, var(--itc-lit) 90%, transparent))
    drop-shadow(0 0 0.08em var(--itc-void))
    drop-shadow(0 0.15em 0.25em color-mix(in srgb, var(--itc-void) 60%, transparent));
}
.itc-playing-hud-tree {
  width: 1.15em;
  height: 1.6em;
  margin-left: -0.575em;
  background: linear-gradient(170deg, color-mix(in srgb, var(--itc-leaf) 70%, var(--itc-lit)), var(--itc-leaf) 60%, color-mix(in srgb, var(--itc-leaf) 70%, var(--itc-void)));
  clip-path: polygon(50% 0, 72% 24%, 61% 24%, 84% 49%, 70% 49%, 96% 78%, 57% 78%, 57% 92%, 43% 92%, 43% 78%, 4% 78%, 30% 49%, 16% 49%, 39% 24%, 28% 24%);
}
/*
  The family: three of the alien's own, the tall one in the middle, each a round head with two dark
  eyes on a pair of shoulders, in the acid's green on a dusk of the ally's lavender, so they are three
  and not one green smudge at the size of a count.
*/
.itc-playing-hud-frame {
  width: 1.85em;
  height: 1.4em;
  margin-left: -0.925em;
  box-sizing: border-box;
  border: 0.15em solid var(--itc-gilt);
  border-radius: 0.12em;
  background:
    radial-gradient(circle at 15% 46%, var(--itc-void) 0 0.035em, transparent 0.05em),
    radial-gradient(circle at 29% 46%, var(--itc-void) 0 0.035em, transparent 0.05em),
    radial-gradient(circle at 43% 30%, var(--itc-void) 0 0.04em, transparent 0.055em),
    radial-gradient(circle at 57% 30%, var(--itc-void) 0 0.04em, transparent 0.055em),
    radial-gradient(circle at 72% 50%, var(--itc-void) 0 0.03em, transparent 0.045em),
    radial-gradient(circle at 84% 50%, var(--itc-void) 0 0.03em, transparent 0.045em),
    radial-gradient(circle at 22% 46%, var(--itc-alien) 0 0.19em, transparent 0.205em),
    radial-gradient(circle at 50% 32%, var(--itc-alien) 0 0.23em, transparent 0.245em),
    radial-gradient(circle at 78% 50%, var(--itc-alien) 0 0.16em, transparent 0.175em),
    radial-gradient(ellipse 0.3em 0.22em at 22% 100%, var(--itc-alien) 0 92%, transparent 100%),
    radial-gradient(ellipse 0.36em 0.36em at 50% 100%, var(--itc-alien) 0 92%, transparent 100%),
    radial-gradient(ellipse 0.26em 0.2em at 78% 100%, var(--itc-alien) 0 92%, transparent 100%),
    linear-gradient(color-mix(in srgb, var(--itc-ally) 55%, var(--itc-void)), color-mix(in srgb, var(--itc-ally) 30%, var(--itc-void)));
}
.itc-playing-hud-ball {
  width: 1.05em;
  height: 1.05em;
  margin-left: -0.525em;
  border-radius: 50%;
  background:
    radial-gradient(circle, color-mix(in srgb, var(--itc-ball-shade) 70%, var(--itc-void)) 0 0.03em, transparent 0.045em) 0 0 / 0.21em 0.21em,
    radial-gradient(circle at 34% 30%, var(--itc-lit) 0, var(--itc-lit) 30%, var(--itc-ball-shade) 100%);
}
.itc-playing-hud-dice-strand {
  position: absolute;
  left: -0.04em;
  top: 0;
  width: 0.1em;
  min-width: 1.5px;
  background: color-mix(in srgb, var(--itc-lit) 80%, transparent);
  transform-origin: 50% 0;
}
.itc-playing-hud-dice-strand-a { height: 1em; transform: rotate(26deg); }
.itc-playing-hud-dice-strand-b { height: 1.55em; transform: rotate(-16deg); }
.itc-playing-hud-die {
  position: absolute;
  top: 100%;
  left: 50%;
  width: 1.1em;
  height: 1.1em;
  margin-left: -0.55em;
  border-radius: 0.18em;
  /* --itc-fur is set by the shell from the palette, on the dice: the plate carries no red of its own. */
  --itc-fur-lit: color-mix(in srgb, var(--itc-fur) 76%, var(--itc-lit));
  --itc-fur-dark: color-mix(in srgb, var(--itc-fur) 60%, var(--itc-void));
  --itc-pip: var(--itc-lit);
  --itc-pip-shade: color-mix(in srgb, var(--itc-fur) 45%, var(--itc-void));
  /*
    A hairline of the light ink round every face, and a halo of the void under the bloom: asked for,
    *"the red dice need to be visible on ember nebula and the dark heart against those reddish
    backdrops"* — red on a rose sky is found by its edge, as the counts are by their void halo.
  */
  --itc-rim: 0 0 0 0.05em color-mix(in srgb, var(--itc-lit) 90%, transparent);
  box-shadow: var(--itc-rim);
  filter:
    drop-shadow(0 0 0.12em color-mix(in srgb, var(--itc-fur) 85%, transparent))
    drop-shadow(0 0 0.08em var(--itc-void))
    drop-shadow(0 0.15em 0.25em color-mix(in srgb, var(--itc-void) 60%, transparent));
}
.itc-playing-hud-die::before, .itc-playing-hud-die::after { content: ''; position: absolute; box-shadow: var(--itc-rim); }
.itc-playing-hud-die::before {
  left: 0;
  top: -0.26em;
  width: 100%;
  height: 0.26em;
  border-radius: 0.08em 0.08em 0 0;
  background: var(--itc-fur-lit);
  transform: skewX(-45deg);
  transform-origin: 0 100%;
}
.itc-playing-hud-die::after {
  top: 0;
  right: -0.26em;
  width: 0.26em;
  height: 100%;
  border-radius: 0 0.08em 0.08em 0;
  background: var(--itc-fur-dark);
  transform: skewY(-45deg);
  transform-origin: 0 0;
}
.itc-playing-hud-dice-strand-a .itc-playing-hud-die { transform: rotate(-24deg); }
.itc-playing-hud-dice-strand-b .itc-playing-hud-die { transform: rotate(18deg); }
.itc-playing-hud-die-five {
  background:
    radial-gradient(circle at 27% 27%, var(--itc-pip) 0 0.09em, transparent 0.11em),
    radial-gradient(circle at 73% 27%, var(--itc-pip) 0 0.09em, transparent 0.11em),
    radial-gradient(circle at 50% 50%, var(--itc-pip) 0 0.09em, transparent 0.11em),
    radial-gradient(circle at 27% 73%, var(--itc-pip) 0 0.09em, transparent 0.11em),
    radial-gradient(circle at 73% 73%, var(--itc-pip) 0 0.09em, transparent 0.11em),
    radial-gradient(circle at calc(27% + 0.04em) calc(27% + 0.04em), var(--itc-pip-shade) 0 0.1em, transparent 0.12em),
    radial-gradient(circle at calc(73% + 0.04em) calc(27% + 0.04em), var(--itc-pip-shade) 0 0.1em, transparent 0.12em),
    radial-gradient(circle at calc(50% + 0.04em) calc(50% + 0.04em), var(--itc-pip-shade) 0 0.1em, transparent 0.12em),
    radial-gradient(circle at calc(27% + 0.04em) calc(73% + 0.04em), var(--itc-pip-shade) 0 0.1em, transparent 0.12em),
    radial-gradient(circle at calc(73% + 0.04em) calc(73% + 0.04em), var(--itc-pip-shade) 0 0.1em, transparent 0.12em),
    radial-gradient(circle at 35% 30%, var(--itc-fur-lit) 0, var(--itc-fur) 55%, var(--itc-fur-dark) 100%);
}
.itc-playing-hud-die-three {
  background:
    radial-gradient(circle at 27% 27%, var(--itc-pip) 0 0.09em, transparent 0.11em),
    radial-gradient(circle at 50% 50%, var(--itc-pip) 0 0.09em, transparent 0.11em),
    radial-gradient(circle at 73% 73%, var(--itc-pip) 0 0.09em, transparent 0.11em),
    radial-gradient(circle at calc(27% + 0.04em) calc(27% + 0.04em), var(--itc-pip-shade) 0 0.1em, transparent 0.12em),
    radial-gradient(circle at calc(50% + 0.04em) calc(50% + 0.04em), var(--itc-pip-shade) 0 0.1em, transparent 0.12em),
    radial-gradient(circle at calc(73% + 0.04em) calc(73% + 0.04em), var(--itc-pip-shade) 0 0.1em, transparent 0.12em),
    radial-gradient(circle at 35% 30%, var(--itc-fur-lit) 0, var(--itc-fur) 55%, var(--itc-fur-dark) 100%);
}
.itc-playing-hud-dice-back-a { animation: itc-hud-dice-back-a ${DICE.swingSeconds}s ease-out; }
.itc-playing-hud-dice-back-b { animation: itc-hud-dice-back-b ${DICE.swingSeconds}s ease-out; }
.itc-playing-hud-dice-fore-a { animation: itc-hud-dice-fore-a ${DICE.swingSeconds}s ease-out; }
.itc-playing-hud-dice-fore-b { animation: itc-hud-dice-fore-b ${DICE.swingSeconds}s ease-out; }
@keyframes itc-hud-dice { from { transform: rotate(-4deg); } to { transform: rotate(4deg); } }
@keyframes itc-hud-dice-back-a { 0% { transform: none; } 14% { transform: rotate(34deg); } 34% { transform: rotate(-20deg); } 52% { transform: rotate(11deg); } 70% { transform: rotate(-5deg); } 86% { transform: rotate(2deg); } 100% { transform: none; } }
@keyframes itc-hud-dice-back-b { 0% { transform: none; } 14% { transform: rotate(34deg); } 34% { transform: rotate(-20deg); } 52% { transform: rotate(11deg); } 70% { transform: rotate(-5deg); } 86% { transform: rotate(2deg); } 100% { transform: none; } }
@keyframes itc-hud-dice-fore-a { 0% { transform: none; } 14% { transform: rotate(-34deg); } 34% { transform: rotate(20deg); } 52% { transform: rotate(-11deg); } 70% { transform: rotate(5deg); } 86% { transform: rotate(-2deg); } 100% { transform: none; } }
@keyframes itc-hud-dice-fore-b { 0% { transform: none; } 14% { transform: rotate(-34deg); } 34% { transform: rotate(20deg); } 52% { transform: rotate(-11deg); } 70% { transform: rotate(5deg); } 86% { transform: rotate(-2deg); } 100% { transform: none; } }
@media (prefers-reduced-motion: reduce) {
  .itc-playing-hud-orbit::before, .itc-playing-hud-orbit::after, .itc-playing-hud-hanging .itc-playing-hud-dice,
  .itc-playing-hud-dice-back-a, .itc-playing-hud-dice-back-b, .itc-playing-hud-dice-fore-a, .itc-playing-hud-dice-fore-b { animation: none; }
}
.itc-playing-boss { filter: none; padding: 0 0.9em; }
.itc-playing-boss-shown { display: flex; align-items: center; }
.itc-playing-boss-track {
  position: relative;
  flex: 1;
  height: 0.55em;
  border-radius: 999px;
  background: color-mix(in srgb, currentColor 16%, transparent);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, currentColor 55%, transparent);
}
.itc-playing-boss-fill {
  inset: 0;
  border-radius: 999px;
  opacity: 1;
  background: linear-gradient(180deg, color-mix(in srgb, currentColor 55%, white), currentColor 55%);
  box-shadow: 0 0 0.5em color-mix(in srgb, currentColor 60%, transparent);
  transition: transform 0.2s ease-out;
}
/* A notch is cut through the track, in the void, so it reads over the fill and over the empty part alike. */
.itc-playing-boss-notch {
  top: -0.2em;
  height: calc(100% + 0.4em);
  width: 2px;
  background: var(--itc-void, #000);
  box-shadow: 0 0 0 1px color-mix(in srgb, currentColor 70%, transparent);
  opacity: 1;
}
.itc-playing-score { flex-direction: row; align-items: center; gap: 0.6em; padding: 0 0.8em; }
.itc-playing-score-value { font-size: 1.45em; }
/* The multiplier over the bar that fills toward its next step, as one small column beside the digits. */
.itc-playing-score-streak { flex-direction: column; align-items: stretch; gap: 0.2em; font-size: 0.7em; }
.itc-playing-score-bar { width: auto; height: 0.28em; }
.itc-playing-score-times { text-align: center; }
/*
  ── THE PAUSE, AND THE COUNT-IN — 0511 ────────────────────────────────────────────────────────────

  The third column holds the pause plate and the score side by side, at the end of the row. The plate
  is the strip's height and wears the strip's rim; its hit area runs past it to a thumb's 44 px on
  every side it can, so the row's height is the strip's and not the thumb's.
*/
.itc-playing-corner {
  grid-column: 3;
  justify-self: end;
  display: flex;
  align-items: center;
  gap: 0.6em;
}
.itc-playing-pause {
  --itc-glass: color-mix(in srgb, var(--itc-void) 66%, transparent);
  position: relative;
  display: none;
  align-items: center;
  justify-content: center;
  box-sizing: border-box;
  width: var(--itc-strip);
  height: var(--itc-strip);
  margin: 0;
  padding: 0;
  font: inherit;
  color: inherit;
  border: 1.5px solid transparent;
  border-radius: 0.75em;
  background:
    linear-gradient(var(--itc-glass), var(--itc-glass)) padding-box,
    linear-gradient(100deg, var(--itc-ally, var(--itc-ink)), var(--itc-ink)) border-box;
  box-shadow: 0 0 0.9em color-mix(in srgb, var(--itc-ink) 14%, transparent);
  cursor: pointer;
  pointer-events: auto;
}
.itc-playing-pause::before {
  content: '';
  position: absolute;
  inset: min(0px, calc((var(--itc-strip) - 44px) / 2));
}
.itc-playing-pause-shown { display: flex; }
.itc-playing-pause:focus-visible { outline: 2px solid currentColor; outline-offset: 3px; }
.itc-playing-pause-bars {
  width: 0.8em;
  height: 0.95em;
  background: linear-gradient(90deg, currentColor 0 34%, transparent 34% 66%, currentColor 66% 100%);
  filter: drop-shadow(0 0 0.15em var(--itc-void, #000));
}
/* The count-in is a banner over the field about to move: a thumb set down under it lands on the glass. */
.itc-resuming { pointer-events: none; }
.itc-resuming-heading { font-size: 1.4em; letter-spacing: 0.3em; }
.itc-resuming-timer { font-size: 4em; font-weight: 800; }
.itc-resuming-heading, .itc-resuming-timer { text-shadow: 0 0 0.4em var(--itc-void, #000), 0 0 0.15em var(--itc-void, #000); }
/* The pause's buttons are one column of one width, so the list reads as a list and not a stack of words. */
.itc-paused-action, .itc-quit-action { min-width: 11em; }
/* The splash's prompt is words and not a plate (0513): the whole screen is what a press lands on. */
.itc-splash-action, .itc-splash-action:hover { border-color: transparent; background: none; box-shadow: none; }
/* An action the shell has taken off a screen for now, whatever display the action rule gives it. */
${each('-action[hidden]')} { display: none; }
@media (prefers-reduced-motion: reduce) {
  .itc-playing-boss-fill { transition: none; }
  ${each('-action')}, .itc-intro-skip { transition: none; }
}
`;

/** A screen's overlay, the controls on it, and whatever else it has to say. */
interface Panel {
  root: HTMLElement;
  /**
   * The controls, in the order `SCREENS` lists them. Empty for a screen the player does not act on.
   *
   * ⚠️ **A list even though every screen has one today.** `src/state/screens.ts` says why the row is
   * a list; this is where a focus ring becomes possible at all, and a ring over one control is
   * exactly what a pad needs on the screens that exist —
   * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md`.
   */
  controls: readonly HTMLButtonElement[];
  /** Where the countdown is written, for a screen that has one. `null` for a screen that waits. */
  timer: HTMLElement | null;
  /**
   * The option buttons, per setting the screen offers — decision 0070.
   *
   * ⚠️ **Kept apart from `controls` even though every one of them is also IN `controls`.** The
   * focus ring needs one flat list; painting which option is on needs them grouped by setting. One
   * list cannot be both without the painter re-deriving the grouping from an index, which is the
   * second description this file already refuses elsewhere.
   */
  options: Partial<Readonly<Record<ChoiceName, readonly HTMLButtonElement[]>>>;
  /** Each choice's band — 0458: the row the cursor stops on, its two steps and its hint line. */
  bands: readonly Band[];
  /** The tab strip's buttons, in the row's `tabs` order — 0458. Empty on a screen with no tabs. */
  tabs: readonly HTMLButtonElement[];
  /**
   * The rows the cursor walks — 0458: the tabs, then each band, then the actions, in the order the
   * screen draws them. A row of one band is one stop; a row of buttons is walked along by where they
   * stand, which is how the music room's grid stays a grid. The list is fixed; its last row is
   * rewritten when an action is taken off the screen (`setActionShown`, 0511).
   */
  rows: (readonly HTMLElement[])[];
  /** The music room's readout — 0212. `null` on every other screen, which is all of them. */
  now: NowPlayingParts | null;
  /** The crossing's words — 0340. `null` on every other screen, on `now`'s exact terms. */
  crossing: CrossingParts | null;
  /** A level's or a run's account — 0428. `null` on every screen that has none. */
  sheet: HTMLElement | null;
  /** The high scores, and the body that drops their column while there are none — 0429, 0458. `null` off the title. */
  board: { root: HTMLElement; body: HTMLElement } | null;
}

/** One choice, drawn as a band — 0458. */
interface Band {
  name: ChoiceName;
  /**
   * Which options may be landed on — 0521. Every one, until `setOpen` shuts some: a hangar slot the
   * ship has not been won in for.
   */
  open: readonly boolean[];
  /** Why the shut ones are shut, said on the hint line in place of the option's hint, or `null`. */
  why: string | null;
  /** The row itself: what the cursor rings and what holds the keyboard's focus. */
  root: HTMLElement;
  less: HTMLButtonElement;
  more: HTMLButtonElement;
  /** The live option's hint, written under the track. */
  hint: HTMLElement;
  /**
   * The options' hints, by position — the row's, so the band says what the live one means; or since 0528
   * the shell's, for a band whose options are named by the ship on the stand (`setLabels`).
   */
  hints: readonly string[];
  /** Which option is on — written by `setChoice`, read by a step. */
  index: number;
  /** Which devices it is offered on — 0512, the row's `on`. */
  on: 'all' | 'touch';
  /** What a press on it does — 0513, the row's `press`. */
  press: 'steps' | 'takes';
  /**
   * What its segments show — the row's `faces`; a band of faces has the pilot card under it (0513), and
   * a chip is one button among the actions (0517).
   */
  faces: 'words' | 'portraits' | 'chip';
}

/**
 * The rows the cursor walks, from what a screen has and what of it is shown — 0458's order: the tabs,
 * each band, the actions. Since 0511 and 0512 a control or a band can be off the screen for now, and
 * one that is gone is not a stop.
 */
function walkOf(tabs: readonly HTMLElement[], bands: readonly Band[], controls: readonly HTMLElement[]): HTMLElement[][] {
  const rows: HTMLElement[][] = [];
  if (tabs.length > 0) rows.push([...tabs]);
  for (const band of bands) if (!band.root.hidden && band.faces !== 'chip') rows.push([band.root]);
  /*
    0517: a chip is drawn among the actions, after them, so it is walked there too.

    ⚠️ **AND THE TITLE'S FLY, ALONE OVER THE QUIET ROW, IS STILL ONE ROW OF BUTTONS HERE — 0538.** Inside
    a row of buttons the boxes decide (0214), so down from *Fly* is the button under its middle and up
    from the quiet row is *Fly*. A walk that split the row was written first, and its probe stayed green:
    the boxes had already said everything it said.
  */
  const shown = controls.filter((c) => !c.hidden);
  for (const band of bands) if (!band.root.hidden && band.faces === 'chip') shown.push(band.root);
  if (shown.length > 0) rows.push(shown);
  return rows;
}

/**
 * One line of an account — 0428: a label and what it says. A number counts up to itself; a string
 * (a rank) is stamped. `tone` is how loud the line is: a total is ruled off and gold, a rank is big.
 */
export interface SheetLine {
  label: string;
  value: number | string;
  tone: 'plain' | 'total' | 'rank';
}

/** One row of the high-score table as the title draws it — 0429. Words already, pushed in. */
export interface BoardLine {
  place: string;
  score: string;
  pilot: string;
  reached: string;
}

/**
 * The elements the crossing's words are written into, held so `setCrossing` never queries the DOM.
 *
 * ⚠️ **Looked up once at boot, exactly as `NowPlayingParts` is** — and for one reason less: this is
 * written a handful of times per crossing rather than six times a second. It is held anyway, because a
 * `querySelector` here and a held reference there would be two answers to one question in one file.
 */
interface CrossingParts {
  root: HTMLElement;
  /** Which leg of how many — 0341. The one line on the plate that is about the RUN, above the place. */
  kicker: HTMLElement;
  /** The destination's pulse, the ship's marker, and the animation that flies it down the leg — 0341. */
  pulse: SVGElement;
  marker: SVGElement;
  motion: SVGAnimationElement;
  place: HTMLElement;
  voyage: HTMLElement;
  /** Shown only while the place is still being synthesised — `src/content/travel.ts` has when. */
  waiting: HTMLElement;
  /**
   * The chart, as a canvas of the chrome's own — and how many legs it was last drawn with, so it is
   * redrawn when the run has moved and not otherwise. `−1` is *never*, because nought is a real answer.
   */
  chart: HTMLCanvasElement;
  drawnFlown: number;
}

/**
 * Where the run is crossing to, and whether the crossing is waiting for it —
 * `docs/decisions/0340-the-coil-is-a-route.md`.
 *
 * ⚠️ **PUSHED, LIKE EVERY OTHER READOUT ON THIS INTERFACE.** The chrome holds no opinion about which
 * place is next or how a bake is going; `src/app/mount.ts` owns both and hands over what to say, on
 * the terms `setHud`, `setChoice` and `setNowPlaying` already state.
 */
export interface Crossing {
  /** The place being crossed to, in `src/content/themes.ts`'s own words. */
  place: string;
  /**
   * How many legs of the route are behind the run — the index of the place it is burning towards.
   *
   * ⚠️ **A NUMBER AND NOT A PICTURE, SO THE SHELL STILL HANDS OVER WHAT TO SAY AND NOT HOW.** The
   * chrome draws the chart itself, through `src/render/bake.ts`'s `drawChart`, into a canvas of its
   * own — exactly as the title screen's pickup key is the real art at a fixed size rather than the
   * live atlas (`ICON_PIXELS_PER_UNIT`'s note has why the atlas's own bitmaps cannot be put in the DOM).
   */
  flown: number;
  /**
   * Which palette the places' colours are read in.
   *
   * ⚠️ **THE NAME, BECAUSE A PLACE'S COLOUR IS PER PALETTE NAME AND THE CHROME IS HANDED A RESOLVED
   * ONE.** `THEMES[kind].glow` is a `Record<PaletteName, string>` — that is what keeps 0024 whole, a
   * high-contrast player gets each place's high-contrast colours — and `makeChrome` takes the inks,
   * not which set they are. The shell knows, so the shell says.
   */
  palette: PaletteName;
  /**
   * Whether the ship has started coming out of the burn, so the banner should be on its way out too.
   *
   * ⚠️ **A FACT ABOUT THE BURN, AND THE FADE IS THE STYLESHEET'S.** The shell says *it is trailing
   * off* on the step that becomes true; how long a banner takes to go, and that it goes by opacity, is
   * CSS and is nothing the shell has an opinion about. It is gone before the level is entered, so the
   * level arrives under a clear screen rather than under a caption that is then cut.
   */
  leaving: boolean;
  /**
   * How many legs the whole route has — so the plate can say *leg 4 of 6* — 0341.
   *
   * ⚠️ **PUSHED BESIDE `flown` RATHER THAN COUNTED HERE**, on this interface's own terms: the chrome
   * holds no opinion about how long a run is. `LEVEL_KINDS` is the shell's to read.
   */
  legs: number;
  /**
   * The destination's own accent, resolved — the colour the plate is framed and lit in. 0341.
   *
   * ⚠️ **A PLACE'S COLOUR AND NOT THE CHROME'S INK, WHICH IS WHAT MAKES SIX CROSSINGS SIX PLATES.**
   * Every other panel is drawn in `--itc-ink`, the player's cyan, because every other panel is about
   * the player. This one is about somewhere, and 0282's test — *can the thing differ per instance* —
   * is answered by the row: it is `THEMES[kind].glow`, per palette, so a high-contrast player gets the
   * high-contrast colour (0024). The stylesheet never uses it for anything a reader must tell apart
   * by hue alone — it frames and it glows; the words are words.
   */
  accent: string;
  /**
   * How long the ship's marker takes to fly its leg on the chart, in seconds — the burn's own length
   * when nothing is waited for. If the burn is held past it, the marker has arrived and waits on its
   * stop, which is also what the ship is doing.
   */
  seconds: number;
  /** The one line that place says about itself, off the same row. */
  voyage: string;
  /**
   * Whether the crossing is being held open by the music rather than by its own floor.
   *
   * ⚠️ **A BOOLEAN AND NOT A FRACTION, and that is `docs/game.md`'s voice rule rather than a saving.**
   * A progress bar over a bake would be a number the player can do nothing with, changing at a rate
   * nothing on the screen explains; what they need to know is *this is taking a moment*, which is one
   * fact. `src/content/travel.ts`'s `travelIsWaiting` is what decides it, and says why it is almost
   * always false.
   */
  waiting: boolean;
}

/**
 * The elements the room's readout writes into, held so `setNowPlaying` never queries the DOM.
 *
 * ⚠️ **Looked up once at boot, exactly as `controls` and `timer` are.** This is written about six
 * times a second while a walk is running, and a `querySelector` per write would be a lookup per
 * write of a tree that has not changed since it was built.
 */
interface NowPlayingParts {
  root: HTMLElement;
  place: HTMLElement;
  section: HTMLElement;
  bar: HTMLElement;
  fill: HTMLElement;
  legend: HTMLElement;
  at: HTMLElement;
  next: HTMLElement;
  of: HTMLElement;
  /** The place whose ticks are currently drawn, so a row that has not changed is not rebuilt. */
  drawnFor: string;
}

/**
 * What the music room is playing right now — `docs/decisions/0212-the-room-walks-the-level.md`.
 *
 * ⚠️ **PUSHED, LIKE EVERY OTHER READOUT ON THIS INTERFACE.** The chrome holds no opinion about where
 * a walk has got to; `src/app/mount.ts` owns the position and hands over what to draw, on the same
 * terms `setHud` and `setChoice` already state.
 */
export interface NowPlaying {
  /** The place, in `src/content/themes.ts`'s own words. */
  place: string;
  /** The rung it has reached, in `MUSIC_LEVEL_LABEL`'s. */
  section: string;
  /** How far through the walk, 0 to 1 — where the fill ends and the position reads. */
  through: number;
  /** Seconds into the walk, and how long the whole of it is. */
  at: number;
  of: number;
  /**
   * Where each section opens, as a fraction — or `null` to keep the ticks that are already drawn.
   *
   * ⚠️ **`null` IS THE COMMON CASE AND IS NOT AN OMISSION.** The ticks are a property of the level,
   * so they change when the place does and at no other time; rebuilding six of them six times a
   * second would be the only per-frame DOM work on this interface.
   */
  marks: readonly { at: number; label: string }[] | null;
  /** The place *Play all* moves to next, or `null` when one place is looping on its own. */
  next: string | null;
  /**
   * Which control is the place being played, as an index into the screen's own controls.
   *
   * ── THE MENU SAID NOTHING, AND THAT READ AS THE MUSIC SAYING NOTHING ────────────────────────────
   *
   * ⚠️ **`docs/decisions/0216-the-menu-says-what-is-playing.md`.** Reported: *"it now just repeats the
   * same track and the focused level never changes with regards to the menu to indicate which track is
   * playing… I know the play bar works properly, but it looks buggy if the menu doesn't change the
   * focus along with the level track."* **Play all was advancing correctly the whole time** — the
   * readout, the backdrop and the mix all followed it — and the nine buttons underneath, which are
   * the biggest thing on the screen, never moved. A screen where the largest element contradicts the
   * smallest is a screen that reads as broken.
   */
  control: number | null;
  /**
   * Whether the focus ring should move to that control as well as the mark.
   *
   * ⚠️ **THE MARK IS ALWAYS RIGHT AND THE FOCUS IS A COURTESY**, which is why they are two fields. A
   * cursor that jumped while somebody was navigating would take the menu away from them mid-press —
   * and `activate` presses whatever the ring is on, so a jump between a press being decided and
   * landing would start a place they did not choose. `src/app/mount.ts` stops asking the moment the
   * player moves the focus themselves.
   */
  follow: boolean;
}

/**
 * The resolution the chrome's own icons are baked at, in pixels per world unit.
 *
 * ⚠️ **Its own bake, deliberately not the atlas the game is drawing with.** That one is re-baked on
 * every rotation and DPI change (`src/app/mount.ts`), and its bitmaps are the live objects the
 * painter blits — appending one to the DOM would take it out of the atlas. This is a second bake at
 * a fixed size, and it costs one pass over the sprite list at boot.
 *
 * ⚠️ **The icons are still the REAL art**, which is the whole point: a key drawn with hand-written
 * SVG would be a second description of every silhouette, and the day an art pass changed one the key
 * would quietly go on showing the old shape. `src/content/sprites.ts` records what a second
 * description of the sprite table already cost this project once.
 *
 * ⚠️ **28 and not 12, and the difference was looked at rather than reasoned about.** The icons render
 * at roughly 20 CSS pixels, so 12 per unit produced a source barely larger than its destination and
 * the life icon showed visible pixel steps at the top of the screen. Baking well above the drawn size
 * costs a few kilobytes once and is what the whole bake-and-blit pipeline is for — art that is a
 * function of resolution rather than a fixed asset (0022).
 */
const ICON_PIXELS_PER_UNIT = 28;

/**
 * The studio's badge, as the shell already ships it — 0437. A sidecar of 0008's closed list and the
 * service worker's precache, so naming it here adds no file to the build and nothing that fails
 * offline. Relative, as the manifest's own icons are, so a branch preview's path finds it too.
 */
const BADGE_SRC = 'icon-192.png';

/**
 * The pilot band's portraits — 0458: drawn at 3.6rem at most, so 128 covers a pixel ratio of two. The
 * boot cards' 320-pixel portraits went with the cards (0513).
 */
const FACE_PIXELS = 128;
/**
 * How many of the table's runs the title shows — 0458: *"could just be the top 5."* The device keeps
 * `TABLE_SIZE`; this is what is worth reading standing still beside the rows.
 */
export const BOARD_SHOWN = 5;

export interface Chrome {
  /** Everything to put on the page, in order. The stylesheet first. */
  elements: readonly HTMLElement[];
  /**
   * Which ship the lives counter shows — 0430 — and the theme the readout wears for it (0451). A life
   * is a ship, so the counter is the one the pilot flies; called when the shell knows it, and a no-op
   * when it has not changed.
   */
  setShip(ship: ShipRow, plate: ShipRow, fit: Fit): void;
  /**
   * Whether the trigger discs are up — 0437. On a touch screen each disc says its stack's count, so the
   * readout's two stack groups are taken off the glass and kept for a reader, who cannot see a disc.
   */
  setTouch(touch: boolean): void;
  /** Which side the trigger discs are drawn on — 0512, the side `src/app/touch.ts` hit-tests. */
  setHand(hand: HandKind): void;
  /**
   * The ship lurched along the lane — `1` a hard push, `-1` a hard stop — so the fuzzy dice on the
   * estate's dash swing against it (0461). Fired by the frame on the step it starts, never per frame.
   */
  swayDice(way: number): void;
  /**
   * What hangs from the readout's dash, or nothing — 0523. The hangar's fitting in a run and over the
   * hangar; the ware in the window over the shop.
   */
  setDangle(dangle: DangleKind | null): void;
  /**
   * Redraw the in-game readout. Called on a change, never per frame.
   *
   * ⚠️ **`charges` is what the player can SPEND**, and it is the third thing on the row because it
   * is the third resource a run has: lives survive everything, the shell survives until it is hit,
   * and a bomb survives until it is thrown. A triggered weapon whose count is invisible is a weapon
   * the player will not use — which is 0045's whole argument, reaching the arsenal.
   *
   * ⚠️ **And what each trigger throws next, since 0373 and per trigger since 0376**: a stack holds
   * different specials, and the one its trigger throws next is the one the player is deciding whether
   * to spend. Its face is the icon; one group per stack, in trigger order.
   */
  setHud(lives: number, health: number, maxHealth: number, stacks: readonly { label: string; sprite: number; charges: number }[]): void;
  /**
   * Show exactly one screen's chrome and hide the rest. `null` shows none of it, which is what the
   * rotate gate needs — an overlay left visible under the gate is a focusable button on a page whose
   * whole message is that the game is not running.
   */
  show(screen: Screen | null): void;
  /**
   * Move the focus by one control in `axis` — 0214, and by rows since 0458: up and down between the
   * screen's rows, round its ends; left and right along a band (clamped at its ends) or a row of
   * buttons (by where they stand).
   *
   * ⚠️ **The axis says which way the player pushed; the CHROME says what that means**, because the
   * chrome is what laid the controls out. `src/app/menu.ts` deliberately stops at the direction.
   */
  move(delta: number, axis?: 'x' | 'y'): void;
  /** Press the focused control, exactly as a click would — or step the focused band on (0458). */
  activate(): void;
  /** Open the tab `delta` along from the shown one, round the ends — 0458: LB and RB on a pad. */
  tab(delta: number): void;
  /** Light the device in hand on How to play's controls — 0458. */
  setDevice(device: GuideDevice): void;
  /**
   * Draw the trigger buttons: one per trigger that has a weapon behind it, in trigger order, stacked
   * up the leading edge from the low corner.
   *
   * ⚠️ **A PICTURE OF WHERE `src/app/touch.ts` IS LISTENING**, and nothing more — the buttons take no
   * pointer events, so the canvas underneath still hears every tap. Two answers to *where is the
   * bomb* would be worse than one wrong one, and a real `<button>` here would take the tap away from
   * the file that also owns not-stealing-the-drag.
   *
   * An empty list hides them, which is what a device with no touch gets —
   * `docs/decisions/0060-a-trigger-is-a-place-on-the-glass.md`,
   * `docs/decisions/0358-a-trigger-is-a-button.md`.
   */
  setTriggers(triggers: readonly { label: string; sprite: number; charges: number }[]): void;
  /**
   * Say what the end boss has left, as a fraction of what it arrived with, or a negative number for
   * no boss on the field — `docs/decisions/0360-the-boss-has-a-health-bar.md`.
   *
   * Called on a change of the displayed fraction, never per frame: `src/app/frame.ts` quantises the
   * fraction and fires only when the quantum moves, on `onHealth`'s terms. `row` is the boss whose
   * bar it is, so the phase thresholds can be marked on it — rebuilt when the row changes, not per
   * call. `null` is a bar with no phases to mark, which is a wreck's — 0475.
   */
  setBoss(fraction: number, row: BossRow | null): void;
  /**
   * Redraw the score — 0428: the run's points so far and the streak they are being scored on. Called
   * on a change, never per frame, on `setHud`'s terms; the count-up between two values is the
   * stylesheet's, so a call writes one property and a label.
   */
  setScore(points: number, streak: number): void;
  /**
   * Put an account on a screen that shows one — 0428: the break, the victory, the run over. `null`
   * empties it. Rebuilt on each call, which is once per showing: every line animates in again.
   */
  setSheet(screen: Screen, lines: readonly SheetLine[] | null): void;
  /**
   * Put the high scores on the title — 0429, best first, with the row at `fresh` lit (a score just
   * set) or `-1` for none. The first `BOARD_SHOWN` stand still beside the rows (0458); an empty
   * table drops the column and the rows stand alone.
   */
  setBoard(lines: readonly BoardLine[], fresh: number): void;
  /**
   * Say how long the shown screen has left, in whole seconds, or `null` for a screen that waits.
   *
   * Called on a change of the displayed number — once a second at most — so it may be ordinary DOM
   * code, on the same terms as `setHud`.
   */
  setTimer(seconds: number | null): void;
  /**
   * Say which option of a setting is currently on, so the row can show it — decision 0070.
   *
   * ⚠️ **Pushed in rather than read out.** The chrome holds no state about a setting; it is told,
   * on the same terms as `setHud`. A chrome that remembered which style was on would be a second
   * copy of `src/state/slices/settings.ts`, and the two would disagree the first time anything
   * dispatched without going through here.
   */
  setChoice(name: ChoiceName, index: number): void;
  /**
   * Which of a band's options may be landed on, and why the rest may not — 0521, a hangar slot the ship
   * has not been won in for. The shut ones are drawn and cannot be pressed, and a step passes over them.
   */
  setOpen(name: ChoiceName, open: readonly boolean[], why: string | null): void;
  /**
   * What a band's options are called and what each means — 0528, for a slot whose options are the ship's
   * own: the art band's three places are the looks of whichever ship is on the stand. Position for
   * position, as many as the row has.
   */
  setLabels(name: ChoiceName, options: readonly { label: string; hint: string }[]): void;
  /**
   * Switch the chrome's typeface role — the UI half of a style, decision 0070.
   *
   * A class on every overlay rather than on the document, because the build puts this stylesheet in
   * a page it does not own (0003) and a rule on `body` would reach past the game.
   */
  setFace(face: 'pixel' | 'clean'): void;
  /**
   * Say what the music room is playing and how far through it is — 0212. `null` hides the readout.
   *
   * Called on a change of what it displays rather than per frame, on `setTimer`'s own terms: the
   * caller decides the resolution, and today that is a thousandth of a walk.
   */
  setNowPlaying(now: NowPlaying | null): void;
  /**
   * Say where the run is crossing to — 0340. `null` empties the words and hides the wait.
   *
   * Called on a change of what it displays rather than per step, on `setNowPlaying`'s own terms: the
   * caller decides the resolution, and there are two things here that can change in a whole crossing.
   */
  setCrossing(crossing: Crossing | null): void;
  /**
   * Say whether the screen up now may be skipped yet — 0412 for the intro, whose game behind it has to
   * finish loading first; the finale always may (0418). Shown on a row that `skips`, while this is true.
   */
  setSkipReady(ready: boolean): void;
  /**
   * Take one of a screen's actions off it, or put it back — 0511: Settings opened from a pause has no
   * music room, because the room walks a level of its own over the field a held run is standing in.
   * The cursor's row is the shown actions, so a walk cannot land on one that is gone.
   */
  setActionShown(screen: Screen, index: number, shown: boolean): void;
  /**
   * Put what a golfer is saying in the finale's bubble — 0418: the whole `line`, of which the first
   * `shown` letters are said, at canvas pixel (`x`, `y`) — the speaker's mouth — with its tail toward
   * them, hung `above` or `below` it, with the speaker's `name` over the words beside a `mark` in their
   * colour. `null` takes the bubble away. Called every step; it touches the DOM only when a letter lands
   * or the speaker has moved a pixel — since 0426 a bubble rides its ship.
   */
  setBubble(line: string | null, shown: number, x: number, y: number, hang: 'above' | 'below', name?: string, mark?: string): void;
  /**
   * Say something under one control that the row cannot know in advance — 0415: *Pilot* on the menu
   * says who is flying. Pushed in, on `setHud`'s terms, when it changes.
   */
  setActionHint(screen: Screen, index: number, hint: string): void;
  /** Drop every listener. */
  release(): void;
}

/**
 * Screens that get an overlay.
 *
 * ⚠️ **Derived from the table, never listed again here.** A screen with no heading and no action has
 * nothing to draw — that is `playing`, and it is decided by `src/state/screens.ts` rather than by a
 * second list in the shell that would have to be kept in step with it.
 *
 * ⚠️ **OR WORDS THE SHELL PUSHES AT IT — 0340.** The crossing has no heading, because the place is
 * not known until it starts, and no action on purpose; `ScreenRow.pushed` is the row saying so, and
 * has the story of the last screen that was shown correctly and was invisible.
 */
/**
 * The four inks the score's flash is drawn in, as custom properties on `el` — 0428. The player's own
 * orange and the hazard's gold for the heat, the impact white for the sweep of light, the enemy's ink
 * for a streak lost. Read off the palette at runtime, so the high-contrast palette gets its own.
 */
function paintScoreInks(el: HTMLElement, colours: Palette): void {
  el.style.setProperty('--itc-hot', colours.bullet);
  el.style.setProperty('--itc-gold', colours.hazard);
  el.style.setProperty('--itc-shine', colours.impact);
  el.style.setProperty('--itc-lost', colours.enemy);
}

function hasChrome(screen: Screen): boolean {
  const row = SCREENS[screen];
  return row.heading.length > 0 || row.actions.length > 0 || row.pushed;
}

/**
 * Which control a push in `axis` lands on, or `null` for *the layout has no answer* — 0214.
 *
 * ⚠️ **BOXES IN AND AN INDEX OUT, RATHER THAN ELEMENTS, AND THE REASON IS `null`.** The fallback
 * this returns `null` for is **unreachable on every screen the game currently has**: the title looks
 * like a column but carries a settings row, so something always lies to either side of something.
 * A branch no data can drive is guarded by nothing —
 * `docs/decisions/0005-a-guard-must-be-seen-to-fail.md` reached from the other side, and the same
 * argument `rungIn` in `src/content/themes.ts` was split out for. Taking rects lets
 * `tests/chrome.test.ts` hand it a column that does not exist yet and check the answer.
 *
 * ⚠️ **PURE, so the DOM read stays at the one call site.** `move` maps its controls to rects and this
 * decides; nothing here can accidentally re-measure a layout mid-decision.
 *
 * ── THE RULE IS: THE NEAREST ONE THAT WAY, ELSE WRAP DOWN THE SAME LINE, ELSE NOTHING ───────────
 *
 * ⚠️ **`null` IS THE ANSWER FOR A COLUMN ASKED TO GO RIGHT, AND IT IS NOT A FAILURE.** Every control
 * on the title screen shares an x, so nothing lies right of anything; the caller then takes the list
 * step it always took, which is the behaviour
 * [0046](../../docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md) shipped and the
 * thing the old *both axes move the focus* note was protecting. **A player pushing a direction that
 * the layout has no opinion about still gets a move**, which is the whole of why that note existed.
 *
 * ⚠️ **THE WRAP IS DOWN THE SAME LINE, NOT ROUND THE LIST.** Pressing down on the bottom row of a
 * grid should reach the top of that column; a list step would reach the control after it, which is
 * the next row's first — a diagonal the player did not ask for. Only when the axis is genuinely
 * empty does this give up and let the caller walk the list.
 *
 * ⚠️ **CENTRES, AND A TOLERANCE OF HALF THE SMALLER BOX.** Two controls on the same row rarely share
 * an exact y — a taller label makes one box grow — so *is this one below me* has to allow for a few
 * pixels of difference or the bottom row of a grid becomes unreachable from one of its columns.
 */
export interface ControlBox {
  left: number;
  right: number;
  top: number;
  bottom: number;
  width: number;
  height: number;
}

export function spatially(
  boxes: readonly ControlBox[],
  from: number,
  delta: number,
  axis: 'x' | 'y',
  /*
    0458: whether a push past the far end of a line comes round to its near end. Yes for a screen that
    is one row of buttons, as the room is; no for a row among others, where the push past the end is
    the player leaving the row and the caller takes them to the next one.
  */
  wraps = true,
): number | null {
  const here = boxes[from];
  if (here === undefined) return null;
  const mid = (box: ControlBox): { x: number; y: number } => ({
    x: (box.left + box.right) / 2,
    y: (box.top + box.bottom) / 2,
  });
  const at = mid(here);
  const along = (box: ControlBox): number => (axis === 'x' ? mid(box).x : mid(box).y);
  const across = (box: ControlBox): number => (axis === 'x' ? mid(box).y : mid(box).x);
  const atAlong = axis === 'x' ? at.x : at.y;
  const atAcross = axis === 'x' ? at.y : at.x;
  const slack = Math.min(here.width, here.height) / 2;

  let best: number | null = null;
  let bestScore = Number.POSITIVE_INFINITY;
  let wrap: number | null = null;
  let wrapScore = Number.NEGATIVE_INFINITY;
  for (let i = 0; i < boxes.length; i++) {
    if (i === from) continue;
    const box = boxes[i]!;
    const step = (along(box) - atAlong) * delta;
    const drift = Math.abs(across(box) - atAcross);
    if (step > slack) {
      /*
        ⚠️ **DISTANCE FIRST AND ALIGNMENT SECOND, weighted so a near miss beats a far match.** The
        alignment term is what makes *down* land in the same column rather than on whichever control
        happens to be closest in a straight line, and the factor keeps it from reaching two rows away
        to find a better-aligned one.
      */
      const score = step + drift * 2;
      if (score < bestScore) {
        bestScore = score;
        best = i;
      }
    } else if (step < -slack) {
      // The furthest the other way, best aligned — the far end of this line, for the wrap.
      const score = -step - drift * 2;
      if (score > wrapScore) {
        wrapScore = score;
        wrap = i;
      }
    }
  }
  return best ?? (wraps ? wrap : null);
}

/** The three things a player can be holding — 0458, How to play's columns. */
export type GuideDevice = 'keyboard' | 'pad' | 'touch';
const GUIDE_DEVICES: readonly GuideDevice[] = ['keyboard', 'pad', 'touch'];
const GUIDE_DEVICE_LABELS: Record<GuideDevice, string> = { keyboard: 'Keyboard', pad: 'Pad', touch: 'Touch' };
/** The standard mapping's face buttons by index, as an Xbox-style pad prints them. */
const PAD_FACE_NAMES: readonly string[] = ['A', 'B', 'X', 'Y'];

/** A key code as its cap says it: `KeyE` is E, `ShiftLeft` is Shift, `ArrowUp` is an arrow. */
function keyCap(code: string): string {
  if (code.startsWith('Key')) return code.slice(3);
  if (code.startsWith('Arrow')) return { Up: '↑', Down: '↓', Left: '←', Right: '→' }[code.slice(5)] ?? code;
  return code.replace(/(Left|Right)$/, '');
}
function keyCaps(codes: readonly string[]): string {
  return [...new Set(codes.map(keyCap))].join(' / ');
}

/**
 * How to play — 0458: the pickups, what each gives and how it is taken, and the controls on every
 * device with the one in hand lit.
 *
 * ⚠️ **THE KEY IS THE ONE THE TITLE CARRIED (0045, 0432), AND IT IS THE UPGRADES AND NOT THE ENEMIES.**
 * An enemy announces itself by shooting at you, so the game teaches it in the only way that sticks; a
 * pickup announces nothing, and a player who does not know it is good will not fly across the lane to
 * find out. What it never said was HOW a pickup is taken — that it turns through faces and the one
 * showing is the one you get — and that is the lead line, and each row's `how`.
 *
 * ⚠️ **EVERY WORD IS A CONTENT ROW'S.** The faces' names and hints are `faceOf`'s, the lines under them
 * the pickup rows' `how`, the triggers `SIDE_LABELS`, the keys `DEFAULT_BINDINGS` and the pad's buttons
 * `PAD_SPECIAL_BUTTONS`. A binding changed in the table is changed here.
 */
function buildGuide(
  prefix: string,
  iconOf: (sprite: number) => HTMLCanvasElement,
  devices: Record<GuideDevice, HTMLElement[]>,
): HTMLElement {
  const body = document.createElement('div');
  body.className = prefix + 'body';
  const lead = document.createElement('p');
  lead.className = prefix + 'lead';
  lead.textContent = 'Pickups drift in turning through what they offer. Fly into one to take the face it is showing.';
  body.appendChild(lead);

  const section = (title: string): HTMLElement => {
    const box = document.createElement('section');
    box.className = prefix + 'section';
    const heading = document.createElement('h2');
    heading.className = prefix + 'section-heading';
    heading.textContent = title;
    box.appendChild(heading);
    body.appendChild(box);
    return box;
  };

  const key = document.createElement('div');
  key.className = prefix + 'key';
  for (const pickup of PICKUP_KINDS) {
    const row = PICKUPS[pickup];
    /*
      ⚠️ **ONE ROW PER PICKUP, AND IT CYCLES AS THE PICKUP DOES — 0432.** Each row's glyph, name and
      hint turn together through its faces at the field's own `PICKUP_CYCLE_STEPS`, so the key teaches
      the thing the player will meet — a shape that changes its offer. **Every face stays in the page,
      stacked in one cell**, and the stylesheet shows one at a time, so nothing reflows as it turns; the
      row is labelled with every face for a reader, who cannot wait for a picture to change.
    */
    const icons = document.createElement('span');
    icons.className = prefix + 'key-cell';
    const names = document.createElement('span');
    names.className = prefix + 'key-cell ' + prefix + 'key-name';
    const hints = document.createElement('span');
    hints.className = prefix + 'key-cell ' + prefix + 'key-hint';
    const told: string[] = [];
    const count = row.faces.length;
    row.faces.forEach((sprite, face) => {
      const said = faceOf(pickup, face);
      told.push(said.label + ': ' + said.hint);
      const icon = iconOf(sprite);
      icon.className = prefix + 'key-icon';
      const name = document.createElement('span');
      name.textContent = said.label;
      const hint = document.createElement('span');
      hint.textContent = said.hint;
      if (count > 1) {
        for (const turn of [icon, name, hint]) {
          turn.classList.add(prefix + 'key-face');
          turn.style.animationName = prefix + 'key-face-' + String(count);
          turn.style.animationDuration = String((count * PICKUP_CYCLE_STEPS) / STEPS_PER_SECOND) + 's';
          // Face `face` is up for the `face`th share of the turn, so its clock is run that far on.
          turn.style.animationDelay = String((-((count - face) % count) * PICKUP_CYCLE_STEPS) / STEPS_PER_SECOND) + 's';
        }
      }
      icons.appendChild(icon);
      names.appendChild(name);
      hints.appendChild(hint);
    });
    for (const cell of [icons, names, hints]) cell.setAttribute('aria-hidden', 'true');
    const how = document.createElement('span');
    how.className = prefix + 'key-how';
    how.textContent = row.how;
    const about = document.createElement('span');
    about.className = prefix + 'key-about';
    about.append(hints, how);
    const line = document.createElement('span');
    line.className = prefix + 'key-row';
    line.setAttribute('role', 'img');
    line.setAttribute('aria-label', row.label + ' — ' + told.join('; or ') + '. ' + row.how);
    line.append(icons, names, about);
    key.appendChild(line);
  }
  section('PICKUPS').appendChild(key);

  /*
    The controls: one row per thing a hand does, one column per device. The touch column names the
    discs by where they stand — they stack up the leading edge from the low corner in trigger order
    (0060), so the first trigger is the lowest.
  */
  const table = document.createElement('div');
  table.className = prefix + 'controls';
  const cell = (text: string, part: string, device: GuideDevice | null): void => {
    const span = document.createElement('span');
    span.className = prefix + part;
    span.textContent = text;
    if (device !== null) devices[device].push(span);
    table.appendChild(span);
  };
  cell('', 'controls-head', null);
  for (const device of GUIDE_DEVICES) cell(GUIDE_DEVICE_LABELS[device], 'controls-head', device);
  const moves = [DEFAULT_BINDINGS.acrossMinus, DEFAULT_BINDINGS.alongMinus, DEFAULT_BINDINGS.acrossPlus, DEFAULT_BINDINGS.alongPlus];
  cell('Fly', 'controls-what', null);
  cell(moves.map((codes) => keyCap(codes[0] ?? '')).join('') + ' / arrows', 'controls-how', 'keyboard');
  cell('Left stick', 'controls-how', 'pad');
  cell('Drag anywhere', 'controls-how', 'touch');
  const specials = [DEFAULT_BINDINGS.special1, DEFAULT_BINDINGS.special2, DEFAULT_BINDINGS.special3];
  SIDES.forEach((side, slot) => {
    cell(SIDE_LABELS[side], 'controls-what', null);
    cell(keyCaps(specials[slot] ?? []), 'controls-how', 'keyboard');
    cell(PAD_FACE_NAMES[PAD_SPECIAL_BUTTONS[slot] ?? -1] ?? '', 'controls-how', 'pad');
    cell(slot === 0 ? 'Lowest disc' : slot === SIDES.length - 1 ? 'Top disc' : 'Middle disc', 'controls-how', 'touch');
  });
  section('CONTROLS').appendChild(table);
  return body;
}

/** `m:ss`. A walk is minutes long, and 170.6 is not a thing anybody reads off a bar. */
function clockOf(seconds: number): string {
  const whole = seconds < 0 ? 0 : Math.floor(seconds);
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

/**
 * How far a step of the arrow keys moves the walk, as a fraction of it.
 *
 * ⚠️ **A twentieth, which is about nine seconds of a three-minute walk** — small enough to land
 * inside a section and large enough that crossing one does not take twenty presses. A fixed number of
 * SECONDS would move a different distance per place, and a walk is a position rather than a clock.
 */
const SEEK_STEP = 0.05;

/**
 * How many pixels square the banner's chart is drawn at.
 *
 * ⚠️ **ITS OWN FIXED SIZE, ON `ICON_PIXELS_PER_UNIT`'s TERMS**: it is shown at roughly a fifth of the
 * screen's height — about 150 CSS pixels on the 720-tall screen every play-test here was given on —
 * so 320 is a little over twice that, which is what a 2× display wants and what keeps a 0.8%-of-tile
 * route line from being a single smeared pixel.
 */
const CHART_PIXELS = 320;

/**
 * How finely the ship's leg is sampled into the path its marker flies — 0341. The bake strokes a leg
 * in forty; the marker is a few pixels long at the size the chart is shown, so twenty-four straight
 * pieces across a sixth of a turn put it within a fraction of a pixel of the stroked line everywhere.
 */
const CROSSING_PATH_SAMPLES = 24;

/**
 * The crossing's banner: a nav plate — the chart with the ship on it, which leg this is, the place,
 * what it is, and, rarely, that it is not ready yet.
 *
 * `docs/decisions/0340-the-coil-is-a-route.md` put it here as a caption over a game still being
 * flown, and `docs/decisions/0341-the-crossing-reads-as-a-nav-plate.md` is why it looks like anything:
 * the burn was played and called great, and this was called *"pretty basic at the moment graphically
 * wise"* — a dark rounded box with a heading in it, which is what it was.
 *
 * ⚠️ **AN `aria-live` REGION, WHICH IS THE ONE THING THE CHART CANNOT DO FOR A SCREEN READER.** The
 * picture says where the run is going; a player who cannot see it gets the same fact only if the name
 * is announced when it changes. It is `polite` rather than `assertive` because nothing here is urgent.
 *
 * ⚠️ **AND `waiting` IS HIDDEN RATHER THAN EMPTY.** An empty element in a live region is still a
 * change to announce, so a crossing that was never held up would say the place's name and then say
 * nothing, twice.
 */
function buildCrossing(prefix: string): CrossingParts {
  const make = (part: string, tag = 'div'): HTMLElement => {
    const el = document.createElement(tag);
    el.className = prefix + part;
    return el;
  };
  const root = make('crossing');
  root.setAttribute('aria-live', 'polite');
  const chartBox = make('crossing-chartbox');
  // The name beside it says everything the picture does, so a reader is told once rather than twice.
  chartBox.setAttribute('aria-hidden', 'true');
  const chart = document.createElement('canvas');
  chart.className = prefix + 'crossing-chart';
  chart.width = CHART_PIXELS;
  chart.height = CHART_PIXELS;
  /*
    ── THE SHIP ON THE CHART, AND THE PLACE IT IS GOING, AS AN SVG OVER THE CANVAS ─────────────────

    ⚠️ **THE ROUTE IS A DRAWING AND THESE TWO ARE MOTION, WHICH IS WHY THEY ARE NOT ON THE CANVAS.**
    The canvas is painted once per crossing (`setCrossing` has the memo); a marker flying the leg on it
    would be a repaint every frame from a file that is cold on purpose. An SVG `animateMotion` is the
    browser's own clock moving one element along one path — nothing here runs per frame, and a
    `viewBox` of 0–100 scales with the chart at whatever size the stylesheet shows it.

    ⚠️ **`begin="indefinite"`, SO THE SHIP LEAVES WHEN THE BURN DOES.** A SMIL animation's default
    clock starts when the document loads, which would have the marker at the far end of its leg
    minutes before the first boss died. `setCrossing` calls `beginElement()` on the step the run has
    moved a leg.
  */
  const SVG = 'http://www.w3.org/2000/svg';
  const overlay = document.createElementNS(SVG, 'svg');
  overlay.setAttribute('class', prefix + 'crossing-overlay');
  overlay.setAttribute('viewBox', '0 0 100 100');
  const pulse = document.createElementNS(SVG, 'circle');
  pulse.setAttribute('class', prefix + 'crossing-pulse');
  pulse.setAttribute('r', '4');
  const marker = document.createElementNS(SVG, 'path');
  marker.setAttribute('class', prefix + 'crossing-marker');
  // A dart, nose along +x, which is the way `rotate="auto"` points it down the path.
  marker.setAttribute('d', 'M 4.2 0 L -3 2.6 L -1.4 0 L -3 -2.6 Z');
  const motion = document.createElementNS(SVG, 'animateMotion') as SVGAnimationElement;
  motion.setAttribute('begin', 'indefinite');
  motion.setAttribute('fill', 'freeze');
  motion.setAttribute('rotate', 'auto');
  // Eased at both ends, as the burn is: `calcMode` spline over the whole path.
  motion.setAttribute('calcMode', 'spline');
  motion.setAttribute('keyTimes', '0;1');
  motion.setAttribute('keySplines', '0.4 0 0.2 1');
  marker.appendChild(motion);
  overlay.appendChild(pulse);
  overlay.appendChild(marker);
  chartBox.appendChild(chart);
  chartBox.appendChild(overlay);

  const words = make('crossing-words');
  const kicker = make('crossing-kicker', 'p');
  const place = make('crossing-place', 'h1');
  const rule = make('crossing-rule');
  const voyage = make('crossing-voyage', 'p');
  const waiting = make('crossing-waiting', 'p');
  waiting.hidden = true;
  /*
    ⚠️ **THE WORDS THE WAIT USES ARE ABOUT THE PLACE AND NOT ABOUT THE MACHINE.** *Loading* and
    *Synthesising* are both true and both put the engine on the screen; `docs/game.md`'s voice rule is
    what it is, never why it is good, and the fiction already has a reason for a ship to hold off.
  */
  waiting.textContent = 'Holding for a way in…';
  words.appendChild(kicker);
  words.appendChild(place);
  words.appendChild(rule);
  words.appendChild(voyage);
  words.appendChild(waiting);
  root.appendChild(chartBox);
  root.appendChild(words);
  return { root, kicker, place, voyage, waiting, chart, pulse, marker, motion, drawnFlown: -1 };
}

/**
 * The music room's readout — 0212.
 *
 * ⚠️ **BUILT ONCE AT BOOT, LIKE EVERY OTHER PART OF THE CHROME**, which is why it may allocate
 * freely: `makeChrome` runs from `src/app/mount.ts` and that file is on `tests/budget.test.ts`'s
 * deliberately-cold list.
 *
 * ⚠️ **THE BAR IS A `slider` AND NOT A `<button>`, WHICH KEEPS IT OUT OF THE PAD'S RING ON PURPOSE.**
 * `docs/decisions/0046-a-pad-is-a-first-class-way-to-press-a-button.md` makes `move` and `activate`
 * a ring of controls to press; a slider in that ring would answer a stick with a seek. Every place on
 * this screen is reachable by a button, so the seek is the convenience rather than the way through.
 */
function buildNowPlaying(
  prefix: string,
  onSeek: (through: number) => void,
  listeners: (() => void)[],
): NowPlayingParts {
  const make = (part: string, tag = 'div'): HTMLElement => {
    const el = document.createElement(tag);
    el.className = prefix + part;
    return el;
  };
  const root = make('now');
  /*
    ⚠️ **HIDDEN UNTIL SOMETHING IS PLAYING**, because the room opens with nothing selected and a bar
    reading 0:00 / 0:00 under an empty place name is a readout claiming to be a readout.
  */
  root.hidden = true;

  const head = make('now-head');
  const place = make('now-place', 'span');
  const section = make('now-section', 'span');
  head.append(place, section);

  const bar = make('now-bar');
  bar.setAttribute('role', 'slider');
  bar.setAttribute('tabindex', '0');
  bar.setAttribute('aria-label', 'Position in the level');
  bar.setAttribute('aria-valuemin', '0');
  bar.setAttribute('aria-valuemax', '100');
  const fill = make('now-fill');
  bar.appendChild(fill);

  const legend = make('now-legend');

  const time = make('now-time');
  const at = make('now-at', 'span');
  const next = make('now-next', 'span');
  const of = make('now-of', 'span');
  time.append(at, next, of);

  root.append(head, bar, legend, time);

  /*
    ⚠️ **THE FRACTION IS READ OFF THE BAR'S OWN BOX RATHER THAN OFF THE PANEL'S.** The overlay is a
    scroll container (0049), so a page scrolled by a pixel makes a `clientX` measured against anything
    else wrong by a pixel — and `getBoundingClientRect` is the one reading that already accounts for
    it. It is called on a drag rather than in a frame, which is what makes a layout read affordable.
  */
  const seekTo = (clientX: number): void => {
    const box = bar.getBoundingClientRect();
    if (box.width <= 0) return;
    onSeek((clientX - box.left) / box.width);
  };
  /*
    ── THE DRAG, AND THE ORDER OF THESE TWO LINES IS A BUG THAT WAS ALREADY WRITTEN ────────────────

    ⚠️ **POINTER CAPTURE, SO A DRAG THAT LEAVES THE BAR IS STILL A DRAG.** Without it the scrub stops
    the moment the finger strays above the bar — which on a 12px-tall control is most drags — and the
    player is left holding a pointer that does nothing.

    ⚠️ **BUT THE SEEK HAPPENS FIRST, BECAUSE `setPointerCapture` CAN THROW AND WOULD TAKE THE SEEK
    WITH IT.** It raises `NotFoundError` for a `pointerId` that is not an active pointer, and the
    first draft called it on the line above the seek — so any input that produced one would make a
    press on the bar do nothing at all, and throw where nobody is looking. **No observed failure came
    from this**: it was found by reading the order while chasing a seek that turned out to be a race
    in the test. It is written down because *the enhancement ate the feature* is a shape worth
    recognising, not because it fired.

    ⚠️ **AND THE DRAG DOES NOT DEPEND ON THE CAPTURE EITHER.** `dragging` is this file's own latch;
    capture is what keeps the events arriving at the bar when it works, and its absence costs a drag
    that leaves the element rather than the whole control.
  */
  let dragging = false;
  const down = (event: PointerEvent): void => {
    dragging = true;
    seekTo(event.clientX);
    try {
      bar.setPointerCapture(event.pointerId);
    } catch {
      // No capture: the window listeners below are what carry the drag instead.
    }
    event.preventDefault();
  };
  const move = (event: PointerEvent): void => {
    if (!dragging) return;
    seekTo(event.clientX);
  };
  /*
    ⚠️ **ON THE WINDOW, BECAUSE A RELEASE OFF THE BAR IS THE COMMON CASE.** A `pointerup` the bar
    never hears leaves `dragging` true, and the next pointer to cross the control would seek without
    anybody pressing anything.
  */
  const up = (): void => {
    dragging = false;
  };
  /*
    ⚠️ **ARROWS, HOME AND END — the same keys a range input answers**, so the seek is reachable
    without a pointer. `aria-valuenow` is written by `setNowPlaying`, so what is announced is the
    position the walk actually reached rather than the one that was asked for.
  */
  const key = (event: KeyboardEvent): void => {
    const now = Number(bar.getAttribute('aria-valuenow') ?? '0') / 100;
    const to =
      event.key === 'ArrowRight' || event.key === 'ArrowUp'
        ? now + SEEK_STEP
        : event.key === 'ArrowLeft' || event.key === 'ArrowDown'
          ? now - SEEK_STEP
          : event.key === 'Home'
            ? 0
            : event.key === 'End'
              ? 1
              : null;
    if (to === null) return;
    onSeek(to);
    event.preventDefault();
  };
  bar.addEventListener('pointerdown', down);
  bar.addEventListener('pointermove', move);
  bar.addEventListener('keydown', key);
  window.addEventListener('pointerup', up);
  window.addEventListener('pointercancel', up);
  listeners.push(() => {
    bar.removeEventListener('pointerdown', down);
    bar.removeEventListener('pointermove', move);
    bar.removeEventListener('keydown', key);
    window.removeEventListener('pointerup', up);
    window.removeEventListener('pointercancel', up);
  });

  return { root, place, section, bar, fill, legend, at, next, of, drawnFor: '' };
}

/**
 * Build every screen's chrome. `onAction` is fired with the screen whose control was pressed.
 *
 * Allocates freely: this runs once at boot, from `mount.ts`, which is on
 * `tests/budget.test.ts`'s deliberately-cold list.
 */
export function makeChrome(
  colours: Palette,
  onAction: (screen: Screen, index: number) => void,
  /*
    0513: `pointer` is a click or a tap on a segment, where `false` is the cursor's step or press. A band
    of pilots tells them apart: a thumb's first landing on a card is a look, and the cursor's press is a
    decision.
  */
  onChoice: (name: ChoiceName, index: number, pointer: boolean) => void,
  // 0212: the music room's seek. A fraction of the walk, and the shell decides what that means.
  onSeek: (through: number) => void,
  // 0412: the intro's skip, pressed.
  onSkip: () => void,
  // 0458: a tab pressed — the screen it opens. The shell shows it, as it shows every screen.
  onTab: (screen: Screen) => void,
  // 0511: the pause button, pressed. The shell decides whether the screen it was pressed on may pause.
  onPause: () => void,
): Chrome {
  const style = document.createElement('style');
  style.textContent = STYLE;

  /** The chrome's own icons, at a fixed size, copied out of a bake so the atlas keeps its own. */
  const icons = bakeAtlas(colours, 'side', ICON_PIXELS_PER_UNIT);
  // 0526: how each ship's icons are fitted; absent is as it comes, as the bake made them.
  const iconFits: Partial<Record<ShipKind, Fit>> = {};
  const iconOf = (sprite: number): HTMLCanvasElement => {
    const source = icons.bitmaps[sprite];
    const canvas = document.createElement('canvas');
    const size = Math.max(8, Math.round(icons.extents[sprite]! * ICON_PIXELS_PER_UNIT));
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (ctx !== null && source !== undefined) ctx.drawImage(source, 0, 0, size, size);
    return canvas;
  };
  /*
    The readout's faces, bare — 0433. Baked on first ask and kept, because a stack changes face a few
    times a run and each change would otherwise bake again. Copied out like `iconOf`'s, so the kept
    bake is never the element in the page.
  */
  const glyphs = new Map<number, HTMLCanvasElement>();
  const glyphOf = (sprite: number): HTMLCanvasElement => {
    let source = glyphs.get(sprite);
    const kind = SPRITE_KINDS[sprite];
    if (source === undefined && kind !== undefined) {
      source = bakeGlyph(kind, colours, ICON_PIXELS_PER_UNIT);
      glyphs.set(sprite, source);
    }
    const canvas = document.createElement('canvas');
    canvas.width = source?.width ?? 8;
    canvas.height = source?.height ?? 8;
    const ctx = canvas.getContext('2d');
    if (ctx !== null && source !== undefined) ctx.drawImage(source, 0, 0);
    return canvas;
  };

  /**
   * A golfer's portrait at the pilot band's size — 0458. The boot cards' painting, at a quarter of its
   * pixels: a thumbnail drawn at the card's resolution is a quarter-megapixel nobody sees.
   */
  const portraitOf = (golfer: GolferKind, prefix: string): HTMLCanvasElement => {
    const portrait = document.createElement('canvas');
    portrait.width = FACE_PIXELS;
    portrait.height = FACE_PIXELS;
    portrait.className = prefix + 'face';
    portrait.setAttribute('aria-hidden', 'true');
    const pen = portrait.getContext('2d');
    if (pen !== null) paintPortrait(pen, GOLFERS[golfer], FACE_PIXELS);
    return portrait;
  };
  /*
    ── THE PILOT CARD — 0513 ───────────────────────────────────────────────────────────────────────

    Who the highlighted pilot is and what they fly: their ship drawn large from the sheet's own bake, so
    it is the ship the run draws, beside their name, pronouns and home, the line about them, and their
    gun with its one-line hint. Built once; `paintPilot` rewrites its words and swaps its ship.
  */
  /** The ship drawn on the card, in pixels per world unit — twice the readout's icons. */
  const CARD_SHIP_PIXELS_PER_UNIT = ICON_PIXELS_PER_UNIT * 2;
  /*
    @setup: a ship is baked the first time its pilot is highlighted, and kept for the page.

    ⚠️ **ONE CANVAS PER CARD, AND IT WAS ONE PER SHIP — 0521.** An element has one parent, so with a
    second card (the hangar's) the same canvas appended there was taken out of the title's, and the
    title's card showed no ship. Kept per screen; the bake is the second card's, once.
  */
  /*
    ⚠️ **AND ONE PER GUN, SINCE 0526**: a ship drawn with a borrowed gun is a different picture of the same
    sprite, baked under `withGun` and kept beside its own.
  */
  // 0527: and one per fit — the gun and the rim, and since 0528 the look.
  const cardShips: Partial<Record<Screen, Map<string, HTMLCanvasElement>>> = {};
  const shipOnCard = (screen: Screen, ship: ShipKind, fit: Fit): HTMLCanvasElement => {
    const kept = (cardShips[screen] ??= new Map<string, HTMLCanvasElement>());
    const key = ship + ':' + fit.gun + ':' + String(fit.rim) + ':' + fit.art + ':' + String(fit.livery);
    let canvas = kept.get(key);
    if (canvas === undefined) {
      const kind = SPRITE_KINDS[SHIPS[ship].sprite];
      canvas =
        kind === undefined
          ? document.createElement('canvas')
          : withFit(ship, fit, () => bakeGlyph(kind, colours, CARD_SHIP_PIXELS_PER_UNIT));
      kept.set(key, canvas);
    }
    return canvas;
  };
  /** How the fitted ship is fitted, for the pilot card — 0526's gun, 0527's rim; set by `setShip`. */
  let cardFit: { ship: ShipKind; fit: Fit } | null = null;
  /** The parts a card has; a line (0538) has the name, the craft and the gun, and the rest are `null`. */
  interface PilotCard {
    root: HTMLElement;
    ship: HTMLElement | null;
    name: HTMLElement;
    who: HTMLElement | null;
    bio: HTMLElement | null;
    craft: HTMLElement;
    gun: HTMLElement;
    card: 'line' | 'whole';
  }
  /** Each screen's card under its band of faces — the title's (0513) and the hangar's (0521). */
  const pilotCards: Partial<Record<Screen, PilotCard>> = {};
  const buildPilotCard = (prefix: string, card: 'line' | 'whole'): PilotCard => {
    const part = (tag: string, name: string): HTMLElement => {
      const el = document.createElement(tag);
      el.className = prefix + 'pilot-' + name;
      return el;
    };
    /*
      ⚠️ **A LINE IS ITS OWN ELEMENT, NOT THE CARD WITH PARTS HIDDEN — 0538.** A card whose bio the
      stylesheet hides is still a card in the tree, saying the bio to anything that reads it, and a
      later rule that shows it again puts the heaviest text back on the title without anyone deciding to.
    */
    if (card === 'line') {
      const root = part('div', 'line');
      root.setAttribute('aria-hidden', 'true');
      const name = part('span', 'name');
      const craft = part('span', 'craft');
      const gun = part('span', 'gun');
      root.append(name, craft, gun);
      return { root, ship: null, name, who: null, bio: null, craft, gun, card };
    }
    const root = part('div', 'card');
    root.setAttribute('aria-hidden', 'true');
    const ship = part('div', 'ship');
    const words = part('div', 'words');
    const name = part('div', 'name');
    const who = part('div', 'who');
    const bio = part('p', 'bio');
    const craft = part('div', 'craft');
    const gun = part('div', 'gun');
    words.append(name, who, bio, craft, gun);
    root.append(ship, words);
    return { root, ship, name, who, bio, craft, gun, card };
  };
  /** Each card's two turning wheels — 0527, baked the first time a car on spinners is shown there. */
  const cardWheels: Partial<Record<Screen, HTMLCanvasElement[]>> = {};
  const paintPilot = (screen: Screen, golfer: GolferKind | undefined): void => {
    const pilotCard = pilotCards[screen];
    if (pilotCard === undefined || golfer === undefined) return;
    const row = GOLFERS[golfer];
    const ship = SHIPS[row.ship];
    // 0526: how the hangar fitted that ship, when the card is the fitted ship's; as it comes otherwise.
    const fit = cardFit !== null && cardFit.ship === row.ship ? cardFit.fit : ownFit(row.ship);
    const weapon = WEAPONS[fit.gun];
    pilotCard.name.textContent = row.name;
    pilotCard.craft.textContent = ship.label;
    // 0538: a line names the gun; the card says what it does as well.
    pilotCard.gun.textContent = pilotCard.card === 'line' ? weapon.label : weapon.label + ' — ' + weapon.hint;
    if (pilotCard.who !== null) pilotCard.who.textContent = row.pronouns + ' · ' + row.home;
    if (pilotCard.bio !== null) pilotCard.bio.textContent = row.bio;
    if (pilotCard.ship === null) return;
    const shipBox = pilotCard.ship;
    shipBox.replaceChildren(shipOnCard(screen, row.ship, fit));
    // 0527: and a car on a turning rim turns it here, each wheel laid over its tyre and spun by the stylesheet.
    const rates = fit.rim === null ? null : RIMS[fit.rim].turn;
    if (ship.wheels !== null && rates !== null) {
      const prefix = prefixFor(screen);
      const radius = ship.wheels.radius;
      const wheels = (cardWheels[screen] ??= [0, 1].map(() => bakeGlyph('spinnerWheel', colours, CARD_SHIP_PIXELS_PER_UNIT)));
      ship.wheels.at.forEach((at, i) => {
        const wheel = wheels[i]!;
        wheel.className = prefix + 'pilot-wheel';
        wheel.style.left = String(50 + (at.along / SHIP_BOX) * 100) + '%';
        wheel.style.top = String(50 + (at.across / SHIP_BOX) * 100) + '%';
        // A sprite's box is its frame's radius over 0.42, the spinner's as the ship's: the tyre's box, in the ship's.
        wheel.style.width = String((radius / 0.42 / SHIP_BOX) * 100) + '%';
        wheel.style.setProperty('--itc-turn', String(rates[i === 0 ? 0 : 1]) + 's');
        shipBox.appendChild(wheel);
      });
    }
  };
  /** How to play's controls cells, by device column — 0458, so the device in hand can be lit. */
  const guideDevices: Record<GuideDevice, HTMLElement[]> = { keyboard: [], pad: [], touch: [] };

  const panels: Partial<Record<Screen, Panel>> = {};
  /** The ship that crosses the title's sky — 0437 — kept so `setShip` can put the pilot's own in it. */
  let titleFlyer: HTMLElement | null = null;
  const elements: HTMLElement[] = [style];
  const listeners: (() => void)[] = [];

  for (const screen of Object.keys(SCREENS) as Screen[]) {
    if (!hasChrome(screen)) continue;
    const row = SCREENS[screen];
    const prefix = prefixFor(screen);
    const root = document.createElement('div');
    // Trailing `-` trimmed for the block itself, so the overlay is `itc-title` and its parts are
    // `itc-title-heading`. Still one prefix, still one description of it.
    root.className = prefix.slice(0, -1);
    /*
      ⚠️ **Only a screen that DIMS paints over the scene** — decision 0063. A screen that keeps the
      world running is a banner, and a banner filling itself with the space colour would hide exactly
      the thing it is a banner over. The stylesheet cannot say this, because it is a fact about the
      screen rather than about the class.
    */
    if (row.dims) root.style.background = colours.space;
    root.style.color = colours.player;
    // The two inks a filled control needs, where the palette is. Custom properties rather than a
    // second stylesheet: the palette is chosen at runtime and a static rule cannot know it.
    root.style.setProperty('--itc-ink', colours.player);
    root.style.setProperty('--itc-void', colours.space);
    // The coil's own second ink, for the title's wordmark — 0436. The ally violet is the ship's too.
    root.style.setProperty('--itc-ally', colours.ally);

    /*
      THE PANEL — everything the screen says, in one box that the overlay centres.

      ⚠️ **A wrapper rather than laying the children out on the overlay directly**, because the
      overlay has two other jobs now: it is the scroll container and the query container
      (decision 0049), and a scroll container cannot centre its own overflowing content safely. One
      child with `margin: auto` can, and it is the same element every screen scrolls.
    */
    const panel = document.createElement('div');
    panel.className = prefix + 'panel';
    root.appendChild(panel);

    /*
      ⚠️ **NOT BUILT FOR A ROW WITHOUT ONE — 0340.** Every panelled row had a heading until the
      crossing, whose heading is the place and is pushed. An empty `<h1>` is a flex child: it takes a
      gap above the words it was supposed to be, and a screen reader announces a heading with nothing
      in it.

      ⚠️ **AND NOT DRAWN ON A SCREEN WITH TABS — 0458: THE TABS ARE ITS HEADING.** Settings said
      *Settings* twice, once as a heading and once as the tab under it that was open, and on the
      smallest phone that second line was the 24 pixels it scrolled by. The open tab is filled, and
      the strip names the place for a reader.
    */
    if (row.heading.length > 0 && row.tabs.length === 0) {
      const heading = document.createElement('h1');
      heading.className = prefix + 'heading';
      heading.textContent = row.heading;
      /*
        ⚠️ **THE BADGE BESIDE THE NAME, ON THE TWO SCREENS WHOSE HEADING IS THE NAME — 0437.** The
        studio's badge (0427) was the launcher icon and nowhere in the game. It is the shell's own
        `icon-192.png`, which already ships beside the page and which the service worker already
        precaches for the install splash — so the page gains no file, no inlined bytes and nothing that
        fails offline. Decorative: the heading beside it is the name.
      */
      if (screen === 'title' || screen === 'splash') {
        const mark = document.createElement('div');
        mark.className = prefix + 'mark';
        const badge = document.createElement('img');
        badge.className = prefix + 'badge';
        badge.src = BADGE_SRC;
        badge.alt = '';
        badge.decoding = 'async';
        mark.append(badge, heading);
        panel.appendChild(mark);
      } else {
        panel.appendChild(heading);
      }
    }
    /*
      ── A LIVE SKY BEHIND THE TITLE — 0437 ─────────────────────────────────────────────────────────

      The title was the space colour, flat, for as long as anybody sat on it. Behind the panel now: three
      layers of stars drifting at three speeds the way the game's own sky does, and every so often the
      pilot's ship crossing low under the buttons. All of it is the stylesheet's and none of it the
      game's — see 0437 for why the music room's flythrough is not what draws it.
    */
    if (screen === 'title') {
      const sky = document.createElement('div');
      sky.className = prefix + 'sky';
      sky.setAttribute('aria-hidden', 'true');
      const flyer = document.createElement('span');
      flyer.className = prefix + 'flyer';
      // The default pilot's fighter until the shell says whose ship it is (`setShip`) — 0441.
      const hull = iconOf(SPRITE.fighter);
      flyer.appendChild(hull);
      sky.appendChild(flyer);
      root.insertBefore(sky, panel);
      titleFlyer = flyer;
    }
    // The inks the score's gold is made of, on every overlay, where the palette is — 0428.
    paintScoreInks(root, colours);

    /*
      ⚠️ **THE ACCOUNT, UNDER THE HEADING, ON THE THREE SCREENS A RUN STOPS TO ADD UP ON** — 0428.
      Empty until the shell pushes it: what goes on it is the run's business and the shell's, not this
      file's, on `setActionHint`'s terms.
    */
    let sheet: HTMLElement | null = null;
    // 0517: and the game over, the fourth — a run that could not be continued is added up there.
    // 0522: and the hangar, whose one line is the Star Shards the player holds.
    if (screen === 'cleared' || screen === 'victory' || screen === 'gameOver' || screen === 'ended' || screen === 'hangar' || screen === 'parts' || screen === 'shop') {
      sheet = document.createElement('div');
      sheet.className = prefix + 'sheet';
      panel.appendChild(sheet);
    }

    /*
      The tab strip, under the heading, on a screen that shares one — 0458. Each tab is a button that
      asks the shell to show its screen; the open one is filled and says so to a reader.
    */
    const tabs: HTMLButtonElement[] = [];
    if (row.tabs.length > 0) {
      const strip = document.createElement('div');
      strip.className = prefix + 'tabs';
      strip.setAttribute('role', 'tablist');
      strip.setAttribute('aria-label', row.heading);
      for (const tab of row.tabs) {
        const button = document.createElement('button');
        button.type = 'button';
        button.className = prefix + 'tab';
        button.setAttribute('role', 'tab');
        button.textContent = SCREENS[tab].heading;
        const open = tab === screen;
        button.classList.toggle(prefix + 'tab-on', open);
        button.setAttribute('aria-selected', open ? 'true' : 'false');
        const press = (): void => {
          if (tab !== screen) onTab(tab);
        };
        button.addEventListener('click', press);
        listeners.push(() => button.removeEventListener('click', press));
        strip.appendChild(button);
        tabs.push(button);
      }
      panel.appendChild(strip);
    }

    /*
      The controls' own box. On the title it stands under the bands, in the column beside the table —
      see the stylesheet, and decision 0049 for why the short axis decides that. Every other screen
      has one control or a few and the box is a formality, which is the point: one description of
      where a screen's controls go.
    */
    const choices = document.createElement('div');
    choices.className = prefix + 'choices';

    /*
      The bands' own box — decision 0070, and bands since 0458. Above the actions on every screen,
      because a band is a thing set before the thing pressed: the title's tier and pilot over Launch,
      Settings' three over its way out. The cursor walks them in that order too.
    */
    const settingsBox = document.createElement('div');
    settingsBox.className = prefix + 'settings-box';

    // 0212: the music room's readout, and `null` on every other screen.
    const nowPlaying = screen === 'music' ? buildNowPlaying(prefix, onSeek, listeners) : null;
    // 0340: the crossing's words, on the line above's exact terms.
    const crossing = screen === 'travel' ? buildCrossing(prefix) : null;

    let board: Panel['board'] = null;
    if (screen === 'title') {
      /*
        ⚠️ **THE TABLE BESIDE THE ROWS, AND THE KEY IS ON HOW TO PLAY — 0458.** *"The display for the
        pickups and bombs isn't actually helpful anymore, it could be a tab in settings."* The key and
        the table took turns in this column on an eighteen-second cross-fade; the table has it alone
        now, still, five rows.
      */
      const boardRoot = document.createElement('div');
      boardRoot.className = prefix + 'board';
      const main = document.createElement('div');
      main.className = prefix + 'main';
      main.append(settingsBox, choices);
      const body = document.createElement('div');
      // Bare until `setBoard` has a run to show — the rows then stand alone in the middle.
      body.className = prefix + 'body ' + prefix + 'body-bare';
      body.append(boardRoot, main);
      board = { root: boardRoot, body };
      panel.appendChild(body);
    } else if (screen === 'guide') {
      panel.appendChild(buildGuide(prefix, iconOf, guideDevices));
      panel.appendChild(choices);
    } else {
      /*
        ── THE MUSIC ROOM'S READOUT, ABOVE ITS BUTTONS — 0212 ───────────────────────────────────────

        ⚠️ **ABOVE, BECAUSE IT IS WHAT THE BUTTONS DID.** A player presses a place and then looks for
        what happened; below the nine controls it would be under the fold on the short screens
        decision 0049 is about, and the answer to *which one is playing* would be the thing furthest
        from the thing that asked.

        ⚠️ **Built for this screen only.** Every other panelled screen gets `now: null` and never
        learns this exists.
      */
      if (nowPlaying !== null) panel.appendChild(nowPlaying.root);
      /*
        ⚠️ **ABOVE THE BUTTON, FOR THE REASON THE READOUT IS ABOVE ITS OWN** — 0340. The crossing has
        one control and the player is not looking for it: what they are reading is the name of the
        place they are arriving in, and *Onward* is the thing they press when they have finished
        reading it. Below the name is where a button that means *I have read this* belongs.
      */
      if (crossing !== null) panel.appendChild(crossing.root);
      // 0458: the bands above the actions, which is the order the cursor walks them in.
      panel.appendChild(settingsBox);
      panel.appendChild(choices);
    }

    /*
      The controls, one per label the row carries.

      ⚠️ **`click` is the ONE activation path, and the pad goes through it too** — `activate` below
      calls `.click()` rather than reaching for `onAction` itself. Two paths to the same effect is
      two places for a screen to start a run without resetting something, and this project has
      already paid once for two descriptions of one fact (`src/content/sprites.ts`).
    */
    const controls: HTMLButtonElement[] = [];
    row.actions.forEach((action, index) => {
      const control = document.createElement('button');
      control.type = 'button';
      control.className = prefix + 'action';
      // 0538: the action that leads, which the stylesheet stands alone over the quiet row.
      if (row.leads && index === 0) control.classList.add(prefix + 'action-lead');
      control.textContent = action.label;
      /*
        The hint, INSIDE the button so it is part of what the control announces itself as.

        ⚠️ **Beside it would be a second thing to focus and a second thing to tab past**, and the
        hint is not a thing to do — it is what the control means. A `<span>` in the accessible name
        is read as one phrase by a screen reader, which is exactly the reading a sighted player gets.
      */
      if (action.hint.length > 0) {
        const hint = document.createElement('span');
        hint.className = prefix + 'action-hint';
        hint.textContent = action.hint;
        control.appendChild(hint);
      }
      const onClick = (): void => onAction(screen, index);
      control.addEventListener('click', onClick);
      listeners.push(() => control.removeEventListener('click', onClick));
      choices.appendChild(control);
      controls.push(control);
    });

    /*
      THE SETTINGS THIS SCREEN OFFERS — decision 0070, and each one a BAND since 0458.

      ⚠️ **A BAND IS ONE STOP FOR THE CURSOR, AND ITS OPTIONS ARE NOT STOPS AT ALL.** The chips were
      each a control, so the title's three two-way settings were six stops for three decisions and
      the pad walked them in whatever order the geometry guessed. The band's root takes the focus;
      left and right move along it (`move`), a press steps it on (`activate`), and a pointer or a
      thumb presses a segment or a step directly. The segments and the steps are out of the tab order
      for the same reason.

      ⚠️ **Each option captures its own position and nothing else.** `src/state/screens.ts` says an
      option carries no value — the content hub's order IS the value — so the shell narrows an index
      against its own table rather than this file narrowing a string.
    */
    const options: Partial<Record<ChoiceName, HTMLButtonElement[]>> = {};
    // Not `bands`: that name is the trigger discs', further down, and the two are different things.
    const choiceBands: Band[] = [];
    for (const choice of row.choices) {
      const chip = choice.faces === 'chip';
      const line = document.createElement('div');
      // 0517: a chip is not drawn as a band, so it does not wear the band's class or its layout.
      line.className = prefix + (chip ? 'chip' : 'band');
      line.tabIndex = 0;
      line.setAttribute('role', 'group');
      line.setAttribute('aria-label', choice.label);
      const label = document.createElement('span');
      label.className = prefix + 'band-label';
      label.textContent = choice.label;
      label.setAttribute('aria-hidden', 'true');
      const step = (towards: -1 | 1, glyph: string, said: string): HTMLButtonElement => {
        const button = document.createElement('button');
        button.type = 'button';
        button.tabIndex = -1;
        button.className = prefix + 'band-step ' + prefix + (towards < 0 ? 'band-less' : 'band-more');
        button.textContent = glyph;
        button.setAttribute('aria-label', said + ' ' + choice.label.toLowerCase());
        const press = (): void => {
          const band = choiceBands.find((b) => b.root === line);
          if (band !== undefined) stepBand(band, towards, false);
        };
        button.addEventListener('click', press);
        listeners.push(() => button.removeEventListener('click', press));
        return button;
      };
      const less = step(-1, '‹', 'Previous');
      const more = step(1, '›', 'Next');
      const hint = document.createElement('span');
      hint.className = prefix + 'band-hint';
      hint.setAttribute('aria-live', 'polite');
      const box = document.createElement('div');
      box.className = prefix + 'options';
      if (choice.faces === 'portraits') box.classList.add(prefix + 'options-faces');
      /*
        ⚠️ **WHICH setting this strip belongs to, on the element rather than in a position** — added
        with the second setting (`docs/decisions/0072-a-cue-is-baked-and-played.md`), because with one
        there was no question to answer. `tests/style.browser.test.ts` had been reaching for *the nth
        option on the title screen*, which was exact while every option belonged to the same row and
        became a test about whichever setting happened to be listed first.

        A `data-` attribute rather than a class, on the same terms as `mount.ts`'s rotate gate: a
        class is a styling hook a later art pass may rename, and this is a contract with a test.
      */
      box.setAttribute(SETTING_ATTR, choice.name);
      const buttons: HTMLButtonElement[] = [];
      choice.options.forEach((option, index) => {
        const button = document.createElement('button');
        button.type = 'button';
        button.tabIndex = -1;
        button.className = prefix + 'option';
        if (choice.faces === 'portraits') {
          /*
            ⚠️ **A CARD: THE GOLFER'S PORTRAIT, ROUND, AND THE NAME THEY GO BY UNDER IT — 0513.** It was
            a face alone (0458), and four faces nobody had been introduced to were a choice between
            colours. The painting is `src/render/golfer-art.ts`'s; the position IS the golfer, because
            `src/state/screens.ts` walked `GOLFER_KINDS` to build the options. The full name is the label.
          */
          button.classList.add(prefix + 'option-face');
          button.setAttribute('aria-label', option.label);
          button.title = option.label;
          const golfer = GOLFER_KINDS[index];
          if (golfer !== undefined) {
            const name = document.createElement('span');
            name.className = prefix + 'option-name';
            name.setAttribute('aria-hidden', 'true');
            name.textContent = GOLFERS[golfer].name.split(' ')[0] ?? GOLFERS[golfer].name;
            button.append(portraitOf(golfer, prefix), name);
          }
        } else {
          button.textContent = option.label;
        }
        /*
          ⚠️ **A CHIP SHOWS ONLY THE OPTION THAT IS ON, SO A PRESS ON IT STEPS TO THE NEXT — 0517**, round
          the end, as the cursor's press on a band does. Its hint is the tooltip, having no line to go on.
        */
        if (chip) button.title = option.hint;
        const target = chip ? (index + 1) % choice.options.length : index;
        // A pointer's press, which a band of pilots reads differently from the cursor's — 0513.
        const press = (): void => onChoice(choice.name, target, true);
        button.addEventListener('click', press);
        listeners.push(() => button.removeEventListener('click', press));
        box.append(button);
        buttons.push(button);
      });
      options[choice.name] = buttons;
      const band: Band = {
        name: choice.name,
        root: line,
        less,
        more,
        hint,
        // The pilot's line is the name as well as what they fly: the face alone does not say who it is.
        hints: choice.options.map((option) => (choice.faces === 'portraits' ? option.label + ' — ' + option.hint : option.hint)),
        open: choice.options.map(() => true),
        why: null,
        index: 0,
        on: choice.on,
        press: choice.press,
        faces: choice.faces,
      };
      choiceBands.push(band);
      if (chip) {
        // 0517: the options alone, after the actions in the DOM and the walk; the stylesheet draws it first.
        line.append(box);
        choices.appendChild(line);
        continue;
      }
      line.append(label, less, box, more, hint);
      settingsBox.appendChild(line);
      /*
        ⚠️ **AND UNDER A BAND OF FACES, WHO THE HIGHLIGHTED ONE IS — 0513.** *"Nothing anywhere says who
        a pilot is"*: the row held a home, pronouns and a biography, and the screen showed a face. The
        panel is read off the rows (`GOLFERS`, `SHIPS`, `WEAPONS`), so a fifth pilot is a row and the
        panel knows them; `setChoice` fills it with whichever face is on. The band's own line says the
        same name and ship to a reader and stands off the glass, where the panel says it to the eye.
      */
      if (choice.faces === 'portraits') {
        line.classList.add(prefix + 'band-faces');
        const pilotCard = buildPilotCard(prefix, choice.card);
        pilotCards[screen] = pilotCard;
        settingsBox.appendChild(pilotCard.root);
      }
    }
    // A screen with no bands has nothing in their box, and an empty flex child is a gap with no row.
    if (settingsBox.childElementCount === 0) settingsBox.remove();

    /*
      The countdown, for a screen that expires.

      `aria-live="off"`: it is announced once by the button's own label and re-announcing a number
      every second would talk over everything else on the screen. A screen reader user who wants it
      can read it; one who does not is not interrupted seven times.
    */
    let timer: HTMLElement | null = null;
    /*
      ⚠️ **Only a screen that has STOPPED THE WORLD gets one, and that is a relationship rather than a
      filter.** A screen that has stopped the world owes the player a number saying when it will stop
      doing that; a banner over a world that never stopped does not, and a countdown on one would be
      exactly the *restating what the screen already shows* `docs/game.md` bans. Decision 0063.

      ⚠️ **IT READ `row.dims`, WHICH WAS THE SAME ANSWER UNTIL THE COUNT-IN — 0511.** Every screen that
      stopped the world also painted over it, so *dims* stood in for *stopped*. The count-in stops the
      world and shows it, because what the player is counting down to is that field moving again.
    */
    if (row.timeout !== null && !row.steps) {
      timer = document.createElement('div');
      timer.className = prefix + 'timer';
      timer.setAttribute('aria-live', 'off');
      panel.appendChild(timer);
    }

    /*
      THE ROWS THE CURSOR WALKS — 0458: the tabs, each band, the actions, which is the order they are
      drawn in on every screen. Built once, from what was built, so the walk cannot list a control the
      screen does not have or miss one it does.
    */
    // Rewritten in place by `setActionShown` and `setTouch`, so `follow` below reads the walk as it stands.
    const rows: HTMLElement[][] = walkOf(tabs, choiceBands, controls);
    /*
      ⚠️ **ONE CURSOR, WHOEVER MOVED IT.** A click, a tap or the Tab key puts the platform's focus on a
      control without asking the chrome; read back here, so the next push of a stick starts from where
      the player actually is rather than from where the pad last left the ring.
    */
    const follow = (e: FocusEvent): void => {
      if (shownScreen !== screen) return;
      const target = e.target;
      for (let r = 0; r < rows.length; r++) {
        const c = rows[r]!.indexOf(target as HTMLElement);
        if (c < 0) continue;
        if (r !== cursor.row || c !== cursor.col) {
          cursor.row = r;
          cursor.col = c;
          paintFocus(false);
        }
        return;
      }
    };
    panel.addEventListener('focusin', follow);
    listeners.push(() => panel.removeEventListener('focusin', follow));

    panels[screen] = { root, controls, timer, options, bands: choiceBands, tabs, rows, now: nowPlaying, crossing, sheet, board };
    elements.push(root);
  }

  /*
    ── THE IN-GAME READOUT ─────────────────────────────────────────────────────────────────────────

    Asked for in play: *"in game we need a life and shield tracker icons so the player has a clue."*

    ⚠️ **"Shield" is the ship's health, and it is the player's word rather than the code's.** There is
    also a `shield` in `src/content/specials.ts` — a special that absorbs a hit — and nothing triggers
    one yet. If both ever exist at once it is the SPECIAL that gets renamed, because this is the word
    a player already used for the thing that keeps them alive.

    ⚠️ **Built once and mutated, never rebuilt.** `setHud` is called on a change rather than on a
    frame (`src/app/frame.ts` only fires `onHealth` when the number actually moves), but rebuilding
    the pip row from scratch on every hit would still churn layout for no reason. The pips exist from
    boot at the ship's full health; a hit toggles a class.
  */
  const hud = document.createElement('div');
  hud.className = 'itc-playing-hud';
  hud.style.color = colours.player;
  // The halo behind the ink — 0361 — in the palette's own void, so a high-contrast palette gets its own.
  hud.style.setProperty('--itc-void', colours.space);

  const livesGroup = document.createElement('div');
  livesGroup.className = 'itc-playing-hud-group';
  /*
    ⚠️ **A LIFE IS A SHIP, SO THE COUNTER IS THE SHIP** — 0430: *"the top left row of 'life' should be
    the ship with an x and the number of lives."* It was a plus, left over from the extra-life pickup
    0082 took off the field, and a plus is the genre's word for HEALTH — the one thing this counter is
    not. The ship in reserve is the arcade's own picture of a life. `SPRITE.fighter` until the shell
    says which ship is flying (`setShip`, the pilot's since 0441), so the readout is never blank while
    it boots.
  */
  let livesSprite: number = SPRITE.fighter;
  /*
    0526: and the gun that ship flies, said with the lives — the icon is hidden from a reader, and since
    the hangar fits another ship's gun the picture is the one place that said which; set by `setShip`.
  */
  let livesGun: string = WEAPONS[SHIPS.fighter.weapon].label;
  let livesIcon: HTMLElement = iconOf(livesSprite);
  livesIcon.className = 'itc-playing-hud-icon itc-playing-hud-ship';
  livesIcon.setAttribute('aria-hidden', 'true');
  const livesCount = document.createElement('span');
  livesGroup.append(livesIcon, livesCount);

  /*
    What each trigger throws next, and how many presses are on its stack — 0373, and one group per
    trigger since 0376. The icon is swapped when the top of a stack changes kind, which is a change and
    never a frame.
  */
  const hudIcon = (sprite: number): HTMLElement => {
    // Bare since 0433: the bubble means *fly into me*, and a counter is not a thing on the field.
    const icon = glyphOf(sprite);
    icon.className = 'itc-playing-hud-icon';
    icon.setAttribute('aria-hidden', 'true');
    return icon;
  };
  const stackGroups: { group: HTMLElement; icon: HTMLElement; sprite: number; count: HTMLElement }[] = [];
  // One per trigger, three since 0447's ward — read off `SIDES`, so a fourth is a row and not an edit.
  for (let i = 0; i < SIDES.length; i++) {
    const group = document.createElement('div');
    group.className = 'itc-playing-hud-group itc-playing-hud-stack';
    const icon = hudIcon(SPRITE.bomb);
    const count = document.createElement('span');
    group.append(icon, count);
    stackGroups.push({ group, icon, sprite: SPRITE.bomb, count });
  }

  const shieldGroup = document.createElement('div');
  shieldGroup.className = 'itc-playing-hud-group itc-playing-hud-shields';
  // `role="img"` with a label, because a row of divs is not something a screen reader can read and
  // the number is what matters — 0024's floor is that every cue has a twin, not that it is visual.
  shieldGroup.setAttribute('role', 'img');
  const pips: HTMLElement[] = [];
  hud.append(livesGroup, shieldGroup, ...stackGroups.map((s) => s.group));
  /*
    The box the strip is sized against — 0465: the host's whole glass, a query container as the
    trigger discs' is, so the strip's type is a share of the SHORT axis and not of the width.
  */
  const top = document.createElement('div');
  top.className = 'itc-playing-top';
  // The studio's two inks for the plates' rims, violet into cyan — 0439, as the banner runs.
  top.style.setProperty('--itc-ink', colours.player);
  top.style.setProperty('--itc-ally', colours.ally);
  top.style.setProperty('--itc-void', colours.space);
  // The row the readout shares with the boss bar — a grid, so the two cannot overlap on any width.
  const strip = document.createElement('div');
  strip.className = 'itc-playing-strip';
  strip.appendChild(hud);
  top.appendChild(strip);
  elements.push(top);

  /*
    ── THE READOUT WEARS THE SHIP — 0451 ─────────────────────────────────────────────────────────────

    *"We also need to do the hud theme on the top left row of icons in game. Golf-Stars has hud theming
    for all the spaceships already."* The plate takes the ship's ink for its counts, its pips and its
    glow, runs its rim from the ship's trim into that ink, and wears the ship's dressing as a class —
    the row says which (`hud` in `src/content/ships.ts`). Only the readout: the boss bar and the score
    keep the studio's rim, which is theirs. Every colour is a palette role moved, so the high-contrast
    palette answers each one.
  */
  const inkOf = (ink: HudInk): string => {
    const base = ink.toward === undefined ? colours[ink.from] : mix(colours[ink.from], colours[ink.toward], ink.by ?? 0.5);
    return ink.lift === undefined ? base : shade(base, ink.lift);
  };
  const wearShip = (ship: ShipRow): void => {
    const ink = inkOf(ship.hud.ink);
    hud.style.color = ink;
    hud.style.setProperty('--itc-ink', ink);
    hud.style.setProperty('--itc-ally', inkOf(ship.hud.trim));
    hud.style.setProperty('--itc-lit', colours.impact);
    for (const motif of HUD_MOTIFS) hud.classList.toggle('itc-playing-hud-' + motif, motif === ship.hud.motif);
  };
  /*
    ── THE DICE ON THE DASH — 0461 ─────────────────────────────────────────────────────────────────

    Played: *"for the station wagon, can we make the hanging fuzzy dice a bit bigger and clearer and
    hanging from the center of the dashboard instead of right on the edge, and have them sway when the
    ship accelerates or stops hard."* They were a pseudo-element: two blank squares off the plate's far
    end, a third of the size of a count. They are a pair on two strings now, from the middle of the
    plate's lower edge, each as big as a count and showing its pips, and the walnut plate is the only
    one that shows them. The frame says when the ship lurches (`stepJolt`) and they swing against it —
    back from a push, forward from a stop — over their own idle drift, which is the outer of the two
    elements so the swing composes with it rather than cutting it off.
  */
  const dice = document.createElement('div');
  dice.className = 'itc-playing-hud-dice';
  dice.setAttribute('aria-hidden', 'true');
  /*
    The classic red fur — 0466. No palette role is this red, so it is the enemy's ink warmed toward the
    shot's orange and deepened, mixed here from the palette as the readout's own inks are (0451),
    so the high-contrast palette answers it. On the dice and not in the stylesheet, because the plate
    inherits the strip's inks and the score's reds are set on the screens' root, which it is not under.
  */
  dice.style.setProperty('--itc-fur', shade(mix(colours.enemy, colours.bullet, 0.3), -0.18));
  /*
    0523: the other dangles' inks, on the fur's terms — every one a role moved, so the high-contrast
    palette answers it. The tree is the pickup's mint deepened, the frame the hazard's gilt, the family
    in it the acid's green toward the mint, and the golf ball the light ink, shaded by the sky.
  */
  dice.style.setProperty('--itc-leaf', shade(mix(colours.pickup, colours.acid, 0.35), -0.2));
  dice.style.setProperty('--itc-gilt', colours.hazard);
  dice.style.setProperty('--itc-alien', mix(colours.acid, colours.pickup, 0.5));
  dice.style.setProperty('--itc-ball-shade', mix(colours.impact, colours.sky, 0.45));
  const swing = document.createElement('div');
  swing.className = 'itc-playing-hud-dice-swing';
  /*
    ⚠️ **EVERY DANGLE ON THE ONE SWING — 0523.** Each is a body of its own under the swing, so the frame's
    lurch (`swayDice`) swings whichever hangs, and the class on the readout says which is shown. The dice
    are the first body; the rest hang from one strand each.
  */
  const hangs = (kind: DangleKind): HTMLElement => {
    const body = document.createElement('div');
    body.className = 'itc-playing-hud-hang itc-playing-hud-hang-' + kind;
    swing.appendChild(body);
    return body;
  };
  const diceBody = hangs('dice');
  for (const [strand, face] of [
    ['a', 'five'],
    ['b', 'three'],
  ] as const) {
    const string = document.createElement('div');
    string.className = 'itc-playing-hud-dice-strand itc-playing-hud-dice-strand-' + strand;
    const die = document.createElement('div');
    die.className = 'itc-playing-hud-die itc-playing-hud-die-' + face;
    string.appendChild(die);
    diceBody.appendChild(string);
  }
  for (const [kind, part] of [
    ['eucalyptus', 'tree'],
    ['family', 'frame'],
    ['golfball', 'ball'],
  ] as const) {
    const string = document.createElement('div');
    string.className = 'itc-playing-hud-dice-strand itc-playing-hud-hang-strand';
    const thing = document.createElement('div');
    thing.className = 'itc-playing-hud-' + part;
    string.appendChild(thing);
    hangs(kind).appendChild(string);
  }
  dice.appendChild(swing);
  hud.appendChild(dice);
  wearShip(SHIPS.fighter);
  /** The ship whose dash the readout has on — 0521, so `setShip` can tell a new plate from the same one. */
  let wornPlate: ShipRow = SHIPS.fighter;

  /*
    ── WHERE TO PRESS, ON A DEVICE WHERE THAT IS A PLACE RATHER THAN A KEY ─────────────────────────

    Decision 0060. Its width is `TAP_STRIP`, imported from the file that hit-tests it rather than
    written again here — the picture and the hit test are one number, or the player presses what they
    can see and something else happens.
  */
  const trigger = document.createElement('div');
  trigger.className = 'itc-playing-trigger';
  trigger.style.color = colours.player;
  trigger.style.setProperty('--itc-ink', colours.player);
  trigger.style.setProperty('--itc-ally', colours.ally);
  trigger.style.setProperty('--itc-void', colours.space);
  // Decorative twice over: it is a picture of a hit region, and the HUD already announces the
  // charges. A screen reader user is not tapping a disc they cannot see the rim of.
  trigger.setAttribute('aria-hidden', 'true');
  /** One button per trigger, grown once and reused — `setHud`'s argument about churning layout. */
  const bands: { root: HTMLElement; icon: HTMLElement; count: HTMLElement }[] = [];
  elements.push(trigger);

  /*
    ── WHAT THE BOSS HAS LEFT ──────────────────────────────────────────────────────────────────────

    Decision 0360. Asked for in play: *"add end boss health bars"*, and owed since the first boss
    play-test — the fish's feed, the phase turns, and the forty seconds 0260 sizes a fight to were all
    events the model resolved and the picture never mentioned (0036).

    ⚠️ **In the ENEMY's ink**, on 0074's own argument about the wall: the colour says whose number it
    is. A bar in the player's ink beside the player's shield would read as a second thing they own.

    ⚠️ **Built once and mutated, never rebuilt** — the fill is a transform, which is the one property
    that costs no layout, and the notches are rebuilt only when the row changes, which is once a fight.
  */
  const bossBar = document.createElement('div');
  bossBar.className = 'itc-playing-boss';
  bossBar.style.color = colours.enemy;
  bossBar.style.setProperty('--itc-void', colours.space);
  bossBar.setAttribute('role', 'progressbar');
  bossBar.setAttribute('aria-label', 'Boss');
  bossBar.setAttribute('aria-valuemin', '0');
  bossBar.setAttribute('aria-valuemax', '100');
  /*
    The bar is a plate since 0439, the readout's and the score's, so the three sit on one line at one
    height; the track inside it is what fills, and the notches are cut into the track.
  */
  const bossTrack = document.createElement('div');
  bossTrack.className = 'itc-playing-boss-track';
  const bossFill = document.createElement('div');
  bossFill.className = 'itc-playing-boss-fill';
  bossTrack.appendChild(bossFill);
  bossBar.appendChild(bossTrack);
  /** The notches, grown once per row and reused. */
  const bossNotches: HTMLElement[] = [];
  strip.appendChild(bossBar);

  /*
    ── THE SCORE — 0428 ────────────────────────────────────────────────────────────────────────────

    Top right, the third column of the row, so it can meet neither the readout nor the bar. Built once
    and mutated: `setScore` writes the total into the counter's property and the streak into the badge.
  */
  const scoreBox = document.createElement('div');
  scoreBox.className = 'itc-playing-score';
  scoreBox.style.color = colours.player;
  paintScoreInks(scoreBox, colours);
  scoreBox.setAttribute('role', 'img');
  /*
    ⚠️ **NO CAPTION SINCE 0439.** *SCORE* sat over the digits and the streak under them, so the score
    stood three lines tall beside a readout one line tall, and the top of the screen had three heights
    in it. One line now: the digits, then the multiplier with its bar under it. Eight rolling gold
    digits top right are the genre's own picture of a score, and the label is still the number in
    words for a reader.
  */
  const scorePop = document.createElement('div');
  scorePop.className = 'itc-playing-score-pop';
  const scoreValue = document.createElement('div');
  scoreValue.className = 'itc-playing-score-value';
  scorePop.appendChild(scoreValue);
  const streakRow = document.createElement('div');
  streakRow.className = 'itc-playing-score-streak';
  streakRow.setAttribute('aria-hidden', 'true');
  const streakBar = document.createElement('div');
  streakBar.className = 'itc-playing-score-bar';
  const streakFill = document.createElement('div');
  streakFill.className = 'itc-playing-score-fill';
  streakFill.style.transform = 'scaleX(0)';
  streakBar.appendChild(streakFill);
  const streakTimes = document.createElement('span');
  streakTimes.className = 'itc-playing-score-times';
  streakTimes.textContent = '×1';
  streakRow.append(streakTimes, streakBar);
  scoreBox.append(scorePop, streakRow);
  /*
    ── THE PAUSE BUTTON — 0511 ───────────────────────────────────────────────────────────────────────

    *"We also need to add a pause/settings button in game."* A plate on the strip's line, beside the
    score in its column, on every device: the keys and Start are the shell's, and a thumb has nothing
    else to press. Left of the score, because the trigger discs stack up the right edge (0358) and the
    corner is the first place a thumb reaching for the top disc lands.

    ⚠️ **A THUMB'S TARGET AND A PLATE'S PICTURE ARE TWO SIZES.** The plate is the strip's height so it
    sits on 0439's line with the other three; on a phone that is about 31 px, under the 44 px a thumb
    needs, so the hit area runs past the plate on every side (`::before` in the stylesheet) without the
    row growing for it.
  */
  const pause = document.createElement('button');
  pause.type = 'button';
  pause.className = 'itc-playing-pause';
  pause.setAttribute('aria-label', 'Pause');
  pause.title = 'Pause (Esc)';
  pause.style.color = colours.player;
  const pauseBars = document.createElement('span');
  pauseBars.className = 'itc-playing-pause-bars';
  pauseBars.setAttribute('aria-hidden', 'true');
  pause.appendChild(pauseBars);
  pause.addEventListener('click', () => onPause());
  const corner = document.createElement('div');
  corner.className = 'itc-playing-corner';
  corner.append(pause, scoreBox);
  strip.appendChild(corner);
  /** What the score last said, so a call that changed nothing animates nothing. */
  let scoreShown = -1;
  let streakShown = 0;
  /** Which of the two pop animations is on, alternated so each gain restarts it without a reflow. */
  let popB = false;

  /*
    ── THE INTRO'S SKIP — 0412 ───────────────────────────────────────────────────────────────────────

    A real `<button>`, so a click and a tap reach it the way they reach every other control. Shown while
    the intro is up AND the shell has said the game behind it is ready; the keys that skip are the
    shell's (`src/app/mount.ts`), because Escape has to work while this is still hidden.
  */
  const skip = document.createElement('button');
  skip.type = 'button';
  skip.className = prefixFor('intro') + 'skip';
  skip.textContent = 'Skip';
  skip.style.color = colours.player;
  skip.style.setProperty('--itc-void', colours.space);
  // A control like every other, so it wears their rim — 0440.
  skip.style.setProperty('--itc-ink', colours.player);
  skip.style.setProperty('--itc-ally', colours.ally);
  skip.addEventListener('click', () => onSkip());
  elements.push(skip);
  let skipReady = false;
  // On any screen whose row skips, since 0418 — the finale's as well as the intro's. One button: its
  // class keeps the intro's name because the intro is where it was drawn first.
  const paintSkip = (): void => {
    skip.classList.toggle(prefixFor('intro') + 'skip-shown', shownScreen !== null && SCREENS[shownScreen].skips && skipReady);
  };

  /*
    ── THE FINALE'S SPEECH BUBBLE — 0418 ──────────────────────────────────────────────────────────────

    What a golfer says, typed out a few letters at a time while the shell plays their voice. The WHOLE
    line is set from the start with the part not yet said held invisible, so the bubble is its final
    size before the first letter and nothing reflows as it types. Placed by the shell at the speaker's
    mouth, in the canvas's own pixels, with its tail on the side the speaker is.
  */
  const bubble = document.createElement('div');
  bubble.className = prefixFor('outro') + 'bubble';
  bubble.style.color = colours.space;
  bubble.style.setProperty('--itc-ink', colours.player);
  // Who is speaking, over what they say — 0426: with no close-up of the cockpit, the bubble names them.
  const who = document.createElement('span');
  who.className = prefixFor('outro') + 'bubble-who';
  const said = document.createElement('span');
  const unsaid = document.createElement('span');
  unsaid.className = prefixFor('outro') + 'bubble-unsaid';
  bubble.append(who, said, unsaid);
  elements.push(bubble);
  let bubbleLine: string | null = null;
  let bubbleShown = -1;
  // Where the bubble was last put, in whole pixels — 0426: it rides a ship, so it moves while it is up.
  let bubbleX = Number.NaN;
  let bubbleY = Number.NaN;

  /*
    ── THE FOCUS RING ──────────────────────────────────────────────────────────────────────────────

    Which screen is up, and which of its controls the focus is on.

    ⚠️ **Held here rather than read back from `document.activeElement`.** The browser's idea of focus
    is lost the moment the player taps the canvas — a touch on the playfield blurs the button — and a
    pad pressed afterwards would then have nowhere to start from. This is the chrome's own answer and
    it survives anything the player does with another device.
  */
  let shownScreen: Screen | null = null;
  /*
    THE CURSOR — 0458: a row of the shown screen's `rows` and a column within it.

    ⚠️ **REMEMBERED PER SCREEN, AND IT WAS RESET ON EVERY SHOW.** *"A remembered position on a screen the
    player has left is a cursor sitting somewhere nobody put it"* — true of a screen the player was
    sent to, and false of one they come BACK to: leaving the music room put the ring on the title's
    first tier rather than on the button they had pressed to get there. The player put it there.
  */
  const cursor = { row: 0, col: 0 };
  const remembered: Partial<Record<Screen, { row: number; col: number }>> = {};
  /** The faces the buttons are currently built from, so they are rebuilt on a change and not per call. */
  let bandFaces: number[] = [];
  /** What the bar last said: a fraction, or negative for no boss. */
  let bossFraction = -1;
  /** Whose phase table the notches were cut for. */
  let bossRowShown: BossRow | null = null;

  /** Show the buttons only where they are true: on the playing screen, with something behind a trigger. */
  const paintTriggers = (): void => {
    trigger.classList.toggle('itc-playing-trigger-shown', shownScreen === 'playing' && bands.length > 0);
  };

  /**
   * Show the bar only while the simulation runs and a boss is on the field.
   *
   * ⚠️ **On `show`'s own terms** — the level break steps the world, so a bar that vanished for it
   * would vanish for the beat the boss is coming apart in; and by then the frame has already said
   * *no boss*, so what is really being held here is the bar not outliving the screen it was drawn on.
   */
  const paintBoss = (): void => {
    bossBar.classList.toggle('itc-playing-boss-shown', shownScreen !== null && SCREENS[shownScreen].steps && bossFraction >= 0);
  };

  /** The control under the cursor on the shown screen, or `undefined` on a screen with none. */
  const atCursor = (): HTMLElement | undefined => {
    const panel = shownScreen === null ? undefined : panels[shownScreen];
    return panel?.rows[cursor.row]?.[cursor.col];
  };
  /*
    ⚠️ **`scroll` IS FALSE WHEN A SCREEN APPEARS — 0458.** Focusing an element scrolls it into view, and
    the title now opens on *Launch*, below the bands: on a window too short for the title, showing it
    scrolled the overlay down to Launch and put the name off the top where nothing scrolls back (0049's
    bug, caught by its guard). A screen appearing does not scroll itself; a player moving the ring does.
  */
  const paintFocus = (focus = true, scroll = true): void => {
    const panel = shownScreen === null ? undefined : panels[shownScreen];
    if (panel === undefined) return;
    const here = atCursor();
    const ring = prefixFor(shownScreen!) + 'action-cursor';
    for (const row of panel.rows) {
      for (const control of row) control.classList.toggle(ring, control === here);
    }
    // Focus the element as well, so the keyboard, the screen reader and the pad all agree about where
    // the player is — one cursor, three devices.
    if (focus && here !== undefined && document.activeElement !== here) here.focus({ preventScroll: !scroll });
  };
  /**
   * Move a band along — 0458. Clamped at its ends, because a band is a line with two ends the player
   * can see, and a press past *Burn* that came round to *Legendary* is a tier nobody asked for; a press
   * on the band itself (`activate`) is the one way round, because it has no direction to be wrong about.
   */
  /*
    ⚠️ **A STEP SKIPS WHAT IS SHUT — 0521**, to the next open option that way, and stands still where
    there is none: a locked dash is shown so the player knows it is there, and is never landed on.
  */
  /**
   * A band's hint line and its two steps, from what is on it and what is open — 0458, and since 0521 a
   * band with shut options says why in the hint's place, and a step with no open option that way is
   * shown as going nowhere.
   */
  const sayBand = (band: Band): void => {
    band.hint.textContent = band.why ?? band.hints[band.index] ?? '';
    band.less.disabled = !band.open.some((open, i) => open && i < band.index);
    band.more.disabled = !band.open.some((open, i) => open && i > band.index);
  };
  const stepBand = (band: Band, delta: number, round: boolean): void => {
    const count = band.hints.length;
    if (count === 0) return;
    let next = band.index;
    for (let tried = 0; tried < count; tried++) {
      let at = next + delta;
      if (round) at = (at + count) % count;
      else if (at < 0 || at >= count) return;
      next = at;
      if (band.open[next] !== false) break;
    }
    if (next !== band.index && band.open[next] !== false) onChoice(band.name, next, false);
  };
  /** The band whose row the cursor is on, or `undefined` on a row of buttons. */
  const bandAtCursor = (): Band | undefined => {
    const panel = shownScreen === null ? undefined : panels[shownScreen];
    const here = atCursor();
    return panel?.bands.find((band) => band.root === here);
  };

  /** What the readout last said, so a change can be told from a layout — 0433. −1 before the first. */
  let shownHealth = -1;
  let shownLives = -1;
  /**
   * Play a readout event on an element — 0433. Two classes that run the same animation, swapped on
   * every kick, because re-adding the class an animation already ran under does not run it again; the
   * score's pop is built the same way (0428), and it needs no timer and no forced layout.
   */
  const kick = (el: HTMLElement, event: 'lost' | 'gained'): void => {
    const a = 'itc-playing-hud-' + event + '-a';
    const b = 'itc-playing-hud-' + event + '-b';
    const next = el.classList.contains(a) ? b : a;
    el.classList.remove(a, b);
    el.classList.add(next);
  };

  return {
    elements,
    setShip(ship: ShipRow, plate: ShipRow, fit: Fit): void {
      /*
        ⚠️ **THE PLATE BEFORE THE NO-OP, BECAUSE IT CHANGES WITHOUT THE SHIP — 0521.** A dash fitted in the
        hangar is the same ship wearing another ship's plate, and a check on the sprite alone would leave
        the readout dressed as it was.
      */
      if (plate !== wornPlate) {
        wearShip(plate);
        wornPlate = plate;
      }
      /*
        ⚠️ **AND THE GUN, WHICH ALSO CHANGES WITHOUT THE SPRITE — 0526.** `ship` is the fitted row
        (`fitted`), so its `weapon` is the gun it flies. When that is another ship's, the icon atlas has
        that ship's sprites baked again with it, and the counter and the title's flyer are taken afresh;
        the pilot cards are repainted, since the band painted them before the fitting was known.
      */
      // 0527: the whole fit — its gun, the rim its wheels wear, and since 0528 its look — as the shell says.
      const kind = SHIP_KINDS.find((k) => SHIPS[k].sprite === ship.sprite);
      const gunChanged = kind !== undefined && !sameFit(iconFits[kind] ?? ownFit(kind), fit);
      if (kind !== undefined && gunChanged) {
        bakeShipFit(icons, colours, kind, fit);
        iconFits[kind] = fit;
      }
      if (kind !== undefined) cardFit = { ship: kind, fit };
      livesGun = WEAPONS[ship.weapon].label;
      for (const screen of Object.keys(panels) as Screen[]) {
        const band = panels[screen]?.bands.find((b) => b.faces === 'portraits');
        if (band !== undefined) paintPilot(screen, GOLFER_KINDS[band.index]);
      }
      const sprite = ship.sprite;
      if (sprite === livesSprite && !gunChanged) return;
      const fresh = iconOf(sprite);
      fresh.className = livesIcon.className;
      fresh.setAttribute('aria-hidden', 'true');
      livesIcon.replaceWith(fresh);
      livesIcon = fresh;
      livesSprite = sprite;
      // And the one crossing the title's sky — 0437: the ship the pilot will fly.
      if (titleFlyer !== null) titleFlyer.replaceChildren(iconOf(sprite));
    },
    setTouch(touch: boolean): void {
      hud.classList.toggle('itc-playing-hud-touch', touch);
      // 0512: and the touch section is up where there is glass to touch, and out of the walk where not.
      for (const screen of Object.keys(panels) as Screen[]) {
        const panel = panels[screen];
        if (panel === undefined) continue;
        // A class the stylesheet lays a touch screen's panel out by, on the panel the screen has.
        panel.root.classList.toggle(prefixFor(screen) + 'touch', touch);
        for (const band of panel.bands) if (band.on === 'touch') band.root.hidden = !touch;
        panel.rows.splice(0, panel.rows.length, ...walkOf(panel.tabs, panel.bands, panel.controls));
      }
    },
    setHand(hand: HandKind): void {
      trigger.classList.toggle('itc-playing-trigger-left', hand === 'left');
    },
    setDangle(dangle: DangleKind | null): void {
      // 0523: the readout says what hangs, and the stylesheet shows that body and no other.
      hud.classList.toggle('itc-playing-hud-hanging', dangle !== null);
      for (const kind of DANGLE_KINDS) hud.classList.toggle('itc-playing-hud-hangs-' + kind, kind === dangle);
    },
    swayDice(way: number): void {
      // `kick`'s two classes, so a second lurch the same way runs the swing again.
      const name = 'itc-playing-hud-dice-' + (way > 0 ? 'back' : 'fore');
      const next = swing.classList.contains(name + '-a') ? name + '-b' : name + '-a';
      swing.classList.remove('itc-playing-hud-dice-back-a', 'itc-playing-hud-dice-back-b', 'itc-playing-hud-dice-fore-a', 'itc-playing-hud-dice-fore-b');
      swing.classList.add(next);
    },
    setHud(lives: number, health: number, maxHealth: number, stacks: readonly { label: string; sprite: number; charges: number }[]): void {
      livesCount.textContent = '×' + String(Math.max(0, lives));
      stackGroups.forEach((slot, i) => {
        const stack = stacks[i];
        slot.group.hidden = stack === undefined;
        if (stack === undefined) return;
        if (stack.sprite !== slot.sprite) {
          const fresh = hudIcon(stack.sprite);
          slot.icon.replaceWith(fresh);
          slot.icon = fresh;
          slot.sprite = stack.sprite;
        }
        const held = Math.max(0, stack.charges);
        slot.count.textContent = '×' + String(held);
        slot.group.setAttribute('aria-label', String(held) + (held === 1 ? ' charge' : ' charges') + ', next ' + stack.label);
      });
      livesGroup.setAttribute('aria-label', String(Math.max(0, lives)) + ' lives, ' + livesGun);
      // Grown once, to whatever the ship's full health turns out to be. A later ship with a different
      // maximum is a table edit, not a rewrite of this.
      while (pips.length < maxHealth) {
        const pip = document.createElement('div');
        pip.className = 'itc-playing-hud-pip';
        pips.push(pip);
        shieldGroup.appendChild(pip);
      }
      /*
        ⚠️ **Grown but never shrunk, so a socket past the tier's cap is HIDDEN rather than removed** —
        0355. A Legendary run followed by a Burn one in the same session would otherwise keep three
        sockets for a ship that may carry none, and on Burn the whole readout goes, because a row of
        nothing is a promise of something the tier withholds.
      */
      for (let i = 0; i < pips.length; i++) {
        const was = !pips[i]!.classList.contains('itc-playing-hud-spent');
        pips[i]!.classList.toggle('itc-playing-hud-spent', i >= health);
        pips[i]!.style.display = i < maxHealth ? '' : 'none';
        /*
          ⚠️ **A SHIELD LOST OR GAINED IS AN EVENT, SO THE READOUT SAYS SO — 0433**, on 0036's rule
          that what the model resolves the picture mentions. It toggled a class and nothing moved: a
          shield could go while the player's eyes were on the lane and the row would never tell them.
          Not on the first call, which is a life being laid out rather than anything happening.
        */
        if (shownHealth >= 0 && was !== i < health) kick(pips[i]!, was ? 'lost' : 'gained');
      }
      if (shownLives >= 0 && lives < shownLives) kick(livesGroup, 'lost');
      shownHealth = health;
      shownLives = lives;
      shieldGroup.style.display = maxHealth > 0 ? '' : 'none';
      shieldGroup.setAttribute('aria-label', 'Shield ' + String(Math.max(0, health)) + ' of ' + String(maxHealth));
    },
    setTriggers(triggers: readonly { label: string; sprite: number; charges: number }[]): void {
      /*
        ⚠️ **Rebuilt on a change of the FACES, not on every call.** `setTriggers` rides `setHud`, which
        fires whenever a charge is spent — several times a run — and replacing three elements to write
        a number into one of them is the layout churn the pips already refuse.
      */
      const same = triggers.length === bandFaces.length && triggers.every((t, i) => t.sprite === bandFaces[i]);
      if (!same) {
        trigger.replaceChildren();
        bands.length = 0;
        for (let i = 0; i < triggers.length; i++) {
          const row = triggers[i]!;
          const band = document.createElement('div');
          band.className = 'itc-playing-trigger-button';
          /*
            Stacked up the leading edge from the low corner: the first trigger — the bomb, on every
            run — is the one under the resting thumb. The same arithmetic the hit test does, in the
            container's own short-edge units.
          */
          band.style.bottom = 'calc(' + String((TRIGGER_BUTTON.inset + i * TRIGGER_BUTTON.gap) * 100) + 'cqmin + ' + String(i) + ' * ' + TRIGGER_DISC + ')';
          // Bare, as the readout's are — 0433: the disc round it is already the button's shape.
          const icon = glyphOf(row.sprite);
          icon.className = 'itc-playing-trigger-icon';
          const count = document.createElement('span');
          band.append(icon, count);
          trigger.appendChild(band);
          bands.push({ root: band, icon, count });
        }
        bandFaces = triggers.map((t) => t.sprite);
      }
      // Terse, per `docs/game.md`'s voice rule: the icon says what it is and this says how many are
      // left. No label — the title screen's key is where a thing gets a name.
      for (let i = 0; i < bands.length; i++) {
        bands[i]!.count.textContent = '×' + String(Math.max(0, triggers[i]?.charges ?? 0));
      }
      paintTriggers();
    },
    setBoss(fraction: number, row: BossRow | null): void {
      bossFraction = fraction;
      if (fraction >= 0) {
        const shown = Math.min(1, fraction);
        // A transform, so a hit costs no layout — the fill is the one thing here that moves in a fight.
        bossFill.style.transform = 'scaleX(' + String(shown) + ')';
        bossBar.setAttribute('aria-valuenow', String(Math.round(shown * 100)));
        /*
          ⚠️ **The notches are the row's phase thresholds, and they are cut once per row.** Every
          `upTo` below one is a place the fight turns — the boss fires wider, flies differently, and
          since 0111 sheds pieces — so the bar says where those are before they happen. The first
          row's `upTo` is 1 and is the bar's own end, so it gets no mark. A wreck's bar has no phases
          to mark, and comes as `null` — 0475.
        */
        if (row !== bossRowShown) {
          bossRowShown = row;
          for (const notch of bossNotches) notch.remove();
          bossNotches.length = 0;
          for (const phase of row === null ? [] : row.phases) {
            if (phase.upTo >= 1 || phase.upTo <= 0) continue;
            const notch = document.createElement('div');
            notch.className = 'itc-playing-boss-notch';
            notch.style.left = String(phase.upTo * 100) + '%';
            bossTrack.appendChild(notch);
            bossNotches.push(notch);
          }
        }
      }
      paintBoss();
    },
    setScore(points: number, streak: number): void {
      const multiplier = multiplierFor(streak);
      const pointsBefore = scoreShown;
      if (points !== scoreShown) {
        // A gain pops; the first write and a new run going back to nothing do not.
        if (points > scoreShown && scoreShown >= 0) {
          scorePop.classList.toggle('itc-playing-score-gain-a', !popB);
          scorePop.classList.toggle('itc-playing-score-gain-b', popB);
          popB = !popB;
        }
        scoreShown = points;
        scoreValue.style.setProperty('--itc-playing-points', String(points));
      }
      // A streak that went back to nothing from a multiplier worth having is a hit, and it shakes.
      // Not when the points went down with it: that is a new run starting, and nothing was hit.
      const broke = streak < streakShown && multiplierFor(streakShown) > 1 && points >= pointsBefore;
      if (broke) {
        scoreBox.classList.remove('itc-playing-score-broke');
        // Read back, so the class going on again is a new animation and not the old one continuing.
        void scoreBox.offsetWidth;
        scoreBox.classList.add('itc-playing-score-broke');
      }
      streakShown = streak;
      streakTimes.textContent = '×' + String(multiplier);
      const toNext = multiplier >= MULTIPLIER_CAP ? 1 : (streak % STREAK_STEP) / STREAK_STEP;
      streakFill.style.transform = 'scaleX(' + String(toNext) + ')';
      scoreBox.classList.toggle('itc-playing-score-hot', multiplier > 1);
      scoreBox.classList.toggle('itc-playing-score-max', multiplier >= MULTIPLIER_CAP);
      scoreBox.setAttribute('aria-label', 'Score ' + String(points) + ', times ' + String(multiplier));
    },
    setSheet(screen: Screen, lines: readonly SheetLine[] | null): void {
      const sheet = panels[screen]?.sheet;
      if (sheet === null || sheet === undefined) return;
      sheet.replaceChildren();
      if (lines === null) return;
      const prefix = prefixFor(screen);
      lines.forEach((line, index) => {
        const label = document.createElement('span');
        label.className = prefix + 'sheet-label';
        label.textContent = line.label;
        label.style.setProperty('--itc-sheet-i', String(index));
        const value = document.createElement('span');
        value.style.setProperty('--itc-sheet-i', String(index));
        if (typeof line.value === 'number') {
          value.className = prefix + 'sheet-value ' + prefix + 'sheet-count';
          value.style.setProperty('--itc-sheet-n', String(Math.round(line.value)));
          // What a reader hears, and what a test reads; the counter is what the eye sees.
          const said = document.createElement('span');
          said.className = prefix + 'sheet-said';
          said.textContent = String(Math.round(line.value));
          value.appendChild(said);
        } else {
          value.className = prefix + 'sheet-value';
          value.textContent = line.value;
        }
        if (line.tone === 'rank') value.classList.add(prefix + 'sheet-rank');
        if (line.tone === 'total') {
          label.classList.add(prefix + 'sheet-total');
          value.classList.add(prefix + 'sheet-total');
        }
        sheet.append(label, value);
      });
    },
    setBoard(lines: readonly BoardLine[], fresh: number): void {
      const board = panels.title?.board;
      if (board === null || board === undefined) return;
      const prefix = prefixFor('title');
      board.root.replaceChildren();
      // 0458: no runs yet, no column — the rows stand alone in the middle.
      board.body.classList.toggle(prefix + 'body-bare', lines.length === 0);
      if (lines.length === 0) return;
      const heading = document.createElement('div');
      heading.className = prefix + 'board-heading';
      heading.textContent = 'HIGH SCORES';
      const rows = document.createElement('div');
      rows.className = prefix + 'board-rows';
      // The best five, still — 0458. The table keeps ten; the title shows the five worth reading.
      lines.slice(0, BOARD_SHOWN).forEach((line, index) => {
        const cells: [string, string][] = [
          [line.place, 'board-place'],
          [line.score, 'board-score'],
          [line.pilot, 'board-pilot'],
          [line.reached, 'board-reached'],
        ];
        for (const [text, part] of cells) {
          const cell = document.createElement('span');
          cell.className = prefix + part;
          if (index === fresh) cell.classList.add(prefix + 'board-fresh');
          cell.textContent = text;
          rows.appendChild(cell);
        }
      });
      board.root.append(heading, rows);
    },
    show(screen: Screen | null): void {
      /*
        ⚠️ **Shown while the SIMULATION runs, not while the screen is `playing`** — decision 0063. The
        level break steps the world, so the player is still flying and still spending charges, and a
        readout that vanished for it would be the one moment in the game where what they are carrying
        is invisible.
      */
      /*
        ⚠️ **AND OVER THE COUNT-IN — 0511**: a held screen that shows the field (`dims: false`) is the
        field about to move, and the readout is part of what the player is getting ready to read.
      */
      const counting = screen !== null && SCREENS[screen].pause === 'held' && !SCREENS[screen].dims;
      /*
        ⚠️ **AND OVER A SCREEN THAT FITS THE PLATE — 0521**: the readout IS the plate, so the hangar shows
        the real one in its corner rather than a picture of it. Read off the row's choices, never its name.
      */
      // 0523: and over the shop, whose ware is tried on the dash before it is bought.
      const fitting = screen !== null && SCREENS[screen].choices.some((c) => c.name === 'plate' || c.name === 'ware');
      hud.classList.toggle('itc-playing-hud-shown', screen !== null && (SCREENS[screen].steps || counting || fitting));
      // The score with it, on its terms: up wherever the ship flies, the break and the burn too — 0428.
      scoreBox.classList.toggle('itc-playing-score-shown', screen !== null && ((SCREENS[screen].steps && SCREENS[screen].inRun) || counting));
      // 0511: the pause button where a pause is offered, and nowhere else.
      pause.classList.toggle('itc-playing-pause-shown', screen !== null && SCREENS[screen].pause === 'offered');
      for (const name of Object.keys(panels) as Screen[]) {
        const panel = panels[name];
        if (panel === undefined) continue;
        const shown = name === screen;
        panel.root.classList.toggle(prefixFor(name) + 'shown', shown);
        /*
          ⚠️ **A RAISED CROSSING FORGETS WHICH LEG IT LAST DREW — 0341.** The memo in `setCrossing`
          is what stops the wait line restarting the marker, and it is keyed on the leg — so a SECOND
          run crossing the same leg would find it fresh, skip, and leave the ship parked on its stop
          from last time. A crossing is raised exactly once per leg flown, which makes this the one
          honest moment to say *this is a new one*.
        */
        if (shown && panel.crossing !== null) panel.crossing.drawnFlown = -1;
      }
      // 0458: the screen being left keeps where its cursor was, for the player who comes back to it.
      if (shownScreen !== null && panels[shownScreen] !== undefined) remembered[shownScreen] = { row: cursor.row, col: cursor.col };
      shownScreen = screen;
      paintTriggers();
      paintBoss();
      paintSkip();
      /*
        Where the cursor starts: where it was left, on a screen seen before; otherwise where the row
        says — its first action (the title's Launch, a run over's Continue) or its first band.
      */
      const panel = screen === null ? undefined : panels[screen];
      if (panel !== undefined && screen !== null) {
        const kept = remembered[screen];
        const bandsFrom = panel.tabs.length > 0 ? 1 : 0;
        const opens = SCREENS[screen].opensOn === 'choice' && panel.bands.length > 0 ? bandsFrom : panel.rows.length - 1;
        cursor.row = kept !== undefined && kept.row < panel.rows.length ? kept.row : Math.max(0, opens);
        cursor.col = kept !== undefined && kept.col < (panel.rows[cursor.row]?.length ?? 0) ? kept.col : 0;
      }
      paintFocus(true, false);
    },
    move(delta: number, axis: 'x' | 'y' = 'y'): void {
      const panel = shownScreen === null ? undefined : panels[shownScreen];
      const rows = panel?.rows ?? [];
      if (rows.length === 0) return;
      const row = rows[cursor.row] ?? rows[0]!;
      /*
        ── ROWS FIRST, AND THE BOXES ONLY INSIDE ONE — 0458 ─────────────────────────────────────────

        ⚠️ **THE WHOLE SCREEN WAS ONE GEOMETRIC GUESS, AND ON THE TITLE IT GUESSED WRONG.** 0214 resolved
        every push against every control's box, which is right for the music room's grid and was wrong
        for a title of five box sizes: down from the last tier went to the middle settings chip and
        wrapped, so *Music* and *Pilot* could not be reached by pressing down at all, and on a phone down
        only ever toggled between two controls. `reports/the-menus-reviewed-2026-10-02.md` has the walk.

        So the screen is ROWS, in the order it draws them: up and down move between rows, left and right
        move along a band or along a row of buttons. **The boxes still decide inside a row of buttons** —
        0214's argument is untouched there, because the music room's tiles are one row of buttons laid
        out as a grid, and how many sit in a line is still a fact about the viewport.
      */
      /*
        ⚠️ **A CHIP IS A BUTTON IN A ROW OF BUTTONS HERE — 0517.** Left and right move along the row past
        it, as they do past *Settings*; only a press steps it, and that is `activate`'s.
      */
      const found = bandAtCursor();
      const band = found?.faces === 'chip' ? undefined : found;
      if (band !== undefined && axis === 'x') {
        stepBand(band, delta, false);
        return;
      }
      if (band === undefined) {
        /*
          ⚠️ **A LAYOUT READ IS AFFORDABLE HERE AND NOWHERE NEAR A FRAME.** This runs on a press —
          0022's budget is about the frame loop, and `tests/budget.test.ts` keeps this file off the hot
          list precisely so the chrome may do DOM work when a player asks for something.
        */
        const boxes = row.map((control) => control.getBoundingClientRect());
        // A screen that is one row of buttons wraps inside it, as every screen did before 0458.
        const next = spatially(boxes, cursor.col, delta, axis, rows.length === 1);
        if (next !== null) {
          cursor.col = next;
          paintFocus();
          return;
        }
        /*
          A push along a row the layout has no opinion about still gets a move — 0214's note, and the
          reason it existed: the player does not know which way the chrome laid a row out.
        */
        if (axis === 'x' || rows.length === 1) {
          cursor.col = (cursor.col + delta + row.length) % row.length;
          paintFocus();
          return;
        }
      }
      // Off the row, to the next one up or down, round the ends — a ring of rows, as the list was.
      const from = atCursor()?.getBoundingClientRect();
      cursor.row = (cursor.row + delta + rows.length) % rows.length;
      const landing = rows[cursor.row]!;
      // Into a row of several, onto the one standing nearest across from where the cursor was.
      cursor.col = 0;
      if (from !== undefined && landing.length > 1) {
        const x = (from.left + from.right) / 2;
        // Entering a grid from above lands on its top line, from below on its bottom one.
        const lines = landing.map((control) => control.getBoundingClientRect().top);
        const edge = delta > 0 ? Math.min(...lines) : Math.max(...lines);
        let best = Number.POSITIVE_INFINITY;
        landing.forEach((control, i) => {
          const box = control.getBoundingClientRect();
          if (Math.abs(box.top - edge) > box.height / 2) return;
          const off = Math.abs((box.left + box.right) / 2 - x);
          if (off < best) {
            best = off;
            cursor.col = i;
          }
        });
      }
      paintFocus();
    },
    activate(): void {
      // A band is pressed by stepping it on, round its end — 0458; a button is clicked, as ever.
      const band = bandAtCursor();
      // 0513: unless the band takes its own option on a press, which is the pilot band's — A flies them.
      if (band !== undefined && band.press === 'takes') onChoice(band.name, band.index, false);
      else if (band !== undefined) stepBand(band, 1, true);
      else atCursor()?.click();
    },
    tab(delta: number): void {
      const panel = shownScreen === null ? undefined : panels[shownScreen];
      if (panel === undefined || shownScreen === null || panel.tabs.length === 0) return;
      const tabs = SCREENS[shownScreen].tabs;
      const at = tabs.indexOf(shownScreen);
      const next = tabs[(at + delta + tabs.length) % tabs.length];
      if (next !== undefined && next !== shownScreen) onTab(next);
    },
    setDevice(device: GuideDevice): void {
      for (const each of GUIDE_DEVICES) {
        for (const cell of guideDevices[each]) cell.classList.toggle(prefixFor('guide') + 'controls-device-on', each === device);
      }
    },
    setTimer(seconds: number | null): void {
      const panel = shownScreen === null ? undefined : panels[shownScreen];
      const timer = panel?.timer;
      if (timer === undefined || timer === null) return;
      // Terse, per `docs/game.md`: the screen already says the run is over, so this says only how
      // long it will keep saying it.
      timer.textContent = seconds === null ? '' : String(seconds);
    },
    setChoice(name: ChoiceName, index: number): void {
      for (const screen of Object.keys(panels) as Screen[]) {
        const panel = panels[screen];
        const buttons = panel?.options[name];
        if (panel === undefined || buttons === undefined) continue;
        for (let i = 0; i < buttons.length; i++) {
          const on = i === index;
          buttons[i]!.classList.toggle(prefixFor(screen) + 'option-on', on);
          buttons[i]!.setAttribute('aria-pressed', on ? 'true' : 'false');
        }
        // 0458: the band says the live one's hint, and a step that has nowhere to go is shown as such.
        const band = panel.bands.find((b) => b.name === name);
        if (band === undefined) continue;
        band.index = index;
        sayBand(band);
        // 0513: a band of faces says who the one on it is, on the card under it.
        if (band.faces === 'portraits') paintPilot(screen, GOLFER_KINDS[index]);
        /*
          A face scrolled off a long roster's track is brought back into view when it is chosen.

          ⚠️ **THE TRACK'S OWN scrollLeft, AND IT WAS scrollIntoView.** That scrolls every scrolling
          ancestor too, and the overlay is one (0049): on a window too short for the title it scrolled
          the whole screen to the band at boot, and the name went off the top where nothing scrolls
          back to it — the bug 0049 exists for, which its own guard caught.
        */
        const chosen = buttons[index];
        const track = chosen?.parentElement;
        if (chosen !== undefined && track instanceof HTMLElement && track.scrollWidth > track.clientWidth) {
          const left = chosen.offsetLeft - track.offsetLeft;
          if (left < track.scrollLeft) track.scrollLeft = left;
          else if (left + chosen.offsetWidth > track.scrollLeft + track.clientWidth) track.scrollLeft = left + chosen.offsetWidth - track.clientWidth;
        }
      }
    },
    setOpen(name: ChoiceName, open: readonly boolean[], why: string | null): void {
      for (const screen of Object.keys(panels) as Screen[]) {
        const panel = panels[screen];
        const buttons = panel?.options[name];
        const band = panel?.bands.find((b) => b.name === name);
        if (buttons === undefined || band === undefined) continue;
        band.open = open;
        band.why = why;
        // A shut option is shown and cannot be pressed: `disabled` takes it off the pointer and the reader.
        for (let i = 0; i < buttons.length; i++) buttons[i]!.disabled = open[i] === false;
        sayBand(band);
      }
    },
    setLabels(name: ChoiceName, options: readonly { label: string; hint: string }[]): void {
      for (const screen of Object.keys(panels) as Screen[]) {
        const panel = panels[screen];
        const buttons = panel?.options[name];
        const band = panel?.bands.find((b) => b.name === name);
        if (buttons === undefined || band === undefined) continue;
        for (let i = 0; i < buttons.length; i++) {
          const option = options[i];
          if (option !== undefined) buttons[i]!.textContent = option.label;
        }
        band.hints = options.map((option) => option.hint);
        sayBand(band);
      }
    },
    setFace(face: 'pixel' | 'clean'): void {
      /*
        ⚠️ **Toggled on every screen's overlay and on the readout**, because a face that changed on
        the title and not in the game would be the setting half-applied — and the readout is the one
        piece of chrome the player looks at while flying.
      */
      for (const screen of Object.keys(panels) as Screen[]) {
        panels[screen]?.root.classList.toggle(prefixFor(screen) + 'face-pixel', face === 'pixel');
      }
      hud.classList.toggle(prefixFor('playing') + 'face-pixel', face === 'pixel');
      trigger.classList.toggle(prefixFor('playing') + 'face-pixel', face === 'pixel');
      bossBar.classList.toggle(prefixFor('playing') + 'face-pixel', face === 'pixel');
      scoreBox.classList.toggle(prefixFor('playing') + 'face-pixel', face === 'pixel');
      pause.classList.toggle(prefixFor('playing') + 'face-pixel', face === 'pixel');
      skip.classList.toggle(prefixFor('intro') + 'face-pixel', face === 'pixel');
      bubble.classList.toggle(prefixFor('outro') + 'face-pixel', face === 'pixel');
    },
    setSkipReady(ready: boolean): void {
      skipReady = ready;
      paintSkip();
    },
    setActionShown(screen: Screen, index: number, shown: boolean): void {
      const panel = panels[screen];
      const control = panel?.controls[index];
      if (panel === undefined || control === undefined || control.hidden === !shown) return;
      control.hidden = !shown;
      panel.rows.splice(0, panel.rows.length, ...walkOf(panel.tabs, panel.bands, panel.controls));
    },
    setBubble(line: string | null, shown: number, x: number, y: number, hang: 'above' | 'below', name = '', mark = ''): void {
      if (line === null) {
        if (bubbleLine === null) return;
        bubbleLine = null;
        bubble.classList.remove(prefixFor('outro') + 'bubble-shown');
        return;
      }
      const letters = Math.max(0, Math.min(line.length, shown));
      if (line !== bubbleLine) {
        bubbleLine = line;
        bubbleShown = -1;
        who.textContent = name;
        who.style.borderLeftColor = mark;
        bubble.classList.toggle(prefixFor('outro') + 'bubble-below', hang === 'below');
        bubble.classList.add(prefixFor('outro') + 'bubble-shown');
      }
      // Moved only when it has moved a whole pixel, so a bubble on a ship holding station is left alone.
      const px = Math.round(x);
      const py = Math.round(y);
      if (px !== bubbleX || py !== bubbleY) {
        bubbleX = px;
        bubbleY = py;
        bubble.style.left = `${px}px`;
        bubble.style.top = `${py}px`;
      }
      if (letters === bubbleShown) return;
      bubbleShown = letters;
      said.textContent = line.slice(0, letters);
      unsaid.textContent = line.slice(letters);
    },
    setActionHint(screen: Screen, index: number, hint: string): void {
      const control = panels[screen]?.controls[index];
      if (control === undefined) return;
      const prefix = prefixFor(screen);
      let line = control.querySelector<HTMLElement>('.' + prefix + 'action-hint');
      if (line === null) {
        line = document.createElement('span');
        line.className = prefix + 'action-hint';
        control.appendChild(line);
      }
      line.textContent = hint;
    },
    setCrossing(crossing: Crossing | null): void {
      const parts = panels.travel?.crossing;
      if (parts === undefined || parts === null) return;
      if (crossing === null) {
        parts.place.textContent = '';
        parts.voyage.textContent = '';
        parts.waiting.hidden = true;
        return;
      }
      parts.place.textContent = crossing.place;
      parts.voyage.textContent = crossing.voyage;
      parts.waiting.hidden = !crossing.waiting;
      parts.kicker.textContent = `Leg ${crossing.flown} of ${crossing.legs}`;
      const travel = panels.travel?.root;
      travel?.classList.toggle(prefixFor('travel') + 'leaving', crossing.leaving);
      // The place's own colour, as a custom property, so the stylesheet frames and lights the plate
      // in it without this file knowing what any rule does with it — 0341.
      travel?.style.setProperty('--itc-accent', crossing.accent);
      /*
        ⚠️ **REDRAWN WHEN THE RUN HAS MOVED A LEG AND NOT OTHERWISE** — once per crossing, which is
        once per level. This is called again when the wait line appears, and a chart redrawn for that
        would be forty strokes to change nothing — and a marker restarted for it would fly its leg
        twice. `show` forgets the memo as the crossing is raised, so a second RUN over the same leg
        still draws and still flies.
      */
      if (parts.drawnFlown === crossing.flown) return;
      const ctx = parts.chart.getContext('2d');
      if (ctx === null) return;
      parts.drawnFlown = crossing.flown;
      ctx.clearRect(0, 0, parts.chart.width, parts.chart.height);
      // The palette's own sky ink for a leg not yet flown: the one colour here that means *scenery*.
      drawChart(ctx, parts.chart.width, crossing.palette, crossing.flown, colours.sky);
      /*
        ── AND THE SHIP FLIES THE LEG IT IS ON, ALONG THE CURVE THE BAKE STROKED — 0341 ──────────────

        The path is sampled off `chartTileX` and `chartTileY`, which are the functions `drawChart`
        strokes the route with, so the marker is ON the line by construction rather than by two
        descriptions of a spiral agreeing — `docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md`.
        In the overlay's own 0–100 units, which its `viewBox` scales to whatever size the chart is shown.
      */
      const legs = Math.max(1, crossing.legs);
      const from = Math.max(0, crossing.flown - 1);
      let path = '';
      for (let s = 0; s <= CROSSING_PATH_SAMPLES; s += 1) {
        const u = (from + s / CROSSING_PATH_SAMPLES) / legs;
        path += `${s === 0 ? 'M' : 'L'} ${(chartTileX(u) * 100).toFixed(2)} ${(chartTileY(u) * 100).toFixed(2)} `;
      }
      const end = crossing.flown / legs;
      parts.pulse.setAttribute('cx', (chartTileX(end) * 100).toFixed(2));
      parts.pulse.setAttribute('cy', (chartTileY(end) * 100).toFixed(2));
      parts.motion.setAttribute('path', path);
      /*
        ⚠️ **A PLAYER WHO ASKED FOR LESS MOTION GETS THE SHIP ALREADY ON ITS STOP.** A duration of
        nothing with `fill="freeze"` is the end of the path, held — so the chart still says where the
        run is going, and nothing on it moves. The burn itself is the game and is 0024's *one game,
        and it is the loud one*; this is chrome, and the platform's own setting is the knob over it.
      */
      const still = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
      parts.motion.setAttribute('dur', still ? '0.001s' : `${Math.max(0.1, crossing.seconds).toFixed(2)}s`);
      parts.motion.beginElement();
    },
    setNowPlaying(now: NowPlaying | null): void {
      const parts = panels.music?.now;
      if (parts === undefined || parts === null) return;
      if (now === null) {
        parts.root.hidden = true;
        // 0216: and nothing is playing, so nothing is marked. Left on, it would claim a place is.
        for (const control of panels.music?.controls ?? []) {
          control.classList.remove(prefixFor('music') + 'action-playing');
        }
        /*
          ⚠️ **The drawn place is forgotten as well as hidden**, or a listener who leaves the room and
          comes back to the SAME place gets the ticks that were already there — which is correct today
          and stops being correct the moment a level's script can change between visits.
        */
        parts.drawnFor = '';
        return;
      }
      parts.root.hidden = false;
      /*
        ⚠️ **THE MARK IS ON THE BUTTON, WHICH IS WHERE THE PLAYER IS LOOKING** — 0216. It is the same
        mechanism `setChoice` uses for a setting, because it is the same question: *which of these is
        on*. Toggled over every control rather than only the playing one, so leaving a place marked is
        not a state this can get into.
      */
      const controls = panels.music?.controls ?? [];
      for (let i = 0; i < controls.length; i++) {
        controls[i]!.classList.toggle(prefixFor('music') + 'action-playing', i === now.control);
      }
      // The room's places are its one row of buttons, which is its last row — 0458's walk.
      const actionsRow = (panels.music?.rows.length ?? 1) - 1;
      if (now.follow && now.control !== null && (cursor.row !== actionsRow || now.control !== cursor.col) && shownScreen === 'music') {
        cursor.row = actionsRow;
        cursor.col = now.control;
        paintFocus();
      }
      parts.place.textContent = now.place;
      parts.section.textContent = now.section;
      const percent = (now.through < 0 ? 0 : now.through > 1 ? 1 : now.through) * 100;
      parts.fill.style.width = `${percent.toFixed(1)}%`;
      parts.bar.setAttribute('aria-valuenow', percent.toFixed(0));
      /*
        ⚠️ **The bar's spoken value is the PLACE and the SECTION, not a percentage.** A screen reader
        announcing "62" says nothing about where that is; this is the one control on the screen whose
        number is meaningless without the thing it is a number of.
      */
      parts.bar.setAttribute('aria-valuetext', `${now.section}, ${clockOf(now.at)} of ${clockOf(now.of)}`);
      parts.at.textContent = clockOf(now.at);
      parts.of.textContent = clockOf(now.of);
      parts.next.textContent = now.next === null ? '' : `next: ${now.next}`;
      // The ticks are the level's, so they are redrawn when the level is — see `NowPlaying.marks`.
      if (now.marks === null || parts.drawnFor === now.place) return;
      parts.drawnFor = now.place;
      parts.bar.replaceChildren(parts.fill);
      parts.legend.replaceChildren();
      for (const mark of now.marks) {
        const at = `${(mark.at * 100).toFixed(1)}%`;
        /*
          ⚠️ **The tick at zero is skipped and the name at zero is not.** A boundary drawn on the
          bar's own left border is a thicker border rather than a mark; the label still belongs under
          it, because the first section is a section like any other.
        */
        if (mark.at > 0) {
          const tick = document.createElement('div');
          tick.className = prefixFor('music') + 'now-tick';
          tick.style.left = at;
          parts.bar.appendChild(tick);
        }
        const name = document.createElement('span');
        name.className = prefixFor('music') + 'now-name';
        name.textContent = mark.label;
        name.style.left = at;
        parts.legend.appendChild(name);
      }
    },
    release(): void {
      for (const drop of listeners) drop();
    },
  };
}
