# What a role does not buy — every layer the mix does not deliver, in all seven places

**2026-08-18.** The audit [0164](../docs/decisions/0164-a-role-is-a-promise-the-mix-has-to-keep.md)
was built to make possible, run over all seven places so that nobody has to listen to all seven to
find out.

> *"It's probably not going to be just the groove and not just on that level, but a whole bunch of
> sounds and a whole bunch of levels, so if we can identify them all and fix them all, that'd be a lot
> better than me having to listen to each individual segment and then listen to each individual item
> in each segment to identify what's not audible."*

## How to read it

`node scripts/weigh-adrift.mjs [place] [--rung=push] [--all]`. Every row is one layer at one rung:

- **role** — what the arrangement says this layer IS here, with the place's promotion applied.
  `part` is the thing you follow, `counter` sits just under it, `pulse` you can pick out when you
  attend to it, `bed` you feel, `air` you never notice.
- **margin** — what it actually has, in the best band it lives in, on the ear that favours it. This
  is [0152](../docs/decisions/0152-a-layer-is-heard-in-the-sum.md)'s figure and nothing about it has
  changed.
- **want** — what that role asks for, from `ROLE_MARGIN_DB`.
- **adrift** — the difference. The floor is **−5 dB**, the widest step between two adjacent roles, so
  every row below is **performing the role beneath the one it was given**.
- **under** — the single loudest thing in that window, which is the one a hand can argue with.

⚠️ **`tests/themes.test.ts` HOLDS THIS EXACT LIST** and refuses both a new entry and a stale one, so
a fix is recorded by deleting a line rather than by editing this file. The ranking below is what this
file is for; the membership lives in the guard.

## ⚠️ Four layers are two thirds of it

| layer | times adrift | worst |
|---|---|---|
| **drone** | 25 | −12.2 dB (rime `surge`) |
| **perc** | 16 | −9.7 (mire `approach`) |
| **dread** | 14 | −13.5 (rime `bossPeak`) |
| **drive** | 10 | −11.4 (mire `surge`) |
| wraith | 5 | −12.7 (labyrinth `boss`) |
| toll | 5 | −9.0 (core `approach`) |
| frenzy | 4 | −8.2 (labyrinth `boss`) |
| call | 3 | −8.8 (mire `push`) |
| hook | 3 | −7.4 (labyrinth `surge`) |
| crash | 2 | −5.1 (mire `approach`) |
| chords, lead, stomp, sub | 1 each | −5.9 (labyrinth `approach`) |

## ⚠️ And the same three layers are on top, which the previous audit also found

| on top | times |
|---|---|
| **engine** | 15 |
| **sub** | 14 |
| **chords** | 9 |
| lead | 7 |
| counter | 6 |
| auraFast, stomp, wraith | 5 each |
| everything else | ≤ 4 each |

⚠️ **[`what-the-mix-buries`](what-the-mix-buries-2026-08-16.md) COUNTED THE SAME THING TWO DAYS
EARLIER AND GOT sub 21, chords 15, engine 14.** Two audits over different questions, ranking the same
three layers in nearly the same order, is the strongest statement either of them makes: the bed of
this composition is what buries it, in every place, at every rung, and
[0147](../docs/decisions/0147-a-place-is-a-balance.md)'s 259 hand-set multipliers did not move it.

## ⚠️ `drone` fails a floor written to excuse it

The previous audit found `drone` in its worst twenty six times and excused it — *"it is connective
tissue and is meant to be felt rather than picked out"* — and that was correct against a floor that
asked every layer to be audible.

⚠️ **This floor does not ask that.** `drone` is `air`, and `air` asks for −13 dB: *you never notice
this*. `drone` is up to **12.2 dB under that**, in six of the seven places. It is not sitting under
the mix as designed. There is nothing there.

## ⚠️ `dread` is the sharpest single finding, and it is a `part`

