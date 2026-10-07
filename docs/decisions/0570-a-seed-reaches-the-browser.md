# 0570 — A seed reaches the browser

**Accepted 2026-10-07.** [0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) applied
to the one intermittent guard left on the board: `tests/settings-kept.browser.test.ts`
([0510](0510-the-settings-are-kept.md)), red on CI twice on 2026-10-05 and once on 2026-10-07, never
locally. Its sibling `tests/hangar.browser.test.ts` ([0521](0521-the-hangar-opens.md)) went red three
times the same way.

## The rule

**A browser test fills a kept key with `seeded` (`tests/seed.ts`), which writes it from an ordinary
script on a blank `file:` page that has finished loading, and only then opens the game's page in the
same tab.** Never from an init script. `seedOnce`, the init script, is deleted, and its twelve other
callers moved with the two that reload.

## What it was

The 2026-10-07 failure printed `itc-keyed-out`: after the reload the store had **no keys at all**, the
seed's included, although the page had read its write back just before. Nothing in `src/` clears the
store. Local runs had already ruled out load and memory pressure (48 reloads), so the question went
to CI, where it happens: the test's flow looped, three lanes per runner beside a real suite shard for
load, with a diagnosis written on every empty store.

| the seed written | reloads on CI | the store came back empty |
|---|---|---|
| by an init script at document start (`seedOnce`, the test as it was) | 270 | **5** |
| by the game's page after it loaded | 216 | 0 |
| by a blank page after it loaded, the game opened after (`seeded`'s shape, a draft) | 360 | 0 |
| by `seeded` itself, as shipped | 360 | 0 |

Five in 270 is about one reload in fifty; at that rate 720 clean reloads by chance is roughly one in a
million.

On every empty store **a second tab in the same browser found it empty too, the profile's leveldb did
not hold the key, and `window.name` still carried the seed's mark**, so the seed had not run twice. A
reload races nothing the browser holds, because the browser never held the key. The writes lived in
the tab's renderer and nowhere else, and the reload threw that cache away. The tab saw its own writes,
so every assertion before the reload passed.

**So no wait fixes it, however it is sized** ([0245](0245-a-budget-is-sized-under-load.md)). A second
tab polled until it sees the key waits for something that is never coming; a pause before the reload
pauses over a browser that will never hold the key.

Why an init-script write goes astray inside Chromium is not established. What is established is the
property that matters to the test: a write made where the seed made it sometimes never reaches the
browser. A write made by a page that has loaded did not, in 936 tries.

## What the earlier readings were

Both earlier fixes in `tests/seed.ts` were answers to this one defect, seen from two sides:

- **The seed refilled the key whenever it read empty**, and was made once-per-tab on `window.name`
  because after a reload it wrote itself over what the page had kept. The store it read empty was this
  empty store.
- **A persistent profile replaced `browser.newContext()`** because the empty store was taken for the
  in-memory store's. The failures followed it to disk. It stays, because a player's browser keeps its
  store on disk, but it was never the cause.

## Not the game

No player's page runs an init script. The game writes its keys from its own scripts after it has
loaded, which is the row that came back clean. This is a defect in the rig, not in what ships.

## What guards it

- The two reload tests themselves, which now fail only if a kept key is not kept.
- **A new probe in `scripts/probes/0510-the-settings-are-kept.mjs`**: the page boots on every kept
  setting but the crossing, and the browser test goes red on its reload line. That line had been seen
  red only by accident before.
- `keyedOut` stays in both tests' messages, so an empty store, if one comes back, names itself.

## How it was measured

A scratch test looping the flow, run on a branch never merged, with the workflow cut down to six
runners each doing three lanes of 12–20 rounds while `npm test -- --shard=k/6` ran beside it. On an
empty store it wrote the second tab's keys, the profile's leveldb files and `window.name`. It is not
kept: 0044 asks for the cause, and a standing stress costs every PR ten minutes to re-ask it.

## Rollback

None needed. Tests only, and no irreversible surface.
