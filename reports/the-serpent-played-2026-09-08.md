# The serpent played — 2026-09-08

The second play of the redrawn serpent on The Approach, after
[0276](../docs/decisions/0276-the-kit-draws-a-creature.md),
[0277](../docs/decisions/0277-the-serpent-has-menace.md) and
[0278](../docs/decisions/0278-the-flash-is-a-wash.md) landed. Recorded in full because every
decision answering an item of it will be written against it —
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).

⚠️ **It is not only about the serpent.** Two of the six items are stated about the serpent and are
true of all fourteen hulls, and one of those is the largest single finding in the file.

## What was said

> *"our serpent boss on The Approach still looks like a worm, and it's not animated at all, it (like
> pretty much exactly every boss) bobs up and down, but there's no movement to the sprite itself,
> it's a flat static image that isn't alive."*

> *"the lightning attack is great, change nothing there, but the acid and void attacks are also
> pretty trash, they're basic, straightforward and require no skill at all."*

> *"and like all bosses, you can fly behind it with the lightning canon and just basically sit their
> nuking it because it doesn't go backwards at all."*

> *"the body needs to be longer"*
>
> *"the overall figure needs to be far more menacing, there's no sense of any kind boss like aura to
> it at all or sharp angles, it's a cute cuddly little bobbing space worm at the moment."*

> *"the acid blast attacks need to be arrow shaped, acid arrow style things that fly out and
> explode"*

> *"the void blasts need to be larger balls that absorb (void) the player's weapons (it'll be
> interesting to see how it interacts with the lightning gun), they also void the player's missiles
> and the players bomb if a bomb passes through them."*

> *"the lightning attacks are great."*

> *"so there's a lot there, but we need to a heck of a lot for each boss, the tiny onscreen enemy
> bullets, the wave and enemy bullet pacing and basically everything"*

**And two things settled in the same session, asked because either answer changes what gets built:**

- **The order.** The up-lane corridor first, because it is the cheapest change with the widest reach
  — all fourteen fights — and depends on nothing else. Then the serpent's body, its acid, its void;
  then the small bullets and the pacing.
- **The void's appetite is finite.** A ball swallows a set number of the player's shots, swelling as
  it feeds, and then bursts. Chosen over a bottomless one so it is a thing to shoot *through* rather
  than a flat tax on a fight that is already at twice its old health
  ([0260](../docs/decisions/0260-a-boss-is-fought-to-the-end.md)).

## ⚠️ The one item that was measured, because it is a geometry fact and not a taste

*"You can fly behind it … and just basically sit their nuking it because it doesn't go backwards at
all."* **True of every boss in the game, and the cause is not that the boss will not reverse.**

Read off the shipped files:

| | measured | where |
|---|---|---|
⚠️ **THE DIRECTIONS ARE THE REPOSITORY'S, AND THEY ARE EASY TO INVERT** — this file had them
backwards once before it was committed. **Down-lane is decreasing `along`**: toward the camera's
trailing edge, toward the player, the way every boss faces and shoots. **Up-lane is increasing
`along`**: toward the leading edge, where the level arrives from. So *"fly behind it"* is flying
**up-lane, past the boss**, and the empty ground is behind the boss's tail rather than in front of
its face.

| | measured | where |
|---|---|---|
| how far **up-lane** the ship may fly | **167.1** units from the camera's trailing edge | `PLAYER_LEAD`, `src/sim/flight.ts:152` |
| where the fourteen bosses stand | `station + drift + radius` is **149 to 155** | `src/content/bosses.ts`, held by `tests/level.test.ts` |
| which way a volley points | `Math.PI` — **straight down the lane**, at the player's usual ground | `throwAttack`, `src/app/boss.ts:641` |

**So there is a corridor 12 to 18 units deep up-lane of every boss's tail that the ship can reach
and that nothing in the boss vocabulary points into.** The serpent is the *narrowest* case, because
it is the widest hull; a gyre or a redoubt leaves nearly twice that.

⚠️ **AND IT IS THE AIM AND NOT THE STATION, WHICH IS WHY MOVING THE BOSS WOULD NOT FIX IT.** Every
station is already within five units of the ceiling `tests/level.test.ts` allows, and that ceiling
exists so the whole hull is on the narrowest view (0061). A boss pushed further up-lane runs off the
leading edge. What is actually true is that **`spray`, `rake`, `wall`, `whip` and `beam` all point
one way**:

