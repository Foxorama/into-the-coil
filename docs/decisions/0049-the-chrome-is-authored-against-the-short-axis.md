# 0049 — The chrome is authored against the short axis

**Accepted 2026-08-06.** A bug report, with a photograph attached: *"well this is a problem — title
screen on mobile."* The game's own name was off the top of the phone, and the third difficulty tier
was off the bottom with no way to reach it.

## The rule

| | |
|---|---|
| **the overlay** | a **query container** and a **scroll container**. Nothing else lives on it |
| **every size on a screen** | a fraction of **that box** (`cq` units), capped at a comfortable rem |
| **centring** | `margin: auto` on one panel — never `justify-content` or `align-items` on the overlay |
| **a list of things** | goes across the **long** axis. The short axis carries the taller column, not the sum |
| **a column that must not collapse** | a **fractional grid track**, never a flex item's natural width |
| **type** | has a floor. Below it the screen overflows rather than shrinking further |
| **scrolling** | the net for a viewport nobody could design for. Never the design |

Held by `tests/layout.browser.test.ts`, which measures **CSS pixels against the viewport on six real
devices** — [0027](0027-measure-the-picture-not-the-model.md)'s *"at least one assertion in units the
player experiences"*, and here it is the only kind worth having.

## What actually went wrong, which is three things and not one

The title screen stacked six items down the page: a heading, a three-row pickup key, and three tier
buttons. On a 1280×720 window that is 565 pixels of content in 720 pixels of height and it looks
composed. On the phone it was photographed on it is 565 pixels of content in **375**.

**1 — The long axis was empty and the short axis was doing all the work.** Landscape is the shipped
orientation ([0031](0031-landscape-is-the-shipped-orientation.md)), so every screen the player sees
is wide and short: a phone gives 320–412 CSS pixels of height and two to three times that of width.
The key and the tiers are independent of each other, so they now sit **side by side** and the short
axis carries whichever is taller rather than their sum. That is the whole fix; the rest is what keeps
it fixed.

**2 — Every size was a constant.** `padding: 2rem`, `gap: 1.5rem`, `font: 1.25rem` — 64 + 96 + type
that never shrinks, on a box whose height is not a constant. They are now `min(<the comfortable
size>, <a fraction of the box>)`, so the design degrades on the axis that ran out.

⚠️ **`cq` units and not `vh`, and the difference is not pedantry.** The overlay is `inset: 0` on
whatever element the game is mounted into. On the shipped page that is the viewport; inside the itch
iframe it is the iframe; on a page that embeds the game beside other content it is neither. `vh` is a
guess that is usually right, and the box is a measurement that always is. It costs one declaration —
`container-type: size` — and one constraint: **a container cannot query itself**, so the font and
padding live on the panel rather than on the overlay.

**3 — The heading was not cut off, it was GONE, and that is a different bug.** The overlay centred
its children with `justify-content: center`. A flex container centres an overflowing child too — half
of it is pushed off the **start** edge, which is the one edge no scrollbar can reach. So the top of
the screen was not merely below the fold, it was outside the document's reach entirely.

⚠️ **Auto margins are the fix and they are not a trick.** `margin: auto` distributes *positive* free
space only; when there is none, it computes to zero and the panel falls back to the top. Centred when
it fits, top-aligned when it does not, in one declaration and with no breakpoint to get wrong.

## The first fix was a wrapping flex row, and CI caught it in a font

⚠️ **The two columns were a `flex-wrap: wrap` row, and it passed every check on this machine.** A
flex row wraps when its items' **natural widths** do not fit — and a natural width is a text
measurement. On the Linux runner `system-ui` resolves to a different font with wider metrics, the two
columns stacked, and 67 pixels went off the bottom of a 480×320 phone. Same CSS, same browser engine,
different font.

**A layout that depends on text fitting depends on the font, and the font is not a thing this
repository controls** — not on a CI runner, not on a player's phone, not when a user has set a
different default. So the row is a **grid with fractional tracks**: a track is a fraction of its
container and cannot be pushed wider by what is in it. `minmax(0, 4fr)` rather than `4fr`, because a
track's default floor is its content's min-content width, which is the same blowout wearing grid
syntax.

Vertical size is now font-metric-independent too: `line-height` is a **multiple** rather than
`normal`, so a line box is exactly 1.35em whatever the face's ascent and descent are. The one thing
that could still change a height is text wrapping onto another line, and the tracks are sized with
room for it.

