# 0126 — The dashboard is the instrument, and it plays the game's own mixer

**Accepted 2026-08-12.** The tool [0027](0027-measure-the-picture-not-the-model.md) owes for the one
channel a play-test cannot be taken on twice a day, and the second instrument built for the sound
after [0116](0116-the-rig-plays-the-level.md)'s WAV rig.

**It supersedes nothing.** `scripts/hear.mjs` writes files; this plays, and it is driven while it
plays. What no mode of that rig can do is answer a question asked *at a moment* — *what am I hearing
right now, and what should I be?*

> *"There's still whole sections of sound and music that have been produced that I've apparently
> never heard in game… give me a local server with a sound dashboard where I can play the music
> tracks and it lists at each point what sounds I should be hearing so I can verify, and then overlay
> weapons fire and weapon tiers over it so I can judge and play around without us having to do a new
> PR and whole sweep every time."*

## The rules

**The dashboard plays the game's mixer, not a model of it.** `makeAudioOut`, `makeSpeaker` and
`makeMusicOut` are the shell's own objects, so the ducking, the voice cap, the holds, the accents,
the bus shaper and 0117's bar-line quantisation are the ones a player gets — because they are the
same code.

**The live readout reads the graph.** `MusicOut.gainOf` returns a layer's `AudioParam`, so the number
printed beside a layer cannot disagree with the speakers. **Nothing under `src/` may call it** and
`tests/dash.test.ts` scans for that: a parameter the shell could write is a second place the mix is
decided from.

**`rig/` is dev tooling and is outside the shipped graph, in both directions.** `vite.config.ts` has
one entry, so `vite build` never sees the page, and no file under `src/` may import from `rig/`.

**The arithmetic is a module and the browser half is not.** `rig/transport.ts` has no DOM and no
`AudioContext` in it, for the reason 0116 had to discover: a guard has to reach the values.

## ⚠️ The measurement it makes that nothing here has made before

**How long a layer is open, against how long its own loop is.** Level one, at a 45-second fight:

| layer | its loop | longest run | comes round |
|---|---|---|---|
| `counter` | 25.6 s | 33.9 s | **1.33×** |
| `arp` | 25.6 s | 50.0 s | 1.95× |
| `hook` | 25.6 s | 66.0 s | 2.58× |
| `call` | 25.6 s | 84.7 s | 3.31× |

⚠️ **`surge` LASTS 16.0 SECONDS AND THE LAYER IT OPENS TAKES 25.6 TO SAY ITSELF.** `counter` is
0113's *"the ear is handed a different tune"* and it is **0.63 of a loop** inside its own section;
`approach`, at 17.9 s, is 0.70. Those are the two rungs
[0125](0125-the-build-starts-sooner.md) records as unnoticed — *"the 1:32 and 1:48 aren't noticeable
in game"* — and this is a second, independent reason for it that costs no new material at all.

⚠️ **IT DOES NOT CONTRADICT 0125 AND IT IS NOT A SUBSTITUTE FOR IT.** That decision measured
*arrivals are heard, departures are not* and asked for ~60 notes a bar of new material per rung; this
says the material those rungs already have **arrives in a window too short to complete a phrase**. A
hand adding notes without widening the window would be filling 0.63 of a loop more densely.

⚠️ **NOTHING IS TUNED HERE.** 0116's rule — the instrument first, judged after — and 0113's finding
that building it after the third guess is what cost six rounds.

## What the player has never heard, and it is not a bug

Asked directly, because the report was *sections that were produced and never heard*:

| | |
|---|---|
| **six of the seven themes** | `mixOf` re-mixes 6–7 layers per place and only `approach` is neutral. A run reaches them only by reaching those levels; the dashboard's level selector is the whole answer |
| **`bass` and `beat`** | title-only by design — [0095](0095-the-level-has-its-own-music.md)'s `TITLE_ONLY`, closed for every second of every level |
| **`stomp`, `frenzy`, `wraith`** | the fight and nothing else, so they exist for whatever a boss lasts |
| **every cue** | all fourteen have a call site. `chime` is `src/app/mount.ts`'s and is the one that is not an event |

⚠️ **NO DEAD LAYER AND NO DEAD CUE WAS FOUND**, which is worth writing down because it was the first
hypothesis. What is real is the **window**, above, and the six unvisited places.

