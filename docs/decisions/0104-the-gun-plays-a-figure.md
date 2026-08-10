# 0104 — The gun plays a figure, the explosions are on the grid, and the bus is mastered

**Accepted 2026-08-10.** The audio items of
[the-seventh-play-test](../../reports/the-seventh-play-test-2026-08-10.md).

**The third feedback round in a row whose headline is the sound, and the first that came with a
question about whether to keep going.** Four separate mechanisms, one report, and the thing they have
in common is that every previous audio pass tuned a NUMBER while the mechanism underneath it was
missing.

## The rules

**An auto-weapon's cue must finish before its own next volley, at every rung of its ladder.** That is
[0035](0035-damage-is-legible-on-the-body-that-took-it.md)'s rule for the eye, written for the ear for
the first time.

**A cue may carry a `figure` — velocities indexed by where in the BEAT it lands, never by how many
soundings have gone before.**

**A cue may wait for the next sixteenth, and never waits more than one.**

**The music bus is mastered, and the mastering is a stateless curve so the guard can model it.**

**A level never opens thinner than the title screen.**

## What was asked for

> *"The title and boss screen music needs to be the minimum base level we build upon for the music.
> The current level music is way too calm and repetitive."*

> *"The game sound effects also don't blend in with the music at all, they need to pulse and beat with
> the music and currently they're timingly in sync, but the sound doesn't mess [mesh] at all."*

> *"Enemy explosions should pulse with the beat, the gun fire should be in sync with the tone, both
> player and enemy."*

> *"Volume levels are still way off as well, background too quiet etc."*

> *"The gun fire at the moment as well doesn't fit in with the music at all, it's technically on beat,
> but it also doesn't fit a great sound experience."*

## The question underneath it, answered before anything was built

> *"If we can't actually do a really good rhythm game with the sound we're using let me know and I can
> drop this line of gameplay."*

⚠️ **The sound engine is not the constraint.** The parts that are normally hard are already built: a
sample-locked loop set that cannot drift ([0090](0090-the-music-is-four-loops.md)), the sim clock
phase-locked to the audio clock ([0094](0094-in-time-is-not-in-phase.md)), every cadence on a
sixteenth ([0093](0093-the-gun-is-on-the-grid.md), [0096](0096-the-enemies-play-along.md)), one
synthesiser shared between the music and the effects, and a key
([0099](0099-the-cues-are-in-the-key.md)).

⚠️ **What does not exist is a rhythmic PLAYER INPUT, and that is a design fact rather than an audio
one.** `src/content/actions.ts` bans a fire action. The only thing the player does is steer, and
steering has no beat — so everything on the grid is the machine keeping time. The game can sound
rhythmic; the player cannot be rhythmic.

⚠️ **THE PLAYER CLOSED THE QUESTION AND IT SHOULD NOT BE RE-OPENED:** *"rhythm game is definitely not
what I want for this game, but I want the sound to be rhythmic and immersive and it's currently not
close to that experience."* No rhythmic input is to be built.

## First: the rig, because four mix passes were tuned without one

⚠️ **`scripts/hear.mjs` could write the cues, and it could write the music, and it could not write
them TOGETHER.** The report is about the two channels against each other — *"they don't blend"* — so
until this change the exact thing being complained about had never been listenable outside the game.
[0027](0027-measure-the-picture-not-the-model.md) owes the instrument before the tuning pass, and
three passes at the mix had been made without it.

⚠️ **`--play` renders the bed at `MUSIC_GAIN × MASTER_GAIN` with the gun, the missiles and the
explosions over it at `MASTER_GAIN`**, at their own cadences, with the explosions on the arbitrary
steps the game actually fires them on. Both gains are imported. It prints the ratio.

⚠️ **AND THE RIG LIED FOR ONE COMMIT, WHICH IS WORTH RECORDING.** The first version summed the music
bus without the new shaper, so the instrument built to measure the mix reported a mix nobody hears —
and under-reported the change it had just been used to choose by about four and a half decibels. One
helper now, used by every mode.

