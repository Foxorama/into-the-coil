# The Black Heart, driven — 2026-09-16

A plan for changing The Black Heart's music to the three desk moments pasted on 2026-09-16, written to
be picked up cold. It holds the desk values as the ladder numbers they imply, what those numbers
measure as through the shipped bus, the four decisions the drive runs into and the choice each one
puts to the ear, and a queue. It originates nothing a decision or a script does not already say;
where it proposes, it says so and costs the choice. The scratch measurements were made in a worktree
that is left standing — see the last section.

## ⚠️ It was built, and two of its four costings moved when they were measured again

[0329](../docs/decisions/0329-a-level-may-fall.md) and
[0330](../docs/decisions/0330-the-black-heart-is-driven.md) are what shipped. Where they differ from
the queue at the end of this file, **they are right and this is the record of what was thought
first** — kept rather than edited, because a plan quietly rewritten to match its outcome teaches
nothing.

- **The contour landed in the same PR as the drive, not before it.** A contour no place states is a
  mechanism no probe can reach, and a probe pointed at one reports STILL GREEN —
  [0019](../docs/decisions/0019-a-probe-must-be-seen-to-apply.md).
- **The clip was not the whole of it.** What this file costed is the clamp share; the assertion that
  actually bit is the **saturation** measure beside it, and the driven `run` was −12.4 dB dirty
  against a ceiling of −16. Both come from one layer.
- **`beat` came down to 1.28 rather than 2.04, and the whole-place trim was refused.** The trim was
  built and measured: it charges five clean rungs 3.1 dB to fix the one dirty rung among them.
- **The contour is `−1.9 / −0.8 / −3.6` and not the drive's own `−3.4 / −2.3 / −5.1`**, because the
  opening came down and nothing else did. The `approach` and both fight rungs therefore keep the
  loudness they already ship at, to within 0.06 LU — which is *"as is"* satisfied literally, where
  holding the shape would have dragged them 1.2 LU below anything they have ever been.
- **`LEADS.core.surge` stayed at `lead`.** By margin the three candidates sit within 0.3 dB of each
  other, and a tie is not a displacement.
- **The duck guard's hard twin was deleted rather than demoted.** The claim is already registered
  once, as the taste `0167-duck`.

## Before anything

Read, in this order: `docs/machine.md` (node is not on PATH), `CLAUDE.md`, `docs/game.md`,
`docs/state-of-play.md`. Then the three decisions this plan turns on:
[0129](../docs/decisions/0129-the-desk-holds-a-value-not-a-multiplier.md) (a hold is an absolute gain,
so a paste is what you transcribe), [0226](../docs/decisions/0226-the-level-holds-one-loudness.md)
(every rung is held to `run`'s loudness, which is what the drive disagrees with) and
[0191](../docs/decisions/0191-a-place-sits-somewhere.md) (the precedent: Saurian Belt driven on the
desk, put to the player with the numbers, shipped as driven).

## The ask

Three *copy this moment* pastes of level `eye`, desk driven, cues off, mix `the game's own`:

| paste | at | what was held |
|---|---|---|
| `run` | 0:07 | drone 0.94, bass 0.63, **beat 3.19**, sub 0.63, perc 0, stomp 0.42; arp, ride, hook, toll, crash, dread, counter, wraith at 0 |
| `push` | 0:58 | drone 0.70, bass 0.34, beat 0.06, sub 0.31, perc 0.10, hook 0.28, dread 0, **stomp 0.77** |
| `surge` | 1:39 | drone 0, bass 0.14, beat 0, sub 0.63, **engine 1.29**, perc 0.15, groove 0.15, arp 0.77, ride 0.01, call 0.42, hook 0.94, drive 0.06, toll 0.42, crash 0.46, dread 0.23, counter 0.57, stomp 0.42, **frenzy 0.86**, wraith 0.28 |
| `approach` | — | *"as is"* |

And the brief over them: *"it'll probably need a bit of tweaking to get the opening, closing and
loudness correct, but I want a sense of discordance between the four arcs to have attributes of all
previous levels, but be copies of none."*

A layer not held in a paste plays the shipped target and is left alone below. Two held values are
read as zero: `ride` 0.01 at `run` and `surge` is not a fader position — the desk's first notch is
0.022 — but a hold of 0 caught on the node's exponential tail, so the ride is **closed** at `surge`
where the shipped ladder opens it at 0.64. `beat` 0.06 at `push` and `drive` 0.06 at `surge` are real
notches (51 dB under the desk ceiling) and are transcribed as driven; both are inaudible under the
rung they sit in and the ear should decide whether they are ghosts or zeros.

## What the desk values are, as a ladder

The dashboard's target is `rungIn × mix × REBASE × LEVEL_HOLD` (`scripts/timeline.mjs`,
`targetGain`), so a held gain transcribes as `desk ÷ (mixOf × holdOf)` at the hold that was playing
when it was driven. `THEMES.core.ladder` becomes:

