# 0274 — A place is mixed by ear, and level one is not the reference

**Accepted 2026-09-07**, from a mix session driven entirely from the dashboard once
[0272](0272-the-fader-shows-where-the-layer-is.md) made its faders usable:

> *"Listening to that and the hook is very right ear centered with ear buds, the other music is left
> ear centered, it sounds like a bunch of separate layers instead of a cohesive whole track."*

**Amends [0147](0147-a-place-is-a-balance.md)** for two places, and retires the claim in
[0155](0155-a-place-follows-its-own-instrument.md)'s table that The Approach never disagrees with the
arrangement.

## The rules

**The Approach:** `mix.hook` 1.9 → **0.78**, `mix.lead` 1.4 → **0.74**, `mix.counter` 1.45 → **1.72**.

**Ember Nebula:** `chords` closed at `push`; `crash` is a cymbal; the cymbal lifted at `surge`,
`approach` and `boss`.

**And `LEADS.approach` is no longer empty** — it says `push: 'arp'`.

## ⚠️ The right-hand dominance was volume, not position

Nothing in the pan field moved all evening. `hook` is still +0.55, `lead` still +0.30. The place went
from tilting right to sitting **1.12 dB left** purely by turning two layers down, and the report that
started it — *"a bunch of separate layers"* — was about **`hook` at 1.49 against a median layer-rung
of 0.52**, nine decibels over the middle of the mix and 8.7 dB into one ear.

**What the cut revealed is that the rung holds its own loudness.** Taking `hook` and `lead` out lifted
everything left standing — `perc` 1.92 → 2.09, `counter` 1.07 → 1.38, `crash` 1.17 → 1.28, `groove`
0.94 → 1.02 — with no entry in any table for any of them. *"The reduction in hook and lead has allowed
some of the other unheard instruments to sneak in nicely."* It also means an absolute number cannot be
set and kept: each cut took two passes, because `scripts/solve-hold.mjs` hands part of it back.

## ⚠️ Level one stopped being the reference, and that was a choice rather than a side effect

`LEADS` carried this: *"The base composition. It IS the arrangement, so it never disagrees with it."*
With `mix.hook` at 0.78, `push` in The Approach is led by `arp` at 1.87 against a `hook` of 0.63 —
so [0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md) went red on `approach/push/hook`, correctly:
the mix had stopped delivering a `part`.

Two repairs were possible — put the riff back at that one rung, or let level one name its own lead
like anywhere else — and the second was chosen deliberately: *"Let's go with 2, I'm happy to end the
level comparison status."*

**It changes no audio.** `LEADS` says what a rung is about; every gain is in `src/content/themes.ts`.
What is gone is the claim that one of the seven can be listened to as the neutral case, which had
already stopped being audibly true.

## ⚠️ A layer can be load-bearing for a shape nobody thought of it as serving

Ember Nebula's `crash` was a 1.4-second noise swell with a 0.42-second attack. Reported: *"is the
crash supposed to be cymbals? it sounds like a steam vent noise or something."* The description was
exact and the old comment argued for it — *"a swell and not a hit"* — and a slow rise and fall of
filtered noise with no transient in front of it is what a vent is.

It was replaced by a triangle, which was then deleted too (*"it isn't adding anything useful"*), and
**with the slot empty the place's `surge` came out darker than its `push`** — 231 Hz against 275,
where [0136](0136-the-place-has-a-room-and-an-arc.md) requires a climb of at least 2%. The vent had been
carrying the brightness climb, and nothing said so anywhere. Falling back to the base composition's
`crash` does not fix it either: that one is *"three sounds in 12.8 seconds"*, a quarter of this
place's density.

**So the slot holds what the first report asked about: a cymbal.** 1 ms attack, 13 kHz down to 4 kHz,
on the two strikes the vent used, lifted 1.5× across `surge`, `approach` and `boss` — carried through
all three so [0167](0167-a-build-does-not-duck.md) sees no duck at either boundary.

## ⚠️ And one request was refused by a rule, which is the shape worth keeping

*"Drop chords by about 1/3 in push, from 1.48 down to .42."* `chords` is Ember Nebula's `run` lead and
carries into `push`, so that is **12.4 dB under its own rung** — against 0167's floor of 1 dB, in a
game whose largest reduction of a carried layer anywhere is 0.26 dB. The design's way to say *this
layer steps out here* is [0120](0120-a-rung-may-close-a-layer.md): close it. Closing clears both
guards, and it is what shipped.