## The gun never stopped sounding

⚠️ **THE MEASUREMENT, and it is the whole of *"doesn't fit a great sound experience"*.** The pulse cue
was **0.110s** long:

| tier | gap between volleys | the gun is sounding |
|---|---|---|
| 0–1 | 0.133s | 83% |
| 2–3 | 0.100s | **110%** |
| 4 | 0.067s | **165%** |

**From the second weapon pickup the gun never stops.** It is a continuous tone with bumps in it, at an
RMS of 0.110 against a whole music bed of 0.132 — so it was also half the mix by energy. There is no
gap for a beat to live in, and no amount of putting it *on* the beat could have made one.

⚠️ **`hold` NEVER PREVENTED THIS AND WAS NEVER MEANT TO.** It is 2 steps against a cue 6.6 steps long.
Every one of the twelve rows is longer than its hold, correctly — the field exists to stop a **flam**,
and two kills close together should both sound. It is fatal only for the two auto weapons, because the
player cannot choose not to fire them.

⚠️ **The missile was EXACTLY ONE BEAT — 0.400s against a fastest cadence of 0.333s.** The counter-beat
[0093](0093-the-gun-is-on-the-grid.md) is named for overlapped itself precisely where it is meant to
be most legible.

### So both are shortened, and the rule is 0035's

[0035](0035-damage-is-legible-on-the-body-that-took-it.md) requires the impact FLASH to finish before
the next hit lands, or two hits draw one picture; `IMPACT_FLASH_STEPS` has been held against the fire
rate ever since. **The identical claim about the sound was never made, and was false the whole time.**
`tests/sound.test.ts` now drives it off the ship's own ladder rather than a number.

⚠️ **What it costs is the tail 0102 added, and the sub is KEPT.** *"Too tinny"* was answered with
weight below 55 Hz and that is still there; what goes is its length. 65ms is three and a half cycles
at the root — felt, and short enough that the next one is a second event rather than the same one
continuing.

### And it plays a figure, which is 0102's own finding arriving at the cues

⚠️ **[0102](0102-the-music-goes-somewhere.md) found every drum in the music was bit-identical to every
other** and named it: *"identical repetition at a fixed interval is not LIKE a metronome, it is the
definition of one."* It gave the drums velocities. **It did not give them to the cues**, and the pulse
is the most repeated sound in the game by a wide margin.

⚠️ **INDEXED BY POSITION IN THE BEAT, NOT BY A COUNTER.** A counter drifts the moment a cadence changes
(four times up the ladder) or a volley is refused by the pool — and then every later accent is off the
bar for the rest of the run. That is 0094's *in time is not in phase* one layer up. A shot is accented
**because it is on the downbeat**, which is what a player does and what a counter cannot express.

⚠️ **A velocity and not a pitch, which is a deliberate limit.** Transposing would need each layer's
scale DEGREE and the rows store resolved Hz, so a shift would walk the endpoints off the scale and
break [0099](0099-the-cues-are-in-the-key.md)'s guard rather than serve it.

⚠️ **Every weight draws the SAME noise**, because `Rng.stream` is a pure function of two strings that
consumes nothing. Four different draws would be four different sounds instead of one played four ways
— a gun that changes timbre as it fires. `tests/sound.test.ts` asserts it as an exact ratio.

## The explosions were the one loud thing in the game not on the grid

⚠️ **Three decisions put every cadence on a sixteenth and none of them reached here.** 0093 gridded the
gun, 0096 the enemies, 0094 the loops — and all three grid **when a body decides to fire**. A kill
happens when a bullet ARRIVES, which is a function of how far away the thing was, so the loudest
repeated event in a level landed on an arbitrary sixtieth of a second.

⚠️ **[0099](0099-the-cues-are-in-the-key.md) ASSUMED THE OPPOSITE IN AS MANY WORDS** — *"arriving on
the beat over a drone sounding A"* — and tuned the harmony of cues whose timing had never been gridded
at all. That is why *"close to on beat but they don't mesh"* came back as *"they don't mesh"*.

