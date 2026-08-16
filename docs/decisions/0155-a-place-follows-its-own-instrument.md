# 0155 — A place follows its own instrument, and the balance floor is retired

**Accepted 2026-08-16.** Retires [0147](0147-a-place-is-a-balance.md)'s `apart` guard on its own
stated condition, and replaces it with the axis a listener actually uses.

> *"One of the big problems is every level sounds the same and that's what I've been trying to fix,
> so if there's still a guard forcing, let's clear it out so we can make each level sound and feel
> different and unique."*

## The rules

**A place may name what it FOLLOWS at each rung**, in `LEADS`. Naming one displaces the
arrangement's own part, which steps down to a counter-line — one part per rung is what makes the
solve satisfiable at all.

**No two places may follow the same instrument at every rung.** `tests/arrangement.test.ts` holds it.

**0147's balance floor is gone.** No guard requires two places to differ in how loud their layers
are.

## ⚠️ The retired guard wrote its own retirement condition

Its comment, unchanged since 0147:

> *"If a later round finds two places at 3.1 dB that still sound alike, this number is wrong and
> should MOVE rather than be worked around."*

**That clause has fired.** The seven ship at **3.3–4.0 dB apart**, satisfying the floor at every rung,
and the report is unchanged. 0147 spent **259 hand-set numbers** buying a difference the guard could
see and a listener could not.

⚠️ **AND THE FINDING IS STRONGER THAN *the number is wrong*: THE QUANTITY IS.**
[0154](0154-the-mix-is-authored-as-intent.md) makes balance **authored** rather than emergent —
every layer is driven to its role's target to 0.00 dB — so two places with the same arrangement have
identical balance profiles **by construction**. `apartBy` was built to measure a balance that emerged
from 428 numbers; asking it now asks whether two places were given different roles, which is a
question about a table rather than about a sound.

⚠️ **THE CANDIDATE THAT LOOKED OBVIOUS WAS TESTED AND REFUTED.** A per-place *contrast* — one number
widening the spacing between roles — does not help and at three rungs is worse, because `apartBy`
normalises each layer against its own place's loudest.
[`the-arrangement-solves-and-the-places-collapse`](../../reports/the-arrangement-solves-and-the-places-collapse-2026-08-16.md)
has the table.

## ⚠️ What actually makes two levels different is what you are following

Until now **every place tracked the same instrument at the same moment** — the hymn at `run`, the riff
at `push`, the counter-melody at `surge`, the tritone from the approach on. Seven places, one subject
per rung, differing only in timbre and level. **That is one arrangement played seven ways, whatever
the gains say**, and it is what a player hears when they say every level sounds the same.

What ships now:

| place | run | push | surge | approach | boss |
|---|---|---|---|---|---|
| level one | call | hook | counter | dread | dread |
| **Ember Nebula** | chords | arp | counter | toll | **wraith** |
| **Saurian Belt** | groove | ride | drive | drive | **frenzy** |
| **The Labyrinth** | perc | ride | counter | toll | **stomp** |
| **Rime Shelf** | chords | lead | lead | dread | **wraith** |
| **The Toxic Mire** | sub | groove | drive | toll | **toll** |
| **The Black Heart** | engine | hook | lead | counter | **drive** |

⚠️ **THE FIGHTS WERE THE WORST OF IT AND ARE FIXED IN THE SAME TABLE.** The first version of `LEADS`
left five of seven places following `dread` at both the approach and the boss — so every fight in the
game had the same subject, which is
[0113](0113-there-is-one-composition-and-seven-levels.md)'s *"the boss part just feels like part of
the regular level music"* wearing a new mechanism. Ember Nebula's fight now follows the howl, Saurian
Belt's the lasers, The Labyrinth's the hound's tread.

⚠️ **THE MATERIAL DIFFERENTIATION IT LEANS ON ALREADY EXISTS AND IS ALREADY GUARDED** —
[0148](0148-a-place-has-its-own-notes.md) gave every place its own notes, mode and voicing, and
`0148 — NO TWO PLACES THAT CHOSE THEIR NOTES CHOSE THE SAME ONES` holds it. Between that guard and
this one, the ground 0147 was written for is covered on two axes a player can hear, where it had been
covered on one they could not.

## ⚠️ Still not wired into the game

`MUSIC_LADDER` and `mixOf` decide every gain the player hears, exactly as before. This is a content
table, a guard and a retired assertion; the mixer has been handed none of it. **The evidence that
would justify wiring it in is an ear on the rendered arcs**, which is what `hear.mjs --level --solved`
now writes.

## Confirmed, not assumed

- `node scripts/weigh-solve.mjs` — the solve still converges with every place following its own
  instrument: **0 layers out of their role's spacing, worst 0.18 dB**, across seven places and every
  rung. 55 gains land past `MIX_CEILING`.
- `node scripts/weigh-mix.mjs` — every remaining bound satisfied with `apart` removed.
- ⚠️ **`tests/arrangement.test.ts` caught a real defect in this table on its first run**: `mire`
  followed `toll` at `surge`, and the ladder does not open `toll` until `approach` — **a place
  following silence for a whole section.** Same class as the four no-op promotions it caught in 0154.
- `npm test`, `npm run prove` — see the PR.
