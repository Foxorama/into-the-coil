# 0275 — A layer may move

**Accepted 2026-09-08**, asked for by name and then confirmed by ear:

> *"Is there anyway we can have those three notes play right, left, right ear? It'll sound the same
> from speakers, but if we can bounce those three notes only between left and right… I think it'd be
> pretty good."*
>
> *"The organ going left to right was great, I didn't notice it on the organ and it made those three
> notes bounce around exactly how I wanted."*

**Extends [0118](0118-the-mix-has-a-width.md)**, which gave every layer one position and said so in
the singular.

## The rule

**A place may state a `PanTrack` for a layer: one entry per step over the layer's own loop, `null` for
*hold where you are*.** The **whole layer** moves. The mixer writes the track into that layer's
`StereoPannerNode` as a horizon of `setValueAtTime` events at the instant the sources start, and never
again.

Ember Nebula's `hook` is the only track in the game: **right, left, right** across the three `STABS`
notes of every fourth bar, derived from `ROOT` so it cannot drift from the figure it is written
against.

## ⚠️ The cheap version was tried first, and it is the one that shipped

There were three ways to put three notes in three places, and only one of them costs nothing:

| | |
|---|---|
| **automate the layer's panner** | free — the `AudioParam` already exists; **but the whole layer moves** |
| give the stabs their own layer | one more baked loop, **~4.5 MB**, against a 56 MB ceiling `tests/sound.test.ts` says *"the third raise must not be a number"* — and Ember Nebula is already at 46.85 |
| per-voice pan with a stereo bake | [0118](0118-the-mix-has-a-width.md) already refused stereo buffers on that same ceiling |

**So the free one was rendered and listened to before either of the others was designed.** `hook` is a
four-voice organ registration whose 8-foot and 4-foot ranks play continuously through the stab bar, so
the objection was real and specific: the whole registration would swing with the three notes. It was
inaudible. *"I didn't notice it on the organ."*

**The 4.5 MB was never spent, because the question was answered by ear for the cost of one render.**
That is [0027](0027-measure-the-picture-not-the-model.md) used forwards rather than as a post-mortem.

## ⚠️ It is scheduled once, and that is why it is affordable

`swapTo` starts every source at one timestamp and *"there is no scheduler anywhere to re-align them"*.
This rides that rather than adding one: the horizon is written in the same call, so the frame loop is
untouched and nothing allocates in it — [0022](0022-frame-rate-is-a-feature.md).

**563 `setValueAtTime` calls, once.** Twelve events per 25.6-second loop, 35 loops in a 900-second
horizon, one layer, one place. The horizon is four times the longest level on purpose: a number that
had to be *just enough* would be a budget and would need an owner
([0192](0192-a-guard-holds-an-invariant.md)).

A change of place re-writes it, anchored to `anchorAudio` rather than to `currentTime` so the gesture
keeps its place in the bar, with past events skipped — a `setValueAtTime` behind the clock applies at
once, and a horizon of them would arrive as one burst.

## ⚠️ Two instruments had to be taught it, and one of them had already lied

**`scripts/hear.mjs` resolves the track per sample.** Without that, `--level` writes a file the game
does not play — [0209](0209-the-rig-hears-in-stereo.md)'s whole subject. **This is not hypothetical:
the swing was auditioned from an untracked copy of `hear.mjs`, and three renders were handed over
afterwards that quietly did not have it in them.** The report was *"the swapping left to right is not
in the render"*, and it was correct.

**`rig/dash.ts` had to stop cancelling it.** Its comment read *"nothing in the mixer ever moves a pan
after construction"* — true when written, false the moment a track existed. A following layer's
parameter now differs from `LAYER_PAN` most of the time, so the desk's per-frame write would have
**cancelled the scheduled swing on the first frame it drew**, and the instrument would have shown a
place not moving. A hold still wins and still cancels; what that costs is the horizon, and it is named
in the file rather than hidden.

## The guard, and what it holds

**A layer that moves obeys every rule a layer that sits still does.** Every value in a track is inside
`PAN_LIMIT`, and a track's length is a whole divisor of its layer's loop — because a track that does
not divide the loop walks the gesture further round the bar every pass, which is
[0090](0090-the-music-is-four-loops.md)'s *layers that drift apart* wearing a panner, and what a
listener would report is that the bounce stopped landing on the notes.

**The two existing pan guards read `LAYER_PAN` and a track is not in it.** A new table beside a
guarded one is the shape that goes wrong: `LAYER_PAN`'s own ceiling was right when written and
silently wrong from the moment `mix` multiplied it, guarded by nothing.

`scripts/probes/0275-a-layer-may-move.mjs` breaks it both ways — one value widened past the limit, and
a track that no longer divides the loop.
