# 0393 — The icicle is cut

**Accepted 2026-09-27.** The frost that melts is drawn a seventh smaller and cut as a crystal — shaded
belly, lit face, a glint — under a softer glow, so the shard that bursts is the one the eye goes to.
**Amends [0390](0390-a-dud-icicle-looks-like-one.md)**'s art.

## The ask

> the melting icicles are good, but need to be slightly smaller and look slightly cooler, they look super
> basic at and the original frost attack itself that splits is over-shadowed. Not too small though, only
> about 15% smaller than they are now

## What changed

- **Size:** `frostSpent`'s extent 6.6 → 5.6. The hurtbox is the frost row's and is unchanged.
- **Art:** eight edges where there were six, a point and a root; the belly below the ridge in shadow
  (`shade(frost, -0.35)`), the upper face lit (`shade(frost, 0.5)`), a glint near the root, and a glow of
  0.8 at 0.22 where 0.95 at 0.3 was — the shard's is 1.12 at 0.45.

**The first cut came out green with a dark eye**, because `shade` takes a share from −1 to 1 toward black
or white and 0.72, 1.35 and 1.7 were read as brightness: the belly a pale tint, the face and the glint past
white into a colour of their own. Photographed on the bench at four times before it was believed.

## The guard, and that it was seen to fail

`tests/accents.test.ts`, *0393*: in CSS pixels of a 1280×720 screen, the icicle reaches no further than
nine tenths of the shard. At 0390's size it reached 0.93. One break in
`scripts/probes/0393-the-icicle-is-cut.mjs`, the extent put back, red at 0.93. **Re-anchored**: 0390's
squat probe, on the new hull's shoulders.

## Not held by any guard

**That it looks cooler.** Photographed among the hoarfrost's volleys; owed a play.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