## Two guards were caught measuring the wrong quantity, and both by `npm run prove`

⚠️ **THE THEME GUARD PASSED WITH THE THEME REMOVED.** *Two themes do not produce the same gains*
compared all twenty-three layers of level one against level seven — and `eye`'s boss is 190 units
further out, so its **aura** is at a different point at the same second. The guard was satisfied by
the one pair of layers driven by a distance rather than by a place.
[0027](0027-measure-the-picture-not-the-model.md) inside a test.

⚠️ **AND A PROBE REDDENED A STRONGER GUARD THAN IT NAMED.** Dropping the theme where the *target* is
computed reddens *every target is the one `levelWrites` would schedule* instead — because a rig lying
about its theme **consistently** still agrees with itself. Two different claims wearing one probe;
[0019](0019-a-probe-must-be-seen-to-apply.md)'s other half is what separated them.

⚠️ **AND THE READOUT ITSELF WAS WRONG ABOUT THE AURA.** The first draft reported `auraSlow` as
*opening* at the first rung boundary after 0107's level build crosses its onset — true about a gain,
false about the music: nothing arrived, something that had been climbing for thirty-five seconds
crossed a threshold. It is now `tracking`, and 0117 leaves the aura unquantised for the same reason.

## Two defects that only exist because this is DRIVEN, and both were found by driving it

⚠️ **A SCRUB RE-ANCHORED THE MUSIC UP TO A PHRASE INTO THE FUTURE, AND FROZE THE WHOLE LADDER.** The
first version moved the step clock with the slider. `phaseTo` reads a step clock that disagrees with
the audio clock as drift and corrects it the way [0094](0094-in-time-is-not-in-phase.md) says — by
restarting the loop set at the next **phrase** boundary, up to 25.6 s ahead. `anchorAudio` becomes
that future instant, `nextBarFrom` returns it for every subsequent write, and every gain holds
where it was until the anchor arrives. **Observed as: jump to `surge`, and the layers `surge` opens
stay silent while the readout insists they are at full.**

⚠️ **THE FIX IS THAT A SCRUB MOVES THE LEVEL AND NEVER THE CLOCK**, and the dashboard therefore does
not call `phaseTo` at all. Its step count is derived from the same wall clock the `AudioContext`
runs on, which 0094 itself sizes at *under ten milliseconds across a three-minute level*. **A
re-phase exists for a sim that dropped steps; this tool has no sim.**

⚠️ **AND `requestAnimationFrame` DOES NOT RUN IN A HIDDEN TAB WHILE THE AUDIO DOES.** The game is
right to use it — it drives a picture. This drives a **sound**: a player who tabs away mid-level
would have the music go on playing while the level stopped advancing underneath it, so the rung
would hold and the thing they were listening for would never arrive. It is a timer instead, with the
elapsed time measured rather than assumed. **A tool that lies when it is not being watched is worse
than one that costs a timer.**

## ⚠️ Amended the same day, by flying it — the pause, the desk and the copy button

**Three things came back within an hour of the first use**, which is the tool doing its job:

⚠️ **PAUSE DID NOT STOP THE MUSIC.** *"It stops the timer bar, but the music is still running in the
browser."* A straight omission — `playing` gated the walk and the cues and nothing told the mixer. It
now calls [0119](0119-off-stops-the-loops.md)'s own `setOn`, so a paused dashboard is in exactly the
state a player who turned sound off is in rather than a fifth state invented here. **Resuming
re-anchors the step clock**, because `start()` re-anchors the loops and a count measured from the old
anchor would put the gun a pause-length off the bar.

⚠️ **AND THE READOUT LIED WHILE PAUSED, WHICH IS THE HALF THAT NEEDED THINKING ABOUT.** `setOn` fades
the master and stops the sources; **a layer's own gain is upstream of both and does not move**, so
the page went on reporting `sub 0.86` into silence. Being paused is now a visible state on the page.
A tool that reports a number it is not producing is the exact failure this decision opens by naming.

⚠️ **THE SOLO BECAME A DESK.** *"I need to be able to select individual layers to play together and
adjust those layers to strengthen or diminish them."* Each layer has an on/off and a **trim over the
mixer's own target** — at ×1 a held layer sounds exactly as the ladder says, at ×1.4 it is the same
arrangement with that part pushed. Clicking a name still solos.

