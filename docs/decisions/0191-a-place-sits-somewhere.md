# 0191 — A place sits somewhere, and the arrangement may name what only one place opens

**Accepted 2026-08-21.** [0189](0189-a-place-is-what-it-does-not-play.md) shipped the wrong track. This
is the correction, and the two mechanisms it needed to be possible at all.

> *"The dashboard saurian level is not what I was after at all. The changes with chords and groove
> just bring it back to the sameness of the previous levels, whereas the file I uploaded with my
> changes had it as a completely different track audibly."*

## The rule

**Two, and they are the two that made the mistake possible.**

1. **`ARRANGEMENT` may give a role to a layer any place opens**, not only one the shared row opens.
2. **A place states a `trim`** — one number over everything it plays.

## ⚠️ What went wrong, because the mechanism is only half the point

⚠️ **`chords` WAS NOT THE CAUSE AND `groove` WAS.** Measured against the driven dump: `chords` reads
`0.00` in both. `groove` reads **0** on the desk and **1.62** as shipped. The player closed it; 0189
opened it with a bassline written for the occasion.

⚠️ **AND THE REASON IS THE WORST AVAILABLE ONE.** Two messages earlier the same player had corrected
this project's whole idea of what makes a level sound different — *"the manual adjustments I made make
saurian sound completely different to every other level"* — and the answer was the **arrangement**:
their state opened `bass` and `beat`, which **no other place in the game sounds at all**. 0189 moved
that sound into `groove`, which all seven places open, in the same sixteen-bar centre slot with the
same `bed` role as everywhere else. **It removed the exact thing that had just been identified as the
difference, while quoting the correction in its own text.**

⚠️ **AND IT DID IT TO KEEP A GUARD GREEN.** `tests/arrangement.test.ts` refused a role for a layer the
SHARED ladder does not open, so `bass` and `beat` could not be given one — and a layer with no role is
outside [0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md) entirely. 0189's own *What this costs*
section says so outright: *"the break went into `ownB` instead… this is now the second decision to
step around it."* **The second step-around is what cost the level.**

## ⚠️ The arrangement reads every place's ladder now

Two assertions read `MUSIC_LADDER` and both are wrong for the same reason —
[0162](0162-a-place-has-its-own-ladder.md) made the shared row one opinion among eight:

- *the arrangement gives `X` a role at `rung` and the ladder never opens it there* — now **no place**
  opens it there. The defect it exists for, a role for a layer nobody sounds, is untouched.
- *a lead the ladder never opens is a place following silence* — now reads `rungOf(theme, …)`. The old
  form both refused a place the right to follow the layer that makes it different **and** passed a
  place that had closed its own lead.

⚠️ **`bass` IS A `counter` AND `beat` A `pulse` IN EVERY FIGHT RUNG**, and Saurian Belt follows `bass`
at `run`. It is the only place in the game that follows its bass, and it is a bass no other place has
open — which is [0155](0155-a-place-follows-its-own-instrument.md)'s sentence arriving with something
to say it about.

⚠️ **THE SEVEN ROLE-LESS LAYER-RUNGS `docs/state-of-play.md` HAS BEEN FLAGGING ARE STILL SEVEN.** This
makes naming them *possible*; it does not name them. The other half of that guard — *names every layer
the rung actually sounds* — still reads the shared row, and widening it would demand a role for all
seven at once. **That is a pass, not a side effect of this one.**

## ⚠️ A place sits somewhere

The driven mix drives the bus into the shaper's clamp on **0.13%** of samples at `surge` against a
guard of 0.05%: `bass` and `beat` are open at **1.62** where the title screen plays them at 0.5, over a
floor that already has its own kick. Two kicks on the same sample, and `beat` is shared material that
cannot be reshaped for one place.

