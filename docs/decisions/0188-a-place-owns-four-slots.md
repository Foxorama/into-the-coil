# 0188 — A place owns four slots, and nineteen of them were telling every place what to write

**Accepted 2026-08-20.** Four layers with no name, no instrument and no role. **Saurian Belt has the
first one in the game**, and it is the only pitch-bend in the whole score.

> *"Can we add different layers? These are the exact kind of similarity issues that are blocking some
> of the differences I want on different levels."*

## The rule

**`ownA`–`ownD` are slots a PLACE gives an identity to.** They are zero at every rung of the shared
ladder and empty in the base composition. A place that opens one states its voices and its role in
`OWN_ROLES`, or `tests/themes.test.ts` refuses it.

## ⚠️ The measurement that made the case

[0186](0186-a-place-has-its-own-gesture.md) built `node scripts/weigh-gesture.mjs` to answer a report
that two instruments both said was already answered. It says **nine of twenty-three slots are filled
the same way** by Ember Nebula and Saurian Belt — same strike rate, same note length, same lowest
note:

```
bass · beat · drive · dread · auraSlow · drone · stomp · lead · perc
```

⚠️ **NEITHER PLACE INHERITED THEM.** `src/content/nebula.ts` and `src/content/saurian.ts` each state
their own, and each arrived at the same instrument: `drone` is a 4.6-beat sustained thing at 55 Hz in
both, `dread` a 4.4-beat sustained thing at 62 Hz in both. **A slot called `drone`, panned centre,
four bars long and given the `air` role can only be one thing** — the name, the position, the length
and the role between them write the layer before an author starts.

⚠️ **SO THE FOUR CARRY NONE OF IT.** Saurian Belt's `ownA` and Rime Shelf's are not two versions of
one instrument; they share a slot in a closed union and nothing else. That is
[0016](0016-a-hub-enumerates-kinds.md)'s rule kept — the union is still enumerable, still exhaustive,
still typed — with the cost paid where 0016 does not reach.

## What a place has to state

| | |
|---|---|
| its **voices** | `THEMES[place].voices.ownA` — the existing per-place table |
| that it **opens** it | `THEMES[place].ladder`, per rung — [0162](0162-a-place-has-its-own-ladder.md)'s lever |
| its **role** at each rung it opens | `OWN_ROLES` in `src/content/arrangement.ts` |

⚠️ **THE ROLE IS REQUIRED AND THAT IS THE ONLY REASON THE TABLE EXISTS.** `roleOf` returns `null` for a
layer the arrangement does not name, and `adriftAt` skips those — so an own layer without a role is a
layer whose audibility **nothing checks**. That is the state
[0172](0172-a-place-opens-with-its-own-four.md) left seven layer-rungs in, which `docs/state-of-play.md`
has been flagging since.

⚠️ **`OWN_ROLES` LIVES BESIDE `LEADS` AND `PROMOTES`, NOT ON `ThemeRow`.** The first draft put it on
the theme row and needed `arrangement.ts` to import `themes.ts` — a runtime cycle between two content
files. The per-place role tables were already in `arrangement.ts`; the fourth belongs with them.

## ⚠️ Two things stayed global, and both are refusals rather than omissions

**Pan.** `LAYER_PAN` is a property of the LAYER — *"a place may change what a layer plays and not
where it is"* — held by a guard in `tests/themes.test.ts` written from Ember Nebula's first cathedral
bell, **49% below 130 Hz at a pan of −0.5 with every guard in the repository green**. Own slots are
centred. A place that wants its own instrument placed has to argue with
[0118](0118-the-mix-has-a-width.md), not route around it.

**Length.** `LAYER_BARS` is four for all four slots, and the number is the resident ceiling's:
`tests/sound.test.ts` holds the loops under **56 MB**, twenty-three layers is **48.0**, and four
four-bar slots is **52.5**. Four *eight*-bar slots is **57.0** and does not fit. That guard's own note
says a change wanting more than 56 MB wants the boundary-baking mechanism instead — **so a fifth slot,
or a longer one, is that conversation and not a number to nudge.**

## ⚠️ Saurian Belt fills the first one, because a mechanism no data exercises is guarded by nothing

`rungIn`'s own header, one table over. `ownA` is a **raptor call**: 1180 → 430 Hz in 180 ms with a
noise chirp under it, twice in four bars, off the beat, never on the downbeat the kick owns.

⚠️ **IT IS UNPITCHED, AND THAT IS WHAT MAKES IT ANOTHER INSTRUMENT RATHER THAN ANOTHER PATCH.** A
pitched voice cannot glide; `from` and `to` are a sweep only for an unpitched one. **Nothing else in
any place's music bends**, so this is the one thing in the score that does.

⚠️ **AND IT IS THE HALF OF THE BRIEF THE GATED CHORD GAVE UP.** Saurian Belt is *a cross between
ancient jurassic and eurobeat techno trance*, split by register — the primeval material melodic and
on top. 0186 turned the chord into a machine, which was right and took one of the melodic parts away.
This answers it back.

⚠️ **IT COST THE PLACE ITS BOTTOM ONCE, AND THAT IS 0140's LESSON ARRIVING AGAIN.** Written quiet, the
call needed **4.2** from the ladder to reach its role, and a multiplier that large on a bright layer
pulled Saurian's share under 300 Hz to **23.5%** — under 0147's floor, on the level whose entire
recent history is its bottom. Louder material at a smaller multiplier renders identically
(`scripts/weigh-material.mjs` measured that in 0167), so what actually paid for it is `sub` and
`engine` lifted at `approach`. **A new layer spends another layer's room** — 0181, third time.

## What is guarded

| | |
|---|---|
| the four are closed at every rung of the shared ladder | ✅ |
| the base composition states no voices for them | ✅ and it is asserted, not merely true |
| a place that opens one states its voices | ✅ `tests/themes.test.ts` |
| a place that opens one states its role at that rung | ✅ — without it 0164 cannot see the layer |
| `OWN_ROLES` names only own slots | ✅ — otherwise it is a back door for demoting `sub` |
| the desk reaches every layer **a place actually has** | ✅ three audition guards, re-aimed |
| **what an own slot IS** | ❌ **on purpose** — that is the whole point |

## ⚠️ What this does not fix

**The nine converged slots are still converged.** Adding instruments does not stop `drone` being the
same held 55 Hz sine in all seven places. `weigh-gesture` names exactly which slots to work on and
this decision touches none of them.

**And it is unheard.** Like 0183's aura ceilings, 0186's gate and 0187's lifted kick, nothing here has
had an ear on it. `npm run dash`.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). No storage key, no save field, no
cache prefix, no origin. Content tables and guards; a revert is `git revert`.
