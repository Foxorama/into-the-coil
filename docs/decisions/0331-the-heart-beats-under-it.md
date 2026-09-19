# 0331 — The heart beats under it, and a note that stops is a click

**Accepted 2026-09-19.** Twenty-five listens of level `eye` and of the six places beside it, handed
over as reports rather than as edits. The one this record is named for:

> *"Clearly heard, but the background backing for the track… fainter for the first 25 seconds, then
> kick in where it does."*

…and the one that turned out to be about every level at once:

> *"The other tracks have a bit of static and pop throughout them."*

The plan this implements is [`the-listen`](../../reports/the-listen-2026-09-16.md); what the night of
2026-09-19 measured while shipping it is in
[`the-night-of`](../../reports/the-night-of-2026-09-19.md), including the numbers that moved by more
than anyone expected and the two questions this record does **not** answer.

## The rules

**A place may state a heart, and it is an own slot per movement.** `OWN_ROLES.core` names `ownC` at
`run`, `ownD` at `push`, `ownA` at `surge` and `ownB` at `approach` — each a `pulse`, which is *a
pulse you can pick out when you attend to it* and is that report in this table's own vocabulary. The
fight's heart is `stomp`.

**A place may loop an own slot over more bars than the shared set** — `ThemeRow.bars`. A heart beats
at the speed it was asked for rather than at the speed four bars divide into: every ~3.7 s at the
opening (seven beats in sixteen bars), ~2.6 s in the second movement, ~1.4 s in the acceptance. Four
bars is 6.4 seconds and holds none of those evenly.

**Every music note ends in a six-millisecond release.** It faded a cue buffer and never a music note,
so every note in the score stopped dead at its envelope's end — which is a click, and *"static and
pop throughout"* is what a score full of them sounds like.

**A music note on a triangle, saw or square takes at least three milliseconds to arrive.** At phase 0
a triangle is at +1, a saw at −1 and a square at +1, so a 0.4–2 ms attack began with a jump of the
whole waveform; forty-five voices across seven places are written that way. **Starting each wave on
its zero crossing was tried first and moved every place's balance** — The Black Heart's flute fell
11 dB as its triangle cancelled its sine — so the phase is left where every mix was tuned and the
edge is softened instead. A cue is untouched, because a sound effect's hard edge is often the point.

**Every ride is a tick rather than a hiss.** Measured per layer, the ride was the loudest thing above
the top of every other part in five places — noise from 5 to 11 kHz on every sixteenth, by as much as
16 dB in The Shoal. Every ride now reaches down to 2.5–4 kHz and stops at 5.5–8, on the same rhythm.

**A place may strike a layer with its own onset** — `ThemeRow.struck`. *"Approach needs the chords at
1st and 2nd transition to pop a bit more"*: a chord that takes a tenth of a second to speak swells
rather than pops, so The Approach plays the base composition's chords at 12 ms and the title screen,
which is the base composition, is untouched.

**An envelope is not a note, so it is not a `voices` entry.** The first answer was
`chords: MUSIC.chords.map(…)` — the base's own notes with one field changed — and `revoicedBy` reads
the KEYS of `voices`, so the place claimed a tune it had not written and
[0148](0148-a-place-has-its-own-notes.md) held its G♯ to a scale nobody chose. Everything else that
asks *what does this place play* would have been told the same untruth without going red at all.

**A layer a place pins to the downbeat does not spend a bar of the build** — `ThemeRow.onBeat`. It
was ranked with the staggered arrivals and then had its time overwritten, which left its bar occupied
and empty: The Black Heart's `approach` was four layers landing together, two silent bars, and the
lament arriving at 4.80 s in a section 8.75 s long.

**A place's own lead is answered before the shared table gets to say `null`.** A place's ladder is the
authority on what it opens — [0162](0162-a-place-has-its-own-ladder.md) — and
[0120](0120-a-rung-may-close-a-layer.md) closes `call` at `surge` for every place with no opinion.
The Black Heart reprises the piano lament at `approach`, and `roleOf` answered `null` for it: a place
following a layer the mix has no target for, with [0164](0164-no-layer-is-inaudible.md) unable to ask
whether the thing the listener is meant to TRACK can be heard at all.

