# 0529 — The livery is free

**Accepted 2026-10-05.** Item 9 of [`the-hangar-planned`](../../reports/the-hangar-planned-2026-10-05.md).
On [0527](0527-the-wheels-turn.md)'s *Paint & Parts* tab, with the rule its other looks have.

## The ask

> *"Let's allow custom Livery, if someone wants to make something monstrous on their own game they can
> do that"* — planned as *"a free colour for each ship's body, through a picker a pad, a mouse and a
> thumb can all work. The running lights stay cyan and the high-contrast look stays on roles."*

## The rule

**Once a ship has been won in, its body may be painted any of twelve hues in any of three tones, or left
in the factory's paint. The paint is the body's ink and nothing else's.**

| | |
|---|---|
| **the colours** | `src/content/livery.ts`: twelve hues round the wheel, thirty degrees apart and named, and three tones — deep, bright, pale. Thirty-six bodies and the factory's, each a different ink and none of them one of the palette's own |
| **the picker** | two bands on *Paint & Parts*: *Colour* — the factory's, then the hues, shown one at a time with its arrows on every screen — and *Tone*, open only on a ship painted a hue. A band is the control a pad, a mouse and a thumb already work on every screen in the game; a wheel or a slider would be a new one, with a focus, a drag and a step of its own for each |
| **the paint** | each ship's painter fills its body with the livery where it filled it with its own ink: the fighter's hull and pods, the saucer's disc and pods, the Firebird's lacquer, the estate's gilt above the burl. The running lights, the glass, the trim, the gold, the wood and the wheels keep their inks |
| **the palette** | `liveryFor`: no paint on the high-contrast palette, whose every ink is a meaning. Nothing mounts that palette yet (`src/main.ts` mounts the default), so this is the rule waiting for it |
| **the fit** | the paint joins the `Fit`, so the atlas a run flies, the readout's ship, the card and the intro all wear it; the shell builds every fit in one place (`fitOf`) |
| **kept** | a new field on `itc_hangar` version 1, per ship, a hue and a tone, refused off the lists or on a ship never won in |

## Why it is built the way it is

**Twelve and three, not a wheel.** *Free* was asked for, and a continuous wheel is the freest; it is also
a control the chrome does not have, on three devices. Thirty-six colours across the wheel and down the
tones are free enough to make something monstrous, and every one is a step on a band. If play asks for
finer, a third band of shades is a row, not a control.

**The body, not the palette.** Painting a ship by swapping the palette's player ink would have painted its
running lights, its shot and its readout; the plan asked for the opposite. Each painter names the ink its
body is filled with and takes the paint there.

**The paint is the player's to make monstrous.** No floor holds a livery against the void: a deep violet
fighter is dark, and the ask was that it may be. What keeps the ship findable is what always did — its
outline, its cyan running lights, its exhaust.

**On a phone,** the colour and the tone stand side by side across both columns; on the shortest the card
goes, as it does in *Hangin' Out*. Measured at 1280x720, 844x390 and 480x320, with type widened toward
CI's: nothing scrolls.

## Rollback

`livery` is a new field on `itc_hangar` version 1. Reverting leaves it unread and every ship wears its
factory paint.

## What guards it

`tests/livery.test.ts`: the picker's colours, each different, named for what they are, none a palette
ink; the rule, the tone on a hue and not on the factory's; the palette; the fit; the key.
`tests/livery.browser.test.ts`: the Firebird painted blue on *Paint & Parts*, the tone opening with the
colour, and the card and the readout's ship — the atlas a run flies — both repainted. Probes in
`scripts/probes/0529-the-livery-is-free.mjs`.

## Owed

- A play of a painted ship in every place, and whether a finer picker is wanted.
