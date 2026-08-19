# 0182 — A mix number has no band

**Accepted 2026-08-19.** Two constants, one silent clamp and four assertions removed; two probes
retired, four re-anchored. **No number the game plays moves** — every one of the 161 `mixOf` values
is bit-identical.

> *"Are we still having guards or blockers or restrictions limiting sound for no discernable quality
> reason? The music is restricted and has been for ages with gains, sound limits and all sorts of what
> seem like artificial restrictions. Let's remove them so we can get proper sound variability."*

## The rules

**What a place may state in its `mix` is unbounded.** `MIX_FLOOR` and `MIX_CEILING` are gone and
`mixOf` does not clamp. What bounds the mix is the bus, and the clip guard measures it through the
real shaper.

**Nothing asserts that a rung sums louder than the rung below it**, in the shared ladder or in a
place.

**Nothing asserts that a place plays as many notes a bar as level one.**

## What went, and what each was forcing

| removed | what it made true of all seven places |
|---|---|
| `mix` entries within 0.22 – 2.6, clamped silently by `mixOf` | **a balance louder than 2.6 could be typed and could not be played**, with nothing saying so |
| `NO PLACE IS SUBSTANTIALLY SLOWER THAN THE BASE COMPOSITION` (0.9 × level one, every rung) | **no place may be sparse** — no slow enormous place, no quiet menacing one |
| `A WIDER BAND STILL CANNOT FLATTEN THE LADDER` (`run < push < surge`, `approach < boss`, per place) | **every level climbs and every boss is loud** |
| `the level climbs to its own top` (the same sums over `MUSIC_LADDER`) | the same, of the shared ladder |
| a place's ladder value ≤ `MIX_CEILING`, as *"what the desk can express"* | **a wall eight times tighter than the reason it gave** — see below |

## ⚠️ This is [0161](0161-the-shape-of-a-level-is-not-guarded.md)'s table, eight days later, in gain

0161 removed *no rung is thinner than the level's opening* and *the boss is ≥1.5× as busy as the
opening*, and wrote the distinction down: **floors — about whether sound works — kept; shape — a
musical opinion from one round — gone.**

⚠️ **THE SAME TWO CLAIMS SURVIVED IN ANOTHER FILE UNDER ANOTHER DECISION'S NAME.** Counted in notes
they were 0102's density guard and were deleted. Counted in **gain** they were 0147's climb guard and
`tests/music.test.ts`'s *climbs to its own top*, and nobody connected them — because 0161 was written
about section length and these are about level, and neither file mentions the other.

⚠️ **THAT IS THE TRANSFERABLE PART AND IT IS NOT A NEW RULE.** A guard is found by the property it
holds, never by the decision it was filed under. 0161 said *apply the principle to guards we have just
written rather than only to ones we inherited*; what it could not say is *and then go and find the
other spellings*.

## ⚠️ Every one of the four had already told us, in its own comment

**The band.** `src/content/arrangement.ts` recorded it on 2026-08-16 — *"the rule set forbade its own
answer… `arp` reads exactly 2.60 in two places because somebody drove it into the wall and the wall
said nothing"* — and the wall stayed for three more days and three more decisions.
[0176](0176-the-re-based-mix-is-the-mix.md) moved it off the product and onto the hand, which fixed
the large half and left the wall standing. **Three entries were sitting exactly on 2.6 when it came
off.**

**The pace floor.** Set at 0.85, where both its probes reported STILL GREEN; tightened to 0.9, where
the thinnest shipped reading was 0.94. Its own note: *"less than is comfortable, and the alternative
was a guard that did not fire… a place that genuinely wants to be a tenth thinner than level one at
some rung will fail here."* **A guard that is either vacuous or four points off the shipped music has
no setting at which it measures what it is named for.**

**The climb.** Two named exceptions, and a comment explaining that its own red is not an alarm: *"it
is a sum of gains and not a loudness… what a listener has, at a boundary that opens `counter`, `crash`
and `drive`, is 0171's build; what this counts is whether the numbers happen to total more."*
[0027](0027-measure-the-picture-not-the-model.md) — a model quantity that has stopped tracking the
thing it stood for is worse than no guard, because it still passes.

**`climbs to its own top`.** [0114](0114-the-fight-is-a-different-piece.md) took the fight out of it
in so many words — *"a sum of gains is a proxy for loudness that holds only while layers are added"* —
and kept the proxy for every other rung. **The retirement was written and applied to one row.**

## ⚠️ And one of them was a wall with a wrong reason, which is worth its own line

`tests/themes.test.ts` held every value in a place's own ladder at or below `MIX_CEILING` — **2.6** —
on the stated grounds that *a value the desk cannot show is a value nobody can drive back to*
([0129](0129-the-desk-holds-a-value-not-a-multiplier.md)). The desk reaches `DESK_CEILING`, which is
derived and today is **21.94**. The guard was **8.4× tighter than the reason it gave**, against a
table whose largest entry is 1.08, and the honest version of the claim is circular — `DESK_CEILING` is
twice this product's own maximum. What is left is the mechanism: a gain node takes no negative and no
`NaN`.

