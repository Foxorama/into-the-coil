# 0131 — The surge comes 14.3 seconds sooner, and lands on the downbeat it is crossed on

**Accepted 2026-08-12.** One number, and it closes a measurement
[0126](0126-the-dashboard-is-the-instrument.md) took and deliberately did not act on.

> *"We need to bring the surge earlier by about 14.2 secs — bring it in after a downnote, it just
> needs to happen sooner."*

## The rule

**`SURGE_UNITS` is 1736, where it was 1221** — 515 world units, which at 36 a second is **14.31
seconds**. Level one crosses it at **70.39 s** rather than 84.70.

⚠️ **ONLY `surge` MOVES, AND THAT IS THE DIFFERENCE FROM
[0125](0125-the-build-starts-sooner.md).** 0125 shifted all three distances by the same 263 units
because the ask was about *the changes*; this one names a section, so `push` gives up the time and the
spacing between the rungs is not preserved. `run` and `approach` are untouched.

| rung | was | now |
|---|---|---|
| `run` | 34.7 s | 34.7 s |
| `push` | **50.0 s** | **35.7 s** |
| `surge` | **16.1 s** | **30.4 s** |
| `approach` | 17.9 s | 17.9 s |

## ⚠️ *After a downnote* needed no new mechanism, and 1736 is which downbeat

[0117](0117-a-section-change-lands-on-the-beat.md) already starts the ramp at the next bar line, so a
rung change has not been heard mid-bar since it landed. What the value buys on top of that is that
the **crossing** is on a bar too:

| | crossed at | heard at |
|---|---|---|
| `surge`, before | 84.70 s — **beat 3.76** | the next downbeat, 0.10 s later |
| `surge`, after | 70.39 s — **beat 3.98** | the next downbeat, **0.008 s later** |

⚠️ **So the distance and the bar now agree**, and the change is heard at the instant the player passes
the place rather than up to 1.6 s after it. 1732 would have been 14.20 s exactly and would have landed
on **beat 0.25** — a 1.35 s wait for the next bar, which is the defect 0117 exists for arriving through
the front door.

⚠️ **It can only ever be true of ONE LEVEL.** Seven levels with seven `bossAt` values share these two
distances, so at most one crossing can be on a bar. Level one is the one every report so far has been
about, and 0117 keeps the other six correct anyway.

## ⚠️ What it fixes that was not asked for: the section could not hold its own tune

0126 measured how long a layer is open against **how long its own loop is**, and `surge` was the worst
row in the table. `surge` opens `counter`, a sixteen-bar counter-melody:

| | the section | `counter`'s loop | stated |
|---|---|---|---|
| before | 16.1 s | 25.6 s | **0.63 of it** |
| after | 30.4 s | 25.6 s | **1.19 of it** |

⚠️ **A section shorter than the phrase it introduces has never played that phrase.** *"The 1:32 and
1:48 aren't noticeable in game"* is a verdict about material the listener was given two thirds of.

⚠️ **THIS DOES NOT DISCHARGE 0125's ASK AND MUST NOT BE READ AS DOING SO.** 0125 says `surge` and
`approach` each need roughly **60 notes a bar of material that ARRIVES**; this gives material that is
already there long enough to be a phrase. They are independent, and this was the cheaper one.
`approach` is still 17.9 s against the same 25.6 s loop and is untouched here.

## What is guarded, and the thing that could have gone wrong

⚠️ **Nothing asserts the value** — [0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md):
it is a tuned distance and a hand's choice. `tests/music.test.ts` holds that the rungs are ordered,
that each is a real stretch of seconds (over 10, under 90) and that every one is reachable; 35.7 and
30.4 pass all three.

⚠️ **AND THE RISK IS IN THE OTHER DIRECTION, WHICH IS WHY IT WAS MEASURED RATHER THAN ASSUMED.**
Lengthening `surge` shortens `push`, and every layer that is open across `push` gets less time to say
itself. Driven out of `rig/transport.ts`'s own `layerSpans`:

| worst rows | passes before | passes after |
|---|---|---|
| `arp` — open at `push` alone | 1.95 | **1.39** |
| `counter` | 1.33 | 1.88 |
| `hook` | 2.58 | 2.58 |
| `call` | 3.31 | 2.75 |

**Nothing drops below one.** A change that fixed one layer's phrase by starving another's would be the
same defect moved, and `arp` is where that would have shown.

## Rollback

None owed — [0001](0001-revertability-not-risk-rating.md). A content constant: no storage key, no save
schema, no cache prefix, nothing shipped that outlives a run. `musicLevelFor` reads it every frame, so
even a revert mid-run changes only where the next section lands.
