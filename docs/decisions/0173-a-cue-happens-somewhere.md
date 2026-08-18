# 0173 — A cue happens somewhere

**Accepted 2026-08-18.** The first change to the effects channel since the music work began, and the
answer to the half of the ask that turned out to be true.

> *"The cues and sfx need to be reworked as we haven't touched them since we spent all the time on the
> music and they're still the old mono sounds and haven't been reworked as stereo sounds with deep
> bass, reverb and actually decent sound."*

## The rules

**The cue bus has one room, and a cue states its share of it.** `air` on `CueRow` is a send; the
tail is `CUE_ROOM_SECONDS` and the return is `CUE_ROOM_GAIN`, both properties of the room rather than
of any sound in it.

**The room's two sides are drawn from different noise.** The width is the tail; the dry signal stays
where the event happened.

**A cue on the weapon cadence is dry.** `pulse`, `missile`, `threat` and `hit`.

## ⚠️ Every sound in this game happened in an anechoic chamber

A cue was a dry mono buffer into a fixed panner with nothing at all between it and the master.
[0136](0136-the-place-has-a-room-and-an-arc.md) gave the **music** a room in 2026-08; the cues never
had one, and `src/app/music.ts`'s own header says why that matters:

> *the music and the effects come out of one instrument, which is what stops the soundtrack sounding
> like it was made somewhere else*

The reverb was the one part of that instrument only one of the two channels could reach.

## ⚠️ The width is the tail, and that is a decision rather than a shortcut

*Stereo* for a cue cannot mean widening the dry sound. Where an event happened is information the
player dodges on — [0127](0127-a-cue-has-a-place.md) — so spreading the dry signal
would spend a fact to buy a feeling. **The dry stays a point and the room is everywhere**, which is
also what happens in a room. The two impulse channels are drawn from independent streams and
correlate at **−0.018**; two identical channels would be a mono sound played twice.

⚠️ **A CONVOLUTION ON A BUS RATHER THAN A BAKE INTO EVERY BUFFER.** `addRoom` is a post-pass over a
loop baked once a level; a cue is baked once and **played ten times a second**, so a wet tail baked
into the buffer would lengthen every one of them and cost the same arithmetic again at every sounding.
One `ConvolverNode` for the channel does it once. **The buffers are untouched and still mono**, so
nothing that measures a cue had to change.

⚠️ **AND THE SENDS ARE PER KIND, NOT PER VOICE.** `tests/budget.test.ts` names `src/app/sound.ts` cold
for exactly one allocation — *"one single-use audio source per voice because the platform has no other
way to play a buffer"* — and a `GainNode` per sounding would make that sentence false. Fourteen gains
built with the context keep it true; `PAN_BUCKETS` is the same argument for the same reason.

## ⚠️ The browser found a fatal bug the headless suite could not

Every other buffer in `src/app/sound.ts` is created at `SAMPLE_RATE` and **resampled** by the source
node when the device disagrees — 44.1 kHz material on a 48 kHz context plays a hair slow and nobody
has ever noticed. **A `ConvolverNode` throws instead:**

> *NotSupportedError: the buffer sample rate of 44100 does not match the context rate of 48000 Hz*

On the unlock gesture, taking the whole speaker down with it. `tests/*.browser.test.ts` caught it on
the first run and nothing else could have: the headless guards bake at a rate they choose and never
build a graph. The impulse is drawn at `ctx.sampleRate`.

## ⚠️ `hit` was wet until it was measured, and a quiet send is not a short one

At `air: 0.14` — the smallest value in the table — the room took `hit`'s tail from **56 ms to 743
ms**. A cue with a small peak has its −40 dB point pushed *later* by a tail, not earlier, so the
quietest send in the table produced one of the longest smears in it. `hit` lands once per connecting
bullet, which is the gun's own rate.

| dry, and why | |
|---|---|
| `pulse` | `FASTEST_FIRE` is 0.067 s against a 1.1 s room — sixteen soundings to one tail |
| `missile` | `missilePerBeat` reaches six, which is the same arithmetic one weapon over |
| `threat` | rides the enemy fire cadence, and its whole job is saying *where* |
| `hit` | the gun's rate again, measured above |

What the room does to the rest, by how long each cue stays within 40 dB of its own peak:

| | dry | with the room |
|---|---|---|
| `blast` | 950 ms | **1426 ms** |
| `death` | 1300 ms | **1749 ms** |
| `bossDown` | 1749 ms | **2203 ms** |
| `kill` | 350 ms | **852 ms** |
| `pickup` | 167 ms | **786 ms** |

