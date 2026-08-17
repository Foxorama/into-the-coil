# 0158 — A level says where its sections open

**Accepted 2026-08-17.** The first of the four asks in the reopened score, and the one that had to
land before any of the others could be authored.

> *"can we rearrange the four sections? or have them different per level as well? some levels kick
> right into a surge etc, if we have the exact same timing for each for each it's also going to be a
> limiter."*

## The rule

**Where a level's music changes is a script the level owns, in the same level-local distance space as
`bossAt`** — a `sections` list on `LevelRow`, ascending, opening at `0`. `PUSH_UNITS`, `SURGE_UNITS`
and `BOSS_APPROACH_UNITS` are gone.

```ts
sections: [
  { at: 0,    section: 'run' },
  { at: 1249, section: 'push' },
  { at: 2534, section: 'surge' },
  { at: 3627, section: 'approach' },
],
```

**Order, count and timing are free, and the names stop being a ladder.** `run` / `push` / `surge` /
`approach` stay a closed union so the guards and the desk can key on them
([0016](0016-a-hub-enumerates-kinds.md)), but nothing requires them in order, once each, or at all. A
level may open at `surge` and drop away. **`boss` and `bossPeak` are untouched** — they are keyed to
the boss's health, not to a distance ([0113](0113-there-is-one-composition-and-seven-levels.md)), so
`SectionName` excludes them at the type level.

## ⚠️ Nothing moves, and that is the whole of this change

**All seven scripts are `bossAt` minus the three constants they replace.** The differences the ask is
actually about are their own change, with their own play-test —
[0027](0027-measure-the-picture-not-the-model.md) is why: a fourteen-file refactor and a musical
judgement landing in one diff leaves nobody able to tell which one they are hearing.

**Measured rather than asserted.** `scripts/timeline.mjs` walks the camera at a sixty-fourth of a
second and asks `musicLevelFor` for the rung, for all seven levels, on the tree before this change
and the tree after it:

| | |
|---|---|
| every rung crossing of every level, **crossed and heard** | **byte-identical**, 42 boundaries |
| level one's `surge` | crossed 70.3906 s, heard **70.4000 s** — 44 bars exactly, which is what [0131](0131-the-surge-comes-sooner.md) bought |

**And the lookup was proved equivalent before a line of it was written.** The old test was
`toBoss <= at.surge` from the boss backwards; the new one is *the last entry the camera has reached*.
Compared over **30,287 camera positions** — every whole unit of all seven levels, plus half-unit
probes either side of all 21 boundaries — **zero mismatches**. The `<=` boundary carries over exactly.

## ⚠️ What it gives up, with the number

[0102](0102-the-music-goes-somewhere.md) measured the three distances **back from the boss** so that
*"a longer level spends longer at `run`"*. A level-local script cannot do that: a level made longer
now spends the extra time in its **last** section rather than its first.

**That scaling was buying 6.1 seconds across the entire roster.** The seven `bossAt` values run 4240
to 4460 — a spread of 220 units, which at 36 units a second is six seconds spread over seven levels.
It was automatic behaviour nobody had asked for, standing in the way of a difference that had been
asked for by name.

⚠️ **The cost is real and is named rather than waved past**: retuning a `bossAt` used to compress
nothing and now silently stretches that level's build. `tests/music.test.ts` holds every section of
every level to a floor of 10 s and a ceiling of 90 s, and the build to 6–30 s, so a stretch that
matters fails.

## ⚠️ The guard that ran over one level now runs over seven

0102's span assertions were written against `LEVEL_KINDS[0]` — correctly, because the three distances
were shared and level one's spans **were** every level's spans. Per-level scripts make that seven
independent questions for free, and it is the guard that catches a hand-authored four-second `push`
when the differences start being written. Same for the build-length assertion, which was one constant
and is now seven scripts' last entries.

## ⚠️ And 0138's scan inverts rather than dying

[0138](0138-a-section-boundary-is-a-distance-you-can-drag.md) gave `musicLevelFor` a fifth parameter
so the dashboard could drag a boundary, and `tests/dash.test.ts` scanned `src/` to prove **nobody
shipped passes it** — by counting arguments, which is the distinction
[0116](0116-the-rig-plays-the-level.md) paid for.

There is no global default any more, so **everybody must pass it**, and counting proves nothing. The
scan now reads the argument EXPRESSION and requires it to be `<something>.sections`. That is a
stricter claim than the one it replaces: *at most four arguments* was satisfied by any call that
stayed short, while this permits exactly one expression — a literal, a local, or another level's row
all fail.

