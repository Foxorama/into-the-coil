# 0405 — The surge fires one, down the middle

**Accepted 2026-09-28**, with [0406](0406-a-mid-boss-is-met-armed.md) from the same report. A tube surge — the seeker's Hunt and the forward missiles' Overdrive — adds
**one** charged missile a volley, not two, and it leaves from the ship's centreline between the two
fitted tubes, from a barrel that runs out past the nose. **Amends
[0379](0379-the-specials-are-seen.md)**, which gave each surge a pod on either flank.

## The ask

From a play of every boss after [0391](0391-a-target-takes-a-blade-so-often.md):

> overall the bosses were dying a bit fast … other bosses were very quick, inc minibosses

and, a minute later:

> oh and the big problem was the supercharged missiles, can we make that 1 bonus missile firing in the
> middle of the two regular ones instead of 2 bonus missiles

## What changed

**`pods.count` is 1 on both rows** in `src/content/specials.ts`. Everything else the surge carries —
four times a seeker's damage and twice its fuse, three times a straight missile's and a blade's
pierce — is unchanged: the ask names the count, and the count halves what a surge adds.

**Where a pod sits is `podSide(j, count)`**, one function the frame launches from and the bake draws
from, so the count on the row is the whole of what decides the picture ([0036](0036-an-event-the-model-knows-about-the-picture-mentions.md)).
One pod is the centreline; more spread evenly from flank to flank, which for two is 0379's pair. The
row still says how many (0282) — nothing here makes one the only answer.

**A pod on the centreline launches from `POD_NOSE`, 4.5 units ahead of the ship's centre**, not from
the fitted tubes' `MUZZLE_ALONG`. The surge's picture is drawn in the layer under the ship
([0373](0373-a-special-is-the-guns-own.md)), so a pod launched from the tubes' muzzle — which is under
the nose — would be drawn where the hull covers it, and the missile would appear out of the ship with
nothing on the ship saying where. 4.5 clears the longest nose any ship has (7.8 units, half of it 3.9).
**No pop**: the fitted tubes pop sideways before they straighten (0097); one on the line has nowhere to
pop to.

**The picture is a barrel**, in the surge's ink: from under the hull out to `POD_NOSE`, a collar at the
muzzle, the muzzle lit. A flank pod is still drawn as 0379 drew it, for a row that asks for more.

### ⚠️ And 0379's pods were never drawn where they were launched

The bake converted world units to the sprite frame by the half-extent, `POD_ACROSS / (extent / 2)`;
the frame's unit is `r`, which is **0.42** of the tile. So 0379's pods sat at 3.8 units while the frame
launched them at 4.5. Nothing held it — 0379's "fire from where they are drawn" guard reads the
constant, and the constant was right; the drawing's arithmetic was not. It surfaced here because the
first photograph of the barrel put its muzzle on the nose it was drawn to clear. Both are converted by
`extent * 0.42` now, which is the conversion the bake already uses elsewhere.

## Guards changed, and why

- **`every fitted tube with every tube special`** held the pods at `[-POD_ACROSS, POD_ACROSS]`. It holds
  them where `podSide` puts them, which is where the bake draws them.
- **`never fill the missile pool`**'s floor was half the pool, as the "this measured nothing" check. That
  was sized for four missiles a volley; with three, homing tubes under Overdrive peak at nineteen, which
  is the pods being lighter and not the guard measuring nothing. The floor is now **two volleys in the
  air at once** — what makes the pool's budget a question at all. The ceiling is untouched.
- **0379's probe** *"the pods firing from the fitted tubes"* broke the launch to
  `LAUNCHER_ACROSS * side`; with one pod `side` is zero and so is that, so it would have come back
  STILL GREEN. It now puts the pod in the first tube's place.

## The guards, and that each was seen to fail

`0405, THE REPORTED ONE` in `tests/surge.test.ts`, in the picture's units — where each missile is across
the lane as it leaves, against a ship with both tubes fitted, so "the middle of the two regular ones" is
a thing the volley can be wrong about — and three breaks in
`scripts/probes/0405-the-surge-fires-one-down-the-middle.mjs`:

| broken on purpose | went red |
|---|---|
| the frame placing pods on the flanks whatever the row says | `0405, THE REPORTED ONE` |
| the overdrive firing two pods again | `0405, THE REPORTED ONE` |
| a centreline pod launched from inside the hull, where the barrel is covered | `0405, THE REPORTED ONE` |

0379's seven, re-run: all seven red, the re-anchored one included.

## Not held by any guard

**How the barrel reads in play** — about a unit of it and the lit muzzle stand clear of the nose on a
seven-unit hull, photographed off the sheet (`scripts/shot-sheet.mjs auraOverdrive auraHunt`), never in
motion. And **whether a charged missile down the centreline reads as its own thing** beside the pulse
stream, which is the reason 0097 took the missiles off the centreline: the pod is the surge's ink and
the surge's size, where 0097's complaint was a plain missile. Both are owed a play.

**What the change does to a fight's length** is not measured: `scripts/weigh-boss.mjs` silences the
missiles on purpose, so no instrument here flies a surge against a boss. The report is the evidence,
and the play after this is the check.

No rollback note: no storage key, save schema, cache prefix or origin is touched.
