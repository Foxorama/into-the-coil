# 0371 — The ice is staggered

**Accepted 2026-09-25.** A boss volley of frost leaves the hull one shard at a time — half a second
apart at Savior, closer at Burn — and each shard's fuse is rolled from a range rather than read as
one number. Both frost fights change: the Rime Shelf's ship and the hydra's frost head.

## The ask

> *"the bosses that use the ice attacks need to have the attack vector changed so that firing
> multiple ice bullets has them staggered by a half second or so and they need to have a random
> length before they explode. current issue is they get fired at the same time and explode at the
> same time and fill the screen with a bunch of ice shards that so heavily clustered you can't
> really dodge them."*

It was exact. Every shard of a volley left on one step with the same fuse, so every shard opened on
one step. Driven for thirty seconds a phase at Savior and Burn, **every shard in both fights opened on
a step with another**. The Rime Shelf's last phase opened 111 shards on 37 steps at Savior and 147
on 49 at Burn. [0263](0263-the-frost-ship-shatters.md) makes a shard two bolts and then twelve
flakes, so a volley of three was thirty-six flakes appearing at once.

## The rule

**`stagger` on a shot row is the steps between the shots of one boss volley of it**
(`src/content/shots.ts`). Absent means together, which is every other row. It sits on the bullet and
not on the boss because the reason is the bullet's: both fights throw the same shard.
[0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s default shape applies: the row
says what its version is, and shared code holds the fallback.

- **A staggered volley is a sweep** ([0304](0304-the-serpent-sprays.md)). `staggerVolley` in
  `src/app/boss.ts` puts a fan, a ring or a wall onto the five fields a sweep already keeps, and
  `spray` throws the rest one at a time from wherever the muzzle has got to. A wall adds two fields,
  its spacing and how many slots it has thrown, because a wall steps sideways rather than turning.
  It throws the same slots in the same order as before.
- **The next volley waits one stagger past the last shot.** `spray` runs before the gate, so a
  volley timed to the last shot would throw its first shard beside it. A probe puts that back and
  watches the guard go red.
- **A whip, a breaker and a lob do not stagger.** A lash and a crest are shapes made by every shot
  leaving together, and a lob is one shot.

**The stagger is authored before the tier and scaled by its `fireGap`**, exactly as a phase's
`fireEvery` is. The frost authors 40: **30 steps at Savior** (the half second asked for), **24 at
Burn** and 42 at Legend. The first version held it flat, and the table below is what that cost; the
answer was *"make it harder on burn."* Where the stagger is what binds the rate, it is the number a
tier has to move.

**A stage's `after` is a `Fuse`, `{ least, most }`, rolled once per shot per stage** on a new
`fuseRng` stream ([0021](0021-one-stream-per-concern.md)). The frost's first fuse is 38–56 steps and
its second is 36–48. The melt stays fixed at 90: flakes going out together are nothing to dodge.

**The first fuse is narrower than the tightest tier's stagger (18 steps against Burn's 24).** That
width is what makes *"not at the same time"* certain rather than likely. The next shard always opens
at least six steps after the one before it, so shards open in the order they were thrown. A wider
fuse would be more random, and a probe shows it puts pairs back. It was 24 wide while the stagger
was a flat 30, and scaling the stagger by tier is what narrowed it.

**Both ranges sit a little later than the old fixed fuses, and that was measured.** Centred on the
old 45 and 40, the shortest pair put the snowflake 2.7 units into the far half of the screen. That is
the thing the second fuse exists to prevent.

## What it costs

**The stagger caps the rate at one shard a stagger.** Shards opened in thirty seconds of a phase,
before this decision, with the stagger held flat at 30, and as it lands, scaled by tier:

| phase | before, Savior | before, Burn | flat, Savior | flat, Burn | landed, Legend | landed, Savior | landed, Burn |
|---|---|---|---|---|---|---|---|
| Rime Shelf 1 (wall) | 50 | 66 | 49 | 60 | 36 | 50 | 67 |
| Rime Shelf 2 (spray of 2) | 54 | 74 | 54 | 60 | 40 | 54 | 75 |
| Rime Shelf 4 (spray of 3) | 111 | 147 | 60 | 59 | 43 | 60 | 75 |
| hydra 4 (frost head) | 16 | 20 | 14 | 17 | 10 | 14 | 18 |
| hydra 5 (frost head) | 16 | 20 | 14 | 16 | 14 | 14 | 18 |

**The Rime Shelf's last phase throws about half the shards it did, on every tier.** That is the ask:
the rate a player can read is one shard at a time. Flat, it also made Burn the same fight as Savior
there, which undid [0270](0270-a-shattering-volley-is-counted-in-shards.md)'s *"sending it twice as
often"*; scaled, Burn is a quarter more than Savior. The pilot's worst gap in that phase went from 10.0
units to 12.5 at Savior, and from 8.5 to 14.5 at Burn.

## What was rejected

- **A hold at the muzzle**, with every shard thrown and held still until its turn. That would be a
  bullet the picture shows and the model does not fire, or the reverse, which
  [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) names.
- **The stagger on the boss row or the phase.** Two fights throw the one bullet, and the report is
  about the bullet.
- **A random fuse alone.** It spreads the openings, but three shards leaving together still read as
  one volley and still open within a second of each other.

## What is held

`tests/frost.test.ts`:

- *THE STAGGER, DRIVEN*: every phase of both frost fights, on every tier, for twenty seconds. No two
  shards leave the hull on one step, no two open on one step, and every rolled fuse is inside the
  row's range with more than one length among them. In every phase that throws frost, Burn throws
  more shards than Savior and Savior more than Legend. The fights it walks are derived from the rows
  that stagger, and a sibling test pins that list to the two the report named.
- **The tier half is asked of every phase, not the busiest, and its probe is why.** The first draft
  asked only the phase with the most shards. Reading the spray's stagger flat went STILL GREEN,
  because it thinned the spray phase until a wall phase was busiest, and the wall still differed.
- *THE FISSION, DRIVEN* now runs twice, with every fuse pinned to the short end and then to the long
  end once it is lit and checked. It gains the other half of the snowflake's place: at the longest
  fuses, it still opens ahead of the ship's box.

Probes: [`scripts/probes/0371-the-ice-is-staggered.mjs`](../../scripts/probes/0371-the-ice-is-staggered.mjs),
eight, all red on the guard they name.

**Three older probes went STILL GREEN, and the guards were right to stay green.** 0263's *a snowflake
of twelve* and 0270's *a ceiling of six* and *no ceiling* each broke one defence. The stagger is now a
second defence in front of the same pool and lane guards. Each probe was widened to restore what
originally shipped, which had no stagger either, and each is red again. 0070's style probe was
re-anchored on the `shots.ts` import line.

## What is owed

**The play.** Both fights have been driven and counted on all three tiers, not played or
photographed. Whether Burn's quarter more is enough is a play question: its number is the frost
row's 40 and the tier's `fireGap`, and nothing asserts on how far apart the tiers sit.