```ts
ladder: {
  run: { chords: 0, call: 0, drive: 0.55, engine: 1, perc: 0, groove: 0.6, drone: 0.943, bass: 0.63, beat: 3.19, sub: 3.385, stomp: 0.283 },
  push: { chords: 0.36, drive: 0.7, hook: 0.17, drone: 1.498, bass: 0.725, beat: 0.128, sub: 3.553, perc: 0.144, stomp: 1.108 },
  surge: { sub: 8.106, drone: 0, bass: 0.335, engine: 3.328, perc: 0.243, groove: 0.401, arp: 0.72, ride: 0, call: 0.309, hook: 0.641, drive: 0.143, toll: 1.612, crash: 1.574, dread: 0.614, counter: 0.803, stomp: 0.679, frenzy: 1.078, wraith: 0.382 },
  approach: { sub: 1.45 },
  boss: { sub: 2.668 },
  bossPeak: { sub: 2.773 },
},
```

⚠️ **`sub` READS AS 8.1 BECAUSE THE PLACE'S OWN MULTIPLIER ON IT IS 0.186** (`mix.sub` 0.585 ×
`REBASE.core.sub` 0.318). The number is honest and
[0182](../docs/decisions/0182-a-mix-number-has-no-band.md) says there is no band; lifting `mix.sub`
and dividing the row would read better but would move the fight's `sub`, which is *as is*.

⚠️ **`bass` AND `beat` ARE `TITLE_ONLY`** — [0095](../docs/decisions/0095-the-level-has-its-own-music.md)
closed them in every level because *"an A-rooted riff is a wrong note over three chords in four."*
Saurian Belt already opens both at 1.62 in every rung
([0189](../docs/decisions/0189-a-place-is-what-it-does-not-play.md)), the guards that hold the closure
read the shared ladder only, and here the wrong note is the ask: over the Heart's sixteen bars the
title's A sits as the ninth of G in three bars and the fourth of E minor in two. Nothing needs
changing for a place to open them; what needs saying is that at `run` there are **two kick drums** —
the title's syncopated eighths under `sub`'s double kick — and only an ear can rule on that.

## What it measures as

Made in the worktree on the ladder above, with the shipped `LEVEL_HOLD` (what the desk was playing)
and with the hold re-solved by `node scripts/solve-hold.mjs core`.

### The level's loudness, K-weighted through the shipped bus

| rung | shipped today | **as heard on the desk** | re-solved under 0226 |
|---|---|---|---|
| run | −18.29 LUFS | **−13.13** | −13.13 |
| push | −18.28 | **−16.57** | −13.14 |
| surge | −18.29 | **−15.47** | −13.13 |
| approach | −18.27 | **−18.27** | −13.12 |
| boss | −18.28 | **−18.28** | −13.15 |

