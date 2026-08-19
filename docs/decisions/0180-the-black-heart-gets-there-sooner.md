# 0180 — The Black Heart gets there sooner

**Accepted 2026-08-19.** An authored change, driven on the desk and pasted back — which is the loop
[0163](0163-the-script-is-edited-here.md) built and the first time it has been used for a level's own
script.

> *"Change The Black Heart sections to match the run/push/surge/approach timing as per this modified
> instead of the ships."*

## The rule

**`eye`'s four boundaries are 0, 744, 2360 and 3986 units.** They were 0, 1439, 2724 and 3817.

## What moved

| section | shipped | now |
|---|---|---|
| `run` | 40.0 s | **20.7 s** |
| `push` | 35.7 s | **44.9 s** |
| `surge` | 30.4 s | **45.2 s** |
| `approach` | 17.9 s | **13.2 s** |

⚠️ **`bossAt` DOES NOT MOVE.** The level is 4460 units either way, so nothing about its length, its
waves, its pickups or its fight changes — only where it turns. The opening is halved and the two
middle sections take what it gave up.

## ⚠️ The guard that had to be edited is the one that exists to be edited

`0158 — and EVERY level says for itself where its sections open, in SECONDS` in `tests/music.test.ts`
pins every boundary as **the second a player hears it**, and its own note says what to do here:

> *"Moving a boundary is meant to fail this, and the number it prints is the number to paste back
> after a play-test has argued for it."*

It failed, and its number was pasted back: `push` 39.97 → 20.67, `surge` 75.67 → 65.56, `approach`
106.03 → 110.72. **That is the guard working**, not a guard being worked around — it is the one thing
in the suite that would notice a boundary moving by accident, which is exactly why it must be edited
by hand when one moves on purpose.

## ⚠️ And every boundary still lands on a downbeat

`node scripts/hear.mjs --level=eye`, which is [0116](0116-the-rig-plays-the-level.md)'s instrument:

```
  rung        the game decides   beat      the music moves   beat     lasts
  run                  0.00s    0.00              0.00s    0.00     20.7s
  push                20.67s    3.68             20.80s    0.00     44.9s
  surge               65.56s    3.91             65.60s    0.00     45.2s
  approach           110.73s    0.84            112.00s    0.00     13.2s

  5 of 5 rung boundaries fall mid-bar, where the camera puts them.
  0 of 5 are HEARD mid-bar.
```

⚠️ **[0117](0117-a-section-change-lands-on-the-beat.md) holds under the new distances**, which was the
one thing a change of this shape could quietly break. The longest wait is `approach`'s 1.27 s, inside
the 1.6 s bar it is waiting for.

## What this is not

**Not a claim about the other six levels.** Their scripts are untouched, and 0158's whole point is that
they no longer have to agree.

**Not a mix change.** No gain, no ladder, no arrangement. The same rungs open the same layers; they
arrive at different seconds.

## Rollback

No storage key, no save field, no service-worker cache prefix, no origin. Four numbers in
`src/content/levels.ts` and the row that pins them in `tests/music.test.ts`.
