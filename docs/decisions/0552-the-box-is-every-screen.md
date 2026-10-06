# 0552 — The box is every screen

**Accepted 2026-10-06.** The half of [0080](0080-the-box-is-the-screen-and-the-screen-is-16-9.md) it
left owed — *"we'll add a different viewport for mobile"*. **Supersedes** 0023's and 0080's *every
device gives the player the same box*; their clamp, their lane and their spawn horizon stand.

## The ask

> *"Ok we really need to sort out the mobile vs desktop resolution discrepancies. It looks good on
> desktop at 1980 res now, but I have no idea what it'll look like at higher resolution. On mobile tho
> it's now a good third of the screen is visible dead space. How do we sort it out so there's hardly
> any dead space regardless of resolution do we need to add a resolution setting? Originally I said it
> should be the exact same game, but that doesn't seem viable so now I don't care if it's different
> gameplay, I just want all resolutions to have good gameplay."*

## What was measured, before anything moved

Off the built page at `81a86a4`, every camera a real screen in CSS pixels, photographed through a run:

- **Resolution is not the variable; aspect is.** 1920×945, 2560×1305 and 1920×945 at a device scale of
  two are the same picture at three sizes: the view is `ACROSS_SPAN` tall in world units and the atlas
  is baked at `view.scale × dpr` ([0022](0022-frame-rate-is-a-feature.md)'s cap of 2), so a 1440p or 4K
  monitor is the 1080p game, sharper. **No resolution setting is needed**, and one would only offer the
  player a way to make the art blurrier.
- **The dead space is the box, not a letterbox.** Every landscape phone in the table is inside the
  clamp and fills the glass with sky; the portrait phone is asked to turn sideways. What a phone could
  not use was the front of the picture: the box was `PLAYER_ALONG_SPAN` — the 16:9 view's 213 units —
  on every screen, so the ship's wall stood at:

| screen | view along | the wall | out of reach ahead |
|---|---|---|---|
| 16:9 monitor, full screen | 213.3 | 202.7 | 5% |
| 1080p browser window under the 75 px bar | 265.0 | 202.7 | **24%** |
| 19.5:9 phone | 259.7 | 202.7 | **22%** |
| 20:9 phone | 266.5 | 202.7 | **24%** |
| 21:9 phone, or a phone under its toolbar | 280–288 | 202.7 | **28–30%** |

With the trailing margin, a 21:9 phone's ship could fly in 66% of the lane it was shown — *"a good
third"*, measured. The desktop's own browser window was a quarter dead too; it had not been reported.

## The rule

**The ship's forward wall is the front of the screen it is on, less the same clear air on every
screen.** `leadFor(alongSpan)` is `PLAYER_LEAD + boxPastFor(alongSpan)`, and `boxPastFor` is how much
further the view reaches than the narrowest one — zero on 16:9, so every 16:9 number is what it was.

| | follows the device's box | stays on the narrowest one |
|---|---|---|
| the clamp, the wall's mark, *when* the mark shows | ✓ | |
| the boss's station, and the room's far wall and roots | ✓ moved on by `boxPastFor` | |
| a pickup's wander and where it slows; a charger's turn; a fall of bodies, lightning, rocks, the breaker's wave | ✓ | |
| the wheel's no-fly wall; a flank's opening in the corridor | ✓ | |
| a corridor's end and the carve pool's size — level boundaries, no device | the widest box, `leadFor(MAX_ALONG_SPAN)` | |
| the trailing margin, the lane, the spawn horizon, `MAX_ASPECT` | | ✓ |

## Why it is built the way it is

**The extra air is added at the front, and the clear air in front of the wall stays a distance.**
`PLAYER_ALONG_MARGIN` is how far the ship at its wall stands from the place a wave becomes visible, and
an arrival is a speed in world units — so the reaction it buys is the same on every screen in units,
not in shares. A fraction of a wider view would hand the 21:9 player 3.7 more units of warning for no
reason anyone gave.

**The boss is moved on by the same amount, because a fight is measured from the front.** Left where 16:9
put it, a boss on a phone stood mid-screen and the ship could fly round the front of it. Moved on by
`boxPastFor`, the fight is the 16:9 fight measured from the leading edge, and what a wider screen adds
is room *behind* the ship — the room pieces already did exactly this
([0498](0498-the-roots-meet-the-edge.md)), so the bound's picture is still outside the bound.

**Everything drawn across the box follows it, or the box has a safe strip.** Lightning, rockfalls, the
breaker's spines and a fall of bodies were drawn between the margin and the narrowest wall; on a phone
that left a quarter of the reachable box where none of them could land, which is a place to stand rather
than a fight.

**The flanker's ceiling rose by the clear air.** A ship at the front of the widest box stands 10.7 units
short of the horizon, and a ceiling AT the horizon put its flanker 11 units in front of it rather than
[0197](0197-a-wave-arrives-as-a-wave.md)'s 24. `FLANK_CEILING` is `MAX_ALONG_SPAN + FLANK_CLEAR_AIR`:
still short of `spawnAlong`, and a body entering past the edge slides in as the 16:9 one already did.

**The room's wall and the mark are moved by the painter, not stored.** `room.to` and `BOUND.inView` stay
the narrowest view's, and `src/render/scene.ts` adds `boxPastFor(view.alongSpan)` — so a resize
mid-fight moves the wall, the mark and the clamp on the same step.

## What it costs, named rather than discovered

- **Different screens play differently, which the player has now asked for.** A wider screen keeps the
  lookahead it always had ([0364](0364-the-view-zooms-out.md)) and now also gets room to fly in it. The
  spawn horizon and every level's timing are unchanged.
- **On a phone the front of the box is under the trigger discs.** The discs stand up the leading edge
  ([0465](0465-the-chrome-fits-the-phone.md)) at 35% glass, so a ship there is seen through them. It is
  the play's to say whether that wants the discs moved; nothing here moves them.
- **A boss's entrance is still authored on the 16:9 screen.** It flies its path and then closes on the
  moved station at its approach rate, which is a slide forward of up to 75 units on the widest view —
  watchable rather than a jump, and owed a look.

## Rejected

- **A resolution setting.** Resolution never changed the picture; aspect does, and the aspect is the
  device's.
- **Raising `MAX_ASPECT` so a toolbar-squeezed phone or a 32:9 monitor loses its bars.** The bars are
  4–10% of the width and filled with the sky; `MAX_ALONG_SPAN` is the spawn horizon, and moving it moves
  every wave of every level later on every device.
- **A per-device zoom (a smaller `ACROSS_SPAN` on a phone).** It moves the dodge lane — the difficulty
  axis every speed is measured against — and the report was about room, not size.
- **Showing the extra span behind the camera instead**, so lookahead is equal everywhere. Everything
  that culls, enters or turns at the trailing edge would vanish in the middle of a wide screen.

## What guards it

| broken on purpose | went red |
|---|---|
| the clamp back at the narrowest view's wall | `tests/bound.test.ts` — *the strip in front of the wall is a sliver, and the wall is drawn where the ship stops*, through the real frame and painter on five screens; and `tests/flight.test.ts` — *the ship reaches the front of the picture*, on nine |
| the wall's mark left behind while the clamp moved | the same `tests/bound.test.ts` guard, in pixels |
| the boss left at the 16:9 station | `tests/level.test.ts` — *on a phone it holds the same place from the screen's front edge* |
| the flanker's ceiling back at the horizon | `tests/spawns.test.ts` — *a flanker never enters behind the ship*, now asked over every ship position in the device's box |

⚠️ **0080's first probe was re-aimed, and that is a finding.** It put the aspect floor back at 1.5 and
expected the strip guard to go red; it no longer can, because the box follows the view and a lower floor
leaves none of a 16:9 screen out of reach. What the floor still breaks is `PLAYER_LEAD` being the 16:9
screen's wall, and *the ship really is against it* is the guard that says so.

`scripts/probes/0552-the-box-is-every-screen.mjs`. **Owed: a play on a phone**, and a look at a boss
entrance on one.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
