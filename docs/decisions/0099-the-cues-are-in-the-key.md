# 0099 — The cues are in the key

**Accepted 2026-08-10.** Item 3 of
[the-fifth-play-test](../../reports/the-fifth-play-test-2026-08-10.md).

**The third axis.** This project has tuned gain ([0092](0092-the-mix-is-a-hand-and-the-aura-was-a-curve.md))
and it has tuned timing ([0093](0093-the-gun-is-on-the-grid.md),
[0094](0094-in-time-is-not-in-phase.md), [0096](0096-the-enemies-play-along.md)). It had never once
tuned **harmony**, and nothing in it could have.

## The rule

**Every pitched cue layer glides between two notes of the key.** `noise` is exempt, because for noise
`from` is a sample-and-hold rate and not a pitch.

**The key lives in `src/content/cues.ts`**, and `src/content/music.ts` re-exports it.

## What was asked for

> *"The primary and second fire, enemy fire and explosion noises for bomb, enemy and player death
> don't sync into the music properly, they're all close to on beat, but the sounds just don't mesh at
> all."*

## "Close to on beat" is a PASS, and that is what makes this diagnosable

⚠️ **0093, 0094 and 0096 put every cadence in the game on a sixteenth grid and hold the loops in phase
with the sim.** The report says the timing arrived and something else did not. Three decisions of
timing work, and moving the sounds closer to the beat could not have fixed what was left.

⚠️ **The music is A minor. The cues were in no key at all.** The pulse fell to 52 Hz, a kill to 62,
the blast to 58, a death to 48 — four different notes, none of them the root and none of them in the
scale, arriving on the beat over a drone sounding A. That is a description of *"close to on beat but
they don't mesh"*.

⚠️ **Nothing was wrong, which is why it lasted.** [0072](0072-a-cue-is-baked-and-played.md) and
[0089](0089-a-cue-has-a-body.md) both treat `from` and `to` as timbre — *"a RATE rather than a pitch,
so one pair of numbers means the same thing for all four waves"* — which is exactly right about the
synthesiser and says nothing whatever about what note comes out.

## The key could not be seen from where the cues are

⚠️ **`MUSIC_ROOT` was declared in `src/content/music.ts` and read by nothing else.** The import arrow
runs `cues → music` ([0015](0015-the-layer-ladder.md)), so the file that synthesises the effects
**could not see the key even in principle**. That is not an oversight anyone made; it is a structural
fact that made the oversight inevitable.

⚠️ **So the key moves down the ladder and `music.ts` re-exports it**, which makes *the whole game is
in A minor* something the compiler carries rather than a sentence in a comment. `MUSIC_ROOT` stays one
description and every existing import still resolves.

## What the numbers are

⚠️ **Nothing is a new voicing: each endpoint is the nearest scale tone to what 0089 tuned by ear.** The
largest move is under 5%, so every filter, envelope and decay 0089 chose is intact.

⚠️ **Every interval is now a whole number of semitones, and none of them was.** A death fell 21.9
semitones and a kill 19.4 — not intervals at all, so two explosions half a second apart were two
unrelated slides. It follows from both ends being scale tones rather than being a second rule.

⚠️ **And the families are the point rather than the tuning:**

| | falls or rises to | which is |
|---|---|---|
| the blast, the boss coming apart | **the root** | it resolves — the player did that |
| a kill | the seventh | it hangs; there are more coming |
| a death | the seventh, and it is the only cue that ends unfinished | it does not resolve |
| a shield, a pickup, the chime | **an octave up** | everything gained rises |
| a bomb thrown | two octaves up, on the fourth | the thing it turns into has not happened yet |

## WHAT THIS DECISION TRIED TO DO AND COULD NOT

⚠️ **The first draft tuned the note a listener actually HEARS, and the measurement refused to say what
that is.** The reasoning was sound: a `curve` of 6 is a click heard almost at its start and a curve of
1.4 is a rumble heard a third of the way down, so the same interval sounds a different note depending
on how fast the layer decays — and an exponential sweep is still gliding when the layer stops, so
**neither endpoint is a note the ear rests on**.

