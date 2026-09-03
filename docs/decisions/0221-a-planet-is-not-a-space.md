# 0221 — A planet is not a space

**Accepted 2026-09-04.** The day after [0220](0220-a-place-is-somewhere-you-are.md), against its own work.

> *"the planets still have the starry space backdrop visible, ground features need be properly have
> nothing behind them and the sky in the background needs to match the sky"*
>
> *"saurian needs blue skies… rime shelf needs to be icy and austere… toxic mire is also a planet, but
> needs an overhanging canopy so that it feels like you're flying through a tight narrow corridor above
> the toxic pools below and beneath the overhanging canopy above"*

## The rules

- **A place has land or it is in space**, and `THEMES[theme].ground` is which.
- **A place with land draws an opaque ground tile, last in its sky, and has no star fields.**
- **Land is darker than the sky over it**, in every palette.

## ⚠️ Three faults, one cause, and 0220's guards were green through all of it

0220 put a planet's ridges in `STRUCTURE_OF`, which paints marks **at an alpha** onto the **weather
tile** — and the weather tile is drawn *first*, with both star fields after it. So:

| reported | what it actually was |
|---|---|
| the starry backdrop is still visible | `skyFar` and `skyNear` drawn on top of the mountains |
| ground features have things behind them | ridges at 0.45, 0.64 and 0.88 alpha |
| the sky doesn't match the sky | `space` was still the void, because nothing had said it was a sky |

⚠️ **AND 0220 HELD *WHERE THE SKYLINE SITS* AND *THAT THE RIDGES RECEDE* — both true the whole time.**
A guard on the right quantity in the wrong layer is still green. That is
[0027](0027-measure-the-picture-not-the-model.md) one level up: the model of a horizon was correct and
the horizon was see-through and behind the stars.

## ⚠️ Order and depth are independent, and conflating them is the tempting fix

A mountain range is far away **and** in front of everything behind it. `paintScene` walks the sky array
in order and that is the only thing deciding what covers what; `depth` decides only how fast a layer
goes past. The ground is **last in the array at 0.45** — nearly the slowest thing in the place, and in
front of all of it. Sorting the sky by depth is the obvious tidy-up and it puts the land back behind
the stars; there is a probe for exactly that.

## ⚠️ *Blue skies* and *daylight* are two different asks, and only one is available

`THEMES[].space` is the colour every ink's contrast is measured against
([0198](0198-the-accessibility-pass-comes-after-the-game.md), `tests/sky.test.ts`). Measured, on the
worst ink:

| | `enemy` on the bare backdrop |
|---|---|
| floor | **3.00** |
| Saurian Belt, before | 5.93 |
| **Saurian Belt, `#16305a`** | **4.07** |
| Rime Shelf, `#1a3a50` | 3.70 |
| a daylight blue (`#1b3a6b`) | 3.51 |
| anything brighter | under the floor |

**This is a dark game by construction** — [0024](0024-the-accessibility-floor-is-settings.md), *there is
one game and it is the loud one*. What a night-blue buys is that the place stops being the void, which
is what was reported; a noon sky was never on the table and saying so is better than shipping one and
losing the floor.

## ⚠️ Austere is a count before it is a shape

0220 gave Rime Shelf three terraces of stepped tables with a corner every twentieth of a tile, and the
bench showed **a city skyline**. There are two now, with long runs, and the only thing that happens on
them is the occasional pressure ridge. What makes a place austere is that there is nothing to look at,
not that there is something bleak to look at.

## ⚠️ The mire's corridor is bounded from both ends, and they pull against each other

*Tight* is what was asked for; *the player cannot fly down it* is a bug. The lane is a fixed 100 units
and the ship uses all of it ([0023](0023-the-long-axis-is-the-scroll-axis.md)), so the corridor cannot
be narrow the way a wall is. It measures **33 lane units against a ship 7 across** — floor at three
ship-widths, ceiling at 55.

⚠️ **THE CEILING WAS 72 AND `npm run prove` REFUSED IT.** The probe — the canopy lifted to tile 0.27,
half out of the frame — came back **STILL GREEN**, because the gap only reached 59 of a permitted 72. A
bound loose enough to admit the break it was written for is not a bound.

## ⚠️ Squaring a one-sided draw is what makes something hang

A skyline sampled evenly around a base is a mountain range upside down, and the bench showed a smooth
hill with nothing overhanging anything. A uniform draw puts most of its mass in the middle of its
range: busy everywhere, extreme nowhere. Squaring pushes the mass to zero and leaves the occasional
long reach — which is the difference between *a bumpy ceiling* and *things hanging off one*.

## ⚠️ What a dark structure mark is drawn in, and it used to be the palette's void

