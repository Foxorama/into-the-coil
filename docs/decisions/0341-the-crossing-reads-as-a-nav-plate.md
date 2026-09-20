# 0341 — The crossing reads as a nav plate, and is a second longer

**Accepted 2026-09-20.** **Amends [0340](0340-the-coil-is-a-route.md)**: the banner's look, and the
scene's floor. Nothing about how the burn works moves.

## The report

> *"Level transition is great now, if anything could be slightly longer. The popup explaining things
> could use an awful lot of love tho, it's pretty basic at the moment graphically wise."*

Both halves are right about what was built. The banner was a dark rounded box with a heading in it —
the same box every dimmed panel in the game is, which is fine over a dim and is the plainest thing on
the screen over a sky at twelve times its speed.

## The rule

**The plate is lit in the colour of the place it names.** Every other panel is drawn in `--itc-ink`,
the player's cyan, because every other panel is about the player. This one is about somewhere. The
shell pushes `THEMES[kind].glow[palette]` with the words, the chrome sets it as `--itc-accent`, and
every rule on the plate reads it — the frame, the wash down from the top, the disc behind the chart,
the kicker, the name and the glow behind the name. Six crossings are six plates.

⚠️ **THAT IS [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s TEST, ASKED OF
CHROME**: *a change is finished when the thing it added can differ per instance.* And it is per
PALETTE, which is what keeps [0024](0024-the-accessibility-floor-is-settings.md) whole — a
high-contrast player gets each place's high-contrast colour.

## What it is made of

| | |
|---|---|
| the frame | two cut corners, a hairline border, and a diagonal hairline drawn across each cut — a clipped corner has no border, so the cuts would otherwise be the backing simply stopping |
| the backing | the void at four fifths, a wash of the accent down from the top, and scanlines. **No backdrop blur**: a filter over a canvas repainting sixty times a second is a full-screen effect per frame to soften a caption |
| the chart | in an instrument — a disc of the place's light with a ring round it |
| on the chart | **the ship flies the leg it is on**, and the destination pulses |
| the words | a `LEG 4 OF 6` kicker, the name large and letter-spaced, a rule that draws itself in, the place's line |
| arriving | down from the top edge with the burn, each line rising a few hundredths after the last; back up to the edge as the burn trails off |

⚠️ **THE MARKER IS AN SVG OVER THE CANVAS, NOT A REPAINT.** The route is a drawing, painted once per
crossing; a marker on it would be a repaint every frame from a file that is cold on purpose. An
`animateMotion` is the browser's own clock moving one element along one path, and its path is sampled
off `chartTileX` and `chartTileY` — the functions `drawChart` strokes the route with — so the ship is
on the line by construction ([0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)). It
takes the burn's own length to arrive, and if the burn is held for the music it waits on its stop,
which is what the ship is doing too.

⚠️ **A PLACE'S COLOUR IS NOT PROMISED TO BE LEGIBLE, SO THE TYPE IS MIXED TOWARDS WHITE.** It was
designed against Rime Shelf's teal, and 0282 says a quantity solved from one case is checked in
every case it runs in: The Approach's accent is dim and the high-contrast column's are dimmer.
`tests/travel.test.ts` reads the mix **out of the stylesheet** rather than retyping it, and holds the
name and the kicker to WCAG AA on the lightest the plate can be, for all seven places in both
palettes. Fourteen cells, all clear.

⚠️ **AND A PLAYER WHO ASKED THE PLATFORM FOR LESS MOTION GETS THE PLATE WITHOUT THE CHOREOGRAPHY** —
no stagger, no drawn rule, no pulse, and the marker parked on its stop. The burn itself is the game and
is 0024's *one game, and it is the loud one*; this is chrome over it.

## A second longer

Four seconds became five, and the whole second went on the time at **full** burn — two and a half
seconds of it rather than one and a half. The build and the tail were asked for by shape in 0340 and
are not what *longer* is about. *Brief* is unchanged at three. It is still a play-test number, now with
one datum: *slightly* is the player's word, and a second is a quarter of what it was.

## Confirmed, not assumed

Probes in `scripts/probes/0341-the-crossing-reads-as-a-nav-plate.mjs`. The frame back in the player's
ink — which is also what a typo in the property's name looks like, and fails by looking fine — is
caught by handing the plate a red no place has and reading its computed border. The name in its raw
accent is caught by the contrast guard. The second taken back is caught by the guard written in
seconds. 0340's probe for the banner's backing is re-anchored: the backing became five layers.

⚠️ **NO GUARD HOLDS THE MARKER BEING ON THE ROUTE, AND THE REASON IS WHERE IT IS BUILT.** Its path is
made inside `setCrossing`, which only the shell calls, and the shipped page exposes nothing that
raises a crossing without winning a boss fight. The browser test holds that the marker and its
animation exist; that it is ON the line was looked at on the bench (`?cross=N`,
`scripts/shot-travel.mjs`) at two legs. That it shares the bake's two functions rather than a copy of
the curve is the structural half, and is why a guard was not invented for it.

## What this leaves owed

**The plate has been photographed and not played.** A still cannot see the stagger, the drawn rule,
the pulse or the marker moving — 0340 says the same of a cut, from having been caught by it.

**The burn is still silent**, which is 0340's and unchanged.
