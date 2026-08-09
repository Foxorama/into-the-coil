# 0098 — A wave plays a figure, and there are three bullets

**Accepted 2026-08-10.** Item 4 of
[the-fifth-play-test](../../reports/the-fifth-play-test-2026-08-10.md).

**Second pass over a defect [0096](0096-the-enemies-play-along.md) already answered**, and the
second half is a report nothing in the repository could have seen.

## The rules

**Every member of a formation gets its own place in its own cadence, and the spread only ever
delays.** A body's phase is quantised once at spawn, as before; what is new is that the phase differs
per member.

**There are three enemy bullets and they are a ladder: quick and thin, medium, slow and fat.** Every
one keeps the same hurtbox, and the faster a shot is the smaller it is drawn.

## What was asked for

> *"The enemies all fire at exactly the same time when they appear, all the enemy bullets are exactly
> the same."*

## The volley: 0096 aligned the phase and then handed every body the same one

⚠️ **0096's own sentence is the bug, read carefully.** *"Two enemies that spawned on different
sixteenths stay on different sixteenths"* — true, and a formation does not spawn on different
sixteenths. `spawnWave` places every member inside **one call**, so `w.steps` and `row.fireEvery` do
not vary down that loop and neither did `nextOnGrid`'s answer. Five turrets, one number, one volley.

⚠️ **Every guard 0096 wrote is green over the reported build, and correctly so.** They ask whether a
shot lands on a step the grid allows. They never ask **how many** landed on it, which is the whole of
what the player described — [0027](0027-measure-the-picture-not-the-model.md), for the third time in
this feedback round.

## The two rules are incompatible, and this decision says which one survives

⚠️ **0096 refused to round the alignment forward**, and the reasoning is on its probe: *"every body on
the field would open fire up to a grid unit LATE — a change to how quickly a wave becomes dangerous,
which is a balance number nobody asked to move."* The guard it left behind says a body waits within
one grid unit of its cadence.

⚠️ **N bodies at one cadence CANNOT be at N phases while all of them wait within one grid unit of
it.** That is arithmetic, not a trade-off: the window is one sixteenth wide and the phases have to be
sixteenths apart. So a spread is impossible under 0096's guard, and the guard is what produced the
report.

⚠️ **What survives is the DIRECTION, which is what the rule was protecting.** 0096's number was
incidental; its argument was *no body opens fire sooner than it used to*. A share moves a body
**later**, by whole grid units, and never past one more cadence. Nothing on the field becomes
dangerous sooner than it was, and `tests/difficulty.test.ts` holds both halves separately.

## Where a body sits in its cadence

```
e.fireIn = nextOnGrid(w.steps, fireGapFor(row.fireEvery, w.difficulty), (i + index) / wave.count);
```

⚠️ **The member's index AND the wave's**, which is the parity idiom `spawnWave` already uses eight
lines up for the roam. The member spreads the formation across its own cadence; the wave rotates it,
so two waves of turrets in a row do not play the same figure at the same offset.

⚠️ **Authored rather than rolled**, for the reason that function opens with: a level that rolled its
rhythm would play differently every run and could not be tuned by a hand.

⚠️ **The slots are the BODY's cadence divided by the grid, never the wave's size.** A turret's 48
steps is eight sixteenths and a lancer's 78 is thirteen; spreading over the count instead would put
two bodies on one slot in the first case and leave five empty in the second. It is a probe.

⚠️ **A share of zero is byte for byte what 0096 returned**, so the boss and every other caller ask
the old question and get the old answer.

## And the seeded field was the one reload site 0096 never reached

⚠️ **`seedField` in `src/app/mount.ts` set `e.fireIn = row.fireEvery`** — the pre-0094 form, because
the seeded field is not a wave and nothing pointed at it. It is the field behind the title screen and
behind the proof scene, so it is the first thing a player ever hears anything shoot in, and every body
of one kind counted down together. It is on the grid and spread now.

## The bullets: one row, three shooting kinds and seven bosses

| | speed | drawn | silhouette | sent by |
|---|---|---|---|---|
| `lance` | **1.6** | **1.9 u** | a dash lying along the lane | the lancer, `harrow`, `shoalMother`, `axis` |
| `spit` | 1.4 | 2.6 u | a square | the warden, `sentinel`, `chorus` |
| `flak` | **1.0** | **3.4 u** | a bevelled slab | the turret, `lattice`, `redoubt` |

⚠️ **EVERY HURTBOX IS STILL 0.9, WHICH IS 0081's OWN PRECEDENT.** When the spit got its own
silhouette its radius was deliberately left alone — *"this is a legibility change and not a difficulty
one"* — and the same rule governs here. What varies is what the player sees and how long they have;
what they have to dodge is one circle.

