# 0629 — A launcher and not a box

**Accepted 2026-10-18.** From the play-test of 2026-10-18 —
[`the-play-test-of-2026-10-18`](../../reports/the-play-test-of-2026-10-18.md), item 3, its missiles half. Amends
[0461](0461-the-ships-are-jazzed.md)'s roof turrets and [0448](0448-each-ship-fires-from-its-own-guns.md)'s rows of
where each tube's missile lies. The guns half of item 3 is still to come.

## The ask

> *"Ships: update boring blocky gun + missiles with nice art"*

## What was there, photographed first

At the sprite sheet's zoom, and on the bench in the fight with two straight tubes loaded, the boxy parts were:

- The cars' tubes. The Firebird's and the estate's were two flat rectangles on the roof in the livery, each with a
  band. The Thunderbolt's and the Aqua Duck's were two grey boxes at the back.
- Three guns: the fighter's pulse rod, the estate's shuriken launcher block and the duck's paint box. Those are
  the other half of this item.

The caddie's missiles are pearl pods off its rim and the fighter's hang under its wings; both read as missiles
already. The Hamster Ball's grey squares are axle stubs that its darts hang from in the fight.

## What the size allowed, measured

At the fight's camera a car's turret was about 5.6 × 4.3 px, and two shared a roof three units tall. Drawn as two
separate pods, each could only be one of two things:

- deep enough to see, and then a drum: a slot is barely longer than it is tall;
- slim enough to read as a pod, and then a five-pixel dot on a stick.

The bench showed both. Every solid mark must also clear 0106's 2.5 px. A pod drawn with a pylon, a highlight, a
tail cap and two bands measured each of them at a pixel or a pixel and a half (`tests/accents.test.ts`).

The player was asked with sketches of three directions: one twin launcher, two rounded full-size pods, or detail
for the pad only. **Chosen: one twin launcher.**

## The rule

| | |
|---|---|
| **one launcher a stage** | every tube a stage has keeps its slot on the row (`FIREBIRD_TURRETS` and the rest), and the launcher is drawn over all of them (`launcherSpan`). It is a pod lying along the roof (`podOf`): its girth 0.24 of its length, at most 1.15 units; round at the tail; its nose's lip curved in; held up on a pylon over the middle 44% of its length, with the sky showing fore and aft. The same shape is the outline (`turretsOn`) and the paint (`paintTurrets`) |
| **one tube** | the single tube's slot is longer than it was, so one tube is a pod and not a drum. Firebird 0.4–4.2 → −0.6–4.6; estate −8.5–−4.9 → −10.2–−4.4; Thunderbolt −14.6–−11 → −15.2–−10.8; duck −10.2–−7 → −11.2–−6.2 |
| **the mouths** | one in the middle of the face, or two stacked 0.62 of the radius either side of its middle line (`mouthsOf`). A loaded nose is as tall as the launcher (`TURRET_NOSE`), so two noses overlap however they stand. At under half the radius apart they read on the pad as one nose; at 0.62 they are two tips |
| **the paint** | three marks, because the launcher is 7.6 × 3.4 px at the fight's camera: the cylinder's shading (lit back, dark belly), one band in the livery's second ink 1.75 units wide (2.5 px), and one dark face at least 0.9 units in radius, which the noses lie in. The pylon is the outline's, in the body's paint |
| **the rows** | each car's `tubes` move to the mouths, read back off `carMounts`. Two missiles now leave from one point along the roof, stacked 0.35 units apart; they were a unit apart along it |

## The screen, considered

[0295](0295-a-ranking-guard-is-a-content-limiter.md): the launcher is drawn inside the box the turrets stood in, with
sky taken out of it under the launcher, so the ship's silhouette is no bigger. The missiles leave from where they lie
in its face, as they left from the turrets. Nothing else shares that space.

## What guards it

`tests/launchers.test.ts`, *0629*: for each car at one tube and two, it reads the drawn hull at the fight's camera
(1280×720), starting from the missile's nose in the launcher's face (`carMounts`, which the rows are held to). It
checks two things a sixth of the way in from each end:

- the launcher runs back at least twice as long as it is tall;
- the sky shows between it and the roof.

A box sat on a roof fails both.

Probes are in `scripts/probes/0629-a-launcher-and-not-a-box.mjs`, all three seen red: the box back on the roof, the
launcher flat on the roof, and the launcher as a drum. `tests/mounts.test.ts` holds the rows to the mouths.
`tests/accents.test.ts` holds every mark over the floor and on the hull. 0448's probe of the Firebird's row is
re-anchored on the row's new value, and all seven of 0448's probes were seen red.

## Owed

- **A look in play**, the fight and the pad: whether one launcher with two tips reads as two missiles, and whether
  two missiles leaving one point reads right.
- **The guns:** the pulse rod, the shuriken launcher block and the paint box. Next, as their own decision.
