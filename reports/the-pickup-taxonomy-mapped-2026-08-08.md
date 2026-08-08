# The pickup taxonomy, mapped — 2026-08-08

**An investigation with a result and no code.** Chunk 5 of
[`the-third-play-test`](the-third-play-test-2026-08-08.md), which the player calls
*"the lynchpin of whether this game is actually good or not"*.

⚠️ **It is written down because the work was scoped, measured and then NOT started**, on the same
reasoning [`the-death-beat-mapped`](the-death-beat-mapped-2026-08-08.md) gives: it is a change to what
a pickup IS, it re-authors seven levels' content, and starting one of those with a third of a session
left is how a half-migrated table ships. The constitution's own words — *"implement properly or stop:
'this cannot be done cleanly because X, here is what I would do instead' is a result."*

⚠️ **It supersedes nothing in
[`two-things-found-while-chunking`](two-things-found-while-chunking-2026-08-08.md)** — that report
found the involution constraint and the damage line; this one measures the density and proposes a
taxonomy that satisfies both.

**Everything below was read out of the code on 2026-08-08**, after
[0081](../docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md).

---

## What was asked for

> *"power ups are too common still and these are premium game pieces that are the lynchpin of whether
> this game is actually good or not"*

> *"too many varieties and it's overwhelming and weak, too few and the player doesn't feel powerful
> enough"*

> *"shields/lives should be kept to 1-2 per level. Shields in particular are so much more stronger
> than I had anticipated."*

> *"missile upgrades need to be 2-3 per level"*

> *"rapid fire/rapid missiles rapid whatever else we add need to be combined into one power up - which
> is the weapon change power up, we haven't implemented other weapons yet, but picking up a second of
> the same weapon needs to increase it's tier and rate of fire together. There's just too many power
> ups for these to be separate things."*

> *"when a player dies let's change it to 50% chance of each power up they have collected spawning
> from their death, current implementation means there's not really a cost to dying at all"*

> *"max speed auto-fire is way too strong for the current game - when you get max speed nothing is a
> challenge, bosses die in less a second and they are supposed to be tough."*

## What is authored today, counted

**Every authored entry is a PAIR** — [0052](../docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md)
makes a level author the pair and the camera pick the face — so a `shield` entry is *a shield or an
extra life*, and the counts below are opportunities rather than items.

| level | entries | shield/life | rapid/missileRate | spread/missileSpread |
|---|---|---|---|---|
| approach | **24** | 9 | 7 | 8 |
| descent | **22** | 8 | 7 | 7 |
| coilward | **19** | 9 | 6 | 4 |
| shoal | **19** | 9 | 6 | 4 |
| batteries | **19** | 9 | 6 | 4 |
| gauntlet | **19** | 9 | 6 | 4 |
| eye | **20** | 9 | 6 | 5 |

⚠️ **The ask is 1–2 shields-or-lives per level and there are nine.** *"Power ups are too common
still"* is an understatement of what the table says: against the stated budgets, the levels carry
roughly **four times** the pickups they should, and the survival pair is over by a factor of five.

⚠️ **This is a content edit across seven lists, and every one of them has prose attached** explaining
why a particular pickup sits where it does. Deleting three quarters of the entries means most of that
prose stops being true, which is the bulk of the work and the reason this is not a fifteen-minute
change.

## The structural problem: an odd number of kinds

[0052](../docs/decisions/0052-a-pickup-is-two-things-and-the-camera-says-which.md)'s `CYCLE` is a
**proved involution** — `tests/cycling.test.ts` holds that every kind maps to exactly one *other* kind
and that the mapping is its own inverse. **A fixed point is explicitly refused**, and an odd number of
kinds cannot avoid one.

Today there are six: `extraLife`, `shield`, `rapid`, `spread`, `missileRate`, `missileSpread`.

- Merging `rapid` + `missileRate` — the ask's own words — leaves **five**. Broken.
- Merging both rate pairs *and* both spread pairs leaves **four**: `weapon`, `hardpoint`,
  `extraLife`, `shield`. Whole, but it is not what was asked: the ask says one weapon pickup whose
  repeats raise *"tier and rate of fire together"*, which is one kind and not two.
- Taking the ask literally — one `weapon` pickup replacing all four upgrades — leaves **three**.
  Broken again.

### The proposal: four kinds, and the fourth is a special

| pair | | |
|---|---|---|
| offence | **`weapon`** — the weapon, and every repeat raises tier and rate together | **`bomb`** — a charge for the arsenal |
| survival | **`shield`** | **`extraLife`** |

⚠️ **`bomb` is the honest way to an even count, and it is a thing `docs/game.md` already wants.**
*"More specials, found during the run"* is in the product definition; `src/state/slices/run.ts` has
carried a `took` action since [0039](../docs/decisions/0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)
**with nothing that dispatches it**; and [0053](../docs/decisions/0053-the-bomb-is-the-first-thing-the-player-spends.md)
left *how a player gets more bombs* to level clears alone. A bomb pickup closes all three.

