# 0108 — The bed is felt, the hands are on it, and the boss arrives

**Accepted 2026-08-10.** Items 1, 2, 3, 4 and 5 of
[the-ninth-play-test](../../reports/the-ninth-play-test-2026-08-10.md).

**And it is the first decision in this project taken with the style brief removed.** The player lifted
it mid-session, in writing, and that is a rule change rather than a note —
see *The brief was lifted* below.

## The rules

**A pitched note has a weight.** `steps` carries a semitone for a pitched voice, so
[0102](0102-the-music-goes-somewhere.md)'s velocity reached exactly half the music; `accents` is the
other half, indexed by position in the pattern rather than by a counter over struck notes.

**A guard about a layer is written over the property, never over the layer's name.** 0102's accent
assertion named `beat`, `beat` is `TITLE_ONLY`, and the layer that plays under every second of every
level was a row of literal `1`s for two decisions with the guard green.

**The mix's ceiling is `MUSIC_GAIN × the summed peak` and nothing else.** `saturate(x, a) ≤ 1` exactly
when `x ≤ 1` for every positive `a` — so the drive cannot make the bus clip, and a headroom problem
is fixed at the peak's own instant or in that one constant.

## What was asked for

> *"how deep can we push the bass? I want to feel the bass beats in my chest"*

> *"Can we get some percussion up in here to counterpoint it as well?"*

> *"and how much can we mix it up for the bosses? the level music is getting passable, but the boss
> music isn't increasing proportionally."*

> *"from playtesting, the pace of the music sounded good around level 4, that should be our starting
> point for the music."*

> *"the metronome beats are still louder and because they're two beats back and forth, every mix
> sounds the same."*

## The brief was lifted, and that is why the riff is a riff

> *"if the power ballad and rez ask is too limiting, let's change that and either remove those limits
> or expand them into scandinavian symphonic metallic rock with a deep bass beat. But don't be limited
> by personal 'style' requests and try to fit the music into that, go off playtest reports and actual
> music that sounds good. What I ask for may not be 'what's right' so if I put too many strictures on
> things, we can go around them or ignore them if needed."*

⚠️ **THE BRIEF WAS LOAD-BEARING IN THE SOURCE AND IS NOW ADVISORY.** *"A mix of a power ballad style
music and the game Rez"* is quoted in `src/content/music.ts` four times as the reason a layer is what
it is — the drone is *backgroundy*, `chords` is *the power-ballad half*, `engine` is *the Rez half*,
and [0104](0104-the-gun-plays-a-figure.md)'s `hook` is a clean stab because a ballad's middle register
is a pad. Those arguments were correct against the brief and the brief no longer binds.

⚠️ **WHAT IT CHANGED HERE IS ONE THING, DELIBERATELY.** `hook` is a palm-muted power chord on a gallop
instead of a stab — root and fifth, no third, hard-driven. It is the same rung, the same length and
the same job (*a shape a listener can follow*), done by the genre that is actually built for 150 BPM.
Everything else in this decision was already owed by the play-test and would have been built the same
way under the old brief.

⚠️ **The offer of *scandinavian symphonic metallic rock* is taken as permission and not as a
specification**, which is what the second half of the quote asks for. The `toll` layer's choir is the
symphonic end of it; the gallop and the `stomp` are the metal end; nothing has been renamed to claim a
genre it has not earned in the room.

## The metronome, third report, and 0102 fixed it in the wrong layer

⚠️ **THE FINDING IS THE SHAPE OF THE MISS RATHER THAN THE NOTE VALUES.** 0102 found that *"identical
repetition at a fixed interval is not LIKE a metronome, it is the definition of one"*, gave `beat`
velocities, and wrote `tests/music.test.ts`'s accent guard **over `MUSIC.beat` by name, because that
is what the report named**. `beat` is `TITLE_ONLY` — it plays on the title, the level break and the
run-over screen and nowhere else.

⚠️ **`engine` was `[1, 1, 1, 1, 1, 1, 1, 1]` the entire time**, with a clap on two and four at the same
weight, in a two-bar loop, as the loudest layer of every level. *Two beats back and forth* is a
correct transcription of it. Two decisions and three play reports passed over a guard that was aimed
at the wrong file section.

⚠️ **AND THE PITCHED HALF HAD NO WEIGHT AXIS AT ALL.** 0102's mechanism is *read an unpitched `steps`
entry as a gain*; a pitched entry is a semitone, so the arp's 128 square notes, the groove's bass line,
the chords' rolling sub and the lead were each one event repeated at a fixed interval, unreachable by
the fix. `accents` is that axis, and `renderNote` is one multiply.

