# A death that draws nothing is three different bugs at once

**2026-08-05.** Not a play-test verdict — a request, and the reason given for it is the interesting
part.

## The ask

> *"Let's add a destruct animation now, because that's going to help a lot with future testing,
> identifying hits or whether things mysteriously disappear, debris lasting time etc. And let's
> change the player ship back to blinking yellow, it was doing that before and it got changed to the
> white."*

⚠️ **The first one is framed as an instrument, and that is exactly what it is.** It has been asked
for as a diagnostic before an effect, which is the right way round: a death currently draws nothing
at all, so three completely different situations produce an identical picture —

| what happened | what the screen showed |
|---|---|
| it died | nothing |
| it drifted off the trailing edge | nothing |
| the collision missed and it is still there behind something | nothing |

Every play-test so far has reported a version of *"they just disappeared"*, and every one of those
was this: a question the screen could not answer. See
[0036](../docs/decisions/0036-an-event-the-model-knows-about-the-picture-mentions.md), which is the
rule the three reports turned out to share.

## What landed, and what it was measured at

A pooled scatter of shards from the point of death, with a spread of speeds and a spread of
lifetimes. Driven on the shipped page and counted through the painter:

| | |
|---|---|
| fragments | 8 for an enemy, 16 for the ship |
| dissipation | 64 → 46 → 19 → 14 → 2 → 0 blits per 50ms |
| visible life | roughly 300–560ms, ragged rather than uniform |

⚠️ **The ragged tail is the point rather than a flourish.** Every fragment expiring on the same step
reads as the effect being switched off; a spread reads as it thinning out. It is also what makes
*"how long does debris last"* answerable by watching, which is half of why it was asked for.

**The budget was written for this three decisions ago.** 0022's worst case is *~150 enemy bullets,
~80 player projectiles, ~40 enemies, ~200 particles*; the particle share has been unclaimed and
`mount.ts` said so rather than quietly spending it. Debris claims exactly that 200. The total is 471
and the 500-entity frame budget has not moved.

## The yellow, and the thing it retires

The ship blinks `hazard` yellow again. It went white when the flash was generalised from the ship to
every body, which was a change nobody asked for that rode along with one that was needed.

⚠️ **It also settles the hypothesis the last report wrote down and declined to build on.** That
report flagged that the ship blinking to the same ink an enemy flashes is *one channel carrying two
opposite meanings* — *you cannot be hurt right now* versus *this just was* — and guessed the fix
would be a third sprite. It is not. It is the colour the ship already had, and a hand asked for it
back before any of that reasoning was needed.

## What is still silent

**A miss draws nothing**, so a near miss and a wide miss look the same. Named and left: unlike the
three above, nobody has yet reported it as something else.

---

## A near miss worth recording, because no probe would have caught it

`SPRITE_KINDS` is the baking order and `SPRITE` is the blit index. They are two descriptions of one
fact and **nothing type-checks that they agree** — both are valid tables independently. Adding
`debris` to the middle of one list and the end of the other made every entity in the game draw as
something else, and it was caught by reading the diff rather than by anything running.

It is now held by an assertion, and probed. The lesson is not *be careful*: it is that a `Record`
over a closed union forces a row to EXIST and can never force it to hold the right value, which is
the same hole [0035](../docs/decisions/0035-damage-is-legible-on-the-body-that-took-it.md) found
when a hit sprite could be filled in with the sprite it was supposed to differ from.

## And a third tautology, caught by the harness again

The guard for *"an explosion must not move a wave"* ([0021](../docs/decisions/0021-one-stream-per-concern.md))
was first written as: drain one stream the test built, check the other has not moved. That proves
`Rng.stream()` returns independent streams — which `tests/rng.test.ts` already owns — and says
nothing about which stream the **game** reaches for. `npm run prove` reported STILL GREEN.

It now drives the real frame until a burst has actually happened and requires the spawn stream to be
exactly where an untouched world's is. **Three assertions in two sittings have now been green against
the implementation they existed to reject**, and all three were found by
[0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md) rather than by review.
