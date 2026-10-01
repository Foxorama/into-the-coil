# 0442 — The ray gun

**Accepted 2026-10-01.** Feather Fade's gun on the Little Green Caddie. It is the fourth gun, and
it is new with [0441](0441-a-pilot-flies-their-own-ship.md).

## The ask

> *"Little green caddie will be piloted by Feather Fade and gets a new weapon, which is a ray gun that
> fires four concentric purple energy rings that explode on impact with a small energy explosion."*

## The rule

- **A new flight, `burst`.** A ring flies straight up the lane like a pulse and is spent by
  arriving. Where it lands, it goes off as `rayBurst`: a small blast that lands once on everything
  inside it.
- **One ring a volley, every eight steps**, from one barrel at the nose. It must be aimed, unlike the
  pulse's fan.
- **Four rings about one centre**, drawn in three pages. The brightest ring steps outward a page at
  a time, so a volley ripples as it flies.
- **In `ally`, the player's lavender.** Never `void`, which is the serpent's hostile violet. A ring is
  told from a seeker by its silhouette.
- **Its own cue, `ray`.** A pure tone falling an octave, with a ring a fifth under it and the guns'
  shared sub. Shorter than its own cadence.

## Why it is built the way it is

**The burst rides the blast pool.** A bomb's explosion already lands once on everything inside it
and once on a boss, through `blastInto` and `blastBoss`. A ring's arrival is logged in its own
`landed` log, and each entry becomes a blast in the same step, before the blast pairing. So a burst
lands on the step its ring does, and costs nothing a blast does not.

**A flight and not a flag on the row.** What the frame does with a ring differs from a pulse in two
places, its cue and its arrival. 0016's *the frame switches on how it flies* makes that a member of
`FlightKind`, so a fifth gun that bursts is a row.

**The damage was measured.** Ring 6 and burst 3 were flown against the other three guns with
`scripts/weigh-boss.mjs`. The first draft, 4 and 2, took the fish 65 s where the others took 38 to
41. At 6 and 3, quickest fights at Savior:

| boss | pulse | arc | shuriken | ray |
|---|---|---|---|---|
| fish (1300) | 40 s | 38 s | 39 s | 38 s |
| serpent (700) | 51 s | 24 s | 25 s | 41 s |
| hydra (1700) | 47 s | 37 s | 46 s | 41 s |

It sits inside the band. On a pack it does more than its boss figure says, because the burst reaches
a body beside the one the ring found.

## Owed

- **Its special.** The player chose the nova ring: a huge ring bursting out from the ship that pops
  what it passes. Because it pops bullets, it goes in the shield/void cycle on the defensive trigger,
  so it lands with the second change in
  [`the-roster-planned`](../../reports/the-roster-planned-2026-10-01.md). Until then the caddie opens
  on two bombs.
- A play, and the ear on the cue.
