# 0314 — The shoal comes in while it fights

**Status:** accepted
**Builds on:** [0249](0249-the-eagle-summons.md), [0262](0262-the-eagle-throws-quills.md), [0270](0270-a-shattering-volley-is-counted-in-shards.md), [0313](0313-the-fish-breaches.md)
**The brief:** [`the-fish-asked`](../../reports/the-fish-asked-2026-09-12.md)

## The ask

> *"Needs to be attack while the adds are coming in"*
>
> *"The adds need to be more interesting than a boring line of fish and a boring line of space shrimp —
> there needs to be a reason for the player to react and interact with them."*

Two items, and they are one change: the reason to react to an add is a thing the add is DOING, and a
horde that arrives instead of an attack is a horde the player deals with in peace.

## The mechanism the game did not have

⚠️ **A `summon` IS AN ARM OF `BossAttack`, SO THE VOLLEY THAT CALLS A HORDE THROWS NOTHING.** The adds
were the attack. Two of the fish's five phases were summons, so **for a third of that fight the boss
stopped fighting to send its adds** — and a phase table has no way at all to say *as well as*.

A phase may now carry an `Escort`: who, how many, in what shape, from which edge, how many may stand —
and `every`, which is the one field a summons does not have. It is stepped beside the row's `fall`
(0251) and for the fall's own reason: **a clock of its own is the whole of what *while* means.**

| | |
|---|---|
| on the PHASE, not the row | a fall is weather over a whole fight; an escort is one phase's idea, so a boss can open alone and be joined later — [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s *a change is finished when the thing it added can differ per instance* |
| one caller, not one copy | every other field is `summon`'s and it goes through the same `summonAdds`: the ceiling that tops the horde up rather than adding to it (0270), the flanking entry (0262), and a full field spending no turn |
| its own side counter | sharing the summons's `spin` would make each stream's side a function of how often the OTHER fired — unpredictable to whoever authors either, and measurable only intermittently ([0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)) |
| its first call opens the phase | the counter starts at zero, so *the phase turns over and the shoal comes in with it*. A fall waits its own gap because the boss arriving is already an event; a phase change is the event this one belongs to |

⚠️ **AND THE LAST THIRD CARRIES BOTH AT ONCE, WHICH IS WHAT KEEPS THEM TWO THINGS.** The volley dumps
a wave of kites on the fire grid while the escort keeps the shoal arriving underneath it on its own
faster clock. If an escort were only ever a summons with a different name, that phase would be
unreadable; it is the phase that proves it is not.

## The reason to react is that the shoal is not coming for the player

⚠️ **EVERY ADD IN THIS GAME EITHER IGNORES THE SHIP OR CONVERGES ON IT, AND BOTH ARE ANSWERED BY *SHOOT
IT OR DO NOT*.** That is what *"a boring line of fish and a boring line of space shrimp"* is about: not
the shapes, the question. A drifter and a hunter ask the same one.

**The minnow swims for the boss.** One that gets there is eaten, and the fish is fed — so every one the
player lets past is health they have to take off again. The question stops being *dodge or shoot* and
becomes **what is worth your fire right now**, which nothing in this game has asked before.

| | |
|---|---|
| one hit, no gun | it cannot punish being ignored except by arriving, so ignoring the shoal is a longer fight and not a worse one |
| the slowest thing on the field | it crosses the player's fire on its way up-lane, and the window to deal with it is several seconds wide |
| 14 health a bite | against the fish's 3040 on the tuned tier: three a call every two seconds is at most 21 a second handed back, against a max-weapon loadout taking off the order of sixty. **A play number, and nothing asserts it** |

⚠️ **FEEDING CAN NEVER PUSH IT BACK INTO A PHASE IT HAS LEFT, AND THAT IS THE FLOOR UNDER THE TRADE.** A
phase is keyed to remaining health (`docs/game.md`), so an unclamped heal walks the fight **backwards**
through the table — the look, the cadence and the attack all reverting, and 0111's phase burst firing
again on the way down. The ceiling is the current phase's own `upTo`: the shoal can undo everything the
player did **inside** this phase and nothing they did before it.

