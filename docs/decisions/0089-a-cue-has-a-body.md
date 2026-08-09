# 0089 — A cue has a body

**Accepted 2026-08-09.** A play-test verdict on the whole of
[0072](0072-a-cue-is-baked-and-played.md)'s output — the first feedback the sound has ever had, in
either direction, across four rounds.

**Amends [0072](0072-a-cue-is-baked-and-played.md)** on the synthesiser, the sample rate and the
fade-out it deleted. Everything 0072 decided about *when* a cue may sound — the twin, the hold, the
voice cap, the ban — is untouched.

## The rule

**A cue is a stack of layers, each with its own envelope, a lowpass and a highpass. Anything that
explodes is four parts: a crack, a filtered body, a bright debris tail, and a boom.**

## What was asked for

> *"Basically, I don't like them at all — too tinny, way too Atari 2600, not in a fun pixel sound
> way."*

> *"I definitely want more bass-y, more boomy/explosiony on the missiles, bombs, player and boss
> explosions."*

> *"For the primary fire weapon I want to sound more like a meaty chaingun… for turrets etc and
> non-bosses, more laser and pew pew."*

And on the second pass, which is the one that found the real fault:

> *"The all-cues didn't sound that great, sounded like it was all happening inside a tin shed and you
> were listening from the outside — basically, a bit tinny and muffled."*

## *Way too Atari 2600* was a description of the MODEL, not of the tuning

A `CueRow` was one wave, one exponential sweep, one shared attack and one shared exponential decay.
**That is a TIA voice.** No arrangement of its six numbers could have produced a sound that was not
one, so there was never a version of this that was a tuning pass.

| | had | has |
|---|---|---|
| oscillators per cue | 1 | 1–6, each with its own envelope and start time |
| filters | **none, anywhere in the codebase** | a lowpass and a highpass per layer, each sweeping |
| saturation | none | per layer, plus a gentle glue over the sum |
| band-limiting | none — naive square and saw | PolyBLEP on both |
| sample rate | 22050 | 44100 |

⚠️ **There was no filter in the project at all, and that is the single biggest line in the table.** A
boom *is* noise behind a falling cutoff; the same noise unfiltered is a hiss, and every explosion in
the game was that hiss. `kill`, `blast`, `bossDown` and `death` were each one sample-and-hold noise
oscillator with a falling grain rate, which is the 2600's noise channel exactly.

## The tin shed, and how a number found it

⚠️ **The first rebuild was rejected too, and *"tinny AND muffled"* sounds like a contradiction until
it is measured.** It is not one: it is a spectrum with a **hump in the middle and nothing at either
end** — energy piled between 300 Hz and 2 kHz, no top and no bottom. That is what being outside a
shed does to a sound, and the player's metaphor was a precise description of a transfer function.

⚠️ **The instrument that found it had to be corrected before it could be believed**, which is
[0027](0027-measure-the-picture-not-the-model.md) happening to the measurement rather than to the
code. The first band report measured raw spectral density and normalised each cue by its own peak; a
sub sine puts all of its energy at one frequency, so it buried everything above it and **every cue
read as having no top whether it had any or not**. A metric that returns the same answer for a bright
sound and a dull one is not measuring brightness.

Corrected, it is density × bandwidth (so noise reads flat) and **A-weighted** (so the ear's thirty
decibels of insensitivity at 50 Hz are accounted for). Then it said the thing plainly:

| A-weighted peak band | first rebuild |
|---|---|
| `bossDown` | **himid**, 800–2000 Hz, with `sub` at 0.04 |
| `pickup`, `chime`, `shield` | **mid**, with nothing below 300 Hz at all |

⚠️ **AND IT NAMED A MISTAKE NOBODY WOULD HAVE FOUND BY EAR ON GOOD SPEAKERS.** The boom was swept to
27–60 Hz, where a laptop or a phone reproduces **nothing**. On the machine the game is played on, all
that survived was the midrange noise. The booms now land at 165–190 Hz falling to 50–60, with a sub
octave underneath for systems that can render it — audible everywhere, felt where there is something
to feel it with.

## The four parts, and what each is for

| part | what it is | what it fixes |
|---|---|---|
| **crack** | a few ms of bright noise | the sound starts rather than fades in |
| **body** | noise between a highpass and a *falling* lowpass | the boom. The highpass is what removes the shed |
| **debris** | a long, quiet, bright tail | the top. **It did not exist at all before** |
| **boom** | a sine sweeping into the floor, plus its sub octave | the weight, at a pitch a speaker can produce |

