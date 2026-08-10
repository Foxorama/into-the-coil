# 0102 — The music goes somewhere, and the guns have a bottom

**Accepted 2026-08-10.** Item 2 of
[the-fifth-play-test](../../reports/the-fifth-play-test-2026-08-10.md) and items 3 and 4 of
[the-sixth-play-test](../../reports/the-sixth-play-test-2026-08-10.md).

**One decision because the bake is one budget.** [0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md)
established that a cue's gain and the music's cannot be tuned apart, and *"don't mesh with the
background music"* is a relationship rather than a property.

## The rules

**An unpitched step is a VELOCITY.** There was no accent anywhere in the model.

**A level's music climbs four times, and the climb is measured in notes a bar.** The tempo does not
change and cannot.

**The synthesis happens on the title screen, a note at a time.** The bake stops being a budget.

## What was asked for

> *"Title screen music isn't quite right. The metronome doesn't fit the other beat. It doesn't blend
> nicely, it sounds like two separate tracks being played at the same time."*

> *"The ingame background music doesn't change and increase in tempo as you progress through the
> level. It's also an incredibly limited couple of repeating beats that's a few seconds of sound
> repeated for minutes."*

> *"The background music is still flat and lifeless, has no depth, no pace, no increased tempo."*

> *"Guns and rockets for the player need a deeper bassy tone still as they're too tinny."*

## THE TITLE: the metronome is the absence of accent

⚠️ **`MusicVoice.steps` said *play* or *rest* for a drum, so every kick, click, snare and hat in the
game was bit-identical to every other.** Identical repetition at a fixed interval is not *like* a
metronome — it is the definition of one. No arrangement of gains or filters could have answered the
report, which is why three passes over the mix never touched it.

⚠️ **AND `src/content/music.ts` CLAIMED OTHERWISE.** Its hats were documented as *"alternating loud
and quiet, which is what makes them a shuffle rather than a machine"* and the pattern was
`Array.from({ length: 32 }, () => 1)`. **The prose described something the data structure could not
express**, and every value in every drum table was 1, so nothing could ever disagree with it.

⚠️ **One multiply, and the field already carried the number.** Reading an unpitched step as a gain is
backwards-compatible to the sample: every existing pattern is all ones and renders identically.

⚠️ **What the title plays now**: a syncopated kick on eighths that leaves two and four to the snare, a
click that follows it, a ghost stroke before the last backbeat, hats on a four-step accent cycle — and
**the 220 Hz `tri` beep on two and four is gone**, which was the most tick-like thing in the piece and
was doubling a snare that already had the backbeat.

## THE LEVEL: one rung across nine tenths of it

⚠️ **`musicLevelFor` returned `run` from the moment a level began until 430 units before its boss** —
about **160 seconds of a 176-second level** — and `run` opened three layers over a four-bar loop.
There was nothing to progress through, and every guard was green because they were all about the
ladder's shape and none about how much of a level a rung covers.

| rung | opens | the player hears |
|---|---|---|
| `run` | engine, chords | drums and harmony |
| `push` | **groove** | **a bass line** |
| `surge` | **arp** | sixteenths — the pulse doubles |
| `approach` | drive | the boss is coming |
| `boss` | lead, aura | the tune arrives |

⚠️ **THE LEVEL'S PIECE HAD NO BASS LINE AT ALL, and that is most of *"no depth"*.** `bass` is
`TITLE_ONLY` and [0095](0095-the-level-has-its-own-music.md) was right to close it — an A-rooted riff
is a wrong note over three chords in four — but **nothing replaced it**. From the moment a level began
the only thing under the kick was the chords' own rolling sub.

⚠️ **`groove` is four bars against the chords' eight**, which is what 0095's whole-multiple rule buys:
the bass says the same two bars over each half of the progression, so the harmony turns underneath a
line that does not.

## THE TEMPO DOES NOT CHANGE AND CANNOT, AND THIS SAYS SO

