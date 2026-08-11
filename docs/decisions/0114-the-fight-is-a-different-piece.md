# 0114 — The fight is a different piece, and the ladder stops being additive

**Accepted 2026-08-11.** The boss item of the eleventh play-test's third round.

**It supersedes the ADDITIVE half of [0090](0090-the-music-is-four-loops.md)** and leaves the rest of
that decision standing. 0090 says two things; only one of them is wrong.

## The rules

**The ladder is additive from `run` to `approach` and nowhere else.** That span is the level's own
piece and 0090's rule governs it unchanged.

**The fight is a different piece.** `LEVEL_ONLY` names the layers that carry the level's harmony, and
they CLOSE when the boss arrives — on exactly the terms
[0095](0095-the-level-has-its-own-music.md) closes `TITLE_ONLY` at a level's start.

**The fight has two rungs and climbs between them.** `boss` is the sparse arrival; `bossPeak` is the
wall of sound, and it is the top of the ladder. Every guard that meant *the loudest rung* now names
`TOP` rather than `boss`.

## What was reported, and why it was arithmetic rather than taste

> *"The boss part just feels like part of the regular level music, not an escalation. We've got the
> seamless looping, but there is no separate boss theme or dynamic climax."*

⚠️ **THAT WAS NOT A MIX PROBLEM AND NO AMOUNT OF TUNING COULD HAVE FIXED IT.** 0090's ladder only ever
opens layers, so the boss rung was **the level's arrangement plus whatever it added** — by
construction. *The level with more of it* is the only thing an additive ladder can produce at its top.
Four rounds of this session were spent adding layers to the boss and every one of them made the
report more true, not less.

⚠️ **AND THE PLAYER CALLED IT BEFORE THIS DECISION DID**: *"so there's a problem in 0090… if it's
restricting the music, it's a problem and not a good rule."* Correct, and the reason it survived four
rounds is that it reads as a description of the music rather than as a constraint on it.

## What 0090 got right, and keeps

⚠️ **THE LOOP ARCHITECTURE IS UNTOUCHED AND IS STILL LOAD-BEARING.** Sample-locked loops of whole
multiple lengths, started on one timestamp, that cannot drift apart — that is 0090's real content and
nothing here weakens it. `LEVEL_ONLY` closes a layer by taking its GAIN to zero, exactly as
`TITLE_ONLY` does; no source stops, nothing is re-anchored, and the seam guard is as true as it was.

⚠️ **What is superseded is one sentence**: *"the ladder is additive and that is the ask, stated as a
table."* It was a faithful reading of the ask **at the time** — *"backgroundy, then an increased beat
and bass leading into the boss fight, then really pumping as the boss appears"* is one piece getting
fuller. The ask has changed twice since and the rule did not.

## Why closing is the only mechanism that works

⚠️ **THE HARMONY IS THE REASON, AND IT IS STRONGER THAN THE ONE 0095 HAD.** 0095 closed the title's
bass because an A-rooted riff is a wrong note over three chords in four. The level's material is
consonant A natural minor; the fight's is **A Phrygian with a tritone in it**. Holding `chords` open
under `dread` is not a thin arrangement — it is a minor second sounded against a major second, which
is not tension, it is a mistake.

⚠️ **ONLY THE HARMONY CLOSES. THE DRUMS AND CYMBALS PLAY THROUGH** — and the first draft of this
decision got that wrong. `perc`, `ride` and `crash` were in `LEVEL_ONLY`, and the note-density guard
caught it: the fight measured **1.04× as busy as the opening of a level** where it must be over 1.5.
A pitchless layer cannot clash with a mode, so closing it bought nothing and cost the wall of sound.

## The leitmotif

⚠️ **`wraith` IS `call`'s CONTOUR WITH ITS SECOND FLATTENED — three notes move.** The player has spent
two minutes with that tune and said of it *"the tune kickin around 52 secs is great"*, so it is the
only melody they have had time to learn. The same shape in the mode the fight is already in, through a
driven square instead of a triangle: recognisable and wrong.

⚠️ **It opens at `bossPeak` and nowhere else.** A leitmotif that plays through the whole fight is a
layer; one that arrives when the boss is half dead is a payoff.

## What the guards found, and what changed in them

⚠️ **SEVEN GUARDS FAILED AND EVERY ONE ENCODED THE ADDITIVE RULE.** They were not wrong; they were
about a shape the game no longer has. What replaced them is **more** structure, not less:

| was | is |
|---|---|
| every rung opens more than the one below | true across `CLIMBING`; the seam is named and checked |
| the loudest rung is `boss` | the loudest rung is `TOP`, named once so nothing believes otherwise |
| — | the fight must CLIMB: its peak sums above its arrival |
| — | `LEVEL_ONLY` must actually close, member by member |

⚠️ **AND ONE GUARD WAS RETIRED FROM A CLAIM IT COULD NO LONGER SUPPORT.** A sum of gains proxies
loudness **only while layers are added**. The fight closes six and plays the rest louder, so it sums
to 12.7 against `approach`'s 13.6 while being audibly the loudest thing in the game. It keeps the
additive claim across `CLIMBING` and hands loudness to the RMS-through-the-shaper guard next to it —
[0027](0027-measure-the-picture-not-the-model.md), because a model quantity that has stopped tracking
its subject is worse than no guard: it still passes.

## What is still open, in the player's own words

⚠️ **`surge` IS STILL NOT AN EVENT.** *"There is only a very subtle difference in the sound between
push and surge… it doesn't really make any noticeable difference in game because there'll be the
other game noises over the top."* Two rounds have raised it — `counter` now leads its own rung at
1.05 — and the verdict is unchanged. **The next attempt should not be another gain.** What separates
`push` from `surge` today is three layers arriving over a piece that already has eleven; what would
separate them is the thing that separates `approach` from `boss`, which this decision already built:
something STOPPING. A rung that closes a layer as it opens two is a change of arrangement rather than
a thicker one, and it is the only mechanism here that has ever read as a section boundary.

⚠️ **AND THE VOLUME GAP REPORTED BETWEEN THE RENDERS WAS THE RIG.** *"There's a massive musical volume
difference between final-play-bosspeak, final-cues and v9-surge and v9-push."* Measured, the fight is
already the loudest rung in the game — 0.4807 RMS against `surge`'s 0.4238. `--music` was writing the
bed at `MUSIC_GAIN` and `--play` at `MUSIC_GAIN × MASTER_GAIN`, so the two modes rendered the same
music at two reference levels and the difference between two FILES was mistaken for a difference
between two rungs. **It was one instruction away from being tuned as a defect in the music.** Both
modes carry the game's gain now — the second time 0027 has fired inside this rig, after the missing
bus shaper under-reported a change by 4.5 dB.

## The one number that moved instead of a guard

⚠️ **The report asked for boss music *"5-10secs before the boss shows"* and a guard requires every rung
to last over ten seconds** — `RAMP_SECONDS` is 1.6, and a rung shorter than a handful of those is a
gain ramp heard as a wobble rather than a section. **10.6 seconds satisfies both**, so the number
moved and the guard did not.
