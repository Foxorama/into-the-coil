# 0395 — The fish wears its fire

**Accepted 2026-09-27.** The flying fish's aura is ribbons of fire wound round its own outline and
twisting as they go, not a fan of teardrops aft of it; the fire turns with the hull; and the olive
filaments painted off its wings and tail are gone, because the ribbons are what trails it now.

## The ask

> the fire streamers coming off just look weird and janky … can we have it with decent fire coming
> off it and curving around it like contours or something … kinda curved around it like streamers
> being twirled by a gymnast sort of thing.

## What the picture showed

Photographed on the bench in each stage before anything moved:

- **The aura was seven straight teardrops** streaming aft ([0320](0320-the-fish-kindles.md)), each one
  re-rolled off a random stream every frame. Nothing on one frame was the same flame on the next, so
  six frames were six unrelated pictures: a flicker with no motion in it.
- **It never turned.** `layAura` laid the chainless boss's flame at heading zero. On station the hull
  is at zero too, so it was invisible — until the last stage's leap, when the fish banked through its
  arc and the fire went on streaming sideways beside it.
- **The wings' trails baked olive.** [0318](0318-the-fish-is-drawn.md)'s filaments are the body's lit
  ink at 0.8 over the void, and on the grown body they lay over the three barbs as a comb of
  yellow-green smudges. They read as a second, still fire in the wrong colour.

## What changed

**Ribbons.** Two a side — a *contour* off the snout, along the pectoral's leading edge just outside it,
round the wing tip and away aft; and a *braid* from under the flank that crosses behind the tail to the
far side, where its mirror crosses it. White-hot adds a third a side, an *orbit* wider than the
contour. Each is a spline in the fish's own units, so a point on it is a point beside `VOLANS_BODY`.
Two things travel along it with the frame and neither is random: a sway that grows toward the free
end, and a **twist** — full width where the ribbon faces the eye, a fifth of it edge-on, and its back
in the coal. The frames are one turn of that twist, so they loop; there are eight a set now.

**The flesh does the wrapping.** The aura is behind the hull, so the stretch of a ribbon that passes
behind a barb or under the tail is hidden and comes out the other side. That is what *curving around
it* looks like from above, and it cost no layer in front.

**One girth.** The ribbons are drawn round the animal at one size, so the first two stages blit at the
same girth (`VOLANS_FIRE_HEAD`, which the painter and the row both read) and the tile went from 54 to
64 so it is blitted at 1.35 and 1.56 rather than 1.85 — an edge the eye follows cannot be a smear. The
first stage keeps the slower beat; the crown no longer grows between the first two.

**It turns.** A hull with no chain has its flame laid at its own heading. A chain's flames are crowns
on round nodes and stay as they were.

**The wing and tail filaments are removed**, not repainted. The ask they answered — *"longer finny
trails coming off them"* — is answered by the contour ribbon leaving the wing tip.

## The guards, and that each was seen to fail

`scripts/probes/0395-the-fish-wears-its-fire.mjs`:

| guard | the break |
|---|---|
| `tests/volans.test.ts` — *and at the last stage it LEAPS*, now also: every flame is laid at the hull's heading while it banks | the turn line removed |
| `tests/volans.test.ts` — *THE ASKED-FOR ONE: the animal TRAILS*: in every frame of the fire, six marks run from under the hull to 8px past it, three a side, the longest 24px | the ribbons slid aft off the animal |

The trails guard is 0318's, with its numbers unmoved, reading the fire instead of the wing paint; its
old probe in `0318-the-fish-is-drawn.mjs` went with the paint it broke. **Its first draft stayed green
with every ribbon moved off the animal**: the haze is a stack of ovals round the hull's centre, and each
one crosses the outline and hangs far off it. A mark that encloses the fish's centre is not a trail
now, and the probe goes red.

## Not held by any guard

**Whether it reads as a gymnast's ribbon in motion.** The bench pane freezes animation; the stills show
the wrap and the twist, not the travel. Owed a play.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