⚠️ **IT IS NOT A COLLISION, AND WRITING IT AS ONE WOULD HAVE COST A FOURTH MEANING FOR `damage`.**
Nothing is hit: no damage is dealt, no invulnerable window opens, and the thing consumed is the one
that arrived.

## The sprite sheet caught what no number would have

⚠️ **THE FIRST PHOTOGRAPH OF THE SHOAL WAS A FISH SWIMMING TO THE FISH TAIL FIRST.** Every hull in this
game is baked facing down the lane, because every hull goes that way. A minnow goes up it. Every
assertion about where the shoal WAS stayed green over that, which is
[0027](0027-measure-the-picture-not-the-model.md) exactly: *a guard measuring a quantity defined in
terms of the constant it guards proves only that the code agrees with itself.*

`blit` has taken an angle since [0306](0306-the-serpent-coils-in.md) and 0313 put a whole hull on it.
This is the third user of it and the first that is not a boss: the minnow's `turn` is the heading it
swims at, so a shoal converging on the fish fans in towards it. The guard asks for the angle the painter
is handed, in degrees off the way the body is actually travelling.

**And the minnow is drawn as a fish rather than as a variation on the kite it shares a sky with**: a
blunt snout, a body that swells behind the head, a dorsal fin up and an anal fin down, and a deeply
forked tail — all of it in the outline, on [0276](0276-the-kit-draws-a-creature.md)'s rule that a fin
which reads at this size has to be part of the silhouette. The kite beside it is a straight-edged
diamond with two streamers. **Five world units, the smallest body in the game**, so a shoal reads as a
shoal rather than as a wave.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0314`:

| broken on purpose | went red |
|---|---|
| the escort keeping nobody standing, so the phase throws into an empty field | `THE ASKED-FOR ONE: the adds come in WHILE it is throwing` |
| the escorted phase made a summons again, so the adds ARE the attack after all | `THE ASKED-FOR ONE: the adds come in WHILE it is throwing` |
| the minnow hunting the ship instead of swimming for the fish | `a minnow swims for the FISH and not for the player` |
| the minnow not turned to its heading, so the shoal swims to the fish tail first | `a minnow swims for the FISH and not for the player` |
| the shoal never eaten, so reaching the fish costs the player nothing | `one that gets there is EATEN` |
| the feed unclamped, so a shoal can push the fish back into a phase it had left | `feeding can never push it back into a phase it has left` |
| the escort's side never alternating, so the shoal is a file after all | `and the shoal comes in from the SIDES` |

⚠️ **AND ONE EXISTING GUARD WENT RED AND WAS WIDENED WITH ITS REASON.** `tests/crowd.test.ts`'s *a
summons keeps at most the horde its row authors standing* read one ceiling per phase and measured 14
against 8 on the fish's last third, which authors two. The claim did not move — *no more standing than
the row says* — the arithmetic did, and both halves are still authored numbers.
[0192](0192-a-guard-holds-an-invariant.md): a red guard is answered by fixing the defect, changing the
guard and saying why, or deleting it.

## What this deliberately does not do

- **The raptor is no longer called by the fish**, and is not missed: it is the Saurian Belt's animal
  (0232's signature, borrowed), and what the fish sends now is its own. Its row is untouched.
- **The kite is not redrawn.** The brief asks for better art on the adds and this answers half of it —
  a new body, drawn as the place's own creature. The kite's diamond is 0249's and wants its own pass,
  which is the item still owed.
- **No minnow shoots, and none is authored by a level.** A horde that shoots is a wall (0249's own
  words) and a feeder with nowhere to feed is a drifter — `tests/volans.test.ts` holds both.
- **The shoal does not flee when the boss dies.** It keeps swimming at where the boss was until the
  cull takes it, which is what every other body on the field does when a fight ends.
