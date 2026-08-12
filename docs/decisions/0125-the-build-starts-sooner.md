# 0125 — The build starts sooner, and an arrival is what a listener hears

**Accepted 2026-08-12.** Two things from one play report: a timing change that is done, and a finding
that **corrects [0123](0123-a-rung-changes-the-notes.md) two decisions after it landed.**

## The rule

**Every rung starts 263 world units earlier** — 7.3 seconds at 36 units a second. `push` moves from
43.2 s to **35.2 s**, which is the downbeat nearest the 35.7 s asked for.

> *"I think we also need to shift the changes to be around 7.3sec sooner… it can be placed on the
> downnote appropriately around that time, but it just feels slightly too long timewise before it
> kicks in currently."*

⚠️ **ALL THREE DISTANCES MOVE BY THE SAME AMOUNT**, so the spacing between rungs is unchanged and only
the start does. `approach` gains the difference and now runs 17.9 s, which is further inside
[0114](0114-the-fight-is-a-different-piece.md)'s ten-second floor than it was.

⚠️ **The downbeat is not chosen here.** [0117](0117-a-section-change-lands-on-the-beat.md) already
quantises a rung change to the next bar line, which is why 35.2 rather than 35.7 — the player asked
for exactly this and it needed no new mechanism.

## ⚠️ 0123 measured the right thing and the wrong half of it

0123 found that a section is heard in proportion to how much material **changes**, and raised `surge`
to 37% churn and `approach` to 30% by having them **close** layers. Played:

> *"The only really noticeable scene changes are at 0:43 and at 2:00. The 1:32 and 1:48 aren't
> noticeable in game."*

**Unchanged from before 0123.** Splitting churn into its two halves:

| transition | notes **arriving** | notes leaving | heard |
|---|---|---|---|
| `run` → `push` | **+70** | −0 | ✅ |
| `push` → `surge` | +20 | −36 | ❌ |
| `surge` → `approach` | +4 | −37 | ❌ |
| `approach` → `boss` | **+64** | −21 | ✅ |

⚠️ **A PERFECT SPLIT ON ARRIVALS ALONE, AND DEPARTURES DO NOT REGISTER AT ALL.** +70 and +64 are
heard; +20 and +4 are not, whatever leaves alongside them. **0123's fix raised the half that does not
count** — which is why the player's verdict did not move, and why *the fix was indistinguishable from
no fix*.

⚠️ **THE GUARD IS THEREFORE WRONG AND IS LEFT WRONG ON PURPOSE.** `every rung replaces a real share of
what is playing` passes at 30% while measuring a quantity now known not to predict the report. Fixing
the threshold without fixing the *quantity* would be the third time this arc has tuned a number
against the wrong measure — and the quantity cannot be fixed until there is material to arrive with.
**The decision that adds the material is where both go** — not [0126](0126-the-dashboard-is-the-instrument.md),
which took the number first and is an instrument rather than a note. This decision is what stops the
next hand trusting the current bound.

## What the fix has to be, and it is content

⚠️ **`surge` AND `approach` NEED TO BRING ~60 NOTES A BAR OF NEW MATERIAL EACH**, which the level does
not have spare — every dense layer is already open by `push`, and the fight's own layers cannot be
borrowed without weakening the arrival that already works.

⚠️ **THE PLAYER CHOSE NEW MATERIAL OVER FEWER SECTIONS**, having been offered both: *"let's add new
material, I think that's going to give us a better quality result here. Fewer bigger sections sounds
like it's going to flatten things out and probably not in a good way."* **Recorded because the
rejected option is the cheaper one** and a later hand under time pressure will find it attractive.

## Why there is no confirmation table

⚠️ **NO NEW GUARD, AND THAT IS THE POINT OF THE SECTION ABOVE.** The distances are content
([0034](0034-a-threat-is-absolute-and-a-pool-is-the-pairing.md): nothing asserts on a tuned value),
and the guard this decision's finding invalidates is named rather than adjusted. The existing rung
guards ran green and 0090's approach-build probe was re-anchored onto the new distance.

## An intermittency was seen here and is NOT explained

⚠️ **`npm run prove`'s BASELINE WENT RED ON TWO PAD TESTS AND THEN GREEN ON THE SAME CODE.** *"Starts
a run from the title screen with nothing but the pad"* and *"starts a run without also throwing the
bomb that button is bound to"*, in `tests/menu.browser.test.ts` — neither of which touches anything
this decision changes.

| run | result |
|---|---|
| `npm run check` | 963/963 green |
| `tests/menu.browser.test.ts` alone | 6/6 green |
| prove's baseline, chained onto that `check` in one command | **2 red** |
| prove alone | green, 584/584 |

⚠️ **THE LIKELY CAUSE IS THE CHAINING AND IT IS A GUESS.** `npm run check && npm run prove` leaves the
check's Chrome instances winding down as the baseline launches its own — which is
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)'s subject exactly, *a guard that
only fails under the load of `npm run prove` itself*.

⚠️ **A RERUN IS NOT EVIDENCE AND THIS IS NOT A FIX.** 0044 requires establishing which it is — a real
intermittency in the code or a wrong quantity in the guard — and **neither has been established.**
What is recorded is the reproduction: run `check` and `prove` back to back in one command. **The next
hand to see these two tests fail should start here rather than from scratch**, and should not read the
green run as an answer.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Three distances.