⚠️ **Six rows opt in: `kill`, `bossDown`, `blast`, `death`, `pickup`, `shield`.** The wait is bounded
by one sixteenth — 100 ms — and asserted, so [0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)
still holds: the picture is on its own step and the sound is inside the same tenth of a second.

⚠️ **`hit` IS DELIBERATELY OFF IT, AND SO IS `bomb`.** A hit's hold is 2 steps against a grid of 6, so
gridding it would collapse three hits into one — 0035's guard broken by the fix for a different
report. A bomb answers a **button**, and delaying that is delaying feedback on a press. A probe holds
both.

## The bus was gain-staged four times and never mastered

⚠️ **`MUSIC_GAIN` has been moved three times for this report and could not have fixed it.**
`tests/music.test.ts` caps it at **0.597** by measurement, so the whole remaining travel was 1.2 dB
against a deficit the rig measures at 3–5.

⚠️ **THE BUS HAD NO COMPRESSOR, LIMITER OR SOFT CLIP ANYWHERE**, while every cue has had `glue` since
[0089](0089-a-cue-has-a-body.md). It was peak-limited by a **12–14 dB crest factor it never used**:

| rung | peak | RMS | crest |
|---|---|---|---|
| `run` | 0.539 | 0.132 | 12.2 dB |
| `boss` | 0.819 | 0.193 | 12.6 dB |

⚠️ **A `WaveShaperNode` running the same `saturate` the cues use, and the reason it is not a
`DynamicsCompressorNode` is the GUARD.** A compressor has an attack and a release, so its output is a
function of the signal's history and `tests/music.test.ts` could not model it — the assertion holding
the mix would have to be weakened to admit the thing that fixes the mix. A shaper is stateless, so the
guard applies identical arithmetic and stays a real check.

⚠️ **0.15, swept rather than guessed**: +5.5 dB of RMS for 2.0 dB of crest, where 0.30 buys 8.1 dB for
3.4 and leaves an ordinary level rung peaking at 0.913 — a bus with no dynamics left, and *loud* stops
meaning anything when the boss arrives.

⚠️ **AND IT DOES NOT EAT THE AURA, WHICH WAS THE RISK.** A static shaper compresses a quiet layer
against a loud one, and the aura is a quiet layer at the loudest rung — which is
[0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md)'s own defect, *"I didn't even notice it over
the fire"*. Measured as the RMS of (bus with aura − bus without) at four nearnesses: the aura gains
**5.1–5.3 dB** where the bus gains 5.5, its share goes 66% → 67%, and the spread across nearness is
**8.1× against 8.3× dry**. Discharged.

### And the music now ducks

⚠️ **Two buses summed into one destination and neither ever acknowledged the other**, which is most of
what *"they don't blend"* describes. A `kill` peaks 8.7 dB over the bed and a `bossDown` 11.4, with
nothing moving underneath them.

⚠️ **Web Audio has no sidechain**; what it has is scheduled `AudioParam` automation, which is the same
gesture with the trigger in code. Down in 25 ms, held a sixteenth, back over 320 — **the asymmetry is
the effect**, because a symmetric duck is heard as the music pumping.

⚠️ **Only the four loudest rows carry it, and the gun deliberately does not.** Auto-fire cannot be
switched off, so a pulse that ducked would hold the bed down for the whole game — *"background too
quiet"* returning as a consequence of the fix for *"they don't mesh"*. A probe holds it.

⚠️ **It fires when a cue SOUNDS, never when one is asked for.** A cue the hold or the cap refused is
one nobody hears, and ducking for it is the track getting out of the way of nothing.

## The level opened thinner than the title

⚠️ **`groove` and `arp` now open at `run`.** 0102 built `groove` precisely because *"a piece with no
bass line is what no depth is a description of"* — and then opened it at `push`, 4,200 units from the
boss. **About a minute of every level still had nothing under the kick but the chords' own sub**,
which is the state 0102 was answering.

