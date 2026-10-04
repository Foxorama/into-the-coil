# 0498 — The roots meet the edge

**Accepted 2026-10-04.** Discharges the first thing [0459](0459-the-bosses-are-placed.md) left owed,
*the roots on a wide screen*, for the pieces [0488](0488-the-roots-are-roots.md) placed.

## The ask

Played on a 19.5:9 phone, with a screenshot of the serpent's fight:

> *"the screensize mobile with the walls we added to the serpent level is pretty bad"*

## What was true

The serpent's room is framed by placed root pieces, each at an `along` from the resting camera — the
camera's near edge. They were authored on the 16:9 screen, which is the narrowest any device gets
([0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md)) and shows 213 units along. A 19.5:9
phone shows 260, so the far trunk, which straddles the far edge of a monitor, stood about four fifths
of the way across the phone. Past it was open sky, with the serpent's body running across that sky
and off the screen. The frame framed nothing.

## The rule

**The root frame hangs from the screen's far edge.** In `paintRoom` every piece except the entrance
knot is moved along by however much more than the 16:9 screen this screen shows
(`view.alongSpan − PLAYER_ALONG_SPAN`, never less than nothing). On a 16:9 monitor that is zero and
nothing moves. On every wider screen the frame is the same picture, at the same distance from the far
edge: the far side framed, and the near side open sky.

**The knot is not moved**, because it is where the serpent coils as it arrives, and the serpent is in
the world.

## Why it is the painter's and not the row's

The frame is scenery. What it pictures is a bound the ship already has: the ship's box is the 16:9
screen on every device, and the far roots stand beyond it. Every piece moves *away* from the ship, so
the picture of the bound is still outside the bound, and nothing the sim asks changes with the
device. A row authored against the widest screen instead would put the far roots off a monitor's
edge, so the screen the game is judged on (0153) would lose the frame to fix the phone.

## Not changed

**The Labyrinth's tiled room.** Its far wall stands at the box's edge too, so a phone shows a strip
past it. But the gyre's wreck falls out of that wall in the world
([0337](0337-the-gyre-falls-out-of-the-wall.md)), and a wall drawn further off would leave the wreck
falling out of nothing. It was not reported, and it is named here as the next to look at.

## Confirmed

`tests/serpent.test.ts`, *THE REPORTED ONE, IN SHARES OF THE SCREEN*: the serpent stood at rest and
the room painted on a 1920×1080 monitor, an 844×390 phone and a 2400×1000 screen; the farthest root
lands the same distance past the far edge on all three, in screen heights. Without the change the
phone's is 0.23 of a screen height short of the edge where the monitor's is 0.16 past it. 0498's probe
puts the near-edge placement back.

**Owed:** a play of the serpent's fight on the phone.
