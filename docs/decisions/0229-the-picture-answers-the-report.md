# 0229 — The picture answers the report: a fireball you can see, bullets with a heart, tiers with room, and an organ

**Accepted 2026-09-05.** The play-test of [0227](0227-a-sprite-is-painted-not-filled.md) and
[0228](0228-an-enemy-wears-its-place.md), answered in one pass.

> *"The fireball definitely didn't look like a fireball because I didn't know there was a fireball in
> game… enemy bullets need to be tailored graphically… we lost the ship upgrade graphics in the
> graphics upgrade… the heart on level 7 is a very adorable love heart, but we need a pulsing black
> 'heart' not a love heart."*

## The rules

**Debris is drawn over the bodies and under every shot.** `src/app/mount.ts` puts the debris pool
after the enemies and before the enemy shots; `tests/flares.test.ts` reads the order off the file.
A fireball over the body it came out of reads as that body going up; over a bullet it would hide the
one thing on screen the player cannot afford to lose track of, so every shot stays above it.

**A burst is bigger than the biggest enemy and smaller than the smallest boss, and it holds six
steps a frame.** 5, 9, 12 and 14 units, from 3.5 to 9; twenty-four steps, from sixteen. The floor
and the ceiling are both in `tests/flares.test.ts`: a fireball smaller than the body it came from is
the one nobody saw, and one the size of a boss is a boss arriving.

**An enemy bullet is painted on the pulse's own terms.** A halo in the `enemy` ink and a white-hot
heart on the spit, the lance and the flak; the flak's underside in shadow. Silhouette, size and ink
are exactly where [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) and
[0098](0098-a-wave-plays-a-figure.md) put them, because those are how the three are told apart.

**A hull tier is a wider sprite, and the hull inside it does not grow.** `shipMk2` is 8.2 units and
`shipMk3` 9.4 against the bare ship's 7; each arm draws the hull at the bare ship's own radius inside
the wider box, and the pods and canards fill the room the box gained — a pod reaches a third of a
hull past the wingtip and carries a lit muzzle. The hurtbox is untouched. `tests/legibility.test.ts`
holds each tier's extent above the last.

**The Black Heart's landmark is an organ.** A hand-drawn asymmetric mass — a big left ventricle to
an apex low and to one side, a smaller right one, two atria on top — with an aorta arching over it,
a pulmonary trunk and a vena cava, a furrow between the ventricles with coronary branches, and a
sheen on the flank. Drawn as a hole in light with a lit rim, on the beat it already had. The seed
moves the apex and the fullness, so the three castings are three hearts.

## ⚠️ What the picture said the first time, and why every guard was green

- **The fireball was under the enemies.** Debris was first in the draw order since
  [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md), for shards; a fireball drawn
  under the bodies beside it, at 3.5 units, was correct by every guard and invisible in play.
- **The pods were 3.8 pixels tall.** 0227 fitted them into the bare hull's 7-unit box; the thickness
  guard passed them at 2.7 px and the sheet at four times zoom showed them. On a 1280×720 screen at
  one times, they were a line. The room a part needs is the extent, which is a number in
  `src/content/sprites.ts` and not a fraction in a drawing.
- **The card curve was recognised.** 0220 chose it on
  [0203](0203-the-rule-was-never-about-size.md)'s argument that a recognisable silhouette survives
  being flat, and it did — as a valentine.

## What is owed

- **An eye on the fireball in motion.** Twenty-four steps over the bodies is judged on the sheet and
  in a stepped world; whether it now reads as a bang is the next play-test's.
- **The bullets are still one ink across the run**, on purpose: *pink will hurt you*.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix. The atlas is baked at load.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0229`:

| broken on purpose | went red |
|---|---|
| debris put back under the enemies | `is drawn over the bodies and under every shot — 0229` |
| debris drawn over the enemy shots | same |
| the burst's last frame shrunk under the biggest enemy | `a burst is never as big as a boss and a spark is never as big as a burst` |
| the third tier's sprite made the second's size | `0229 — a hull tier is a wider sprite than the one before it` |
