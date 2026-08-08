# 0052 — A pickup is two things, and the camera says which

**Accepted 2026-08-06.** The third item on the list asked for after the two-level play-test: *"a
pickup on the field changes what it is every few seconds, and changes its sprite with it, so which
one a player gets is a matter of when they reach it."*

> ⚠️ **SUPERSEDED 2026-08-08 by [0082](0082-a-pickup-is-rare-and-says-what-it-is.md).** The cycle is
> gone, along with `CYCLE`, `CYCLE_UNITS`, `faceOf`, `cyclePickups` and `tests/cycling.test.ts`.
> **Nothing below was found to be wrong — its PREMISE stopped being true.** The reasoning here is
> written for a field with a pickup every 250 units, where a player passes dozens and takes whatever
> is beside them; 0082 cut a level to six, and a coin flip on a premium piece the player crossed the
> lane for reads as the game taking something away. It also made the ask's per-level budgets
> unauthorable, which is what settled it.
>
> **Kept in full and unedited**, because it is the record of a real mechanism that shipped and was
> played, and because the involution argument below is the reason a three-kind table was not available
> until the cycle went. Its probes are deleted and it is listed in `WITHOUT_PROBES` —
> [0019](0019-a-probe-must-be-seen-to-apply.md)'s STILL GREEN is what repointing them would have been.

## The rule

| | |
|---|---|
| **the pairing** | `CYCLE` — an **involution** over the whole table. Every kind, exactly one partner |
| **the pairs** | rapid ↔ missileRate · spread ↔ missileSpread · extraLife ↔ shield |
| **the phase** | `floor(cameraAlong / CYCLE_UNITS) % 2`, stated once, in `faceOf` |
| **what the entity carries** | the kind the LEVEL authored. Never the face |
| **what the field shows** | that kind, or its partner — every pickup on screen flipping on the same step |
| **what a level authors** | the **pair**, and which face it starts on |

## Why the entity keeps the authored kind

⚠️ **The first draft wrote the face back onto the entity, and it flickered at 60Hz.** Once `kind` is
the face, the next step's rule reads the face rather than the authored kind and flips it again — so
every pickup on the field alternates once a *step*. It is the purest form of the mistake this
repository keeps finding: a derived value stored beside the thing it is derived from, and then read
as though it were the source.

So the entity carries what the level wrote, and *what it is right now* is that plus one boolean. The
boolean lives on the world because **two different loops need the same one**: the sprites are written
in `cyclePickups` and the effect is resolved in the collection, a few lines apart, and a pickup drawn
as one thing and handed over as another is the screen lying to the player. `docs/decisions/0036`
with the sign reversed.

## Why a distance rather than a duration

⚠️ **The same argument `src/content/enemies.ts` makes for the weave**: a shape in the world can be
authored against and a wobble in time cannot. A phase read from wall clock plays differently on a
machine dropping frames; a phase read from each pickup's own age makes every object keep its own
timer, and the field stops flipping *together* — which is the whole of what makes it read as
deliberate rather than as things glitching independently.

`CYCLE_UNITS` is 130 world units, a little over two seconds at the scroll rate, against a pickup that
is in view for about nine. A player who wants the other face can wait for it; a player who wants
whichever is there can take it. Nothing asserts on the number.

## Why an involution over the whole table

A one-way mapping gives a pickup that turns into something that turns into a *third* thing, and a
kind left out of the table is a pickup that never cycles at all — which reads as a bug in the cycle
rather than as a gap in the table. Both are held by `tests/cycling.test.ts`, and the second is what
stops a seventh pickup being added with nowhere to go.

⚠️ **Each pair is one weapon's upgrade against the other weapon's**, which is what makes the choice
real: *shoot faster* against *missiles fire faster*, *another barrel* against *another launcher*,
*one more try* against *a shield*. The guard states that as a property — a face and its partner never
promise the player the same thing.

⚠️ **And each pair is one silhouette in two fills**, which
[0051](0051-a-missile-is-the-second-auto-weapon.md) chose with this change already in view. A pickup
that alternates has to read as one object in two states; two unrelated shapes taking turns would read
as the field being rewritten.

## What this amends

⚠️ **[0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md) said each
level's first pickup is a shield. It is now the shield PAIR** — a shield or an extra life, depending
on when the player reaches it. That is the mechanic working as asked rather than a regression, and
both faces answer the question a one-hit hull asks. `src/content/levels.ts` says so at the line
itself.

## What was rejected

**A canonical face per phase — every pickup on screen showing the same half of the table.** It makes
the field uniform, which sounds tidier and is worse: it throws away what the level authored, so a
designer can no longer place *a shield here and an upgrade there* at all. The authored kind is the
starting face, and the pairs flip around it.

**A per-pickup timer.** It is the obvious implementation and it is the one thing the ask rules out:
*"every cycling pickup on screen then flips together, which reads as deliberate."* Its probe is in
the set below precisely because every single-pickup assertion passes with it in place.

**Teaching it on the title screen.** The key already lists all six faces with their real sprites. What
it does not say is that a pickup alternates, and `docs/game.md` is explicit that hints are added
*where play proves they are needed, never pre-emptively*. This is a play-test question.

## Confirmed, not assumed

`npm run prove 0052` — every guard broken on purpose and seen to fail.

| broken | what went red |
|---|---|
| the collection reading a different phase from the one the field is drawing | `hands over the face on the field, in both phases` |
| the face written back onto the entity, so the cycle accumulates | `never accumulates` |
| the drawn face left for `stepEntities` to overwrite on the next step | `draws the face it will hand over, on every step of both phases` |
| the phase read from a step counter rather than from the camera | `flips on a distance, not on a clock` |
| the pairing made one-way, so a face has no way back | `pairs every kind with exactly one other` |
| each pickup flipping on its own phase rather than with the field | `flips everything on the field on the same step` |

⚠️ **The fixture that measured an empty field.** The first version of these tests placed a pickup at
the ship's own distance, where it falls behind the trailing cull in about 200 steps — before the first
phase boundary. Every assertion about what happens *across* a boundary was being made against a field
with nothing on it, and passed. Pickups are placed near the leading edge now, and the helper says why.
[0019](0019-a-probe-must-be-seen-to-apply.md) is the same failure one level down.