The guards now read every unpitched voice of every layer a level opens, per voice, and the aura is
exempt **for a stated reason**: its gain is a runtime function of the boss's distance
([0091](0091-the-boss-has-an-aura.md)) and the level's progress ([0107](0107-a-level-is-a-place.md)),
so a pattern written at one weight is not at one weight in the room.

## The bass, and the guard that measured the wrong thing first

⚠️ **EVERY SUB IN THE PIECE WAS A TAIL.** The kick falls to 38 Hz over 0.42 s, the chords' sine sub is
0.62 of a beat, the groove's is 0.34 — and nothing sustained anything under 80 Hz. `sub` is a new
layer at `octave: 0`, which is 41 Hz (E) to 65 Hz (C) across the progression: a held fundamental under
each bar, a swept **drop** on the bar line, and the chord's root on beats two, three and four.

⚠️ **AN OCTAVE LOWER IS HEADROOM SPENT ON SILENCE.** 20–33 Hz is not reproduced by a desktop speaker
and is A-weighted to nothing, so the band a chest actually resolves is the one this sits in.

⚠️ **THE FIRST GUARD WRITTEN FOR THIS WAS WRONG AND `npm run prove` IS WHAT SAID SO.** It asserted the
low end is SUSTAINED — the quietest eighth of a bar against the loudest — on the reasoning that a chest
resolves pressure over time. The reasoning holds and **the measurement could not see the layer**: the
trough is 0.527 with the whole `sub` layer and **0.511 without it**, because an eighth is 0.2 s and the
kick's tail is 0.42, so every window contains a kick. The probe reported WRONG TEST.

⚠️ **What separates is the SHARE, and it separates by five times.** A-weighted, the `sub` band against
the `hi` band:

| | `run` | `push` | `surge` | `approach` | `boss` |
|---|---|---|---|---|---|
| shipped, without the layer | 0.081 | 0.088 | 0.082 | 0.078 | 0.064 |
| **with it** | **0.448** | **0.460** | **0.405** | **0.378** | **0.343** |

The title, which nobody has ever said they could feel, is **0.034**. The guard's floor is a fifth.

## Level four's pace is the floor, and it could not be written in the theme table

⚠️ **`tests/themes.test.ts` REQUIRES `approach` — level one's theme — TO BE EXACTLY NEUTRAL**, so that
the other six are read against something. *"Start at level four"* is therefore a statement about what a
multiplier of 1 should sound like, and that is `MUSIC_LADDER`. `rime`'s character is folded in — the
drone down from 0.5 to 0.34, `engine` and `arp` up — and every theme is re-centred around the new
middle. `rime` keeps its own identity by taking the same brightness further and pulling the low end out
from under it.

⚠️ **WHAT MAY NOT BE SPENT IS A RUNG'S ARRIVAL.** The obvious way to raise the floor is to open `arp`
at `run`, and it sells back one of the four climbs 0102 bought. What opens the level instead is **new
material** — `sub` and `perc` — and `arp` still arrives at `push`.

| rung | opens |
|---|---|
| `run` | **sub, perc**, engine, chords, groove |
| `push` | arp |
| `surge` | hook |
| `approach` | **toll** |
| `boss` | lead, **stomp**, the aura's ceiling |

## The percussion is percussion, which is not more drums

⚠️ **`beat`, `engine`, `drive` and `stomp` all divide the bar the same way.** However many of them play
at once there is one grid underneath, so *"counterpoint"* cannot be answered by another kit. `perc`'s
shaker is `perBeat: 3` — eighth-note triplets, three against the hats' four — and its wood is a 3-3-2
tresillo that lands on the beat once a bar.

⚠️ **IT DOES NOT TOUCH THE SIM'S GRID AND COULD NOT.** [0093](0093-the-gun-is-on-the-grid.md) fixes a
beat at 24 sim steps and [0096](0096-the-enemies-play-along.md) snaps every cadence to a sixteenth of
it. A triplet inside a baked loop is a subdivision of the same beat and nothing in the game fires on
one.

## The boss arrives, and 0107 is why it stopped

⚠️ **THE COMPLAINT IS A RATIO AND 0107 MOVED ITS DENOMINATOR.** That decision gave the level four rungs
to climb and a level-long aura build; the fight's rung gained `lead` and about five per cent on eight
gains. **A boss that adds one layer to a level that has just added four is relatively quieter than it
was before the level got better.**