## What still holds, and it is most of the file

**Floors, on 0161's terms — about whether sound works.** Nothing clips, at any place and any rung,
driven through the real shaper. No layer a rung opens is inaudible
([0140](0140-no-layer-is-inaudible.md)). No layer sits a whole role under the one the arrangement gave
it ([0164](0164-a-role-is-a-promise-the-mix-has-to-keep.md)). A boundary is a build and the arrivals
go up the arrangement ([0171](0171-a-boundary-is-a-build.md)). A rung replaces a real share of what is
playing ([0123](0123-a-rung-changes-the-notes.md)). No place keeps its character in a whisper, and
every place has a bottom and a top ([0147](0147-a-place-is-a-balance.md)).

⚠️ **THE ARRIVAL IS BETTER GUARDED AFTER THIS THAN BEFORE IT, AND THAT IS THE POINT.** What the climb
sums claimed — *a section change is an event* — is held by 0171, which has a **time axis**, and by
0164, which has a **listener**. Both were written after the sums and neither replaced them. Deleting a
proxy whose subject is measured directly is not a loosening.

⚠️ **AND THE LOW BAND SURVIVES WHERE THE PACE FLOOR DID NOT, WHICH IS THE DISTINCTION.** They were one
paragraph and one decision. 0147 turned the low half from *a ratio against the base composition* into
an **absolute band** precisely because *a floor everything is measured against is a target, and a
target is a sameness* — and left the pace half a ratio. [0181](0181-the-floor-has-a-bottom.md) leaned
on the band three days ago to tell an ear it was right; nothing has ever leaned on the pace floor.

## ⚠️ What this does NOT do

**It changes no sound.** All 161 `mixOf` values are bit-identical to seventeen significant figures,
because no entry was outside the band except three sitting exactly on the ceiling, which clamp to
themselves. `tests/themes.test.ts`, `tests/music.test.ts`, `tests/dash.test.ts` and
`tests/arrangement.test.ts` are green unchanged: **145 tests, and the four that are gone are gone by
deletion rather than by passing differently.**

⚠️ **SO THE VARIETY IS NOT DELIVERED BY THIS, IT IS UNBLOCKED BY IT** — which is exactly what 0161
found and is worth saying rather than implying. What was asked for is *proper sound variability*; what
a removal buys is that the authoring pass which produces it does not have to argue with a wall first.
The 54 layers `node scripts/weigh-adrift.mjs` names are still 54.

## What is guarded

| | |
|---|---|
| the bus does not clip, at any place and any rung | ✅ `tests/themes.test.ts`, unchanged |
| a `mix` value is a gain a mixer can set — finite, not negative | ✅ replaces the band |
| a place's ladder value is a gain a mixer can set | ✅ replaces the `MIX_CEILING` cap |
| the product is the hand's row times `REBASE` | ✅ 0176's claim, retitled and re-anchored |
| **how loud a place is, how sparse, and whether it climbs** | ❌ **on purpose** |

## ⚠️ Two probes retired and four re-anchored — [0019](0019-a-probe-must-be-seen-to-apply.md)

**Retired with their guards**, on 0161's precedent:

- 0107's *a theme silencing a layer outright*. Its claim — *a place leans; it does not remove* —
  stopped being true at [0162](0162-a-place-has-its-own-ladder.md), which made closing a layer a
  sentence a place states. The mix floor was guarding a second spelling of a legal choice.
- 0134's *the mixture held instead of running*. It had been re-anchored twice in two days, the second
  time because 0172 made the place faster underneath it.

**Re-anchored:** 0176's three, and 0107's *the mix table stopped being read*. The first of 0176's is
retitled, because *the clamp agrees with the guard* names a clamp that no longer exists; its subject
is unchanged. The second types `0.22`/`2.6` as literals — its whole point is what the retired ceiling
would have cost, so the number is its unit and belongs in the break rather than in the content the
game reads. **687 probe assertions remain.**

⚠️ **AND THE FOURTH IS WHY THIS HARNESS EXISTS, CAUGHT ON THE FIRST RUN.** Taking the clamp out of
`mixOf` removed the `tint` local, so two probes anchored on `return tint * (REBASE…)` could no longer
be applied — and `npm run prove` refused to run the suite rather than reporting green over a break
that never landed. **By hand that is exactly the point at which nothing changes and everything
passes.**

⚠️ **THE TWO CLIMB GUARDS HAD NO PROBE AT ALL AND WERE THEREFORE ONLY EVER GREEN** —
[0005](0005-a-guard-must-be-seen-to-fail.md). That is not why they went, but it is why nothing was
lost by their going: neither had ever been seen to hold anything.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
service-worker cache prefix, no origin. `mixOf` is bit-identical over all 161 place/layer pairs, so
the audio the mixer produces is unchanged; a revert is `git revert` and nothing else.
