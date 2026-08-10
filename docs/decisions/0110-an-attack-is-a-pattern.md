# 0110 — An attack is a pattern, and not every pattern is aimed at you

**Accepted 2026-08-10.** Item 7 of
[the-ninth-play-test](../../reports/the-ninth-play-test-2026-08-10.md).

**The first time anything that shoots at the player fires at somewhere other than the player.**

## The rules

**How a body SHOOTS is a closed union on its row**, the same shape
[0073](0073-an-enemy-is-a-pilot.md) gave how a body moves.

**A pattern is the same pattern wherever the player is.** A fan centred on the ship is *aimed*
however many shots are in it.

**Aimed is not deprecated and must not be.** A field where nothing points at the player is weather.

## What was asked for

> *"need more variety and more attacks that are pattern attacks and less target player attacks."*

⚠️ **IT IS AN ACCURATE READING OF THE CODE, NOT AN IMPRESSION.** `fireEnemies` in `src/app/frame.ts`
computed `atan2(ship − enemy)` for every body in the game that fired, with **no alternative anywhere
in the model**. 0073 gave motion a closed union — drift, weave, hunt, circle, loop — and left firing a
single behaviour; this is that omission arriving, and 0073's own file predicted the shape of the fix
in as many words when it argued for its own union.

## Why a pattern is a different thing from a spread

⚠️ **AN AIMED SHOT ASKS *ARE YOU WHERE IT IS POINTING*, AND THE ANSWER IS ALWAYS *MOVE*.** It is the
same answer every time and there is nothing to get better at. A pattern asks *where is the gap*,
which has a different answer per pattern and is a question a player can learn. That is the whole of
what *"variety"* means here, and it is why the count of shots is not the axis: a five-shot fan centred
on the ship is one aimed shot with error bars.

⚠️ **`tests/pilots.test.ts` holds it by DRIVING THE FRAME TWICE WITH THE SHIP IN TWO PLACES** and
comparing the set of headings. Nothing about the table can say this; a fan centred on `atan2` is
identical on the page to a fan centred on `π`.

## The four

| | what it asks | who sends it |
|---|---|---|
| `aimed` | are you where it is pointing | lancer, warden |
| `spray` | which side of the fan | turret |
| `wall` | be in the hole | sower |
| `spiral` | when, not where | spinner |

⚠️ **THE TURRET LOSES ITS AIM AND IT IS THE ROW THAT SHOULD.** It holds station, is on screen for a
known length of time and fires faster than anything else — [0098](0098-a-wave-plays-a-figure.md)
already gave it the slow fat bullet on the argument that *"a slow wide one is a pattern to move
through"*, and then aimed it. The lancer and the warden keep aiming because their identities are
built on it: one *"steers into the player's lane before it fires"* and the other *"flies in and stays
with you"*, and an unaimed shot from either is a body that closes in order to miss.

⚠️ **THE WALL'S HOLE IS WHERE THE BODY IS, AND THAT IS THE ONE READABLE ATTACK IN THE GAME.**
Everything else is answered after the shots exist; this one announces the safe place by standing in
it. `tests/pilots.test.ts` measures the nearest bullet against **the ship's own hurtbox** rather than
against a number typed in the guard — [0027](0027-measure-the-picture-not-the-model.md).

⚠️ **THE SPIRAL IS THE ONE ATTACK THAT NEEDS STATE, AND IT COULD NOT HAVE BEEN DERIVED.** This
project's usual answer is a function of position — the weave is authored against `along` so a shape
can be drawn on a map. It fails twice over here: a spinner holds station, so a phase off its own
`along` never advances; and a phase off the CAMERA would put every spinner on the field at one angle,
which is 0098's *"they all fire at exactly the same time"* arriving in the other axis. `firePhase` is
one number on the entity, set at spawn from the member's index by the golden angle, on exactly the
terms `spin`, `holdFor`, `turnsLeft` and `bobPhase` already state.

## Two new kinds, and the silhouettes were chosen against the six that exist