The drive has a contour: an opening 5.2 LU louder than the level ships at, a `push` 3.4 LU under it,
a `surge` back up 1.1, and an `approach` and fight 5.1 LU under the opening — which is
[0136](../docs/decisions/0136-the-place-has-a-room-and-an-arc.md)'s *"Up, Up, Up, drop, sharp Down"*
with the first three ups moved into the opening. 0226 as it stands flattens all of that to the
opening's level: the re-solved hold is `push 1.0525, surge 0.7161, approach 1.0985, boss 1.1663,
bossPeak 1.1368` against today's `0.4688, 0.4176, 0.4472, 0.423, 0.4105`, so `push` would play
**+7.0 dB** over what was driven, `surge` +4.7, `approach` +7.8, the fight +8.8.

### The clip budget

`tests/themes.test.ts` *and no theme at any rung drives the bus past full scale* is a budget and
fails hard. On the driven `run` the bus is clamped on **0.835 %** of samples against a ceiling of
0.05 %; every other rung is under it at either hold. The run's `beat` at 3.19 is what does it:

| the run comes down by | clamp share | the run measures |
|---|---|---|
| nothing | 0.835 % ⚠️ | −13.13 LUFS |
| everything × 0.727 (−2.8 dB) | at the budget | −14.26 |
| `beat` alone × 0.638 (3.19 → **2.04** on the desk) | at the budget | −13.95 |
| `beat` closed | 0 % | −15.62 |

`beat` 2.04 keeps the rest of the opening exactly as driven and costs 3.9 dB on the one layer, which
is the smaller change; the ear may prefer the whole opening 2.8 dB down. Either is a hand's edit to
the row above and nothing else.

### The boundaries — `node scripts/weigh-boundary.mjs core`

Sixteen carried layers fall by a decibel or more at the three in-level boundaries; relative to the
rung's own hold (what
[0167](../docs/decisions/0167-a-build-does-not-duck.md)'s guard measures since 0226) ten of them
duck:

| boundary | carried layer falls, less the hold |
|---|---|
| run → push | beat −27.9 dB |
| push → surge | drive −13.8, groove −7.3, call −6.9, bass −6.7, stomp −4.3 |
| surge → approach | sub −14.9, engine −10.3, toll −5.5, crash −4.7 |

Every one of them is a fader the drive pulled. `levelWrites` already paces a carried layer that
falls in the arrivals' own steps — 0226's *"whatever falls at a boundary falls in the arrivals' own
steps"* — so none of them is the *"hard jump"* 0167 was written against; they are a rebalance at the
boundary, which is the thing 0167's rule forbids and the thing this drive does on purpose. The floor
over the shipped ladder is **already a taste** — `0167-duck` in `tests/authored.ts`, demoted by
[0192](../docs/decisions/0192-a-guard-holds-an-invariant.md) after it *"refused the eurobeat
breakdown twice"* — and will print these ten every run. What is still hard is
`0167 — AND THE RE-BASED MIX IS ADDITIVE TOO` in `tests/themes.test.ts`, run against the driven
ladder in the worktree: **red, with exactly the ten above.**

### The roles — `node scripts/weigh-adrift.mjs core --all`

Thirteen new place/rung/layer triples sit more than a role under what the arrangement asks, beside
the eight already on `STILL_ADRIFT.core`:

| rung | adrift | under |
|---|---|---|
| run | groove −12.9, **engine −12.0**, bass −7.7 | beat |
| push | beat −19.8, perc −17.9, **hook −12.5**, bass −11.1, groove −9.9 | stomp, arp, lead |
| surge | drive −23.2, bass −21.0, perc −18.6, groove −18.1, **lead −6.0** | sub, counter, hook |

The three in bold are the place's own lead buried by the drive: `LEADS.core.run` is `engine` and the
beat is 12 dB over it; `push` follows the arrangement's `hook` and the drive cut it to 0.28 under a
`call` at 1.04; `LEADS.core.surge` is `lead` and `hook` is over it. The other ten are the same finding
0191 recorded for Saurian Belt — *"that bass is the loudest thing in the place in three bands, and
what it sits on top of is what this list is"* — and two of them (`perc` 0.10 at `push`, `drive` 0.06
at `surge`) are faders the drive pulled down itself.

### The fight's own three arrive early

`stomp`, `frenzy` and `wraith` are the fight's layers everywhere. Driven, `stomp` plays at 0.42 from
the first bar, 0.77 at `push` and 0.42 at `surge`, against **0.58** in the fight itself; `frenzy`
0.86 at `surge` against 0.70 in the fight; `wraith` 0.28 against 0.59. The `approach` (*as is*)
closes all three, so the boss still opens them and 0108's arrival guard is over the shared ladder and
stays green — but the ear should say whether a blast beat that has been there since bar one still
reads as the boss arriving.

## The four decisions the drive runs into, and what each puts to the ear

**1. The clip budget is a budget and does not move.** The run comes down: `beat` 2.04 (recommended),
or the whole row × 0.727. A hand chooses; the guard reads the answer back.

**2. 0226 — the level holds one loudness — is the one that decides whether what ships is what was
heard.** Two honest answers, and the dashboard cannot audition either (the desk holds gains; the hold
lives inside `rungOf`), so a branch preview is the instrument:

- **Re-solve and keep the rule.** Nothing to decide; `push`, `surge`, `approach` and the fight come
  up 5 to 9 dB from the desk, the ratios inside each rung survive, the contour does not. The drive's
  middle was made hearing a `push` 3.4 LU under the opening, so this is not *as driven*.
- **Amend 0226 so a place may state its contour — recommended.** On
  [0282](../docs/decisions/0282-a-mechanism-for-every-instance-makes-them-one-instance.md)'s own terms:
  the hold's target is `run + contour[rung]` in LU, a place that states nothing is flat (every place
  today, no audio change), and `core` states the driven one — `push −3.4, surge −2.3, approach −5.1,
  boss −5.1, bossPeak −5.1`, measured above. `scripts/solve-hold.mjs` takes the contour, the
  `HOLD_BAND_DB` guard asserts against it, and the solved numbers land within a rounding of today's.
  The reason it is not a reversal of 0226: that decision's finding was a *climb* that *"read as a
  knob"* and *"loudness does not predict a section"*; it never said a level may not be shaped, and the
  shape here is the ear's, with the numbers beside it. The risk to state plainly: six reports asked for
  the knob not to move, and a fall is the knob moving the other way. One listen on the preview
  answers it.

**3. 0167 — a build does not duck — is already a taste, and its hard twin is a duplicate.** 0192
demoted the duck floor to `0167-duck` on the constitution's own admission test — *name a change to
the content that would redden this and be correct* — and this drive is that change again. The guard
that survived, `0167 — AND THE RE-BASED MIX IS ADDITIVE TOO`, did so because its subject was named as
the desk's third mix; [0176](../docs/decisions/0176-the-re-based-mix-is-the-mix.md) folded that mix
into the shipped one, so since then it measures the same carried layers at the same boundaries as
the taste and fails hard where the taste prints. It is **deleted**, not demoted, on that reason: the
claim is already registered once, and a second copy that can fail is the asymmetry 0192 was written
against. `scripts/probes/0171-a-boundary-is-a-build.mjs` cites the floor in passing and is re-read
in the same PR, because a deletion strands probes only the full proof finds. The alternative — a
per-place allowed list, `STILL_ADRIFT`'s shape — keeps a guard over a research object and stops
asking, which is the worse of the two.

**4. 0164 — the roles — is answered the way 0189 answered it: the place follows what the drive made
loudest.** `LEADS.core` becomes `{ run: 'beat', push: 'call', surge: 'hook', approach: 'counter',
boss: 'frenzy' }`. Following the title's kit at `run` is a thing no place does; following the tune at
`push` is the base composition's opening role two sections late, which no place does either; `hook`
at `surge` is Saurian Belt's, one rung. `arp` at `push` is the other candidate (+0.9 dB margin) and
would make the Heart the fifth place to follow the tremolo there. The remaining ten triples go on
`STILL_ADRIFT.core` with the numbers, as 0191 did, unless the ear wants `sub`, `stomp` or `beat`
brought down to let something through — and that is a desk question, not a guard's.

## The arcs, and what each borrows

The brief is *attributes of all previous levels, copies of none*. Read against the other six
ladders and `LEADS`:

- **`run` — the title's kit over the Heart's chug.** Saurian Belt is the only place that opens
  `bass` and `beat`, and it holds both at 1.62 to the end; here the kit is five times the riff and
  both are gone by `surge`. The hats closed at the opening is Ember Nebula's `run` (`perc: 0`). The
  blast beat under it from bar one is no place's: it is the Heart's own fight leaking backward. What
  is new: two kick drums at once, and the title's A over G and E minor.
- **`push` — the tune leads, the riff whispers.** `call` at 1.04 over a `hook` at 0.28 is Saurian
  Belt's whispered `push` hook (0.32, *"meant to be"*) with The Approach's opening role — the hymn as
  the part — moved into the second section. `arp`, `ride`, `lead` enter as they do everywhere; the
  blast beat at 0.77 is louder than the fight's.
- **`surge` — everything at once, drone gone.** Saurian Belt's shape: `drone` closed, `arp` kept
  open through `surge` against the shared `RUNG_CLOSES`, `toll` and `dread` two rungs early (0185's
  *"primeval half"*), the fight's three inside the level. The Labyrinth's kit level (`engine` 1.29
  against its 1.398). `call` kept open at `surge` is no place's. The ride closed while the crash
  carries is Rime Shelf's promotion. Copy of none: no place has ever had twenty-one layers open at a
  rung, and the loudest thing in the room is the kick.
- **`approach` — as is, and it is a drop now.** `sub` falls 14 dB and `engine` 10 into it, the
  drone comes back for the first time since `push`, the ride returns, and the fight's three leave. It
  was the horizon; after the surge above it, it is the room emptying before the boss, which is the
  *drop* 0136 authored and the ladder never delivered.

## The queue

Every branch starts at `main` ([0033](../docs/decisions/0033-a-branch-starts-at-main.md)); the next
waits for the one before it to merge.

1. **The contour** — one decision amending 0226; `solve-hold.mjs` takes a per-place contour; the
   guard asserts against it; `THEMES` gains an optional `contour`; no place states one. No audio
   changes, so the proof is cheap. Skipped entirely if the ear chooses *re-solve and keep the rule*
   in 2 above — but that choice cannot be heard before this lands, which is why it goes first.
2. **The Heart is driven** — the ladder above with `beat` 2.04 (or the row × 0.727), `LEVEL_HOLD.core`
   re-solved against the contour (or flat), `LEADS.core`, ten entries on `STILL_ADRIFT.core`, the
   re-based-mix duck guard deleted with `0171`'s probe re-read, and the layer table at the top of
   `src/content/core.ts` rewritten to what each rung carries now. One PR because it is one change:
   the drive, and the four things the drive costs. The full proof, because two guards are edited and
   a deletion strands probes elsewhere.
3. **The ear** — the branch preview of 2, with the dashboard open on `eye`. What it decides: the two
   kicks at `run`; `beat` and `drive` ghosts or zeros; whether the boss still arrives after a surge
   that already had its blast beat; the contour, or flat. Whatever it moves is pasted back into the
   same branch before it merges — a round trip is fine for a change and not for a question.

The fight is untouched throughout: *"then heading into the approach as is"* ends the ask at the
boss's door.

## What is left in the tree

`C:/into-the-coil-heart`, branch `the-heart-is-driven` off `main` at `943ffc2`, holds the
transcribed ladder and the re-solved (flat) hold as **uncommitted scratch** in
`src/content/themes.ts`, with a `node_modules` junction. It is where the measurements above were made
and is the honest starting point for PR 2 — or discard it. It is not removed here, because a worktree
removal is a command that can lose another session's work and stops for an answer.