**A place BAKES every layer it changes, and an onset is a change** — the third way into `bakedBy`
after a re-voicing and a room, on [0136](0136-the-place-has-a-room-and-an-arc.md)'s own terms.

## ⚠️ Removing an artefact moves every ratio that was measured over it

The six-millisecond release is a correction to a defect and it reddened two guards that measure a
SHARE, because the clicks it removes were in every denominator.

The Rime Vault's `chords` went from 32.7% to 42.6% of its energy below 130 Hz against a 40% ceiling,
**with byte-identical voices**. Forcing `release` back to one sample reads 32.5% — the shipped figure
to a tenth — and the bands say why: energy below 130 Hz **unchanged** at +1.6% while `lowmid` fell
16%, `mid` 43%, `himid` 59%, `hi` 61% and `air` **70%**. A filtered pad has almost no top of its own,
so nearly all of what it had up there was the click at the end of each note.

**Nothing that reaches the player got louder, lower or further off centre.** The ceiling is 0.45 and
the original catch still fires: the 49% bell it was written for was measured with its own clicks in
the total, so released it reads higher still.

## ⚠️ And a report about hiss moved the kick by five decibels in a place nobody was mixing

Every Saurian Belt `sub` entry came off [0164](0164-no-layer-is-inaudible.md)'s known-adrift list.
All five measured 5.1–6.6 dB under a `pulse` and now measure −0.14 to −2.33. **The lift the player
refused** — *"lifting `sub` about 4 dB so the kick reads under the bassline"*, offered and declined in
[0191](0191-a-place-sits-somewhere.md) — arrived without being applied, and the refusal stands.

The cause was narrowed by elimination and two of three candidates were wrong: forcing the release
back to one sample moves it **0.00 dB**, and putting the kit back to `beat: 1.62, ride: 0.42` makes it
**worse** by 0.9 dB. What is left is the base composition's own voices, darkened for the same report.

## ⚠️ The same relationship was bought twice, and the bus paid for it

*"The cymbal crash needs to be removed"* was answered by closing `ride` and `crash` at every rung of
Saurian Belt **and** by lifting `beat` 1.62 → 2.6 so the kit leads **and** by halving `arp`, `hook`
and `ownA`. Any one of those puts the kit in front; together they put 3.8 dB of peak into the hottest
bus in the game, and the comment beside `trim` went on claiming a measurement taken before the tom
fills were written.

| rung | peak | dirty (ceiling −16) | clamped (budget 0.05%) |
|---|---|---|---|
| `run` | 1.027 | −15.87 dB | 0.0011% |
| `push` | 1.099 | −15.59 dB | 0.0297% |
| `surge` | **1.384** | **−15.22 dB** | **0.0712%** |
| `approach` | 1.034 | −16.50 dB | 0.0048% |

`THEMES.saurian.trim` is **0.549**, which puts `surge` back to 0.9737 — the peak this place ships on
`main`. Every ratio the listens tuned is untouched and the place is 3.1 dB quieter than the renders
the ear approved, **which is the one thing in this record that has not been heard.**

## What this record does not decide

**Whether The Black Heart follows the right layers.** Giving its leads their roles made them
measurable for the first time, and the first measurement says `call` at `approach` is 6.6 dB under
what a `part` needs and `counter` at `surge` is 6.4 under. A lament that has to be lifted 6 dB to be
the part is more likely a place whose `LEADS` name the wrong layer than a place that needs a fader.
`LEADS` is untouched; the three lines sit on the known-adrift list marked as a question.

**Whether a level may climb.** [0329](0329-a-level-may-fall.md) lets a place author how far *below*
its opening a rung sits and refuses a rise, and The Black Heart is a lament that builds to an
orchestral fight. Its contour is named as the one exception, pending that decision — and three to four
LU of what looked like a composition turned out to be an unsolved hold, which is the actual defect
0226 is named for.