## ⚠️ `bossAt` left the signature, and the compiler found it

The old arithmetic measured every boundary back from the boss, so where the fight was is what
anchored the sections. A script anchors itself, and the fight's two rungs were always keyed to
`bossOnField` and health rather than to a distance — so the parameter went unread the moment the
subtraction did. `noUnusedParameters` is what said so. **Nothing about the answer changes**: a camera
past the boss still gets the last section, exactly as a negative `toBoss` used to.

`sections` also sits **before** `bossHealthLeft`, which is a change of order and not only of type:
the health is meaningful only during a fight and keeps its default, and the script is meaningful
always and cannot have one.

## ⚠️ The dashboard says the opposite of what it used to, on purpose

0138 recorded *"one set for all seven levels, because the game's is"* — dragging on level one's strip
was a proposal about **every** level, and the panel said so where the numbers were. That is now
false, and a tool that went on claiming it would be teaching the wrong model of the game it is an
instrument for.

| 0138 | now |
|---|---|
| three handles, keyed by rung NAME | one per script entry after the first, keyed by INDEX |
| a drag is a proposal about all seven levels | about **this** level, and the panel names it |
| a dragged set survives a change of level | it cannot — a script means nothing over another level. An edit is kept **per level** instead, so switching away to hear something does not throw it away |
| **copy this moment** prints three constants | prints the level's `sections` array as the TypeScript it would be pasted into `src/content/levels.ts` as, naming the level |
| `SECTION_ORDER` (boss-outwards) reversed into `SECTION_ACROSS` (strip order) | **both gone.** A script is already in the order the strip draws it |

⚠️ **That last row removes a bug class rather than a line.** 0138 records its readout listing the
three backwards until it was driven in a browser — *"obvious in the browser, invisible in the
module"* — because the clamp had to reason from the boss outwards while the strip reads left to
right. There is no second order left to disagree with.

⚠️ **The grips come from the script and not from the marks**, which 0158 forces. 0138 walked
`rungMarks` and keyed each handle on its rung's name; `rungMarks` emits one mark per CHANGE, so a
script naming the same section twice in a row produces one mark and the two stop corresponding. A
grip per entry is exact whatever the script says.

⚠️ **Entry `0` gets no handle**, on the same terms 0138 refused one for `approach`→`boss` and
`boss`→`bossPeak`: a level's music starts where the level starts, and there is nothing for a distance
to decide.

## ⚠️ What the editing panel still cannot do, and why that is the next PR

Dragging cannot express the ask. *"Some levels kick right into a surge"* is a change of **which
section is first**, not of where a boundary sits — so the panel needs to change an entry's section,
add one and remove one. Until it does, finding that shape by ear means typing it, rebuilding and
listening, which is the round trip [0126](0126-the-dashboard-is-the-instrument.md) exists to remove.

**It is deliberately not in this change.** The first diff has to stay provable, and a script editor
is a real piece of UI. The order is: this, then the editor, then a driving session, then the authored
differences with their own play-test.

## What is guarded

| | |
|---|---|
| **every section of every level opens at the second it opened at before**, asked of `musicLevelFor` | ✅ `tests/music.test.ts`, in SECONDS over all seven levels |
| the `<=` boundary, held at both sides — the section's own unit, and one unit earlier | ✅ |
| every section is a stretch of a level, 10 s to 90 s | ✅ seven levels where it was one |
| the build is 6–30 s and longer than one bar of what it builds | ✅ seven levels where it was one constant |
| a script is ascending, non-empty, opens at `0`, and ends before its boss | ✅ — and that last one is what makes `musicLevelFor`'s fallback unreachable |
| no drag can reorder a script, move entry zero, or make a section shorter than its ramp | ✅ over ten dragged values × every entry |
| **every call under `src/` passes the level's own `sections`** | ✅ by reading the argument, not counting them |
| passing nothing is the shipped level | ✅ over all seven, where one comparison used to stand for the lot |
| the pointer, the handle, the redraw | ❌ needs a browser — driven, and the run is below |

⚠️ **`node scripts/prove-guard.mjs 0158` IS 3 OF 3 RED**, each on the guard it names:

| broken on purpose | went red |
|---|---|
| every level walked with level one's script, so the shape is shared again | `EVERY level says for itself where its sections open, in SECONDS` |
| a level's script authored out of order, so one of its sections never happens | `a script is ascending, opens at zero, and never names the fight` |
| the shell passing section distances of its own | `EVERY CALL UNDER src/ PASSES THE LEVEL'S OWN SCRIPT` |