⚠️ **And it makes both pairs a real choice**, which is what `tests/cycling.test.ts`'s second property
holds: *offence against survival*, twice. The current `rapid ↔ missileRate` pair is *shoot faster* against
*shoot faster with the other gun*, which is the muddle the report is complaining about.

⚠️ **The alternative is to drop the cycle**, and it should be considered rather than assumed away.
0052 is a play-test-driven decision — *"which one a player gets is a matter of when they reach it"* —
but it was taken when there were six kinds and a pickup every 250 units. With four kinds and four
pickups a level, *the field changes what it is offering* may stop being worth a mechanism. **That is a
question for the play-test that follows 0079–0081**, not a thing to decide from the table.

### What the merge costs elsewhere

- **Sprites.** `pickupRapid`, `pickupSpread`, `pickupMissileRate`, `pickupMissileSpread` become one
  silhouette; the pair-with-inverted-fill scheme `src/content/sprites.ts` describes loses its subject.
  A `bomb` face already exists (`SPRITES.bomb`, used by the trigger strip).
- **The title key.** `src/app/chrome.ts` walks `PICKUP_KINDS`, so it shrinks from six rows to four for
  free — which is most of the *"too many varieties and it's overwhelming"* complaint, answered by the
  table rather than by a layout change.
- **`UPGRADE_KINDS`** goes from four to one, and `weaponFor`'s four-armed loop becomes one arm with a
  ladder in it. That is where *"tier and rate of fire together"* lives.
- **`PickupEffect`** gains a fourth member — `special` — for the bomb, beside `life`, `upgrade` and
  `shield`. `src/app/mount.ts`'s `onPickup` gains one arm, which is the `took` action finally cashing.

## The max-speed nerf, and it is one line

⚠️ **`src/content/pickups.ts` has an unbounded ladder and it is two identical lines:**

```
if (faster < FASTEST_FIRE) damage++;      // a rapid past the fire floor
…
} else if (shots >= MAX_BARRELS) damage++;  // a spread past the barrel cap
```

Every upgrade past every cap becomes **weight, with no ceiling anywhere**. That is *"max speed
auto-fire is way too strong"* named at its cause: barrels and rate are capped and *damage* is not, so
the twelfth pickup is worth exactly as much as the fifth and the curve never flattens.

⚠️ **The file argues for this behaviour in as many words** — *"an upgrade that cannot change the
outcome is worse than none"*, from `docs/game.md` — so a cap here is a change to a stated rule and
needs a decision, not a constant edit. **The shape that satisfies both**: diminishing rather than
capped, or a cap plus something else for an upgrade to become. Under the merged taxonomy this is the
same question as *what does the fifth weapon pickup do*, which is why it belongs in this chunk rather
than on its own.

⚠️ **Whatever lands has to be measured against a boss, in seconds.**
[`medium-played`](medium-played-2026-08-07.md) and the third play-test both report *"bosses die in
under a second"*, and `tests/difficulty.test.ts` already measures a boss fight in seconds the player
sits through — so the guard exists and wants a floor added to it.

## The 50% scatter

⚠️ **The cheapest item in the chunk, and it amends
[0066](../docs/decisions/0066-a-death-scatters-what-it-took.md).** `scatterUpgrades` throws every
upgrade a death took; the ask is *"50% chance of each power up"*. It is one filter in
`src/app/frame.ts`, and the stream is already there and already named — `w.scatterRng`, which
[0021](../docs/decisions/0021-one-stream-per-concern.md) separated from `burstRng` precisely because
*which pieces a player can reach is the entire cost of a death*.

⚠️ **The even-spacing guarantee has to survive it.** 0077's ring spaces `i / n` of a circle over the
pieces that are thrown; filtering before the ring is built keeps that true, and filtering after it
leaves gaps that read as pieces having failed to appear.

## The half this chunk does NOT contain

> *"the power ups need to spawn after beating a tougher enemy or a mid-round boss, not an end boss to
> get the sense of worth"*

⚠️ **That is *earned*, and it is chunk 6's mechanism rather than this one's.** Every pickup in the
game today is a place in a level's script ([0040](../docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md));
a pickup that arrives because something died is a spawn keyed to an event, which is the same machinery
the difficulty dial needs. Rarity alone does not make a pickup earned — the report says so — but
rarity is what this chunk can deliver, and it is worth playing before the second half is built.

## What this report does not settle

**Nothing here is a decision.** The four-kind taxonomy is a proposal that satisfies a proved
constraint; whether the cycle survives at four kinds is a play-test question; and the damage ladder is
a change to a rule `docs/game.md` states, so it is owed a decision file rather than an edit.