### Which cost the ladder its rungs, and a guard said so

⚠️ **Moving two layers down left `push` and `surge` opening nothing new**, and
`tests/music.test.ts` went red on both *the ladder is additive* and *each rung strikes more notes a
bar*. **The honest answer to a ladder with too few rungs is more music, not a shorter ladder** — and
more music is what the report asks for in the same breath.

⚠️ **`hook` is a new layer: a syncopated stab, four bars over the eight-bar progression.** It is the
one register the piece had empty — `groove` is the bass, `arp` is texture two octaves up, `lead` only
a boss ever hears — and it lands on the *and* of two and three, filling the part of the bar the others
leave alone.

| rung | opens |
|---|---|
| `run` | engine, chords, **groove** |
| `push` | **arp** |
| `surge` | **hook** |
| `approach` | drive |
| `boss` | lead, aura |

## What it measures, before and after

Both from `scripts/hear.mjs --play`, which is the only place either number exists:

| take | before | after |
|---|---|---|
| a level opening | −2.0 dB | **+4.6 dB** |
| mid level, two of each | −4.1 dB | **+2.8 dB** |
| the surge, maxed | −5.0 dB | **+1.6 dB** |
| the boss, maxed | −2.3 dB | **+4.0 dB** |

**The bed went from 2–5 dB under the effects to 1.6–4.6 dB over them**, a swing of 6.3–6.9 dB, and
nothing clips at any rung.

## What the proof found, which is the part worth reading

⚠️ **`npm run prove` reported STILL GREEN on the decision's own headline mechanism.** Removing the
mastering entirely left every music guard green — because **every one of them was a CEILING**. Nothing
in the repository asserted a lower bound on loudness at all, so the fix for *"background too quiet"*
had nothing standing over it.

⚠️ **The guard that now does is a RATIO, and the first draft of it was still too weak.** *Louder than
the gun* passed at drive 0. Driven out: the shipped build sits at **+2.0 dB** over a gun at its fastest
rung and this one at **+7.5 dB**, so the bound is **6 dB** — the bed at twice the gun's amplitude,
which refuses the state that was reported and is a statable rule rather than a number chosen to fit.

⚠️ **And a second guard had gone stale in the same direction.** *There is something in the low end that
moves* skipped `run`, correctly, while a level's opening rung genuinely had no bass line — so it stood
over the one rung this decision is about. A probe closing `groove` at `run` reported STILL GREEN.

## Rollback

⚠️ **No irreversible surface** — [0001](0001-revertability-not-risk-rating.md). No storage key, no save
field, no cache prefix, no origin. Every change is a constant, a table entry, a synthesis path or a
guard; reverting restores the previous sound exactly, and a save written under it loads unchanged
because nothing here is serialised.

⚠️ **The one runtime addition is two Web Audio nodes** — a `WaveShaperNode` on the music bus and
`AudioParam` automation on a gain that already existed. Both are created with the context and neither
allocates per frame; `tests/budget.test.ts`'s cold list is unchanged.

## What this does not settle

⚠️ **None of it has been heard by the player.** Every number above is measured and the whole point of
0027 is that measured is not the same as heard.

⚠️ **The cues are still fixed in A minor over a progression that moves** — Am–F–C–G / Am–F–G–E. A kill
hanging on the seventh is a wrong note over the last chord, once every 12.8 seconds. Baking a variant
per chord is the next lever and it is deliberately not pulled here: this decision already changes four
mechanisms, and a fifth would make the play-test unable to say which one worked.

⚠️ **The `figure` mechanism has exactly one user.** Only the pulse carries one, which makes it — on
[0084](0084-the-dial-is-the-level-and-the-guns.md)'s own honesty about the dial — one refactor from
being a special case in the speaker. The missile deliberately declines it, and whether the enemy
`threat` wants one is a question for the next play-test.
