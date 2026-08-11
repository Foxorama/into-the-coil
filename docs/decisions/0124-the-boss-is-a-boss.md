# 0124 — The boss is a boss, and the design loadout is tier two

**Accepted 2026-08-12.** Reported from play: *"at max level weapons, the boss dies too fast still,
it's more of a mid-level miniboss than an end of level boss."*

## The rules

**A boss lasts more than twelve seconds at max weapons on `savior`**, the tier
`src/content/difficulty.ts` itself calls *"what the game is tuned for"*.

**Every phase lasts more than three seconds there**, or it is not a phase.

**A later boss is a longer fight than an earlier one.**

**The design loadout is tier two and up.** The bare fight is a consequence, not a case to protect.

## The number could not be picked until the player set the target

⚠️ **A HEALTH RISE LENGTHENS THE BARE FIGHT AS MUCH AS THE EQUIPPED ONE, AND THE WEAPON LADDER IS A
6.9× SPREAD** — 7.5 dps with nothing against 52.0 maxed. Trebling `sentinel` to make it an
end-of-level boss also makes it a hundred-second grind for a player who just died and lost their
upgrades ([0085](0085-a-death-does-not-cost-the-bombs.md)). **Those are two different players and no
single number serves both**, so the measurement was handed over rather than resolved:

> *"It's at the core of it a survival challenge game. If you get to the boss with level 1 weapons, you
> can take your time or start over… we should be aiming for the difficulty for the player to be having
> at least level 2 weapons from the moment the second pickup appears. If the game is easy, it's no
> fun, and the overall game is short so restarting isn't really a penalty."*

⚠️ **THAT IS A DESIGN DECISION AND NOT A TUNING ONE**, which is why it was not made here alone. It
says the balance baseline is **tier two and up**, and that a bare player at a boss is in a *take your
time or start over* state rather than a state the numbers owe anything to.

## What moved

| boss | was | is | at tier 4 (max) | at tier 2 | shortest phase |
|---|---|---|---|---|---|
| `sentinel` | 150 | **480** | 4.6 → **14.8 s** | 39.4 s | 4.4 s |
| `harrow` | 220 | **580** | 6.8 → **17.8 s** | 47.6 s | 3.6 s |
| `lattice` | 260 | **680** | 8.0 → **20.9 s** | 55.8 s | 6.9 s |
| `shoalMother` | 280 | **780** | 8.6 → **24.0 s** | 64 s | 3.6 s |
| `redoubt` | 340 | **880** | 10.5 → **27.1 s** | 72.2 s | 4.1 s |
| `chorus` | 320 | **980** | 9.8 → **30.2 s** | 80.4 s | 6.0 s |
| `axis` | 420 | **1140** | 12.9 → **35.1 s** | 93.5 s | 5.3 s |

⚠️ **THE TIER 2 COLUMN IS A RECOVERING PLAYER AND NOT THE TARGET.** A run that reaches `axis` with one
pickup has died recently; ninety-three seconds there is the *take your time or start over* state the
player named. **The FLOOR is written at tier 4** because *"dies too fast"* was said about a maxed
ladder, and a floor that the fastest possible kill clears is one every slower loadout clears too.

**Sized by total fight length rather than by a flat multiplier**, so the run escalates evenly — the
per-phase floor falls out of it rather than driving it, because driving from the shortest phase
produced health values that leapfrogged each other.

⚠️ **AND `savior`'s VOLLEY IS A FRACTION SLOWER** — `fireGap` 0.7 → 0.78, reported as *"the shots are
too fast at Saviour of the Galaxy difficulty level, they need to be just a fraction slower."*
`sentinel` goes from a volley a second to one every 1.2 s; every cadence stays on
[0096](0096-the-enemies-play-along.md)'s sixteenth grid, because `fireGapFor` snaps after the
multiply.

## Why twelve seconds, and it is the music that says so

⚠️ **THE FIGHT IS A MUSIC RUNG AND [0114](0114-the-fight-is-a-different-piece.md) REQUIRES A RUNG TO
OUTLAST ITS OWN RAMP.** A rung shorter than a handful of `RAMP_SECONDS` is *"a gain ramp heard as a
wobble rather than a section"*. At 4.6 seconds the fight was **shorter than the ramp into it** —
which is exactly *"when the boss arrives the section change is noticeable, but not in a dramatic
entrance kind of way."* There was nothing after the entrance.

⚠️ **AND A TWO-SECOND PHASE IS THE SAME DEFECT AS A ONE-SECOND RUNG.**
[0111](0111-a-boss-has-one-idea.md) keys every boss's behaviour to its remaining health and the
shortest phases were **1.3 to 2.0 seconds** — an event the model resolves and the player never gets to
answer, which is [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)'s subject and
[0105](0105-a-body-is-on-screen-long-enough-to-answer.md)'s.

## A guard changed its subject rather than its number

⚠️ **`dies to the base weapon` HELD A THREE-MINUTE CEILING AND CALLED IT *"far longer than the fight
should need"*.** True at 150 health; a **design assumption**, not a measurement — and the player has
now overturned the assumption rather than the claim.

⚠️ **The claim survives and the bound moves.** `docs/game.md`'s *the fight is winnable with no loadout
at all* is still held: a run that cannot be finished is a softlock, and that is what a generous
ceiling catches. **How long a fight should be is now held at the design loadout**, which is where it
belonged.

## What was rejected

**Compressing the weapon ladder instead.** It is the root of the 6.9× spread and it would fix both
ends at once — and [0083](0083-two-ladders-of-four.md) settled the two ladders of four on a play
report, so re-opening it is a bigger change than the one that was asked for. **Named here so the next
hand knows it is the other lever**, not forgotten.

**Scaling boss health by what the player is carrying.** It makes every fight the same length, which is
the opposite of a reward for collecting, and it is invisible to the player in a way this project has
refused before.

## The tiers are counted from the ship, and this decision first counted them from zero

⚠️ **THE PLAYER COUNTS THE SHIP'S OWN WEAPON AS TIER ONE**, so one pickup is tier two — *"I'm assuming
the player starts at tier 1, gets a pickup to tier 2 straight away."* Every table above was written
from zero and is corrected here rather than left to be read two ways:

| the player's name | pickups collected | damage a second |
|---|---|---|
| tier 1 | none — off the line | 7.5 |
| **tier 2 — the baseline** | **one** | **19.5** |
| tier 3 | two | 39.0 |
| tier 4 — max | three | 52.0 |

⚠️ **AND THE ASK IS ALREADY MET.** *"At least level 2 weapons from the moment the second pickup
appears"* — level one puts a weapon at **7.4 s** and its second pickup at **19.1 s**, so a player who
takes the first is tier two well before the second arrives. **It was recorded as an open question and
it is not one**; what it does is name the baseline, which is what made the health numbers pickable.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the first boss back to the health it shipped with, which is 4.6 seconds at max weapons | `THE REPORTED ONE: a boss is not over before its music is` |
| a phase narrowed to a sliver of the health bar, so the boss changes and nobody sees it | `and every phase lasts long enough to be seen as one` |
| the last boss made softer than the first, so the run stops escalating | `and a later boss is a longer fight than an earlier one` |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Seven health values and one
difficulty multiplier. No storage key, no save schema, no cache prefix, no origin — and a save in
flight carries no boss health.