⚠️ **`pulse` and `threat` were approved in play and are not retuned.** *"Run-chaingun and run-threat
sound good"* — a click, a saturated square behind a falling filter and a sine thump; and a resonant
saw whose filter chases its own sweep. The only change to either is that `pulse`'s click keeps its
top, because everything else gained air and the sound the player hears ten times a second should not
be the one dull thing left.

## What this costs, stated

⚠️ **44100 costs nothing that ships.** The bake is CODE and not data — 0072's whole argument — so
`docs/decisions/0003-single-file-build.md` is untouched. What doubles is about twenty milliseconds of
synthesis at the first press, and the RAM the buffers sit in.

⚠️ **`MAX_CUE_SECONDS` goes 1.5 → 2**, because the boss coming apart now takes 1.75. The ceiling is
doing the same job at the new number, and eleven of the twelve are still well under a second.

⚠️ **Every row gain was scaled by 0.6 so the mix keeps the headroom it had.** `tests/sound.test.ts`
holds that the four loudest cues at once cannot clip past the master gain, and the layered rows
tripped it at first. The *relative* balance is untouched — everything scaled together — including
0072's deliberate arrangement that the player's own weapons sit quieter than what is shooting at
them.

## The fade-out is back, and 0072 deleted it on evidence that was correct at the time

⚠️ **This is the most interesting thing in the change.** 0072 wrote a two-millisecond release, then
proved with a probe that it could not matter: one oscillator at `DECAY` 5 is already at 0.7% of peak
when the buffer ends, a hundred times below where a click is audible. `npm run prove` reported STILL
GREEN and the line went. **That was right.**

**A layer carries its own curve now, and a long rumble uses 1.4 — which ends at 25% of peak.**
`tests/sound.test.ts` said so within the hour. The premise moved, not the reasoning, and
`src/app/sound.ts` says so where the constant is, so that the next person to find 0072's argument
does not delete it a second time.

⚠️ **And restoring it re-opened the hole 0072 closed**: a release satisfies *ends at zero* on its
own, so an envelope that never fell would have passed. The guard now asserts both — it ends at zero
**and** it is quieter at its end than at its start.

## Confirmed, not assumed

Per [0005](0005-a-guard-must-be-seen-to-fail.md) and [0019](0019-a-probe-must-be-seen-to-apply.md),
declared in `scripts/probes/0089-cue-body.mjs`.

| broken on purpose | went red |
|---|---|
| only the first layer rendered, so a cue is one oscillator again | `THE SHED: an explosion is spread across the spectrum rather than humped in the middle` |
| the lowpass dropped from the synthesiser, so every explosion is unfiltered static | `and its weight is not in the top octave, which is what a filter is for` |
| the release taken back out, so a long tail is cut off mid-waveform | `starts and ends at zero, because a buffer that stops mid-waveform clicks` |
| the low sine removed from an explosion, so there is no boom to feel | `THE REPORTED ONE: everything that explodes has a body, and not just a hiss` |
| the highpass taken off an explosion's body, so the boxy band comes back | `THE REPORTED ONE: everything that explodes has a body, and not just a hiss` |

⚠️ **THE SUITE COULD NOT SEE ANY OF THIS BEFORE, AND THAT IS WHY IT HAS A SPECTRUM IN IT NOW.** Every
guard over the old table — the twin, the ceiling, the hold, the voice cap, the envelope, the master
mix — was **green over the sound the play-test rejected outright**, and every one of them stays green
over four of the five breaks above. A suite that can only check a table cannot notice that the table
describes an Atari. The two spectral guards are the first assertions in this repository about how
anything actually sounds.

⚠️ **The body guard took three attempts and each failure was the guard's, not the code's.** It first
read *some filtered noise layer has a highpass* — and the four-millisecond **crack** answered for it
while the body lost its filter, which `npm run prove` reported as STILL GREEN. It then read *the
longest* — and `missile` went red honestly, because its longest noise layer is the deliberately bright
debris tail. It reads *the loudest* now, which is what a body is.

⚠️ **One of 0072's probes was re-anchored**: its envelope break planted `Math.exp(-DECAY * u)`, which
is now `-curve * u` — the shared decay became a default rather than a value.

## What this does not settle

**Whether it is right.** Nothing in a test suite can hear, and the spectral guards measure a shape
rather than a sound. `node scripts/hear.mjs` writes every cue to a `.wav` and the verdict is a hand on
the controls — which is the whole of 0027 in the one channel it names as having nothing to look at.

**The mix in a real fight.** The cues were judged solo and as a synthetic battle render; whether a
chaingun at ten a second sits under a boss explosion is a question only play answers.

**Music.** Asked for in the same breath and deliberately not here: *"this might be its own separate
piece."* It is — everything above is a one-shot buffer fired at an event, and music is a clock.
