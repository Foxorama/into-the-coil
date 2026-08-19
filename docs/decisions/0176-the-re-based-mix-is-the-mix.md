# 0176 — The re-based mix is the mix

**Accepted 2026-08-19.** The end of [0167](0167-a-build-does-not-duck.md)'s three-way question, decided
by ear on the desk it was built to be decided on.

> *"Re-based now sounds and blends incredibly well, let's make that the released version of the sound,
> and update the dashboard so we just have re-based and not shipped, solver and re-based. We can just
> keep the good version now."*

## The rules

**The game plays the re-based balance, and it is a table.** `REBASE` in `src/content/themes.ts` is a
per-place, per-layer scale; `mixOf` is the hand's tint times that.

**`MIX_CEILING` bounds the tint and not the product.** The band is what a hand may write; the re-base
is a measurement.

**The desk plays the game's mix and there is no other.** One mode, no `steady` slider.

## ⚠️ The whole third mix is 161 numbers, and that is why this is a table

`rebasedLevel`'s definition is
`out[rung][layer] = shipped[rung][layer] × (solved[push][layer] / shipped[push][layer])`. **The rung
cancels** — every rung is scaled by the same per-layer factor — so the entire balance is one number
per layer per place, which is exactly the shape `mix` already had.

⚠️ **FOLDED, IT REPRODUCES `scripts/solve-mix.mjs` TO 8.9e-16** over every place, rung and layer, and
the shipped game now sits **3.5e-4 dB** from what the desk played in `rebased` mode — which is the
five-significant-figure rounding of the table and nothing else. The player hears what they approved,
and no solver runs to produce it.

⚠️ **SO THE SOLVER IS A RESEARCH TOOL RATHER THAN A DEPENDENCY.** A four-hundred-iteration solve per
place is not something a run start can afford — [0157](0157-the-prewarm-was-scheduled-one-note-at-a-time.md)
is what that costs — and nothing under `src/` calls it.

## ⚠️ What it bought, measured

| | shipped ladder | re-based |
|---|---|---|
| layers under 0164's role floor | **88** | **54** |
| carried layers ducked at a boundary | 0 | **0** — additive by construction |
| samples driven into the shaper's clamp | 0.0000% | **0.0089%** worst, one place |

⚠️ **THE ADDITIVITY IS FREE AND NOT LUCKY.** A per-layer scale over the ladder scales both sides of a
boundary equally, so it cannot change which way one moves. 0167's duck floor is green over the shipped
mix for the first time by construction rather than by tuning.

## ⚠️ It clips 0.0089% of one place's samples, and that is shipped on purpose

The browser's `WaveShaperNode` defines its curve over an input of [−1, 1] and **clamps** anything
outside it — so the guard's unclamped `saturate` was modelling a shaper the game does not have. What
the speaker actually does with the worst sample is turn 1.0062 into 1.0000: **0.054 dB**, on about one
sample in eleven thousand, in Ember Nebula's boss.

⚠️ **THE ALTERNATIVE WAS MEASURED AND REFUSED.** Trimming until nothing reaches the clamp needs a
factor of 0.758 and costs **1.85 dB** of output RMS, because `tanh` is already flat up there — 1.85 dB
of music to remove a 0.054 dB error on 0.009% of samples. The guard now models the clamp and asserts
the **share of samples that reach it**, which is the quantity the defect is actually in.

## ⚠️ Twelve pairs fell under the bottom floor and not one of them lost bass

The 28% share-under-300 Hz floor failed in 12 of 42 place/rung pairs. Measured against the mix this
replaces:

| | low band | everything else |
|---|---|---|
| `nebula/push` | **+1.1 dB** | +1.7 dB |
| `saurian/push` | +0.4 dB | +1.7 dB |
| `rime/push` | −0.7 dB | +1.5 dB |
| `core/approach` | −0.5 dB | +0.4 dB |

…and eight more of the same shape: the bottom moved by **−0.9 to +1.1 dB** while everything else went
**up** by 0.4 to 1.7.