⚠️ **THE FIRST IS THE ONE WORTH HAVING AND IT IS INVISIBLE ON LEVEL ONE**, which is the level every
report has ever been about. A session that checked its work on The Approach would see nothing wrong.

⚠️ **AND THE SECOND IS A CLASS 0138 COULD NOT REACH.** It clamped a DRAG against putting the
boundaries out of order; nothing stopped a hand typing a descending pair into `src/content/levels.ts`,
which is a thing that only became possible when the shape became authored content.

⚠️ **`node scripts/prove-guard.mjs` re-anchored FIVE probes and the harness found two of them.**
0090, 0116 and 0138 were sized in advance; **0102 and 0126 were not**, and `prove-guard` refused to
run at all until they were fixed — *"the code moved and the probe did not."* That is
[0019](0019-a-probe-must-be-seen-to-apply.md) doing the more valuable half of its job, and by hand it
is exactly the point at which the suite reports green.

⚠️ **0090's anchor had to move level rather than move number.** It broke `BOSS_APPROACH_UNITS = 643`
into `40`; the equivalent is pushing a level's last entry up against its boss — but levels one and
three share a `bossAt` and therefore ship **identical scripts**, so the obvious anchor appears twice
and `planEdit` refuses it. It anchors on `eye`, whose numbers are its own. The guard runs over all
seven levels now, so any one of them going wrong turns it red.

## What was driven

`npm run dash`, level one (The Approach). Every row below is 0138's own driven table asked again of
the mechanism that replaced it:

| | read back |
|---|---|
| the strip on load | three grips at 21.2% / 43.0% / 61.6%, **all six rungs**, put-back greyed out |
| the readout | `run 0 · push 1249 · surge 2534 · approach 3627` — **left to right, in strip order, with nothing reversed** |
| three ← on `surge` | 2534 → **2361**, which is 3 × 57.6, one bar of scroll a press |
| three → after it | back to **2534**, and the button greyed itself out again |
| dragged `push` to 95% of the strip | stopped at **2476**, exactly one bar clear of `surge` at 2534, and all six rungs stayed on the strip |
| switched to Ember Nebula | **its own** script — `1299 / 2584 / 3677` — and its put-back greyed out |
| switched back to The Approach | the edit still there, button still live |
| **at 0:55, shipped** | `counter` **silent, target 0.00, live 0.00** |
| **at 0:55, `surge` dragged to 1800** | `counter` **opening, target 1.52, live 1.52** |
| **copy this moment** | the level's `sections` array as pasteable TypeScript, named `approach`, with the shipped array printed beneath it |

⚠️ **THE LAST PAIR IS THE ONE THAT MATTERS AND IT IS READ OFF THE `GainNode`.** `live 1.52` where the
shipped script gives `live 0.00`, at the same second of the same level, is the mixer having actually
followed the handle — not the strip agreeing with the rig about a redrawing. It is 0138's own third
row, reproduced through a script instead of a triple.

⚠️ **AND THE DRIVE FOUND A BUG EVERY GUARD WAS GREEN OVER.** The keydown handler computed its
landing from the `entry` it closed over; `moveSection` redraws the strip, so that element is detached
and that value is stale the instant it first fires — **the handle moved one bar however many times it
was pressed.** `tests/dash.test.ts` could not see it, because every assertion there calls
`dragSection` directly and none of them presses a key twice. 0138 never had the bug and never had to
think about it: it indexed a record by rung name, which is a live lookup by construction, and an
index into an array that is rebuilt on every move is the thing that had to be read late.
[0027](0027-measure-the-picture-not-the-model.md) is the rule, and this is the third bug of this
project's own that it has caught.

## What it costs

| | |
|---|---|
| `dist/index.html` | **252,671 → 253,434 bytes, a difference of 763** — the seven scripts, and the walk that replaced three comparisons |
| the frame loop | unchanged. The walk is indexed rather than `for…of`, so it allocates nothing — this file is not on `tests/budget.test.ts`'s hot list and would not have been caught |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, no origin. `LevelRow` is content, not the save schema:
[0021](0021-one-stream-per-concern.md) stores resolved state and never a level's table, so a save
written before this change loads unchanged after it.

⚠️ **`dist/` is not byte-identical and that is expected**, on 0138's own terms: this touches `src/`.
The measurement is below.