⚠️ **AND HOLDING A LAYER TURNED OUT TO BE A TUG OF WAR WITH THE MIXER, ON TWO LAYERS ONLY.**
`levelWrites` skips a layer whose target has not moved — **except the aura pair, which it writes every
frame by design** (0091: they track a distance the player steers, so they are never at rest).
A desk that wrote only on a change therefore could not switch those two off: they settled at
0.01–0.02 instead of silence. A held layer is now written every frame, full stop.

⚠️ **A HELD LAYER FOLLOWS A RUNG CHANGE IMMEDIATELY RATHER THAN OVER 1.6 SECONDS**, and the page says
so where the desk is. That is a real difference from the game and it is the price of the feature;
*hand it all back* is what a transition is judged with.

⚠️ **AND A COPY BUTTON, BECAUSE EVERY REPORT ABOUT THIS CHANNEL HAS BEEN WRITTEN FROM MEMORY.** *"The
tune kicking around 52 secs"*, *"the 1:32 and 1:48 aren't noticeable"* — and a session then spends its
first hour working out which rung 52 seconds was, at which theme, with what open. It prints the level,
the place, the time in bars and beats, the rung, the aura, the weapon cadences and **`live` beside
`target` for every layer**, as markdown. The two columns together are the point: the report it exists
to carry is *"what is supposedly playing is not actually audible"*, which is a claim about the gap
between them.

## What the build plugin had to give up, and why it is narrower rather than weaker

⚠️ **`stampBuildIdentity`'s `transformIndexHtml` RAN ON EVERY HTML THE DEV SERVER TOUCHED**, so the
day a second page existed it threw on one with no version to report. It is now scoped to the root
`index.html`. **The demand is unchanged and is still a hard build failure**; what moved is which
files it is a demand about. Giving the dashboard a `%ITC_VERSION%` placeholder to keep the plugin
quiet was the alternative, and it is the version of this that quietly stops meaning anything.

## What was rejected

**A second mixer inside `rig/`.** Building the graph from `bakeLoops` and `panGains` directly is
about thirty lines and it is precisely the drift 0116 is named for — that rig came apart from the
game twice, and both times a verdict was taken from it.

**A `mute`/`solo` method on `MusicOut`.** A read-only `gainOf` is enough: 0117 only writes a layer
whose *target* moved, so a gain written from outside is left alone until the rung changes. One
accessor, no state, and nothing added to the frame.

**Putting it under `src/`.** [0015](0015-the-layer-ladder.md) closes that set and
[0003](0003-single-file-build.md) closes the build's; a dev tool belongs outside both.

## Confirmed, not assumed

| broken on purpose | went red |
|---|---|
| the rung read from a table the dashboard keeps, rather than asked of the game | `THE RUNG IS THE GAME’S ANSWER, never a table the dashboard keeps` |
| the level’s own place dropped, so all seven render as level one | `THE PLACE IS IN IT: two themes do not produce the same gains` |
| every layer measured against one loop length instead of its own | `a span’s bounds are the RUNG MARKS and its length is the content’s` |
| the target worked out in the rig rather than asked of the mixer’s own description | `EVERY LAYER’S TARGET IS THE ONE levelWrites WOULD SCHEDULE, to the last decimal` |
| a layer that merely got louder reported as an arrival | `a layer that was already playing is never reported as OPENING` |
| a tier raised the guns and not the tubes | `A TIER IS BOTH LADDERS, and it is the game’s own resolution of them` |
| the pulse laid down at a cadence typed into the rig | `THE GUN’S CADENCE IS THE SHIP’S, never a number typed into the rig` |
| the shell reaching into a music layer’s gain, so the mix is decided in two places | `NOTHING UNDER src/ CALLS gainOf — the mix is decided in one place` |

## How to run it

```bash
npm run dash
```

Vite serves `/rig/`; the page needs one click to unlock audio, because no browser makes a sound
before a gesture ([0072](0072-a-cue-is-baked-and-played.md)).

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). A dev-only page, a guarded module,
guards, probes and one read-only accessor. No storage key, no save field, no cache prefix, and
`dist/` is byte-identical: the build has one entry and never sees `rig/`.