⚠️ **`kill` IS THE LIVE QUESTION AND IT IS FLAGGED RATHER THAN SETTLED.** It is the loudest thing that
happens often, so it is the one row where *big* and *smeared* are the same knob. 0.3 is a hand's
guess.

## ⚠️ *Deep bass* was measured and the claim needs qualifying

Averaged over a whole buffer, **every cue in the game is under 4% below 120 Hz** and most are under
1% — which reads as the ask being exactly right. It is the wrong measure:

| best 150 ms window, share under 120 Hz | | arrives at |
|---|---|---|
| `death` | **16.3%** | 1.10 s |
| `bossDown` | **10.8%** | 1.45 s |
| `blast` | **10.5%** | 0.75 s |
| `kill` | 1.3% | 0.15 s |
| `pickup`, `chime`, `shield` | **0.0%** | — |

**The bottom is there in the three cues that should have it, and it arrives at the END of a sweep** —
which is why a whole-buffer average cannot see it. So the honest open question is not *is there sub*
but *does it arrive early enough to be felt*, and that is an ear's question. **Nothing was tuned
against the number that looked alarming**, which is the whole of
[0027](0027-measure-the-picture-not-the-model.md) applied before a pass rather than after seven.

## ⚠️ And the teardown dropped every node but one

`release` closes the context and clears `buffers`, `places`, `master` and `music`. **A stale send is
not a leak, it is a throw**: `source.connect` across two contexts is an `InvalidAccessError`, so a
release followed by an unlock would have taken the speaker down on the first cue. Caught by reading
the diff back rather than by a guard, and it is the reason `places` has always been cleared there.

## ⚠️ And CI caught two things this machine could not

⚠️ **A DEAD CITATION IN THIS FILE, WHICH `tests/links.test.ts` COULD NOT SEE UNTIL IT WAS COMMITTED.**
The link checker treats an untracked file as gitignored and skips it as a SOURCE, so a decision's own
outbound links go unchecked for exactly as long as it sits unstaged — which is the whole time it is
being written. This one cited `0127-a-cue-comes-from-where-it-happened.md`; the file is
[0127](0127-a-cue-has-a-place.md).

⚠️ **AND THE MEASUREMENT GUARD WAS TWO BILLION MULTIPLIES.** A one-second cue against a 1.1-second
impulse, convolved directly, is 2.35 s here and timed out at five on the runner. It is thinned by two
now — and the first attempt used **thirty-two**, with a comment asserting the answers were identical
to the millisecond. **They were not: 324 ms against 476.** Measured across every factor, only two is
exact. That comment was a claim written without checking, which is the one thing `CLAUDE.md` says an
assumption may never be, and it was inside a guard.

## What this is not

⚠️ **The cue buffers are still mono and the game still has no cue EQ.** Width comes from the room
only; a stereo dry signal would need a channel count change through the bake, the pool and every guard
that measures a cue, and it would fight 0127.

⚠️ **No cue's material changed.** Not one layer, gain, filter or envelope moved — the diff is a send
per row and a bus. That is deliberate: the reported *"actually decent sound"* is a judgement about
material, and material is what an ear has to drive.

⚠️ **There is no desk control for it yet.** `air` is typed, not dragged, which is the state
[0162](0162-a-place-has-its-own-ladder.md)'s ladder was in until today and the same mistake if it
lasts. `rig/dash.ts` is where it belongs.

## Confirmed, not assumed

- `npm run typecheck` clean, `npm test` green — 1,086 — including all five browser sound tests,
  `npm run build` clean.
- Every table above is a measurement over the baked cues and the drawn impulse, at `SAMPLE_RATE`.
- Three probes, seen red, trees restored: `node scripts/prove-guard.mjs 0173`.

| broken on purpose | went red |
|---|---|
| every cue back in an anechoic chamber, which is where all fourteen of them were | `THE ONE IN UNITS THE PLAYER HEARS: the blast rings for at least a third of a second longer` |
| one noise sequence copied to both sides, so the room is deep and not wide | `THE STEREO ONE: the two sides of the room are drawn from different noise` |
| the gun given a room, at sixteen soundings to one tail | `and the four cues on the weapon cadence are DRY, because a tail cannot outlast its own repeat` |

⚠️ **AND NOTHING HERE HAS BEEN HEARD.** Fourteen send values were authored from each cue's own written
brief and checked against a convolution. [0027](0027-measure-the-picture-not-the-model.md) applies to
this document.

## Rollback

Shipped audio. `air` on fourteen rows of `CUES`, and the convolver, return gain and sends in
`makeSpeaker`. Revert the commit; no cue's material moves with it. No storage key, save schema, SW
cache prefix or origin.
