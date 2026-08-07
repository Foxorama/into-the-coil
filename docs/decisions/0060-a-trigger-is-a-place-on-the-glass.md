# 0060 — A trigger is a place on the glass

**Accepted 2026-08-07.** Amends the tap strip in `src/app/touch.ts` and adds a picture of it to
`src/app/chrome.ts`. Does not touch
[0030](0030-input-is-actions-and-needs-no-new-layer.md)'s binding table or
[0032](0032-touch-is-relative-drag-and-not-a-stick.md)'s drag: nothing about how the ship is steered
moves.

## The rule

**On glass, the strip is divided by what the ship OWNS, never by what the binding table budgets for**
— clamped into `1…SPECIAL_BINDINGS`, and read per tap because the arsenal grows during a run.

**And it is drawn.** One band per trigger, on the same `TAP_STRIP` of the same canvas, with the
special's real baked sprite and how many are left. It takes **no pointer events**: it is a picture of
where the canvas is listening, not a control.

Shown on a device that reports touch points, and on no other.

## What was reported

> *"How do you fire bombs on mobile? I can do one and then can't fire any more."*

## Two bugs, one symptom, and either one alone leaves it standing

**The strip was `SPECIAL_BINDINGS` bands wide unconditionally.** That number is a *budget* — how many
triggers exist — derived honestly from `ACTIONS` and correct everywhere else in the game. A run
carries one special, so the second band was **a quarter of the screen bound to a slot `onSpecial`
answers with silence**. Landscape puts it low-right, which is where a thumb rests.

**And nothing drew it.** So which half was live could only be discovered by spending a bomb.

⚠️ **The asymmetry with a keyboard is the interesting part.** `src/content/actions.ts` says *a slot
nobody owns is silence*, and that is exactly right for a key: a key nobody has bound is a key the
player does not press, and pressing it costs nothing. A band is a place on **the only surface the
player also steers with**. The same rule, on a different device, becomes a piece of the screen that
swallows taps.

⚠️ **0030's promise survives intact.** *A third special is one table row* — the ceiling moves and
`src/app/touch.ts` is not touched. What changed is that the ceiling stopped pretending to be the
answer.

## Why the strip is a picture and not a row of buttons

A real `<button>` here would take the tap away from `src/app/touch.ts` — which is also the file that
owns *a second finger in the steering area does not steal the drag*. The two would then hold different
opinions about what a second finger means, and they would disagree first on a phone, in play, with a
thumb already down.

So: `pointer-events: none`, `aria-hidden` (the HUD already announces the charges in words), and its
geometry read from `TAP_STRIP` and `bandCount` — the same two numbers the hit test uses. One
description, or the player presses what they can see and something else happens.

⚠️ **The icons are the real baked art**, on the title key's terms: a hand-written glyph would be a
second description of a silhouette, and the day the art pass moves one the strip goes on showing the
old shape. That needed `face` on `SpecialRow`, because `shot` is nullable — `mines` answers *nothing
fires me*, and deriving the face from the weapon would leave exactly the kinds with no weapon yet with
no face either.

## Why the strip is drawn on a capability and not on a guess

`navigator.maxTouchPoints > 0`, read once at boot. The touch listener is attached on every device, so
the honest question is *can a finger land here* rather than *is the player using one* — a laptop with
a touchscreen gets the strip, and the strip is telling it the truth.

⚠️ **The alternative was to reveal it on the first touch, and it is worse in the one case that
matters.** The first touch of a run is as likely to land in the strip as anywhere else, so the player
would discover where the bomb is by spending one.

## Confirmed, not assumed

Probes in `scripts/probes/0060-triggers.mjs`. **6 red, and every tree back to what it was copied as.**

| broken on purpose | went red |
|---|---|
| the strip split by the binding budget again, so half of it fires nothing | `THE REPORTED ONE: with one special owned, every tap in the strip fires it` |
| the band count captured when the device was attached rather than read per tap | `asks for the count on every tap, because the arsenal grows during a run` |
| the clamp on the band count removed, so an arsenal can index past the triggers | `clamps to the binding budget` |
| the strip drawn with a band per binding rather than per owned trigger | `draws one band per owned trigger` |
| the strip given pointer events, so it swallows the tap it advertises | `draws one band per owned trigger` |
| the strip drawn on a device with no touch at all | `is not drawn on a device with nothing to tap it with` |

⚠️ **The picture guard is measured in PIXELS against the canvas** — the strip's right edge on the
canvas's right edge, its width a fraction of the canvas's — per
[0027](0027-measure-the-picture-not-the-model.md). A guard asserting *the strip is `TAP_STRIP` wide*
against the constant `TAP_STRIP` would prove only that the code agrees with itself, which is what that
decision is named for.

## What this leaves owed

**A second special has never existed**, so a two-band strip has been driven only in a fixture. The
guard runs the loop from one band to `SPECIAL_BINDINGS`, which is the most that can be said until
something puts a second entry in the arsenal.

**Whether a quarter of the glass is the right size for the strip has not been played**, and neither
has whether the leading edge is the right end of it for a right-handed player who steers with the
other thumb. `TAP_STRIP` is a starting point on [0037](0037-the-ship-has-mass.md)'s terms.

**The strip is drawn on the canvas's box and the canvas fills the host.** If the playfield is ever
letterboxed inside a larger host, the picture and the hit region part company — the hit test reads the
canvas's own rect and the strip is positioned on the overlay. Named rather than guarded, because there
is nothing to guard yet.
