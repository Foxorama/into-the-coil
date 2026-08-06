# The eight questions, answered — 2026-08-07

`docs/state-of-play.md` carried eight questions under *"what the play-test still has to answer"* —
each one *"a number nothing in the repository can settle."* They have been played and answered. This
file is the answers, in the player's own words, because the answers are **findings** and a status
document cannot hold one ([0029](../docs/decisions/0029-the-tracked-record-is-the-record.md)).

⚠️ **Two of them are answered *"can't tell yet"*, and that is a real answer.** Both are blocked on
balance work that the same session then queued, and neither is asked again until it can be.

---

## 1. Is the boss's progress readable at all?

> *"No. The boss gains increased attacks, but there's no progress damage. The boss also moves forward
> and stops. The boss is also too hard to beat with tier 1/2 weapons and too easy to beat with fully
> upgraded weapons."*

[0040](../docs/decisions/0040-a-level-is-a-script-and-a-boss-is-its-clock.md) named this as *"the
thing that build exists to find out"*, and the answer is no. **Three separate findings arrived in one
sentence** and they are not the same problem:

- **No progress readout.** 0040 chose escalating phases over a health bar deliberately, and this is
  the play-test it was owed. Still open — nothing has been done about it.
- **"Moves forward and stops."** Answered: [0061](../docs/decisions/0061-a-boss-keeps-flying.md).
- **Too hard at tier 1–2, too easy fully upgraded.** A balance finding, and it is the same shape as
  question 3 below: the fight scales with the loadout more steeply than intended. Still open.

⚠️ **The middle one had a second report of its own** — *"when a boss reaches mid screen it just goes
up/down and there's no longer any flowing movement"* — and the two are one fault seen twice.

## 2. Is any of the three life counts right? Is twenty seconds the right ceiling on being unarmed?

> *"3 seems fine, if anything should be the max, but let's cross this off and rebalance later."*

**Closed for now, explicitly deferred.** Three is not wrong; whether it is right is a question for a
rebalance pass rather than for this build. The twenty-second rearm ceiling was not separately
challenged.

## 3. Are the two harder tiers anywhere near their targets?

> *"Can't tell at the moment — lots of balancing changes to make before this question can be
> resolved."*

**Unanswerable until the balance pass**, which is now the largest open item.
[0047](../docs/decisions/0047-difficulty-is-a-tier-and-the-easy-one-is-the-content.md) sized the two
harder tiers against a five-health ship;
[0050](../docs/decisions/0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)
made the hull one hit, and the tiers have not been re-sized since.

## 4. Do the two upgrades read on screen?

> *"No — nothing on screen changes in regards to missile tubes, fun barrels."*

`docs/game.md` says **every upgrade changes how the ship looks**, and neither of these does: they
change what leaves the ship rather than the ship. **Open**, and it is a product rule with a failing
case rather than a nice-to-have.

## 5. Do the weaver and the charger read apart?

> *"Yes and no — they're functionally exactly the same, but they are visually different."*

`src/content/sprites.ts` wrote the risk down as *"both are essentially lines, told apart by which way
they lie"* and asked whether the silhouettes hold. **They do.** What does not hold is the half nobody
had asked about: the two rows *behave* alike closely enough that telling them apart buys the player
nothing.

⚠️ **That is a content finding rather than an art one**, and it lands against `docs/game.md`'s rule
for ships — *every one must differ on at least one axis the player can feel* — arriving at enemies for
the first time.

## 6. Do enemy shots ever land?

> *"Yes, frequently."*

**Answered, and it closes [0034](../docs/decisions/0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)'s
open question.** The `spit` speed and the fire rates work; the turret and the warden are the rows that
existed to test them, and they do.
[`ship-speed-settled`](ship-speed-settled-2026-08-05.md) is the measurement they replace.

## 7. Is level two a different game or the same one denser?

> *"Yes for variety, no for flavour, because we don't have art, sounds, background images etc."*

[0042](../docs/decisions/0042-a-run-is-a-sequence-of-levels.md)'s claim — that the harrow takes away
the lane the sentinel taught the player to hold — **holds mechanically**. What is missing is
everything that makes two levels feel like two places, and none of it exists yet.

⚠️ **One third of that list has since landed**: `docs/decisions/0065-the-sky-is-baked-and-blitted.md`
puts a sky behind the game. It is one sky rather than one per level, and the layers are already a
per-scene value on the world, so theming it is a table edit whenever a level is themed at all.

## 8. Does a run that survives a level boundary feel like one run?

> *"Yes and no — yes it does; no it doesn't, because there's a hard stop screen instead of a brief
> flowing respite."*

Answered: `docs/decisions/0063-a-level-break-is-a-respite.md`.

⚠️ **And it carries the most consequential thing in this report**, which is about a feature that does
not exist:

> *"This will actually probably change how we implement the journey star-map between levels, and the
> player choice will probably get scrapped, because a flowing continuation to the next run with a
> brief respite will feel better than the hard pause interruption now."*

`docs/game.md` puts a branching chart between levels.
[0042](../docs/decisions/0042-a-run-is-a-sequence-of-levels.md) shipped a straight line first and said
why: *"a chart is a screen, a graph and a set of rules about what may follow what, and all three want
deciding against levels somebody has played."* Somebody has now played them, and the evidence points
**away** from a screen rather than towards one. Not settled here — recorded so the next session argues
with it rather than rediscovers it.

---

## What is still open after this

| | |
|---|---|
| nothing says how much boss is left | question 1, and 0040 still owes it |
| the boss fight scales too steeply with the loadout | questions 1 and 3 |
| the two harder tiers have never been sized against a one-hit hull | question 3 |
| an upgrade does not change how the ship looks | question 4, against `docs/game.md`'s own rule |
| the weaver and the charger behave alike | question 5 |
| no art, no sound, one sky, no themes | question 7 |
| the chart is now a question rather than a plan | question 8 |