⚠️ **A SHARE IS NOT *IS THERE BOTTOM*.** [0134](0134-the-place-keeps-the-games-pace.md)'s report was
*"very high on the treble with no deep bassy times"*, and a ratio answers that only while the top is
held still. Under a balance that lifts the top **on purpose** — which is the sound of inaudible layers
becoming audible, and is what was approved — it falls without a decibel of bass going anywhere. The
floor is re-derived to 24% against the mix that ships; Rime Shelf's `push` at 19.4% is named, because
that place opens with no `sub` at all by [0172](0172-a-place-opens-with-its-own-four.md)'s authoring.

## ⚠️ And the clip guard was the fifth ladder-blind reader

`MUSIC_LADDER[level][layer]`, with no aura ceiling either — after `loudestOf`, `rungShape`, the
audition guard and now the rung-climb guard, all found the same way and all named in
[0172](0172-a-place-opens-with-its-own-four.md). This one decides whether the bus distorts.

⚠️ **AND ITS CORRECTION HAS NO PROBE, WHICH IS WRITTEN DOWN RATHER THAN LEFT AS A GAP.** Putting the
blindness back leaves the suite **green**: no place's own ladder drives its bus nearer the clamp than
the shared one does. The fix is right and is not load-bearing today, and a probe pointed at it would
report red for a reason that is not its subject.

## ⚠️ What was retired, and why each

| | why |
|---|---|
| the desk's three-way mix toggle and `steady` slider | the question is answered; `HOLD_WEIGHT` is where `REBASE` was generated, not a listening control |
| 0175's `gains` on `levelWrites` and `setLevel` | it existed to make those modes arrive properly. **A parameter with no caller is a branch no data reaches** — 0162's ladder landed in that state and its own probe header calls it guarded by nothing. The finding stands; the mechanism need not |
| 0166's *hold weight costs no audibility* and *a weight of zero is the solve that shipped* | both solve the mix the game plays and compare the result to it. **The game now plays the solve**, so both are a second solve on a first |

⚠️ **0166's THIRD GUARD AND ALL OF 0167's STAY**, because their subject is a boundary and boundaries
are still shipped behaviour.

## What this is not

⚠️ **It is not a fix for the quiet layers.** 54 remain under their role, 19 of them in The Coil
Labyrinth. Reported in the same breath as the approval: *"there's still a few elements that are
incredibly quiet or inaudible… I think we can start working on them separately per level now."* Four
guards now carry named, measured exceptions instead of a lowered bar — `mire` on the whisper floor,
`rime/push` on the bottom floor, `saurian/push→surge` and `rime/approach→boss` on the climb — and each
is **deleted** when its place is worked on rather than left to rot.

⚠️ **No cue changed.** The gun, the missile, the enemy death and the bomb are a separate report and a
separate pass.

## Confirmed, not assumed

- `npm run typecheck` clean, `npm test` green, `npm run build` clean.
- The fold reproduces `rebasedLevel` to 8.9e-16, and the shipped game sits 3.5e-4 dB from the desk's
  own `rebased` output — both measured over every place, rung and layer.
- Three probes, seen red, trees restored: `node scripts/prove-guard.mjs 0176`.

| broken on purpose | went red |
|---|---|
| the solved balance dropped, so the game plays the mix the player did not choose | `and the clamp agrees with the guard, so a bad row cannot merely be quietly fixed` |
| the shaper modelled without the browser's clamp, which is a shaper the game does not have | `and no theme at any rung drives the bus past full scale` |
| the hand's band applied to the product, which clamps the balance away at 2.6 | `0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT` |

⚠️ **AND 0164's AND 0175's PROBES WERE RE-ANCHORED**, the first because the adrift list it plants a
stale line into is a different list, the second because two of its three break a mechanism this
decision removes.

## Rollback

Shipped audio, and it is the whole soundtrack. `REBASE` and `mixOf` in `src/content/themes.ts`.
Reverting restores the mix that shipped before this and leaves the desk with one mode, which is a
state nothing has driven. No storage key, save schema, SW cache prefix or origin.
