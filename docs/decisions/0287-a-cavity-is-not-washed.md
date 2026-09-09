# 0287 — A cavity is not washed

**Accepted 2026-09-09**, from the first play of the long serpent —
[`the-chain-played`](../../reports/the-chain-played-2026-09-09.md):

> *"it's looking pretty cool, the hitbox flash for the mouth doesn't look right though, it's a
> slightly off white triangle inside the mouth and it looks pretty weird."*

**Amends [0278](0278-the-flash-is-a-wash.md)**, which made a flash a wash over the body.

## The rule

**A flash lights a body and does not get into what the body is not.** The hit wash is the sprite's
tile with the kind's cavities taken out of it, in one `evenodd` fill.

## ⚠️ Why the mouth was washed at all, which is the whole of it

0284 made the gape a **notch in the silhouette rather than a hole through it**, because a mouth cut
through a hull bakes a skull with a hole in it. That is still right, and it has a consequence nobody
had followed through: **the dark red filling the gape is a MARK in open space, not an absence.**

0278's wash is `source-atop` — the flash ink laid over exactly the pixels the art covered — so the
mouth interior is covered pixels like any other paint. At `FLASH_WASH` the dark red lands within a
hair of the washed flesh around it, and the cavity stops being a cavity: a flat pale wedge with hard
edges and nothing behind it. **An off-white triangle**, which is what was reported and is exactly
what it is.

⚠️ **AND IT IS ON SCREEN ALMOST CONTINUOUSLY**, which is 0278's own finding turned on this: with
`IMPACT_FLASH_STEPS` at four, every gun in the game holds the twin on while it fires. The base frame's
mouth is what the player sees between hits and the twin's is what they see during them, and during
them is most of the fight.

## ⚠️ The fix is a hole in the wash, and not a repaint after it

The obvious repair — lay the wash, then paint the mouth back over it — is wrong, and the reason is
layering. On the base the mouth interior is drawn BEFORE the four fangs and the tongue, because they
stand in it. Re-laid after the wash it covers them, and the twin loses its teeth.

⚠️ **SO THE WASH IS A TILE WITH THE CAVITY TAKEN OUT OF IT.** One `evenodd` fill of two sub-paths,
one composite, still one bitmap and one draw call — **0278's argument for `source-atop` is that a
flash costs no second draw call, and that is untouched.** What changes is that the animal lights up
and its open mouth stays dark, which is what a flash on a real mouth does.

⚠️ **THE CAVITY IS ONE DESCRIPTION, FOR THE REASON THE FANGS ARE.** `MOUTH` is the wedge the paint
fills and the shape the wash is held out of. Authored twice they drift the first time a jaw angle
moves, which the fangs did across three frames before 0285 made them one — measured then in
fractions of a pixel, and invisible until a guard said so.

## ⚠️ A cavity is a property of a kind, so it is a lookup and not a flag

Almost nothing in this game has one. A hull is a solid body seen from above, and the only marks that
are *what a body is not* are this animal's open mouth — three sprites out of a hundred and fifty.

A boolean on every kind saying *wash me normally* would be a mechanism whose answer is identical for
all but three of them, which is
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s own tell. `cavityOf` is
asked about the HURT kind, because that is what the wash knows, and derives the jaw from the name —
`boss8Hit` is shared by both gaze faces (0285) and both wear the resting jaw, so one derivation gives
the right wedge for all three twins.

## ⚠️ What moving the wash into `passes` cost, and it was two guards

It was a `fillRect`, which `tests/paths.ts` records in `rects` and not in `passes`. A filled path goes
in `passes`, so **every hurt twin in the game gained a mark** and two claims written against the old
shape went red on `shipHit` — a sprite this decision does not touch.

Both were repaired rather than relaxed:

- *a hurt twin is its base's art under ONE wash* now expects the base's marks **plus one**, and asserts
  the extra is the flash ink and is LAST. That is strictly more than it held before, because the old
  version could not see the wash's colour at all.
- *a translucent mark stays inside the sprite's own box* skips it, and says why: the claim is about a
  mark that LEAVES its hull — a plume, a halo — running into the next bitmap in the atlas. The wash
  cannot, because `source-atop` clips it to the art it is laid over. Its bounding box says where the
  tile is and nothing about where the ink lands.

⚠️ **AND ONE OF 0278's OWN PROBES WAS STRANDED BY IT**, doubling a `fillRect` that no longer exists.
Caught by `tests/prove-guard.test.ts` before the suite ran, which is
[0019](0019-a-probe-must-be-seen-to-apply.md) doing the job it exists for — the second time in two
PRs that a change to this animal has been caught standing on an older decision's probe.

## What is held, and where

| Claim | Where |
|---|---|
| the wash is held out of the mouth, and out of the SAME mouth the head paints | `tests/accents.test.ts` |
| a hurt twin is its base's art plus exactly one translucent wash, laid last | `tests/accents.test.ts`, amended |