⚠️ **Every speed is still under the ship's 1.7**, which is what makes an aimed shot dodgeable rather
than a coin flip ([0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md)). The spread is 1.0
to 1.6 around the spit's 1.4, so the mean threat is roughly where it was.

⚠️ **THE FAST ONE IS THE SMALL ONE, AND THAT IS WHAT KEEPS THIS A LEGIBILITY CHANGE.** The shot that
gives the player least time is the one that occupies least of the lane; the one that fills the lane is
the one they can walk away from. Inverted, the same three rows are a difficulty increase wearing a
variety change — and with identical hurtboxes **nothing else in the suite could tell the
difference**. It is a probe.

⚠️ **One ink for all three, deliberately.** 0081 read the other way round: colour means *this will
hurt you* and nothing else, so the player learns one thing about ink and three about silhouettes.

⚠️ **The bosses pair by cadence rather than by rotation** — the faster a boss fires, the slower its
bullet. `redoubt` reaches thirty steps a shot, so it throws the fat slow one and the fight is a
pattern to move through; `shoalMother` *"fires little and hits hard"*, so it throws the dart.
`docs/game.md` says every boss is unique, and this is the cheapest axis of that which had never been
used.

⚠️ **The lance is the one pair where SIZE does almost nothing**, and it is written down rather than
hoped over: 1.9 against the pulse's 1.8 is barely larger, so what separates the player's own shot from
the fastest thing fired at them is shape and ink — a red dash along the lane against a cyan disc.
0081's *the bigger one is the one you must not touch* is satisfied by a hair and is not doing the work.

## What the guards could not see, and now can

⚠️ **`no two shots in the game share a silhouette` was green throughout** — it is about the TABLE, and
the table was always fine. What was wrong is which rows the content **sends**, which nothing asked.
The new guard walks `ENEMIES` and `BOSSES` and counts the distinct bullets that actually reach the
field, so a fourth row added and never assigned cannot pass it.

⚠️ **AND IT COUNTED THEM TOGETHER FOR ONE COMMIT, WHICH `npm run prove` REPORTED AS STILL GREEN.**
The two tables live in different files, so putting every shooting ENEMY back on one row still left
three kinds in circulation — the bosses were untouched. **A guard over a total cannot be reached by a
one-file regression**, and a one-file regression is the shape of every regression this project has
had. It is now *each of the three shooting enemy kinds sends a different bullet*, which is a rule and
is checkable as an equality, plus a separate count over the seven bosses.

⚠️ **And the picture guard counts bullets per step**, which is the quantity the report is about and
the one 0096's guard structurally cannot ask. Its spread assertion is in **milliseconds off the real
frame**, because *"at exactly the same time"* is a claim about what a player heard.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0098-a-wave-plays-a-figure.mjs`.

| broken on purpose | went red |
|---|---|
| the share dropped from the spawn alignment, so a formation reloads in unison again | `0098 — THE REPORTED ONE: a formation opens fire as a figure rather than as one volley` |
| the slots counted off the wave rather than off the body's own cadence | `0098 — and a SHARE only ever delays a body` |
| the spread run backwards, so a formation opens fire sooner than it ever did | `0098 — and a SHARE only ever delays a body` |
| the lancer put back on the spit, so two of the three shooting kinds send one bullet | `0098 — THE REPORTED ONE: what shoots back is not all one bullet` |
| the fast bullet drawn as the fat one, so the variety is a difficulty change | `0098 — THE REPORTED ONE: what shoots back is not all one bullet` |

⚠️ **The first one is the whole decision undone in one argument**, and it is the build the report is
about: 0096 exactly as it shipped, with every one of its own guards green.

⚠️ **The fourth reported STILL GREEN on its first run and the GUARD is what moved**, which is the
second time in two decisions — see *What the guards could not see* above.

## What this does not settle

**Whether a figure reads as a figure.** The spread is in sixteenths and the arithmetic is checked, but
whether five turrets on five slots sound like a pattern or like five turrets is a question for an ear.
The same is true of the three bullets: nothing here can say whether *thin, medium, fat* is legible in
a fight — [0081](0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md) has the same
open question about the pickups' four glyphs.

**Whether the delay is felt.** A wave of five now takes up to five sixteenths — half a second — longer
to be fully in the fight than it did. That is the cost of the spread and it is paid in the direction
that makes the game easier, which is the safe direction and not a free one.

**Whether three bullets is enough.** The drifter, the weaver and the charger do not shoot at all, so
the variety is spread over three kinds and seven bosses. A fourth would need a fourth silhouette that
survives twenty pixels, and `reports/enemy-silhouettes-2026-08-05.md` is where that gets hard.

## Rollback

**None.** No storage key, no save field, no service-worker cache prefix, no origin — one argument, two
sprite kinds and two content rows. [0001](0001-revertability-not-risk-rating.md).
