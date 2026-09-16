# The listen — 2026-09-16

**Every report from one listen through all seven levels, what each turned out to be, what changed, and
what only an ear can now settle.** The player listened to music-only renders of every level (the files
were named by level kind, which is how the reports name them) and reported level by level. This is the
record of that pass; [0331](../docs/decisions/0331-the-heart-beats-under-it.md) is the decision. Nothing
here originates a rule.

⚠️ **ONE DEFECT WAS IN EVERY PLACE AND WAS REPORTED FOUR TIMES AS SOMETHING ELSE.** No note of the
music had ever been faded out. The release in `src/app/sound.ts` was only ever applied to the end of a
cue's buffer, on the reasoning *"a layer that ends early is already silent"* — true of cues, false of a
score whose held notes stop at 30–40% of their peak. That is the first row of every place below.

## The reports, verbatim, and what each one was

| level | reported | what it was | what changed |
|---|---|---|---|
| *every level* | *"a weird sound similar to the distortion"* (Descent, Approach, Batteries, Gauntlet) | no note was ever released; a held note stops mid-cycle | every note falls to silence over its last 6 ms — `sampleLayerInto` |
| **Black Heart** | *"at 13, 14, 15 seconds there's some heavy bass that just makes the speakers pulse without sound and it sounds like something isn't tuned correctly"* | `sub`'s held root drops to E and F at 41–44 Hz, beating against the drone's A at 55 | the held root never sits under the tonic — `HELD_ROOT` |
| **Black Heart** | *"in the first section I want the cymbal crash louder and more prominent"* | the china, inside `engine`, the only cymbal at `run` | moved to `ownC`; louder at `run`, unchanged elsewhere |
| **Black Heart** | *"the heartbeat… clearly heard, but… the background backing… fainter for the first 25 seconds, then kick in where it does, then get slightly louder throughout"* | the heart was a voice inside `stomp`, sharing the blast beat's fader | moved to `ownA` on a curve of its own |
| **Black Heart** | *"at 1.07ish there's a pretty rough transition"* | four carried layers jumped on one downbeat: kit +9.8 dB, riff +10.5, chords +6.6, sub +6.2 | none of them rises at `surge` now |
| **Black Heart** | *"kick into more of a higher pitch… flute, or mouth pipes… higher and lifting and distinctly different from the first 1min"* | — | `hook` is a pan pipe on a new sixteen-bar line, A4–C6, with room |
| **Descent** | *"a weird sound similar to the distortion… very common up to about the one minute mark… at 1.25 and onwards as well, not as frequent"* | the release, and `arp`'s octave-up saw: 3.4 impulsive events a second in `run`, none without it | the saw is a triangle |
| **Descent** | *"take the cymbal sound out of the descent because it doesn't fit"* | `crash`'s noise strike, from `surge` on | the strike is gone; the choir shout stays |
| **Descent** | *"the 3 piece high note seems slightly muted and isn't bouncing between left and right ears anymore"* | at `push` the arp carries the top band hard left and the stabs sit 8 dB under it; in the game, the pan schedule ran out fifteen minutes after the music first loaded | `hook` +2 dB at `push`; the pan horizon re-arms — `panWindowFrom`, `panNeedsRearm` |
| **Approach** | *"approach has similar issues"* | the release, and the base riff driven at 0.7: 26.8 of 34.1 impulsive events a second at `push` | the riff's drive is 0.15 and 0.12 |
| **Approach** | *"the chords are slightly muted in the approach, the third section kicking needs the chords to be a bit punchier"* | the hold takes them 2.3 dB down by `surge` while `lead` arrives over them | `chords` at `surge` 0.86 → 1.1 |
| **Batteries** | *"batteries has it right at the start as well"* | the release; the opening's remaining events are its percussion | **needs the ear** — see below |
| **Gauntlet** | *"same thing - but also has what sounds like a bit of static kicking in around 40secs"* | the release; and the reeds landing at 39.8 s carry 43% of the 3 kHz+ band, most of it from a driven square | reeds undriven and darker: top band −7.7 dB, body unchanged |
| **Shoal** | *"the prominent notes in the first section… more just like a computer beeping… needs to be more instrumental and needs I think some violin music as an interwoven melody"* | `call`: a triangle ping highpassed above its own fundamental and a pure sine, both struck in 2 ms | a plucked string on the same notes, and a violin line on the beats the tune leaves empty |
| **Coilward** | *"sounds slightly out of beat"* | nothing is off the grid (worst hit 6 ms late); the kick was 11.7 dB under its role, and the loudest low hits sat a sixteenth BEFORE beats 2, 3, 4 and 1 | the hand drum's pre-beat hits halved; weakest downbeat now 4.0 dB over any offbeat |
| **Coilward** | *"needs the drums to have the focus of the sound"* | the place played the title screen's syncopated kit over a four-on-the-floor nobody could hear | its own kit — kick on every beat, snare on 2 and 4 — leads `run`, `push`, `surge` and `approach`; `trim` 0.85 → 0.78 |
| **Coilward** | *"needs the cymbal or hissing noise removed as it doesn't quite fit"* | the cymbal is `crash` from `push` on; the hiss is `ride`, overlapping tails at every rung | both closed in the ladder |

## How the fixes were checked, on the renders rather than the model

| check | before | now |
|---|---|---|
| Descent, impulsive events per 5 s, 0:00–0:35 | 175–276 | 2–45 |
| Descent, same, 1:15–2:00 | 10–19 | 1–5 |
| Approach, same, across `push` (0:40–1:40) | 269–352 | 77–115 |
| Black Heart, 35–45 Hz band at 11–14 s | up to 13 dB over its floor | at its floor |
| Gauntlet, rise of the 3 kHz+ band at the 40 s boundary | +4.5 dB | +3.4 dB |

## What only an ear can settle now

The renders are in `C:\itc-renders\v2\`, one per level; the first set is still in `C:\itc-renders\`
for comparison.

1. **Black Heart — the pipes.** A pan pipe out of a synthesiser with no vibrato: does it read as a
   flute or pipe, and does the `surge` now lift rather than jump?
2. **Black Heart — the heart.** Faint to 0:21, arriving with `push`, then a little louder each section:
   is it the backing and not the lead? At the fight it now stands out more than the fight's own lead,
   which was already under its role before this.
3. **Black Heart — the cymbal at the opening.** Loud enough, or too loud?
4. **Descent.** Is the weird sound gone? Is the cymbal's absence right, and do the three stabs bounce?
5. **Approach.** Is the distortion gone, and has the riff lost too much bite? (Drive 0.25 is one edit
   away.) Are the chords at the third section punchy enough, or is it their attack rather than level?
6. **Batteries.** Its opening's remaining sharp events are its own percussion. If the weird sound is
   still there, it is one of those drums, and a solo render will say which.
7. **Gauntlet.** The reeds' fizz is down; if the static is still there, the next suspect is `ride` —
   noise ticks arriving at 36.6 s.
8. **Shoal.** Plucked strings instead of the music box, and a violin line under the tune: instrumental
   enough? It is a string section rather than a solo violin, for the reason in `labyrinth.ts`.
9. **Coilward.** Does it sit on the beat now, do the drums lead, and is losing the kick's
   sixteen-bar break acceptable?
