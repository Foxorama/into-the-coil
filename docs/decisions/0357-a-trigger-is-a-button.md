# 0357 — A trigger is a button

**Accepted 2026-09-23.** **Amends [0060](0060-a-trigger-is-a-place-on-the-glass.md)** by one shape:
the place on the glass is a disc under the thumb, not the leading quarter of the screen. Everything
else 0060 decided holds — the count is what the ship owns, the picture is drawn from the hit test's
own numbers, it takes no pointer events, and it is shown on a capability.

## The ask

> *"On mobile add a bomb button."*

> *"Can we get rid of the shitty dotted line on the right hand side of the screen for the no fly
> zone?"*

The second sentence is two lines at once. On every device it is the wall 0074 drew —
[0358](0358-the-wall-is-drawn-while-it-is-met.md) answers that. On a device with touch it is also the
dashed edge 0060 drew down the tap strip, a quarter of the screen in, and a quarter of the glass the
ship could not be flown from. This decision answers that one.

## The rule

**A trigger is a disc the size of a thumb in the leading-low corner of the glass**, stacked up the
leading edge when the ship owns more than one special; **everything else on the glass steers.** Its
size, its insets and its hit reach are one table, `TRIGGER_BUTTON` in `src/app/touch.ts`, as
fractions of the SHORT edge — and the picture in `src/app/chrome.ts` is that table interpolated into
the stylesheet, in container units of the glass's own short edge.

| | fraction of the short edge | on a 390px phone |
|---|---|---|
| the drawn disc | 0.17 | 66px |
| in from each edge | 0.05 | 20px |
| between two discs | 0.05 | 20px |
| the hit circle | 1.3 × the drawn radius | 86px |

## Why a disc and not a smaller strip

A strip is the honest picture of a hit region shaped like a strip, and 0060 was right to draw one.
What was wrong was the region. **A quarter of the only surface the player also steers with was a
place a drag could not start**, and the edge that advertised it read — in the player's words — as a
no-fly zone. Shrinking the strip to a sliver would keep both defects at a smaller size: a band the
full height of the screen is still a place the ship cannot be steered from, and its edge is still a
line down the playfield.

A disc has an inside and an outside, and the outside is the whole of the rest of the glass.

## Why the hit circle is bigger than the disc

A thumb lands on the edge of the thing it aims at as often as on its middle. A button that heard only
its own disc would be 0060's dead half again — a tap the player watched land, answered with silence.
The reach is a multiple of the drawn radius rather than a pixel count, so it scales with the disc.

## Why the SHORT edge

[0049](0049-the-chrome-is-authored-against-the-short-axis.md). A thumb is the same size on every
phone, and the short edge is the one a landscape phone is short of; a disc sized against the long
edge would be a third larger on a 21:9 phone than on a 16:9 one for no reason a thumb can feel.

## Why it is still not a `<button>`

0060's argument is unchanged and is repeated here because it is the first thing the next hand will
reach for. A real control would take the tap away from `src/app/touch.ts`, which is also the file
that owns *a second finger in the steering area does not steal the drag*. The two would then hold
different opinions about what a second finger means, and disagree first on a phone, in play, with a
thumb already down. So: `pointer-events: none`, `aria-hidden`, and the geometry read from the same
table the hit test reads.

## What the picture is measured against

The browser guard compares the disc's centre and diameter on the canvas to `triggerX`, `triggerY`
and `triggerRadius` — the hit test's own arithmetic — and not to the constants, because the CSS is
the constants interpolated and a test that read them back would prove only that the code agrees with
itself ([0027](0027-measure-the-picture-not-the-model.md)). One assertion is in the player's units:
the disc is wider than a fingertip, 44px, on the glass it is drawn on.

## Confirmed, not assumed

Probes in `scripts/probes/0357-button.mjs`, and 0060's six re-anchored on the button.

| broken on purpose | went red |
|---|---|
| the leading quarter of the glass made the trigger again | `THE ASK: where the strip was is steering now` |
| the hit circle shrunk to the drawn disc | `and a tap just past the drawn rim still counts` |
| the picture inset twice what the hit test is | `draws one button per owned trigger, where the hit test listens` |

## What this deliberately does not do

**It does not move the button for a left-handed player.** The leading-low corner is where a right
thumb rests on a phone held in two hands; a setting for the other corner is a row in the settings
table on [0070](0070-a-style-is-a-setting-and-the-first-one.md)'s terms, when a hand asks for it.

**It does not give the desktop a button.** A mouse is not a finger ([0032](0032-touch-is-relative-drag-and-not-a-stick.md)),
and the bomb is on `Space`.

## What this leaves owed

**The size has been measured and not played.** 66px on a 390px phone is a common size for a thumb
control and nothing more; the first play on a phone says whether it is too small under a moving thumb
or in the way of a dodge into the corner.
