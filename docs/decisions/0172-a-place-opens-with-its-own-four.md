# 0172 — A place opens with its own four

**Accepted 2026-08-18.** The authoring pass [0162](0162-a-place-has-its-own-ladder.md) built the
mechanism for and deliberately did not do, and the answer to the oldest complaint this project has.

> *"Actually having the levels sound different — it'll need a bunch of different sounds and effects
> applying to each level and if we need to break budgets etc let's do it."*

## The rules

**A place states its own `run` and `push`, and six of the seven do.** Level one states nothing,
because it is what the other six are read against —
[0128](0128-a-place-plays-its-own-material.md).

**No two places have the same four layers loudest at `run`.** `tests/themes.test.ts` holds it, off
the baked audio rather than off the table.

**A place's ladder is read through `rungOf` by everything that claims to describe what a place
plays** — the guards included.

## ⚠️ Five of the seven opened on literally the same four sounds

`scripts/weigh-apart.mjs` has printed the sentence since 2026-08-13: *"the top of every mix is a sub,
a kick, a bass and a pad, which is the same four sounds in all seven."* Measured at `run`, on the
shared ladder, that is exact — `{groove, chords, engine, sub}` is the loudest four in **The Approach,
Ember Nebula, Saurian Reach, The Toxic Mire and The Black Heart**. After:

| | opens on |
|---|---|
| The Approach | `groove, chords, engine, sub` — unchanged, and the reference |
| Ember Nebula | `chords, sub, engine, call` — no kit; a choir and an organ |
| Saurian Reach | `groove, sub, perc, engine` — hats from bar one, no pad |
| The Coil Labyrinth | `perc, engine, sub, call` — footsteps and a breath |
| Rime Shelf | `chords, call, perc, engine` — **no `sub` at all** until it cracks |
| The Toxic Mire | `sub, chords, engine, drone` — the bottom, and almost nothing else |
| The Black Heart | `engine, sub, drive, perc` — a riff, and no hymn |

⚠️ **`mix` COULD NOT HAVE SAID ANY OF THAT AND 0162 IS WHY.** It is a multiplier over the shared
ladder and any multiple of zero is zero, so **no place could open a layer the ladder closed** — and
`MUSIC_LADDER.run` closes `arp`, `ride`, `hook`, `drive`, `counter` and `lead` in all seven. Saurian
Reach's hats and The Black Heart's guitars are layers the shared ladder does not open at `run` at all.

## ⚠️ Measured, at the rung the complaint is about

`node scripts/weigh-apart.mjs --rung=run`, against `--bare`, which is the same table with every
place's ladder dropped:

| at `run` | closest pair | mean over 21 pairs |
|---|---|---|
| shared ladder | **2.4 dB** | 4.28 dB |
| authored | **3.5 dB** | **5.32 dB** |

| at `push` | | |
|---|---|---|
| shared ladder | 3.2 dB | 4.38 dB |
| authored | **3.8 dB** | **5.21 dB** |

⚠️ **THE CLOSEST PAIR IS THE NUMBER AND THE MEAN IS NOT**, which is
[0147](0147-a-place-is-a-balance.md)'s own lesson: a mean is pulled up by one distant place while the
two a player calls interchangeable sit on top of each other. Every pair at `run` now clears 3.5 dB
where three sat under it.

⚠️ **`surge` BARELY MOVES — 4.22 → 4.37 — AND THAT IS DELIBERATE.** The places converge as the level
climbs, because the arrangement is what they have in common and the opening is what they do not. It
is also where the remaining work is if this is not enough.

## ⚠️ The instrument could not see the lever, and three readers could not either

⚠️ **`weigh-apart` WITHOUT `--rung` MOVED BY 0.1 dB WHILE EVERY OPENING CHANGED.** `profileOf` runs on
`loudestOf`, which takes each layer to the loudest gain **any** rung gives it — an arrangement no rung
plays, and one the fight dominates because the fight is where nearly every layer peaks. **A measure
that averages the opening with the boss cannot see a change to the opening.** `--rung` is the half it
was missing, and it did not know it was missing.

⚠️ **AND THREE FUNCTIONS THAT DESCRIBE WHAT A PLACE PLAYS READ THE TABLE EVERY PLACE SHARES.**
`loudestOf` and `rungShape` in `tests/pace.ts`, and the audition guard in `tests/dash.test.ts`. All
three predate 0162; **none of them could have been wrong until a place stated a ladder**, which is
exactly why 0162's own routing guard was vacuous and had to be a source scan. The debt 0162 recorded
is paid: its third probe is re-aimed at a value comparison, and the scan stays for the case a value
cannot reach.

⚠️ **`loudestOf`'s COMMENT SAID *"Mirrors `rig/transport.ts`"*, AND THE RIG WAS RIGHT.** `loudestGain`
has gone through `targetGain` → `rungOf` since the day it was written. The guard was the copy that
drifted — [0027](0027-measure-the-picture-not-the-model.md) inside the instrument, for the fourth
time in this sequence.

