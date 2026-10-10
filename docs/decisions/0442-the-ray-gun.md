# 0442 — The ray gun

**Accepted 2026-10-01.** Feather Fade's gun on the Little Green Caddie. It is the fourth gun, and
it is new with [0441](0441-a-pilot-flies-their-own-ship.md).

⚠️ **Superseded in part by [0588](0588-the-rings-are-thrown.md)**: *the picture*. Four rings in a train up the
line of flight, each seen edge-on, where this drew four about one centre; and the right stick steers them.

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

**A boss's weight for the ray scales the ring and not the burst.** The burst rides the blast pool,
which takes the boss's window (0150) and not the gun's weight (0372). No boss authors a weight for
the ray, and the ray's own `bossWeight` is 1, so this is latent. A row that ever gives the ray a
weight should know the burst will not follow it.

**The jellyfish is its slow fight**: 103 s from its best place, against 40 to 66 for the others.
That is a floor kept, not a ceiling broken, and it is the first thing a play of the caddie should
look at.

## Amended after the first play: four rings, then a breath

⚠️ **Taken back out by [0448](0448-each-ship-fires-from-its-own-guns.md)**, played: *"it feels bad and
sounds worse, the full autofire felt much better."* The ray fires every eight steps at ring 6 and
burst 3 again; what follows is the record of what was tried.

> *"let's make the little caddie's weapons fire in four shot bursts as well so it's 4 (at current
> speed) brief pause, 4 etc."*

**`burst` on the gun's row: `{ volleys: 4, rest: 16 }`.** Four volleys at the gun's own eight steps,
then sixteen more before the next four — a rhythm the player can hear and a gap they can see. It is
optional on `WeaponRow`, so the other three guns author nothing and fire as they did; the frame
counts volleys in `World.burstFired` and adds the rest when a burst completes.

**The damage went up to pay for the breath.** Four in every six slots fire, so the same rings would
lose a third of their rate. Ring 6 → 9 and burst 3 → 4 put it back, and `tests/level.test.ts`'s
0260 floor, which flies every gun in its own ship against every boss, holds with the bursts.

## Owed

- **Its special.** The player chose the nova ring: a huge ring bursting out from the ship that pops
  what it passes. Because it pops bullets, it goes in the shield/void cycle on the defensive trigger,
  so it lands with the second change in
  [`the-roster-planned`](../../reports/the-roster-planned-2026-10-01.md). Until then the caddie opens
  on two bombs.
- A play, and the ear on the cue.
