# 0303 — The reach goes up a rung

**Status:** accepted
**Supersedes the numbers in:** [0302](0302-the-bolt-shows-its-reach.md)
**Builds on:** [0297](0297-a-reach-is-measured-on-both-axes.md),
[0236](0236-the-guns-answer-the-first-play-test.md)

## The report

Given after playing [0302](0302-the-bolt-shows-its-reach.md) on its branch preview — the play that
decision said it was owed:

> *"Reach needs to be about 1 tier up and slightly further for the last tier."*

## What changes

```
reach: [29, 34, 40, 47, 55]   →   [34, 40, 47, 55, 68]
```

**Every rung is the rung above it**, which is what *one tier up* says, and the cap is a fifth past
where that shift alone would have left it (about 64). The shape is untouched: each rung still buys
at least the sixth `tests/guns-played.test.ts` holds, and 68 is still under the narrowest view.

Nothing else moves. `falloff` stays at 0.6, `links` stays at `[1, 2, 3, 3, 3]`, and the drawn length
is still the whole reach — so **what the player sees grew with it**: the dry bolt is 34 units at the
first rung and 68 at the cap.

| | first hit | second | third | span of the whole chain |
|---|---|---|---|---|
| before 0297 | 98 | 98 | 98 | 294 |
| 0302 | 55 | 33 | 19.8 | 108 |
| **0303** | **68** | **40.8** | **24.5** | **133** |

## The concern this was shipped over, stated rather than argued

0302 said out loud that its cap already crossed the lane's width from the centre (`ACROSS_SPAN` is
100) and that *if it still plays as auto-pilot, the ladder is what moves*. It moved the other way,
on a play, and that is the right authority for it — **an idea's author is not evidence about it, and
neither is a decision's.** [0297](0297-a-reach-is-measured-on-both-axes.md)'s report was about a
chain of three each jumping a full reach; what this ships is one aimed hit at 68 with the jumps
decaying behind it, at a length the player can see.

⚠️ **The one thing worth watching is the last rung specifically**, because it is the only rung that
got more than the shift, and it is the rung the previous report was written about.

## What the longer ladder makes louder, and it is a feature

[0257](0257-the-arc-lands-on-the-screen.md) refuses a link on any body whose hull is not wholly
inside the view. The nose at the front of its box sits **10.7** units from the leading edge on a
1280×720 screen, so a player who flies forward has their forward reach cut to whatever the screen
has left — at every rung of this ladder, and more of it at each one. **The gun rewards flying back**,
which is a positioning rule the number did not have to invent.

## What is deliberately not done

- **No new guard, and none of 0302's move.** The climb and the cap are already held; the size of a
  tuning number is not an invariant, and [0295](0295-a-ranking-guard-is-a-content-limiter.md) is the
  standing rule against writing one.
- **No probe of its own.** No mechanism landed here — the flat-ladder break in
  `scripts/probes/0236-the-guns-answer-the-first-play-test.mjs` is re-anchored on the new numbers and
  still catches a ladder that stops climbing.

## What is owed

The next play of the arc, and the question is now the last rung rather than the gun.
