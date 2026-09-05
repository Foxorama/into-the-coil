# The alpha list — 2026-09-06

The first play with the mid-bosses and the seven real bosses in, given as a list for the next
stretch of sessions: *"I think we're actually at an alpha game state."* This file is the record of
what was said, in full, because every decision that answers an item on it will be written against
it — [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md). The first answer is
[0256](../docs/decisions/0256-a-pickup-keeps-the-count.md).

## What was said

> *"ok we have minibosses and level bosses now and multiple weapons and missiles. I think we're
> actually at an alpha game state. As such lets review the todo list and see what else I need to
> add back into the new list of things."*

> *"What we need to do: huge balancing pass; check over the music so we can export the music files
> as high quality wavs and set up a spotify channel; rework the new bosses to make them more boss
> like."*

### Balancing pass

> *"picking up a new weapon/missile type doesn't reset your power count → it's too punishing when
> you accidentally get a pickup with a lot of enemies on screen or right before a boss or
> something. Reduce and change the number of pickups → we don't need nearly as many if the power
> count isn't being reset. A death reduces the power count by 1 (to a minimum of 1)."*

> *"Pickup spacing overall: weapons → 1 near the start of the level, 1 from the miniboss death.
> Missiles → 1 about 20% of the way into the level. Shields → 1 from the miniboss death. Bombs → 1
> from the miniboss death, 1 from the boss death. Level specific pickups: level 1 → 1 additional
> weapon pickup before the miniboss appears, 1 additional missile pickup halfway between miniboss
> and level boss."*

> *"Enemy balancing: we need less enemies (and bosses) reacting to the player. There's too many
> things that target the player and you can't learn the pattern from → let's change it so one
> unique enemy per level targets/reacts to the player and others should be on a pattern. Bullets
> on screen → the bullet firing waves are still clustered together, especially now with the
> minibosses. Basically, there's either a screen full of bullets or there's 30secs of no bullet to
> be seen at all. All the levels need to have their wave spacing rejigged to make the game have a
> lot more on screen bullet time → not necessarily more bullets on screen, but more time for
> bullets overall to be on screen. Minibosses need to be on their own pattern path and not actively
> matching the player or aiming at the player, it makes it very hard to dodge."*

> *"Weapons: chain lightning jumps too far, enemies don't even get a chance to get on screen."*

> *"Level bosses: need a lot more health, I think I only saw about 50% of their attacks before they
> died. Jormungandr serpent → the lightning attack is superb, don't change it, but the serpent
> should be firing the acid blasts and void blasts together with the lightning, not have it as
> three separate fire fields. Acid blasts need to be a spray fire attack not the wall pattern
> attack. Eagle → the bullets need to be feathered quills; the bullet attacks were boring; the adds
> marched in gently from the left side in a single file, they didn't swoop or dive bomb or do
> anything interesting; is there supposed to be a fire whip attack or something? I didn't get to
> see it. The labyrinth end boss → the walls were really good but started too late in the sequence
> they need to start sooner. Rime shelf end boss → the frost attacks were good, but they need to
> explode and then spawn directional frost bullets that also explode in stellar snowflake patterns
> so that you get chaining pretty snowflakes → to dodge you have to be positioned inside the gaps
> inside the snowflakes. I don't even remember the adds but they weren't great. Toxic mire hydra →
> I didn't even get to try all the attacks as it died too fast. Jellyfish → same didn't get to see
> all the attacks."*

> *"Visuals → boss attacks overall look decent, some need a lot of work. Miniboss attacks need to
> be uplifted a lot, they're virtually impossible to see currently. Enemy bullet attacks are really
> hard to see. Boss graphics are bad — look into the Golf-Stars repo at Jormungandr and then
> compare that with the weird grey tentacle we have here in into-the-coil. All the new bosses look
> terrible, the hydra looks like a weird hand glove thing and doesn't even show heads or anything."*

> *"Feel free to amend, change things if there's going to be a better way to implement or change
> the balancing and pickups around. After playing it, these seem like good changes, but I won't
> really know till I get a chance to playtest it again after making the changes. Full auto and
> merge PRs as you get through them."*

## What the items are, in the order they are being taken

1. **Pickups and deaths** — the count kept across a switch, a death costing a rung, two pickups a
   level and the fights dropping the rest — [0256](../docs/decisions/0256-a-pickup-keeps-the-count.md).
2. **The arc's reach** — a chain that lands before the target is on the screen.
3. **Who reacts to the player** — one kind a level, and the mid-bosses on a pattern.
4. **Bullet time** — the firing waves spread through every level rather than bunched.
5. **The end bosses' health**, and the gyre's walls sooner.
6. **The serpent** — acid and void thrown with the lightning, and the acid as a spray.
7. **The eagle** — quills, attacks worth dodging, adds that dive, and the whip seen.
8. **The frost ship** — shards that burst into snowflakes that burst again, and adds worth
   remembering.
9. **The picture** — the mid-bosses' attacks and every enemy bullet legible; the hulls of the seven
   real bosses, the serpent measured against the predecessor's.
10. **The music as an album** — every place exported as a high-quality wav, and what a Spotify
    channel needs that the repository cannot do.

## What was played, that this is a verdict on

Every decision from [0233](../docs/decisions/0233-a-weapon-is-a-kind-and-a-pickup-cycles.md) to
[0255](../docs/decisions/0255-the-jellyfish-opens.md): three guns, two missiles, seven mid-bosses at
half their health and seven real bosses at their first iteration, on the deployed `main`.