`dread` arrives with the approach to the boss and the arrangement makes it the thing you follow at
`approach` and `bossPeak`. It is **8.2 to 13.5 dB** under what that means, in four places, and in
every case it is under `sub` or `engine` in the `low` band — two layers that are not supposed to be
competing with a lead at all.

## The ninety-one, worst first

| place | rung | layer | role | margin | adrift | under |
|---|---|---|---|---|---|---|
| rime | `bossPeak` | **dread** | part | -10.5 | **-13.5** | sub +8.2 (low) |
| rime | `approach` | **dread** | part | -9.9 | **-12.9** | sub +8.0 (low) |
| saurian | `bossPeak` | **dread** | part | -9.7 | **-12.7** | sub +4.9 (low) |
| labyrinth | `boss` | **wraith** | counter | -14.7 | **-12.7** | auraFast +8.7 (hi) |
| core | `bossPeak` | **dread** | part | -9.6 | **-12.6** | stomp +7.0 (low) |
| rime | `surge` | **drone** | air | -25.2 | **-12.2** | sub +21.7 (low) |
| approach | `approach` | **dread** | part | -9.0 | **-12.0** | lead +5.5 (mid) |
| rime | `push` | **drone** | air | -24.6 | **-11.6** | sub +21.6 (low) |
| labyrinth | `bossPeak` | **wraith** | counter | -13.6 | **-11.6** | toll +10.1 (hi) |
| mire | `surge` | **drive** | part | -8.4 | **-11.4** | chords +4.7 (lowmid) |
| rime | `approach` | **drone** | air | -24.2 | **-11.2** | sub +21.9 (low) |
| approach | `surge` | **drive** | counter | -13.1 | **-11.1** | hook +8.6 (lowmid) |
| labyrinth | `bossPeak` | **drone** | air | -23.9 | **-10.9** | dread +18.8 (low) |
| nebula | `bossPeak` | **dread** | part | -7.8 | **-10.8** | wraith +1.0 (mid) |
| mire | `approach` | **perc** | pulse | -15.7 | **-9.7** | toll +11.9 (lowmid) |
| labyrinth | `boss` | **drone** | air | -22.3 | **-9.3** | dread +17.4 (low) |
| core | `approach` | **toll** | counter | -11.0 | **-9.0** | engine +7.0 (lowmid) |
| mire | `bossPeak` | **perc** | pulse | -14.9 | **-8.9** | wraith +11.0 (hi) |
| approach | `approach` | **drive** | counter | -10.9 | **-8.9** | counter +4.3 (lowmid) |
| mire | `push` | **call** | counter | -10.8 | **-8.8** | chords +6.6 (mid) |
| rime | `bossPeak` | **drone** | air | -21.7 | **-8.7** | frenzy +16.5 (himid) |
| saurian | `bossPeak` | **drone** | air | -21.7 | **-8.7** | frenzy +16.3 (mid) |
| nebula | `bossPeak` | **drone** | air | -21.7 | **-8.7** | wraith +14.2 (mid) |
| nebula | `push` | **perc** | pulse | -14.5 | **-8.5** | arp +12.8 (hi) |
| approach | `bossPeak` | **dread** | part | -5.5 | **-8.5** | engine +-0.5 (mid) |
| core | `bossPeak` | **drone** | air | -21.3 | **-8.3** | engine +15.6 (himid) |
| mire | `boss` | **perc** | pulse | -14.3 | **-8.3** | crash +9.8 (hi) |
| rime | `boss` | **dread** | counter | -10.3 | **-8.3** | sub +8.0 (low) |
| labyrinth | `boss` | **frenzy** | counter | -10.2 | **-8.2** | auraFast +4.5 (hi) |
| approach | `boss` | **dread** | part | -5.2 | **-8.2** | engine +-0.5 (mid) |
| core | `boss` | **frenzy** | counter | -10.2 | **-8.2** | auraFast +6.3 (hi) |
| labyrinth | `approach` | **drone** | air | -21.1 | **-8.1** | dread +17.7 (low) |
| rime | `run` | **drone** | air | -21.0 | **-8.0** | call +18.5 (hi) |
| core | `bossPeak` | **frenzy** | counter | -9.9 | **-7.9** | auraFast +6.1 (hi) |
| labyrinth | `bossPeak` | **frenzy** | counter | -9.7 | **-7.7** | auraFast +4.3 (hi) |
| labyrinth | `approach` | **toll** | part | -4.6 | **-7.6** | counter +3.3 (himid) |
| labyrinth | `boss` | **stomp** | part | -4.5 | **-7.5** | dread +0.9 (low) |
| labyrinth | `surge` | **hook** | counter | -9.4 | **-7.4** | counter +7.1 (hi) |
| approach | `push` | **perc** | pulse | -13.4 | **-7.4** | chords +8.8 (himid) |
| mire | `bossPeak` | **drone** | air | -20.4 | **-7.4** | sub +16.5 (low) |
| saurian | `boss` | **dread** | counter | -9.3 | **-7.3** | sub +4.7 (low) |
| core | `boss` | **wraith** | counter | -9.3 | **-7.3** | perc +5.9 (hi) |
| mire | `surge` | **perc** | pulse | -13.2 | **-7.2** | engine +7.8 (lowmid) |
| core | `boss` | **dread** | counter | -9.2 | **-7.2** | stomp +6.4 (low) |
| saurian | `surge` | **drive** | part | -4.1 | **-7.1** | hook +1.5 (lowmid) |
| saurian | `surge` | **drone** | air | -19.9 | **-6.9** | drive +13.4 (lowmid) |
| saurian | `boss` | **drone** | air | -19.8 | **-6.8** | frenzy +14.2 (mid) |
| approach | `approach` | **perc** | pulse | -12.8 | **-6.8** | lead +7.5 (himid) |
| core | `bossPeak` | **toll** | counter | -8.7 | **-6.7** | engine +3.5 (himid) |
| nebula | `boss` | **drone** | air | -19.7 | **-6.7** | stomp +12.1 (mid) |
| saurian | `approach` | **toll** | counter | -8.7 | **-6.7** | drive +3.4 (lowmid) |
| mire | `push` | **perc** | pulse | -12.6 | **-6.6** | engine +8.1 (lowmid) |
| core | `boss` | **drone** | air | -19.6 | **-6.6** | engine +14.2 (himid) |
| labyrinth | `bossPeak` | **dread** | part | -3.6 | **-6.6** | stomp +-0.3 (low) |
| mire | `approach` | **drive** | counter | -8.6 | **-6.6** | chords +3.8 (lowmid) |
| saurian | `approach` | **drone** | air | -19.6 | **-6.6** | drive +13.8 (lowmid) |
| rime | `boss` | **drone** | air | -19.6 | **-6.6** | frenzy +14.3 (himid) |
| approach | `surge` | **perc** | pulse | -12.4 | **-6.4** | chords +8.0 (himid) |
| core | `boss` | **toll** | counter | -8.4 | **-6.4** | engine +3.4 (himid) |
| nebula | `bossPeak` | **perc** | pulse | -12.2 | **-6.2** | wraith +10.0 (hi) |
| approach | `push` | **hook** | part | -3.1 | **-6.1** | chords +-2.3 (lowmid) |
| nebula | `approach` | **perc** | pulse | -12.1 | **-6.1** | lead +9.1 (hi) |
| core | `bossPeak` | **wraith** | counter | -8.0 | **-6.0** | perc +4.6 (hi) |
| mire | `surge` | **drone** | air | -19.0 | **-6.0** | groove +15.7 (low) |
| labyrinth | `approach` | **chords** | bed | -14.9 | **-5.9** | lead +8.7 (mid) |
| nebula | `approach` | **drone** | air | -18.9 | **-5.9** | sub +14.1 (low) |
| core | `push` | **hook** | part | -2.9 | **-5.9** | lead +1.2 (hi) |
| labyrinth | `surge` | **drone** | air | -18.8 | **-5.8** | sub +14.9 (low) |
| saurian | `push` | **call** | counter | -7.8 | **-5.8** | lead +1.1 (mid) |
| saurian | `approach` | **dread** | counter | -7.8 | **-5.8** | sub +4.7 (low) |
| mire | `boss` | **drone** | air | -18.7 | **-5.7** | sub +14.9 (low) |
| rime | `surge` | **drive** | counter | -7.7 | **-5.7** | chords +3.0 (lowmid) |
| mire | `push` | **drone** | air | -18.7 | **-5.7** | groove +15.5 (low) |
| approach | `run` | **perc** | pulse | -11.7 | **-5.7** | chords +9.9 (himid) |
| nebula | `surge` | **perc** | pulse | -11.7 | **-5.7** | lead +9.1 (hi) |
| labyrinth | `surge` | **drive** | counter | -7.6 | **-5.6** | engine +4.6 (lowmid) |
| approach | `boss` | **wraith** | counter | -7.6 | **-5.6** | toll +0.6 (hi) |
| mire | `run` | **call** | counter | -7.5 | **-5.5** | chords +6.1 (himid) |
| labyrinth | `approach` | **drive** | counter | -7.5 | **-5.5** | engine +4.2 (lowmid) |
| nebula | `surge` | **drone** | air | -18.4 | **-5.4** | sub +13.9 (low) |
| nebula | `boss` | **perc** | pulse | -11.4 | **-5.4** | wraith +8.7 (hi) |
| core | `approach` | **perc** | pulse | -11.3 | **-5.3** | engine +7.3 (lowmid) |
| core | `surge` | **perc** | pulse | -11.3 | **-5.3** | engine +7.5 (lowmid) |
| saurian | `push` | **drone** | air | -18.3 | **-5.3** | groove +11.1 (lowmid) |
| core | `surge` | **lead** | part | -2.3 | **-5.3** | counter +-1.6 (himid) |
| nebula | `boss` | **dread** | counter | -7.2 | **-5.2** | stomp +0.3 (mid) |
| mire | `approach` | **crash** | pulse | -11.1 | **-5.1** | counter +10.5 (hi) |
| mire | `run` | **sub** | part | -2.1 | **-5.1** | groove +0.9 (low) |
| mire | `boss` | **drive** | counter | -7.1 | **-5.1** | engine +1.9 (lowmid) |
| mire | `bossPeak` | **drive** | counter | -7.0 | **-5.0** | engine +1.6 (lowmid) |
| mire | `surge` | **crash** | pulse | -11.0 | **-5.0** | counter +10.4 (hi) |