⚠️ **`reports/enemy-silhouettes-2026-08-05.md` is why this paragraph is here.** The lancer shipped as
a five-sided arrowhead, reasoned to be obviously an arrow, and read at its actual size as *a slightly
smaller diamond* — so the player saw diamonds everywhere, some dying to one shot and some to two, and
reported the game as buggy.

Taken: diamond, wide triangle, bar, needle, half-disc, ring. **The spinner is a CROSS** — the only
concave outline in the game, and an edge that goes in and out four times survives shrinking in a way
corner-counting does not. **The sower is an open CHEVRON** — the only silhouette that is not closed.
The pair to watch is the chevron against the lancer's triangle, both wedges pointing at the player,
told apart by a notch that is deliberately 0.45 of the radius deep against the 0.25 that was measured
to be invisible.

## Three guards were measuring *one body, one bullet* and could not say so

⚠️ **THAT ASSUMPTION WAS TRUE OF EVERY ROW IN THE GAME AND WRITTEN DOWN NOWHERE.**
`shotsPerVolley` is now the single description, and three guards import it:

| guard | what it counted | what it counts |
|---|---|---|
| `tests/spawns.test.ts` — *a formation opens fire as a figure* | bullets on a step | **bodies** that fired on a step |
| `tests/pilots.test.ts` — *volleys a body gets away* | volleys | volleys **and bullets**, separately |
| `tests/legibility.test.ts` — *what shoots back is not all one bullet* | one bullet per shooting kind | see below |

⚠️ **THE LEGIBILITY EQUALITY BECAME ARITHMETICALLY IMPOSSIBLE, WHICH IS NOT THE SAME AS BECOMING
INCONVENIENT.** It read *every shooting kind sends a different bullet* — exactly right with three
shooters and three bullets, and unsatisfiable with five shooters. **A guard that cannot be satisfied
is not strict, it is stopped.** The rule underneath it is restated as two claims: every bullet that
shoots at the player is one an ENEMY sends (nothing is introduced first by a boss), and **no two
shooting kinds share both a bullet and an attack** — which is stronger than the equality was on the
axis that matters, because a threat now differs in what it looks like *or* in what it asks.

## What the level scripts got

Eighteen waves across levels two to seven, by substitution rather than insertion — so the pacing,
the ordering and the pickup budget of every level are untouched and only what arrives has changed.
The spinner is introduced in level two and the sower in level three, and both appear in every level
after their own.

⚠️ **Level one is deliberately untouched.** It is where a player learns that things point at them, and
a pattern means nothing until that is true.

## What the proof found

⚠️ **Five probes, five guards, and one orphaned ANCHOR that had become ambiguous rather than
missing.** 0098's *the lancer put back on the spit* probe anchors on `shot: 'lance',` — unique until
the sower joined the table, and a match that fires twice is refused by the harness exactly as one that
fires never is. It carries the lancer's own next line now.

## Rollback

**None owed.** No storage key, no save field, no service-worker cache prefix and no origin. `firePhase`
is a field on a pooled entity, which is per-frame state and explicitly not reducer state
([0022](0022-frame-rate-is-a-feature.md)); nothing about it is serialised.

## What this does not settle

⚠️ **The bosses still share one behaviour and one aimed volley**, which is item 8 of the same report
and its own change. This union is deliberately shaped so `src/app/boss.ts` can consume it rather than
grow a second one.

⚠️ **Whether a wall should be dodged or flown around.** Its span is 52 of the lane's 100 units, so
going round the outside is a real alternative to taking the gap, and which one a player reaches for is
a thing only a play-test can say. Both are cheap to retune: they are two numbers on one row.

⚠️ **Nothing here changes how hard the game is on purpose.** The substitutions keep every wave's count
and place, but a spinner puts three bullets where a turret put one — `tests/pilots.test.ts` bounds
what one body may send while it is visible, and the level's total is not bounded by anything. It is
named here because a play-test that reports *harder* should look at this first.