⚠️ **THE FIX THAT COSTS NOTHING MUSICALLY IS THE WHOLE PLACE 1.4 dB DOWN**, because it preserves every
ratio the player drove and changes only where the place sits. **And there was no way to write it.**
`mix` is per layer, so a uniform trim meant scaling twenty entries plus adding four for layers this
place had never sounded — twenty-four numbers, and none of them legible afterwards. A reader seeing
`groove: 1.87` cannot tell it is 2.2 with a trim on it, which is the illegibility
[0182](0182-a-mix-number-has-no-band.md) deleted a clamp for causing.

⚠️ **IT IS NOT A CEILING AND NOTHING IS CLAMPED TO IT.** What bounds the product is still the bus. The
clip guard reads **0.0154%** at the worst rung now, against 0.05%.

## ⚠️ Thirteen entries went onto the known-adrift list, and that is a verdict

The list was **empty** after [0186](0186-a-place-has-its-own-gesture.md). It is thirteen. **The mix did
not get worse — it became the player's.** Their bass is the loudest thing in the place in three bands,
so `sub` sits 11–12 dB under what a `pulse` should be, and `dread`, `ride` and `hook` sit under it too.

⚠️ **IT WAS PUT TO THEM WITH THE NUMBERS AND THE ANSWER WAS *ship it as I drove it*.** The alternative
offered was lifting `sub` about 4 dB so the kick reads under the bassline, which would have cleared
four entries. It was refused, and a refusal by the ear that has to live with the level is what
[0027](0027-measure-the-picture-not-the-model.md) says this channel is decided by.

⚠️ **WHAT IT COSTS IS THAT NOTHING WILL FLAG THEM AGAIN.** A known-bad list is a decision to stop
asking. The four `sub` entries are the ones to delete first if the kick is ever reported missing.

## ⚠️ The one thing added that the player did not drive

`crash` opens at `push`. Their arrangement adds two layers there, and
[0171](0171-a-boundary-is-a-build.md) wants a build to span more than three seconds — two arrivals is
one bar. **Asked, and the answer was *find a third arrival* with no layer named**, so: `ride` was
refused because it is already open at their `run` and making it an arrival would mean closing it
there, and `crash` was taken because it is additive, touches nothing below it, and a crash on the drop
is the most eurobeat gesture there is.

## ⚠️ Two probes rotted on this, in two ways neither of them is about

⚠️ **[0189](0189-a-place-is-what-it-does-not-play.md)'S ENVELOPE BREAK IS RETIRED, AND `trim` IS WHAT
RETIRED IT.** Putting the hand drum's 1 ms attack and its old saturation back used to carry
`bossPeak` past the clip guard; with the whole place 1.4 dB down it no longer does, and
`npm run prove` said **STILL GREEN**. The material change stands — a softer attack under two kicks is
right whether or not a guard is watching — but the claim that it is what keeps the bus inside full
scale is no longer true.

⚠️ **AND THE CASCADE BREAK WAS REPAIRED ONTO THE WRONG LEVEL.** Re-anchoring it used a regex for the
first `bossPeak:` row in `src/content/themes.ts`, which is **Ember Nebula's**. The probe rewrote a
place this decision is not about, the clip guard went red, and the run reported a pass. **Right guard,
wrong subject** — which is precisely what 0190 records about 0089 firing on a cue's crack instead of
its body, committed here while repairing an anchor and caught only because the failure named a theme
that had no business being in it.

⚠️ **THAT IS THREE ROT MODES IN TWO DAYS AND NONE OF THEM MOVED THE CODE THE PROBE POINTS AT** —
0188's went stale when a later decision filled a second own slot, 0186's when a later decision closed
the layer it was about, 0189's when a later decision made its quantity comfortable.
`tests/prove-guard.test.ts` checks that an anchor is present and unique and cannot see any of them.
**Only the full `npm run prove` can**, which is the argument for running it before every push rather
than trusting the suite.

## What this reverts

The jungle bassline, the `ownB` break and the raptor call 0189 added at `push` are **deleted**;
`groove` is the octave bass again and closed, as the player left it. 0189's other half stands: the
six closures, the ride, the leads at `push` and `surge`, the envelope work on `perc` and `drive`, and
the audition fallback. **[0190](0190-a-place-owns-what-it-kills.md) is untouched.**