⚠️ **Two defensible models of *the pitch of a chirp* disagreed by four semitones** on the death cue's
own body:

| model | says |
|---|---|
| the energy-weighted mean of the instantaneous frequency, `∫u·e^(-2cu)du / ∫e^(-2cu)du` | 131 Hz |
| a Goertzel over the whole rendered layer, scored in quarter tones | 165 Hz |

⚠️ **There is no third opinion available to break the tie, and the question is genuinely ill-posed.**
A fast chirp does not have *a* pitch. The whole apparatus — a `heardAt` integral, a `glide(degree,
semitones, curve)` helper, every layer rewritten in terms of it — was **built, measured and deleted**,
because a rule tuned to one of two models that disagree by a third of an octave is a rule tuned to
nothing.

⚠️ **What survives is the claim both models agree on**: whatever the ear picks out, it lies between
the endpoints. Make the endpoints notes of the scale and every instant of the sweep is inside a
musical interval. That is weaker than what was attempted and it is the strongest thing that is true.

⚠️ **It is [0027](0027-measure-the-picture-not-the-model.md) working in the direction nobody plans
for.** The rule is usually *measure, because the model may be wrong about the picture*; here the
measurement said **the question the model was asking has no answer**, and the right response was to
ask a smaller one.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0099-cues-in-the-key.mjs`.

| broken on purpose | went red |
|---|---|
| the pulse put back on the two frequencies it shipped with, which are not notes | `THE REPORTED ONE: every pitched cue glides between two notes of the key` |
| the death dropped a semitone onto a note outside the key | `THE REPORTED ONE: every pitched cue glides between two notes of the key` |
| the sweep destination ignored, so every glide is a held note the table says is a fall | `THE SAMPLES: what a layer puts in the room lies inside the interval its row names` |
| the scale opened to all twelve semitones | `and the scale is the natural MINOR` |

⚠️ **The second is the defect exactly and it looks like a tuning edit.** A semitone down is in the
chromatic scale, keeps the interval whole, and is what a hand reaches for while tuning by ear.

⚠️ **The third is the one no assertion over the table can see.** Every row still names two notes in
the key and every interval is still whole; what changes is that the sound in the room is a held tone
rather than a fall.

⚠️ **And it reported STILL GREEN on its first run, because the measured guard asked the wrong
question about the samples.** It checked that the loudest pitch lies *between* the endpoints — and a
held tone at `from` is between the endpoints. What separates a glide from a held note is that there
is energy at the **far** end too, which is what it asks now. That is the third guard in four decisions
to be corrected by `npm run prove` rather than by review, and all three had the same shape: a bound
that describes the state being defended instead of the smallest edit that destroys it.

⚠️ **The fourth is the decision deleting itself while the suite stays green.** Twelve notes to the
octave is *any note*, and *any note* is what an arbitrary frequency already was — so the rule would
survive as a sentence and stop being a constraint.

## What this does not settle

**Whether it meshes.** Nothing in this repository can hear. `node scripts/hear.mjs` writes the files
and a hand gives the verdict, and the report that produced this decision is the first one in the
project's life to mention the sound at all.

**What note a chirp sounds.** Written down above as an open question rather than as a footnote,
because it is the reason this decision is smaller than it set out to be — and because the next hand to
reach for *"tune the perceived pitch"* deserves to find the four semitones already measured.

**The drums.** `src/content/music.ts`'s kick falls 150 → 45 and its toms 190 → 105, and neither is in
the key or should be: 0090 says *"a kick is a fall from 150 to 45 whatever the key is"*. That claim is
untouched and unguarded, and it is the one place the rule above deliberately stops.

## Rollback

**None.** No storage key, no save field, no service-worker cache prefix, no origin — one constant
moved down a layer and thirty-two pairs of numbers. [0001](0001-revertability-not-risk-rating.md).