⚠️ **This is the same class of mistake as the bug being fixed**, one level down: *it looked right
where it was written*. The reason it was caught at all is that the guard runs at the sizes rather
than reading the stylesheet.

## Scrolling is the net, and the guard says so twice

The overlay scrolls, so a viewport smaller than anything in the device list still yields every
control. That is deliberately **not** the design: a player looking at a title screen has no reason to
suspect there is a third difficulty below the fold, and on a gamepad there is no gesture for it. So
the suite asserts the fit **and** the net, separately — `needs no scrolling on any of them, because
scrolling is the net and not the design` would go red if a future screen started relying on it.

## What `npm run prove` caught, and it is the whole reason this file has a section about it

⚠️ **Two of the four probes ran against the first draft of the guard and the suite stayed GREEN.**
Both were about the net, and both had the same cause: the test reached the last control by
**assigning `scrollTop`**.

- `overflow: hidden` scrolls perfectly well from script. It is only the *player* who cannot scroll
  it. So the probe that deleted the scroll container changed nothing the test could see.
- The panel re-centred with `align-self: center` overflowed by 13 pixels at the test's viewport, and
  the panel's own padding kept the *heading* on screen — so an assertion about the heading passed
  while the rule it stood for was broken.

The guard now performs the gesture instead — `page.mouse.wheel` — and measures **the panel's own top
edge**, which is the thing centring moves. [0005](0005-a-guard-must-be-seen-to-fail.md) is why either
was noticed: the fix was already correct and shipped-looking, and both probes are the kind that would
have sat green for months.

⚠️ **A third probe went red on the wrong test, and the reason is worth carrying forward.** A heading
pinned at a fixed size overflows a 480×320 phone, and the assertion that caught it was *needs no
scrolling* rather than *everything is inside the display* — because the first thing pushed past the
bottom edge is the panel's own **padding**, which is not a box any assertion about boxes can see. A
screen stops fitting some way before anything on it has visibly left.

⚠️ **The type scale was RAISED because of these probes, not despite them.** The first pass shrank
padding, gaps and type until 480×320 had 66 pixels of slack — at which point no single declaration
could be broken and seen to matter, and *"sizes are a fraction of the box"* was a rule with no
consequence at any device in the list. A guard that cannot go red means the code is not doing what
the rule says, and here the honest fix was to give the player larger type rather than to write a
weaker probe. [0005](0005-a-guard-must-be-seen-to-fail.md) improving the product rather than the
suite is the outcome it exists for.

⚠️ **And the net's test now asserts its own premise** — that the viewport really is too small for the
screen — because everything it checks is about what happens when a screen does not fit, and a
viewport it fits on tests nothing while passing. [0019](0019-a-probe-must-be-seen-to-apply.md) is the
same failure one level down.

## What was rejected

**A breakpoint.** `@media (max-height: 480px)` with a second layout behind it is two descriptions of
one screen, and the one nobody is looking at is the one that rots — which is exactly how this bug
happened, except the un-looked-at case was the *only* one a player has.

**Shrinking the type until it fit in one column.** At 320 pixels of height that is roughly 11px
buttons, which fails [0024](0024-the-accessibility-floor-is-settings.md)'s floor in the ordinary way:
legible to the person who wrote it, on the monitor they wrote it on. The type floor in the rule table
is the same argument stated positively: a box short enough to need 5px buttons gets an overflowing
screen and the scroll net, because a screen that "fits" the way a photograph of it fits has not fit.

**Letting the layout grow on a big monitor.** The caps are still rem, so a 2400-pixel-wide desktop
draws exactly what it drew before. That is a real judgement — the title screen is small in the middle
of a large display — and it is **not** what was reported. It stays open.

## Confirmed, not assumed

`npm run prove 0049` — every guard broken on purpose and seen to fail.

| broken | what went red |
|---|---|
| the title screen stacked down the short axis again, instead of across the long one | `the phone this bug was reported from` |
| the heading typeset at a fixed size rather than as a fraction of the box it has to fit | `needs no scrolling on any of them` |
| the panel centred by the container again, so an overflowing screen loses its top | `keeps its first line on the display and its last control one scroll away` |
| the overlay stopped scrolling, so a screen too tall for the viewport is unreachable | `keeps its first line on the display and its last control one scroll away` |

The picture was looked at as well as measured, at 480×320, 812×375, 1280×720 and 2400×1080 —
`scripts/shot.mjs --start=no`, which is the rig [0027](0027-measure-the-picture-not-the-model.md)
exists to insist on.