⚠️ **`toll` is at `approach` and not at `boss`, which is the half that makes the arrival one.** An
arrival is a function of what came before it; a bell over the last twelve seconds is what turns the
next rung into a release rather than a step.

⚠️ **And a theme can now say something about a boss with no second table.** `toll`, `lead`, `stomp` and
the aura are zero everywhere except the fight, so a multiplier stated against any of them is a
statement about the boss and about nothing else. Every theme states at least one.

## The mastering, re-swept, and the algebra that was not written down

⚠️ **`saturate(x, a) ≤ 1` EXACTLY WHEN `x ≤ 1`**, for every positive `a`. So `MUSIC_DRIVE` has **no
effect at all** on whether the bus clips — the whole clipping question is `MUSIC_GAIN` times the summed
peak. 0104 chose 0.15 by a sweep and did not state this; it is why the drive could go up while the gain
came down.

⚠️ **THE HEADROOM WAS BOUGHT AT THE PEAK'S OWN INSTANT BEFORE ANY CONSTANT MOVED.** Measured
sample-by-sample rather than in aggregate, the boss mix's peak was two contributions: `toll`'s low sine
at −0.47 and `sub`'s at −0.82, both tails wrapping onto the bar line where the drop already lives. The
bell's octave-under became a choir two octaves up and the floor's tail was shortened: **the summed peak
fell from 2.22 to 1.88 with nothing an ear can name removed.**

| drive, at `MUSIC_GAIN` 0.46 | `run` peak | `run` RMS | `boss` RMS | boss over run |
|---|---|---|---|---|
| 0.15 | 0.851 | 0.285 | 0.365 | +2.1 dB |
| **0.22** | **0.900** | **0.328** | **0.414** | **+2.0 dB** |
| 0.30 | 0.939 | 0.376 | 0.458 | +1.7 dB |

**The column that decided it is the last one.** 0.30 buys 1.2 dB of loudness and spends a fifth of the
climb, which is the report this decision is about. At 0.22 a level is **2.4 dB louder than the mix the
ninth play-test called a great baseline** and the fight is still a step over it.

## What it costs

| | before | after |
|---|---|---|
| loops | 12 | 16 |
| bake, whole set | 862 ms | **1,254 ms** |
| RAM | 11.3 MB | **17.5 MB** |

⚠️ **Both are spent on the title screen and neither is spent in a frame.**
[0102](0102-the-music-goes-somewhere.md)'s prewarm walks one NOTE at a time, and the longest note here
is a 1.84 s sine — cheaper than the drone's filtered pad, which is already the worst case. 0107 refused
72 MB for seven transposed pieces; this is a quarter of that for four new ones.

## What the proof found

⚠️ **Seven probes, seven guards, and one of them reported WRONG TEST** — the sustain measurement above,
which is written up rather than quietly replaced because the appealing wrong quantity is the part worth
passing on. [0027](0027-measure-the-picture-not-the-model.md) caught before shipping rather than after
seven reports.

⚠️ **The bus-driven-flat probe is one 0104 wrote and pointed at the clipping assertion**, which cannot
see it: `saturate` never returns past 1 whatever it is handed. The guard that probe wanted — every rung
measurably louder than the one below, after the shaper — exists now.

## Rollback

**None owed.** No storage key, no save field, no service-worker cache prefix and no origin. Everything
here is a table and a synthesiser: reverting the commit restores the previous bake exactly, because the
loops are generated from these tables at load and nothing about them is persisted.

## What this does not settle

⚠️ **The tempo still cannot move**, and [0102](0102-the-music-goes-somewhere.md)'s note stands: 0093
fixes a beat at 24 sim steps and the gun, the enemies and the phase-lock all ride it. What rises is the
rate of events. If *faster* is reported again against this build, the next conversation is whether the
grid is worth what it costs — and it is now a more expensive question, because `perc`'s triplets and the
gallop are both built on that beat.

⚠️ **Nothing here touches the CUES**, and the ninth play-test's sixth item is about them: *"the enemy
deaths… are on their own sound band."* That is its own change.

⚠️ **Every gain in `src/content/music.ts` is still a hand's number** on
[0037](0037-the-ship-has-mass.md)'s terms. What is measured is the peak, the crest, the climb, the
bands and the accents; what nobody has done is listen to the seven themes against each other.
`node scripts/hear.mjs --music` is the instrument and a hand is the verdict.