- `spray`, `wall` — centred on `π`, down-lane. Never behind themselves, at any spread.
- `whip` — an arc centred on `π`. Never behind.
- `beam` — rooted past the camera's *trailing* edge and reaching up-lane only as far as the hull.
  Covers the ground between the boss and the player, and stops at the boss.
- `rake` — `π + firePhase`, turning cumulatively, so it *does* eventually sweep the up-lane
  hemisphere. At the serpent's `turn: 0.45` and `fireEvery: 84` that is **one full rotation about
  every twenty seconds**, of which perhaps two volleys in fourteen point at a ship parked behind it.
  A threat that arrives twice a fight is not a threat that moves a player.
- `ring` and `rain` — the only two arms that cover the corridor, and they are thinly spread. Of the
  seven **real** bosses, **four throw neither**: the eagle, the pterodactyl, the gyre and the frost
  ship have nothing at all that reaches the ground behind them. The hydra has a ring on **one of
  five** heads. The jellyfish rings, and is the one fight this finding does not describe. The serpent
  has `rain` — the lightning — **in its last third only**, which is exactly the attack the player
  called *superb* and exactly the reason the fight is not a stalemate today.

⚠️ **SO THE LIGHTNING IS ALREADY DOING THE WHOLE JOB OF THREATENING A PARKED SHIP, ALONE, AND ONLY
IN THE LAST THIRD OF THE FIGHT.** That is the finding. The report reads as *the boss will not turn
round*; the file says **five of the nine arms of `BossAttack` cannot reach the ground behind a boss
at all, a sixth reaches it twice a minute, and four of the seven real bosses throw none of the two
that can.**

## ⚠️ What is NOT the cause, so it is not chased

- **The player's box.** Shrinking `PLAYER_LEAD` to put the boss's tail out of reach would take back
  the up-lane third of the screen that 0080 and
  [0074](../docs/decisions/0074-the-box-is-drawn.md) were written to give the player, and it was
  given after a play report saying almost a quarter of the screen was not playable. Standing behind
  a boss should be *possible and expensive*, not walled off.
- **The boss's flight.** Every real boss already patrols, bobs or stalks; the hulls move plenty.
  Nothing about the movement is what leaves the corridor empty.
- **The arc's reach.** Nuking from behind is what any of the three guns does from there; the arc
  is only the one that does it best. This is not a weapon finding.

## ⚠️ And the two items that were already known, which is worth saying plainly

**The undulation is not a new report.** 0277's *What this deliberately does not do* names it, costs
the two ways of building it, and says the segment chain is owed —
*"it's a static image that bounces up and down"* is the same sentence twice, three PRs apart. **What
is new is `it (like pretty much exactly every boss)`**: it is a rule about hulls and not a fault in
one of them.

**And *the body needs to be longer* is the same job.** 0277 measured the ceiling: at a bend radius
held above 1.8 girths, the sprite box buys **one broad arch**, and a longer body inside the same box
buys it by bending tighter than the spine allows — which is the exact thing 0277's
*no bend tighter than the animal's own spine allows* was written to stop.

## ⚠️ And one item contradicts a report from three days ago, which is flagged rather than guessed

*"no sense of any kind of boss like aura to it at all **or sharp angles**"*, against 0277's bend
rule, which landed from:

> *"the tail uplift is really really sharp and a snake/serpent would be more curved because of the
> spine, where a worm with no spine can sharp twist"*

**Read as *kink the body*, the two are opposites.** Read as *the silhouette has nothing on it that
could cut you* — no horns, no jaw, no barbs, nothing but a smooth tapering tube with small ticks on
its back — they agree completely, and the second reading is also what *"cute cuddly"* is naming.
**Taken as the second**, and stated here so a wrong reading costs one sentence rather than a pass.

## What this asks for that the game has no word for yet

Listed, not designed — each is a decision of its own:

| | what is missing |
|---|---|
| a body that is alive | a hull that is not one baked bitmap; `tests/budget.test.ts` asserts blits are exactly one per entity |
| a boss that can be stood behind | something in `BossAttack` that covers the up-lane corridor, on all fourteen hulls and not on one |
| an acid arrow | a shot with a heading in its picture — `blit` cannot rotate — that bursts where it dies |
| a void that eats | a hostile body that consumes player shots, missiles and the bomb; today nothing in `enemyShots` interacts with `shots` at all |
| the small bullets | the standing item 9 of [`the-alpha-list`](the-alpha-list-2026-09-06.md), re-reported |
| the pacing | 0267's own *What is owed* re-measure, re-reported |
