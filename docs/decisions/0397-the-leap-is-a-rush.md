# 0397 — The leap is a rush

**Accepted 2026-09-27.** The sound of the fish going through the edge — its entrance, its last-stage
leap, and the breaker it throws — is air and mass: a whoomph, a rush that swells and closes as it
crosses the field, and a low roll of flame. No layer is resonant, no noise is driven, nothing is
sampled-and-held.

## The ask

> the jumping noise when it flies across the screen sounds like something tearing, no idea what it's
> supposed to be, but it doesn't sound good.

## What was measured

[0375](0375-the-breach-has-a-body.md) re-voiced this cue once, moving its weight down, and kept the
two layers that make a tear: a noise *wake* through a lowpass at `q` 2 under 0.36 drive — a narrow
resonance dragged through noise, which is what ripping cloth is — and a sample-and-hold *ember*
crackle. The leap plays it four times in three seconds. `scripts/weigh-cue.mjs` before and after:

| | low | lowmid | mid | himid | hi | air | fall |
|---|---|---|---|---|---|---|---|
| 0375 | 0.72 | 0.55 | 0.85 | 0.93 | **1.00** | 0.31 | −0.7 dB |
| 0397 | **1.00** | 0.58 | 0.60 | 0.34 | 0.27 | 0.05 | −5.4 dB |

The heaviest band moved from `hi` to `low`, and the centroid now falls from onset to tail rather than
sitting flat.

## What changed

The wake, the ember crackle and the bright splash are gone. The whoomph keeps 0375's fall with its
front eased (4 ms → 14 ms: a sine's four-millisecond front is a click, and four clicks in three seconds
is a rhythm) and most of its drive taken off. A **rush** — white noise swelling over a tenth of a second,
its lowpass closing from 1.3 kHz to 300 at `q` 0.55 as it pans across — is the thing going past, and a
**roll** held under 520 Hz is its heat. The row's glue came down from 0.26 to 0.14, because squashing a
noise bed is grit.

One row, so the entrance and the breaker changed with the leap, and 0315's guard that *the breaker
sounds like the edge the fish breached* still holds.

## The guards

0375's — the low and low-mid share at least 0.8, the centroid climbs no more than 2 dB — pass with more
margin than before, and its two probes were re-anchored on the new layers. No new guard: a brighter
breach could be the right call one day, which makes a ceiling on brightness a taste
([0192](0192-a-guard-holds-an-invariant.md)), and the verdict on *tearing* is an ear's.

## Not held by any guard

**The listen.** `leap-before.wav` and `leap-after.wav` were rendered with `scripts/hear.mjs` for it.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