⚠️ **[0093](0093-the-gun-is-on-the-grid.md) fixes a beat at 24 sim steps.** The player's gun, every
enemy's cadence ([0096](0096-the-enemies-play-along.md)) and the phase-lock between the sim and the
audio clock ([0094](0094-in-time-is-not-in-phase.md)) all ride that number. **A BPM ramp takes the
whole game off the grid three decisions exist to put it on.**

⚠️ **What rises is the rate of EVENTS, which is the mechanism
[0091](0091-the-boss-has-an-aura.md) already calls *builds in tempo*** — the aura doubles its pulse
and doubles it again without a tempo existing anywhere as a number. It is written down here so that
nobody reads *increased tempo* in a document and goes looking for a BPM that was never there.

⚠️ **The guard is NOTES A BAR, and a first draft used the finest subdivision available and was
measuring the wrong thing.** `engine` has sixteenth hats, so the finest subdivision is already 4 at
the opening of every level and stays 4 for ever — measured that way the boss is no busier than the
first bar, which is plainly false. The boss now strikes over 1.5× the opening's notes a bar.

## THE BAKE WAS A BUDGET, AND THE BUDGET WAS AN ARTEFACT

⚠️ **0095 capped the chords at four bars and said why in as many words**: *"eight-bar chords and lead
would be about 900ms on this machine — a freeze at tap to start."* **The length of the music was being
decided by how long it takes to synthesise**, and *"a few seconds of sound repeated for minutes"* is
the consequence.

⚠️ **Neither bake needs an `AudioContext` and both already run at a fixed rate.** `bakeCues` and
`bakeLoops` take `SAMPLE_RATE` — a constant — and return `Float32Array`s. Only `createBuffer` needs
the context, and that is microseconds. The 718ms was riding the gesture for no reason except that it
had always been written there.

⚠️ **A JOB IS ONE NOTE, AND A MEASUREMENT DECIDED THAT.** The first version chunked per LAYER and
`chords` measured **428ms** on its own — moving a 428ms freeze off the gesture and onto the title
screen is moving a hitch rather than removing one. A note is about thirty milliseconds at the worst.

| | before | now |
|---|---|---|
| music | 35.2s of audio, 555ms | **60.8s of audio, 880ms** |
| cues | 163ms | 164ms |
| when | **all of it on the first press** | **spread across the title screen** |
| worst single job | 718ms | **~30ms** |

⚠️ **The cold path is not a fallback nobody reaches** — it is what every headless test takes and what
a player who taps instantly gets. Two ways to the same samples, and `tests/sound.test.ts` holds that
they are identical to the sample, because *the same game sounds different depending on how fast you
pressed* would be invisible to everything else.

## THE GUNS: 0099 gave them the note and this gives them the body

⚠️ **The report moved subject rather than repeating.** *"Too tinny"* is 0089's own word for what it
fixed everywhere else, and the two cues 0089 spent least on are these: the pulse was three layers
where a kill has five and a death six, **with nothing below 55 Hz where the explosions reach 24**.

⚠️ **A sub an octave under, on a scale tone**, which is 0089's stated recipe for weight and 0099's
rule about which note. Measured on the A-weighted spectrum, the pulse's sub band goes from **0.008 to
0.074** of its own loudest.

⚠️ **AND THE SHED GUARD NEVER COVERED THEM.** It walks `EXPLOSIONS`, which is what 0089's report was
about; the player's own weapons have never had a spectral assertion at all, and that is the gap the
next report arrived through. The new guard also holds that the **missile stays the heavier of the
two**, because answering this report by giving the pulse more bottom than the missile would break
[0051](0051-a-missile-is-the-second-auto-weapon.md)'s claim about what the second weapon is.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0102-music-goes-somewhere.mjs`.