⚠️ **AND 0168's GUARD IS WHAT CAUGHT IT, FOR REAL, ON THE FIRST RUN.** *The desk's pace is the guard's
pace* went red at **96.5 notes a bar against 123.75** at Ember Nebula's `run`, because `paceAt` asks
`rungOf` and `rungShape` did not. A guard whose whole job is holding two descriptions together, doing
it.

## ⚠️ What the existing floors cost, one at a time

Every one of these is a guard going red on a real consequence, not a number being fitted:

| what went red | what it cost |
|---|---|
| `0134 — NO PLACE IS SUBSTANTIALLY SLOWER THAN THE BASE` | four places opened under the 90% floor. Rime Shelf and The Toxic Mire got `arp` at `run` — the music box and the ripple, both on brief — and The Coil Labyrinth got `ride` and kept a quiet `groove` |
| `every place has a bottom AND a top` | Ember Nebula and Rime Shelf fell under the 28% low floor at `push`. Both pay for it in `groove` |
| `0136 — EMBER NEBULA CLIMBS INTO THE SURGE` | closing the kit raised the place's pitch centre at `run`, flattening `surge/push` to 1.029 against a floor of 1.05 |
| `0167 — A BUILD DOES NOT DUCK` | **eleven** carried layers fell over a boundary. Every raise at `run` has to survive the next rung, and the raises that could not — every `drone` — were dropped rather than propagated |
| `and NO LAYER IS UNREACHABLE` | The Black Heart closed `call` at `run` **and** `push`, which is every rung the shared ladder opens it at, so the hymn became unauditionable on the desk. It keeps `push` |

⚠️ **AND `HOLD_WEIGHT` MOVED FROM 0.40 TO 0.28**, because 0166's edge of free moved: at 0.30
`core/push/perc` goes under `ROLE_FLOOR_DB` where nothing did before. **That is the guard doing what
its own comment promised** — *"if a later mix pass moves that edge, this test says so rather than
going quietly on shipping the old number."* The trajectory solve does not ship, so what it costs today
is research headroom rather than a sound.

## ⚠️ One guard was loosened, and the claim it makes is unchanged

`0166 — AND A WEIGHT OF ZERO IS THE SOLVE THAT SHIPPED` compared two solves to six decimal places of a
gain. They are the same update rule from different starting points — the test's own comment says so —
so what separates them is where four hundred iterations stop, and **that residue is a property of the
tree being solved**: under 5e-7 before, 7.0e-5 after, on a gain of 2.30.

**It is now stated in decibels, under a hundredth of one.** `DUCK_FLOOR_DB` next door is a whole
decibel because that is a level JND; this is two orders under it, and the worst residue in the tree is
5.9e-4 dB — seventeen times below the bound. A digit count fitted to one tree fails on the next for a
reason that is not a defect; a bound in the units of the claim does not.

## What this is not

⚠️ **It is not new material and it is not an effect.** The ask says *"a bunch of different sounds and
effects"*; this is **which of the existing twenty-three sound, and when**, which is the lever that was
built and empty. New material per place is `src/content/<place>.ts` and is a bigger, separate pass.

⚠️ **It is not a different SHAPE per level.** Every level still changes section at the same seven
distances — [0158](0158-a-level-says-where-its-sections-open.md) made `sections` free per level and
nothing has been authored there either. That is the next-largest lever and it is untouched.

⚠️ **AND NOTHING HERE HAS BEEN HEARD.** Seven openings were authored from each place's own written
brief and checked against meters. [0027](0027-measure-the-picture-not-the-model.md) applies to every
number above.

## Confirmed, not assumed

- `npm run typecheck` clean, `npm test` green, `npm run build` clean.
- The two tables above: `node scripts/weigh-apart.mjs --rung=run` and `--rung=run --bare`.
- 0164's `STILL_ADRIFT` is **88 entries, unchanged** — this pass neither buried a layer nor freed one.
- Three probes, seen red, trees restored: `node scripts/prove-guard.mjs 0172`.

| broken on purpose | went red |
|---|---|
| every place back on the shared `run` row, which is five of seven opening on the same four sounds | ``THE REPORTED ONE: no two places have the same four layers on top at `run` `` |
| the shape arithmetic back on the shared ladder, so the desk's pace and the guard's disagree | `0168 — THE DESK'S PACE IS THE GUARD'S PACE, layer for layer and rung for rung` |
| the audition guard composing its expectation from the shared ladder rather than the place's | `an audition is the LOUDEST this place ever takes the layer, off the game's own tables` |

⚠️ **AND 0166's PROBE WAS RE-ANCHORED**, because `HOLD_WEIGHT`'s value is the thing it breaks. All
three of 0166's were re-run red rather than assumed good.

## Rollback

Shipped audio. The `ladder` block on six rows of `THEMES` in `src/content/themes.ts`, and
`HOLD_WEIGHT` in `scripts/solve-mix.mjs`. The `rungOf` routing in `tests/pace.ts` and
`tests/dash.test.ts` is guard-side and changes no sound. Revert the commit. No storage key, save
schema, SW cache prefix or origin.
