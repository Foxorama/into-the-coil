# 0122 — The kick goes under the music, and the gain was the wrong lever

**Accepted 2026-08-12.** Reported from play, with the layer **named by the player off a solo render**:

> *"The bass beat, the do do do do do do recurring beat, is probably too loud and not bassy enough
> still. It needs a deeper bass, but needs to play below the melody of the music to support and uplift
> it, and it's currently playing over the top of the music so it's drowning out some of the subtler
> other melody parts."*

> *"It's the loud beats in `itc-solo-engine`. I don't think I've even heard `itc-solo-groove` in
> game."*

## The rule

**The kick's body sits below the band the harmony occupies.** Its sweep, not its gain, is what puts it
there — and `tests/music.test.ts` holds the share of its own energy, so it survives being re-voiced.

## It was one number saying two things

⚠️ **THE KICK SWEPT FROM 160 Hz, AND 130–300 IS WHERE `chords` AND `groove` LIVE.** So *not bassy
enough* and *drowning out the subtler melody parts* were **the same defect reported twice**: every
strike masked the harmony, by nothing anybody had written.

Measured, A-weighted, at `run`:

| | lowmid share | before | after |
|---|---|---|---|
| `engine` | 33% → **19%** | 0.0 dB | 0.0 dB |
| `groove` | | −4.1 dB | **−2.6 dB** |
| `chords` | | −5.7 dB | **−4.1 dB** |
| `call` — the tune | | −12.2 dB | **−10.7 dB** |

`from: 160 → 104`, `to: 38 → 34`, and a slower decay so more of the note is spent at the bottom.
**Nothing else moved.**

## The gain was tried, measured, and put back

⚠️ **`engine` IS THE SUB BAND'S MAIN SOURCE, so turning it down takes the floor out from under the
mix.** Cutting it 15% dropped
[0108](0108-the-bed-is-felt-and-the-boss-arrives.md)'s chest-band share to **19.8%** against a floor of
20 — the guard fired, correctly.

⚠️ **AND CUTTING IT FURTHER MADE THE RATIO WORSE, WHICH IS WHAT SAID THE LEVER WAS WRONG.** At ×0.85
the share was 19.76%; at ×0.90 it was 19.65%. `hi` comes from the hats and the cymbals and `sub` comes
almost entirely from the kick, so **turning the kick down lowers the floor without lowering the top**.
A gain could not have delivered *"deeper"* at all, and it cost *"felt"*.

⚠️ **The spectrum change delivered the loudness half for free.** The ear is far less sensitive at 40 Hz
than at 160, so moving the body down lowered `engine`'s A-weighted level without touching a gain —
which is why *"too loud"* and *"not bassy enough"* stopped being in tension the moment the right lever
was used. [0114](0114-the-fight-is-a-different-piece.md)'s *"the next attempt must not be another
gain"* holds for a third decision running.

## What the guards cost, and one was a real trade

⚠️ **A LONGER, DEEPER KICK OVERLAPS THE NEXT ONE AND RAISES THE SUMMED PEAK.** At 0.52 s the `nebula`
theme clipped at 1.000064 of full scale — a guard catching six thousandths of a percent, which is the
kind of margin a hand cannot see. **0.46 s** keeps the depth and clears it.

## It broke a guard in another decision, and the probe is what said so

⚠️ **`npm run prove` REPORTED WRONG TEST ON ONE OF 0108's PROBES.** That probe closes `sub` at a
level's opening rung and expects *"a level carries MANY times the title's sub"* to redden. **It stopped
reddening** — a deeper kick supplies enough of the sub band on its own to clear a ratio against the
title.

⚠️ **THE PROBE'S OWN WORDS ARE WHAT HAPPENED**: *"the floor is back to being a kick's tail."* It named
the failure mode in 0108 and this decision walked into it.

⚠️ **A RATIO AGAINST THE TITLE HAD STOPPED TRACKING ITS SUBJECT**, which
[0114](0114-the-fight-is-a-different-piece.md) says is worse than no guard because **it still passes**.
The claim was always *the level has a floor* — and a floor is sustained where a kick's tail is a
thump, which is the difference between support and pumping.

⚠️ **SO IT IS ATTRIBUTED RATHER THAN TOTALLED NOW**: `sub` must be the **largest single contributor**
to the band, which fails the instant it is closed whatever else is playing, and states no number.
Measured, it holds 36.3% against `drone`'s 26.7% and the kick's 19.3%. **0108's probe is unchanged;
what it aims at is.**

## Why it took a player to name the layer

⚠️ **THREE ROUNDS OF *"the metronome"* WERE ANSWERED BY GUESSING WHICH LAYER IT WAS** — 0102 in `beat`,
0108 in `engine`, and [0113](0113-there-is-one-composition-and-seven-levels.md) is where that stopped.
`hear.mjs --solo` writes one file per layer and **the filename is the answer**; this is the first
report in the project's history where the player could point at a layer instead of describing a sound.

⚠️ **AND THE FIRST TABLE HANDED TO THEM WAS WRONG.** It ranked layers by raw RMS, which said `sub` was
the loudest thing in the game; the player replied that they had never heard it. **They were right** —
A-weighted it is 7.8 dB down, and 11 dB down on a small speaker.
[0027](0027-measure-the-picture-not-the-model.md) firing on my own instrument, and the reason the
guards here are A-weighted.

## What was rejected

**Raising `groove` or `call` to meet the kick.** The player named one layer and described its effect;
raising others is taste added on top of a measurement, and it spends the headroom
[0104](0104-the-gun-plays-a-figure.md) measured. The gap is now 2.6 dB rather than 4.1 and the next
verdict is attributable to one change.

**Raising `sub` so it can be heard.** It is *felt, not heard* on purpose —
[0108](0108-the-bed-is-felt-and-the-boss-arrives.md) — and a player reporting they cannot hear it is
that design working. What they asked for is a deeper KICK, which is this.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the kick swept back down from 160Hz, which is inside the band the harmony occupies | `THE REPORTED ONE: the kick does not sit in the band the harmony occupies` |
| the kick stopped short of the bottom, so it no longer sits under the bass line | `and it reaches deeper than the harmony it sits under` |
| the bass line dropped back under the drums, where a player reports never having heard it | `AND THE LAYER THE PLAYER HAD NEVER HEARD IS WITHIN REACH OF THE ONE THEY HAD` |

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Four numbers in one synthesised
note. No storage key, no save schema, no cache prefix, no origin.
