# Keepsakes

**Copies of what the game looked like on a given day**, kept because the thing they record is
destroyed by ordinary progress rather than by mistakes.

This is not `reports/`. A report is a finding, argued, with numbers — see
[0027](../docs/decisions/0027-measure-the-picture-not-the-model.md). A keepsake makes no claim at
all: it is a build, frozen, openable.

## Why these are committed and `dist/` is not

Because they are *not* build output. `dist/index.html` is regenerated from the current source on
every build and is worth nothing five commits later; a keepsake is the one copy that will still exist
when the source that produced it does not. It is cheap to keep — the build is a single self-contained
page ([0003](../docs/decisions/0003-single-file-build.md)), so a whole moment in the project's life
is 25 kB and opens straight off a file path with no server.

⚠️ **Never a source of truth.** A keepsake is frozen and unmaintained by definition. Nothing may
import from here, no test may read it, and a difference between a keepsake and the current build is
never evidence of a regression — it is what progress looks like.

## What is here

### `screensaver-2026-08-04.*`

The proof scene, at the commit that first made the ship move. 120 seeded entities drifting past a
camera at the authored scroll rate, drawn with the placeholder shapes 0026 landed: diamonds, boxes,
dots, and one blue arrowhead for the ship.

Kept at the player's request — *"it's a really pretty screensaver at the moment with the placeholder
graphics"* — and the request is the point. This picture is a **transitional state that nothing else
would preserve**: real art replaces every sprite in it, and levels replace the uniform random field
with authored waves. Neither is a loss, and both delete this.

The `.html` is the build itself; double-click it. The `.png` is 1280×720 at 2× after four seconds of
running, for when looking is enough.

⚠️ **The thinning toward the leading edge in the screenshot is real and is not a bug.** The scene
seeds the field once across `MAX_ALONG_SPAN` and then scrolls, so the far end runs out. A real level
is authored ahead of the player and does not.