`paintStructure` draws an unlit mark as *a hole in the gas* — the backdrop's colour — and was handed
`colours.space`, the **palette's**, which for the four places in space is within a few percent of the
theme's and was therefore never wrong enough to see. On a planet it is wrong by the whole sky. A place
with land now uses the colour of **its land**: a silhouette over a planet is made of the same stuff the
ground is, which is both true and the reason it is dark.

⚠️ **AND RIME SHELF'S BLOWING ICE IS THE FIRST LIT FIELD IN THE GAME.** Drawn dark it came out of the
bench as black scratches across the one place whose backdrop is bright. `lit` already existed for this,
and 0211 said in as many words that it is a contrast measurement rather than a house style.

## ⚠️ The mire needed a third colour, because its sky is a murk on purpose

`land` and `sky` are the two a horizon needs. *"The toxic pools below"* have to **glow**, and this
place's sky is deliberately darker than anything it separates — so water drawn in it is a black pool in
a black bank. `glow` is the place's own gas: the pools and the haze over them are lit by one thing
rather than by two.

And the air itself went from `#1c2a10` to `#111a08` for the same reason. Every other place's `space` is
something you look **through** at nothing; here it is something you look through at a roof and a floor,
and it has to be darker than both the things it separates are lit by.

## What is held

| claim | how |
|---|---|
| a place has land in `THEMES` exactly when it draws land | `tests/places.test.ts` |
| a planet has no field of stars | same, off `skyFor` |
| the ground is drawn last | same |
| the ground is opaque, and its masses cross the tile | same, through `tests/paths.ts` |
| its skyline is on the lane | same, in lane units |
| land is darker than the sky over it | same, by luminance, in every palette |
| the mire's corridor fits the ship and is still an enclosure | same, against `SPRITE_EXTENT.ship` |
| neither sky puts anything but streaks in front of the game | `tests/budget.test.ts`, **both arrays** |

⚠️ **`tests/budget.test.ts` NOW WALKS BOTH SKIES, AND EVERY RULE IN IT WAS WRITTEN WHEN THERE WAS
ONE.** A second array is a second sky nobody was checking: 0069's *nothing crosses in front of the game
but the streaks*, 0065's fixed blit count and the tiling coverage all had to grow a loop. The rules
about the two star **fields** stay on `SKY`, because a planet does not have them.

⚠️ **`tests/paths.ts` GREW AN `alpha` ON A PASS, FOR THIS AND NOTHING ELSE.** *Nothing behind it* is not
a shape, a position or a size — it is one number, and without it in the trace the only way to check it
was to read the source and believe it.

## What is owed

**Two of the five asks in this report are not in it**, and are named rather than quietly dropped:

- **Saurian Belt's volcanoes** — *"exploding volcanoes adding volcanic effects at some points in the
  level"*. That is `LANDMARK_OF.saurian` and several `landmarks` entries, on the Pillars' own terms;
  *at some points in the level* is a position, which is what 0203 built the slot for.
- **Depth for the four places in space** — *"like the music setting screen how we added the debris"*.
  The room's motes borrow the `debris` **entity** pool, which is free there because no game is running
  and is not available in one: `CAPACITY` totals 0022's worst case of 500 exactly. So it is a baked
  tile like every other sky layer, and it is a sixth sprite rather than a fifth.

⚠️ **AND THE CONTRAST GUARD STILL COUNTS CLOUDS AND NOT GROUND.** 0220 left this owed for lit structure
covering 0.4% of a tile; a planet now covers **a third of the screen** with a mass `cloudCover` has
never heard of. It is safe today because ground is darker than its own sky and the guard measures
against the sky — which is why *land is darker than the sky over it* is a guard and not a taste. The
real fix is `cloudCover` accumulating `GROUND_OF`'s covered area alongside the weather's.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0221` — eight breaks, eight guards red. **Seven probes belonging to other
decisions were stranded**: 0070 and 0097 by `applySky`, 0103 and 0112 because the streak and weather
lines now appear in two arrays, 0107 by two backdrop colours, and 0211 by the mire's retuned fronds.

⚠️ **AND 0107's SECOND BREAK HAD TO GET BRIGHTER, NOT JUST MOVE.** It brightened Saurian Belt's
backdrop from `#121006` to `#3c4a20` — which against a `#16305a` sky is a **darkening**, so the old
replacement would have left the guard green while reading like the same probe. Re-pointing an anchor
without re-reading the break is how a probe survives `tests/prove-guard.test.ts` and stops proving
anything, which is 0220's own worked example arriving again in the same week.

⚠️ **TWO OF 0220's PROBES WERE DELETED RATHER THAN RE-POINTED**, with their guards, because what they
broke no longer exists: they aimed at Saurian Belt's ridges inside `STRUCTURE_OF`. The claims are
re-made here against the layer that replaced it. [0192](0192-a-guard-holds-an-invariant.md): demoting a
guard takes one edit and a reason.
