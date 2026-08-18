# 0170 — A place is audible in its own fight

**Accepted 2026-08-18.** The first authoring change since
[0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md) made the mix answerable to the arrangement,
and the first evidence that **the sameness is not a mix problem**.

> *"The black heart should be a dark symphonic metal track so I don't think we have good level sound
> differentiation yet."*

## The rule

**A place's named character is a VOICE GAIN, not a mix multiplier.** When the layers that make a
place what it is sit under the layers every place shares, the lever is
`src/content/<place>.ts`'s own `note.gain` — and the raise is paid for out of that place's
headroom, one guard failure at a time.

**And `LEADS[place][rung]` names a layer the place is named for, not the loudest one there.**

## ⚠️ The layers the Black Heart is named for were 17 and 19 dB down in its own boss fight

`node scripts/weigh-heard.mjs core --rung=boss`, before:

```
stomp 0 · drive -2 · sub -4 · auraSlow -5 · dread -7 · engine -7 · drone -12
· toll -16 · perc -16 · wraith -17 · auraFast -19 · frenzy -19 · crash -23
```

`wraith` is the howl and `frenzy` is the tremolo at double speed. They are the two layers
`src/content/core.ts`'s own table calls the sound of the place. After:

```
stomp 0 · sub -4 · drive -4 · auraSlow -5 · dread -7 · wraith -7 · engine -7
· frenzy -9 · drone -12 · toll -16 · perc -16 · crash -18
```

## ⚠️ Neither role nor mix could reach them, which is what makes this material

`frenzy` already carried a mix multiplier of **1.911** and would have needed about **8.5** to arrive
— far past `MIX_CEILING`'s 2.6, which
[0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md)'s own header records `arp` being driven into
twice while the wall said nothing. Its **voice** gain was 0.09 against `stomp`'s 0.44.

⚠️ **A role promotion cannot do it either, and the reason is the transferable half.** Role targets
are per-band margins — `ROLE_MARGIN_DB` against `heardAt`'s best window — so promoting a layer moves
what it is measured against, not what it puts out. A layer whose *material* is 14 dB quieter than the
bed is quiet in every band at once, and no ratio fixes a broadband deficit. This is
[0140](0140-no-layer-is-inaudible.md)'s *a gain is not a loudness* read from the other end.

⚠️ **AND IT HAS THE SAME ANSWER AS SIX EARLIER PLACES.** `826eabe` raised voice gains for exactly
this reason in six of the seven. Core was the one left.

## ⚠️ Two decibels of headroom, and the guards priced every raise

Summed peak **2.15** against the clip ceiling's **2.17** —
[0167](0167-a-build-does-not-duck.md)'s own measure, the peak of the summed waveform rather than the
sum of the gains. Three failures, in order:

| paid with | what went red | what it cost |
|---|---|---|
| `drive` | 0147's band balance — core's bottom thinned to **26.7%** against a **28%** floor | reverted; `drive` carries low, and low was not the surplus |
| `call` and `crash` | `drive` went adrift at `boss` | it did not; see below |
| — | 0164's shrink direction demanded three deletions from `STILL_ADRIFT` | the list is three shorter: **91 → 88** |

⚠️ **THE SECOND FAILURE WAS NOT A MIX FAULT AND FIXING IT AS ONE WOULD HAVE BEEN WRONG.** `drive`
read adrift at `boss` because the newly audible layers mask it — and the cause was that
`LEADS.core.boss` still said `drive`, a layer near the top of every place in the game. What core's
own fight follows is `frenzy`. Changing the *lead* is the fix; raising `drive` back would have
undone the change to keep a claim nothing had checked.

## ⚠️ It does not fix cross-level sameness, and the number says so

`node scripts/weigh-apart.mjs` puts core-to-saurian at **3.1 dB**, down from 4.0 — **closer**, because
the layers this raised are layers saurian also has loud. The place now sounds like its own brief and
is no further from its neighbours.

⚠️ **THAT IS THE FINDING, NOT THE SIDE EFFECT.** `weigh-apart`'s own closing line has said it since
2026-08-13: *the top of every mix is a sub, a kick, a bass and a pad, which is the same four sounds in
all seven.* A per-place raise moves a place's quiet third up into a top that is shared, so it can make
a place vivid and cannot make two places different. **Differentiation is seven authoring jobs at the
material and the ladder, not a mix pass** — [0162](0162-a-place-has-its-own-ladder.md) is the
mechanism and it is still empty.

## Confirmed, not assumed

- `npm run typecheck` clean; `npm test` green, including `tests/themes.test.ts`'s clip guard, 0147's
  band balance and 0164's shrink-only `STILL_ADRIFT`.
- The two rankings above are `weigh-heard`'s output on the tree before and the tree after.
- Two probes, seen red, trees restored: `node scripts/prove-guard.mjs 0170`.

| broken on purpose | went red |
|---|---|
| the howl's material back at the gain that left it 17 dB under core's own boss fight | `0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT` |
| core following `drive` in its own boss fight again — a layer loud in all seven places | `0164 — NO LAYER SITS A WHOLE ROLE UNDER THE ONE THE ARRANGEMENT GAVE IT` |

⚠️ **AND THREE MORE GUARDS WENT RED FOR REAL ON THE WAY**, in the table above — 0147's band balance,
0164's adrift list in its shrink direction, and the clip ceiling — which is
[0005](0005-a-guard-must-be-seen-to-fail.md)'s requirement met by the work rather than by a
rehearsal.

⚠️ **AND NOTHING HERE HAS BEEN HEARD.** It is a measured change to what a meter reports about a fight
nobody has flown since. [0027](0027-measure-the-picture-not-the-model.md) is the standing warning and
it applies to this document.

## Rollback

Shipped audio. `src/content/core.ts` voice gains for `crash`, `frenzy` and `wraith`; three
`THEMES.core.mix` multipliers; `LEADS.core.boss`. Revert the commit. No storage key, save schema, SW
cache prefix or origin.