## What is fixed here, and what is not

**Nothing is fixed here.** The guard is what stops the list growing; the repairs are the next piece of
work and are not attempted in the same change, because tuning ninety-one numbers against a floor that
had never been seen to fail is how a threshold gets widened until it means nothing.

⚠️ **AND THE OBVIOUS FIX IS BLOCKED.** [0154](../docs/decisions/0154-the-mix-is-authored-as-intent.md)'s
solve reaches every one of these targets to 0.00 dB, and
[`the-arrangement-holds-the-wrong-thing`](the-arrangement-holds-the-wrong-thing-2026-08-17.md) found
it lurches 8.7–13.7 dB at every section boundary and names what it needs instead: the level solved as
one trajectory, gain held continuous and margin allowed to give. **That is the work this list is
waiting on**, and this file is how its result will be read.

## Confirmed, not assumed

- Every figure from `tests/pace.ts`'s own `adriftAt`, over all seven places and all six fight rungs,
  at `main` d3e0d4e. The guard asserts over the same function, so a printed figure cannot disagree
  with an asserted one — [0029](../docs/decisions/0029-the-tracked-record-is-the-record.md).
- The floor is computed from `ROLE_MARGIN_DB`'s widest adjacent step, not typed.
- The `calm` rung is excluded: the title screen is not a place and `rolesAt` gives it its own table.
- The aura is excluded, on `SOLVED_BY`'s terms — its gain is a distance the player steers (0091).