| broken on purpose | went red |
|---|---|
| the level ladder collapsed back to one rung, which is how it shipped | `0102 — and it climbs FOUR times inside a level` |
| the sixteenth layer closed, so the rungs add music without adding pace | `0102 — and each rung strikes MORE NOTES A BAR than the one below` |
| the level left with no moving bass line, which is how it shipped | `0102 — THE LEVEL: there is something in the low end that MOVES` |
| the velocity dropped in the bake, so every drum is struck at one weight again | `0102 — and an accent reaches the SAMPLES, not just the table` |
| the prewarm seeded from its own root | `0102 — THE ONE THAT WOULD BE INVISIBLE: prewarmed and cold bakes are the same samples` |
| the pulse's sub taken out | `0102 — and the PLAYER'S OWN WEAPONS have a bottom` |

⚠️ **Three of the six restore the code as it shipped.** The ladder, the missing bass line and the
pulse with no bottom are all states this game has been in for its whole life with every guard green.

⚠️ **The fifth is the one that would have been hardest to find.** The game would sound right, every
assertion would pass, and the noise in every drum would differ depending on whether the player pressed
before or after the title screen finished — which is
[0021](0021-one-stream-per-concern.md)'s rule doing exactly what it exists for.

## TWO OF THE GUARDS WERE WRONG AND THE HARNESS SAID SO

⚠️ **The accent guard was measuring ITSELF, and it reported STILL GREEN.** It built its buffer by
calling `sampleLayerInto` with `value === 1 ? note : { ...note, gain: gain * value }` — the line under
test, copied into the test. Deleting the multiply from `src/app/music.ts` changed nothing it could
see. It bakes through `bakeLayer` now, and separates the hats from the kick by FREQUENCY rather than
by position: the kick's tail reaches 0.135 where a hat peaks at 0.07, so a raw peak at a hat's instant
measures the kick.

⚠️ **The bass-line guard matched the thing it was written to notice the absence of, and reported
WRONG TEST.** It looked for *a pitched layer, low, that changes note* — and `chords`' rolling sub is
pitched, at octave zero, and takes four different notes across the progression. So it passed with
`groove` closed. **The sub plays one note per bar, repeated on eighths: it follows the chord.** What
separates a line from a sub is that a line moves **inside the bar**, and that is what the guard asks
now.

⚠️ **Both are the same error this session has made five times**: a guard written against the state
being defended rather than against the smallest edit that destroys it. `npm test` was green for both.

## A GUARD TIMED OUT, AND IT WAS NEITHER FLAKY NOR WRONG

⚠️ **The prewarm comparison passed alone and timed out at five seconds under the full suite.**
[0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md) says to establish which it is
rather than re-run, and it is a third thing: **a guard whose subject genuinely costs two seconds,
meeting a default sized for tests that do not.** It bakes sixty seconds of audio twice.

⚠️ **Its first version made it worse in a way worth recording**: it compared with `Array.from` and
`toEqual`, handing vitest about thirty million boxed numbers. Walking the typed arrays directly is the
same assertion at a fraction of the cost — and the remaining two seconds is the synthesis, which is
real. The timeout is stated on the test with the reason.

## What this does not settle

**Whether any of it sounds better.** Nothing in this repository can hear. `node scripts/hear.mjs
--music` writes the files and a hand gives the verdict, and this is the third decision in a row whose
whole subject is a channel the suite is deaf to.

**Whether four rungs is the right number, or whether they are in the right places.** `PUSH_UNITS` and
`SURGE_UNITS` are a hand's guess at a pace nobody has flown; what is guarded is that each rung is a
real stretch of seconds and that the climb is monotonic.

**Whether the level's piece is now too busy.** It goes from about 52 notes a bar to over 90 by the
boss. That is the thing being asked for and it is also the thing that would be complained about next.

**The drums are still not in the key**, and should not be — 0090 says *"a kick is a fall from 150 to
45 whatever the key is"*. It is the one place [0099](0099-the-cues-are-in-the-key.md)'s rule
deliberately stops, and it stops here too.

## Rollback

**None.** No storage key, no save field, no service-worker cache prefix, no origin — two new layers,
two rungs, a velocity multiply, a prewarm and three cue layers.
[0001](0001-revertability-not-risk-rating.md).
