# 0394 — A send is not a bypass

**Accepted 2026-09-27.** [0127](0127-a-cue-has-a-place.md)'s browser guard asks each cue's source
whether it reaches a stereo panner, where it asked each connection whether it was one. **Amends 0127's
guard**; nothing in the game changes.

## What was found

`npm run prove` refused its baseline on the branch for 0392 and 0393: *"1 of 30 cue sources bypassed
the field and went into GainNode."* The same suite had passed in `npm run check` minutes earlier and
passed three runs out of three alone.

A cue's source connects to its place — its panner — and, when its row states some `air`, to its reverb
send as well ([0173](0173-a-cue-happens-somewhere.md)): one extra `connect`, into a `GainNode`. The
recorder logs every connection a short buffer makes, and the guard called anything that was not a panner
a bypass. So it goes red whenever a cue with a send sounds in the guard's 1.2-second window —
twenty-three rows state some `air` — and load decides which cues land in that window. **An intermittent
guard had found something ([0044](0044-an-intermittent-guard-is-measuring-the-wrong-thing.md)): the
quantity was wrong,** not the code. The failure was not reproduced; this is the mechanism that fits it —
one extra `GainNode` in thirty connections, from a game whose cues are wired exactly this way.

## What changed

The recorder logs each cue connection with its source's id too, and the guard groups them: every source
must reach a `StereoPannerNode`, and may reach anything else beside it. A send is a `GainNode` and so is the
master, so the type of the second connection could not have told them apart — whether the source ALSO
reached a panner is what does.

## That it still fails

0127's six probes, re-proved on this change, each red — among them `source.connect(place)` wired to the
master instead, which is a source reaching no panner at all.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
