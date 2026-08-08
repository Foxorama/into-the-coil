# The batch flown — 2026-08-08

**Six decisions had landed since the third play-test and not one of them had been flown.** This is the
verdict on all six, taken on `into-the-coil.pages.dev` at
[ad06615](https://github.com/Foxorama/into-the-coil/commit/ad06615) — the build carrying
[0077](../docs/decisions/0077-a-pickup-arrives-rather-than-stopping.md),
[0078](../docs/decisions/0078-the-sky-moves-a-third-faster.md),
[0079](../docs/decisions/0079-a-death-is-a-beat-and-the-arsenal-goes-up-with-the-ship.md),
[0080](../docs/decisions/0080-the-box-is-the-screen-and-the-screen-is-16-9.md) and
[0081](../docs/decisions/0081-what-the-player-must-tell-apart-is-told-apart-by-more-than-ink.md).

⚠️ **It is written down because it is SHORT, not despite it.**
[0029](../docs/decisions/0029-the-tracked-record-is-the-record.md) — a report is a committed file
because chat evaporates. A verdict of *nothing to report* on six unflown decisions is worth exactly as
much as a list of complaints: it is what closes them.

---

## What was staged, and how it was checked

`docs/state-of-play.md` had been holding the accumulation as its loudest warning — *"NOTHING LANDED
SINCE THE THIRD PLAY-TEST HAS BEEN FLOWN, AND THAT IS NOW SIX DECISIONS DEEP"* — and naming a
play-test as the next thing that should happen, ahead of chunk 5.

⚠️ **The build was confirmed to be the one under test before a hand touched it**, per
`docs/machine.md`'s byte-count check and the memory of a play-test session spent on staging wondering
why the ship would not move:

| | bytes |
|---|---|
| `dist/index.html`, built locally from `main` at ad06615 | 128,228 |
| `https://into-the-coil.pages.dev/` | 128,228 |

Byte for byte, which `docs/machine.md` says is exact on `*.pages.dev` and is not on the custom domain.
`next.intothecoil.vulpecula.games` measured 129,166 — the same page plus the 938 bytes of
`cdn-cgi/challenge-platform` the Cloudflare zone injects, and its `pointercancel` marker was present.

## The verdict, verbatim

> *"I've played through it, not much feedback at the moment except the ship now takes on a new
> appearance with upgrades and it looks good. aside from that I'm happy to carry on with the rest of
> the changes and then test and report"*

## What that closes

`docs/state-of-play.md` listed four things *"only a hand can judge"*, each with a number behind it
that nothing asserts. All four were in front of the player and none of them was reported:

| | what was owed | outcome |
|---|---|---|
| 1 | **the death beat** — 48 steps, eight tenths of a second, several times a run; *"too long is a tax and too short is not a beat"* | not mentioned. 48 stands |
| 2 | **the pyre** — the ring at the wreck, never seen in a still because it lives a fifth of a second and `scripts/shot.mjs` could not land on it in six attempts | not mentioned |
| 3 | **the box** — the ship now reaches 88% of both axes, at the named cost that a ship at its forward wall has almost 8 units of shot range against 30 before | not mentioned |
| 4 | **the two bullets** — a pink square at 2.6 units against the player's orange disc at 1.8, never seen in a still because `shot.mjs` walks an unattended run | not mentioned |

⚠️ **Silence on 1 and 3 is the useful half of this report.** Both were landed with an explicit
prediction that they would be reported back as bugs — 0079 says a death beat that is too long reads as
a tax, and 0080 says the short shot range at the forward wall *"is the thing most likely to be reported
next as a bug."* Neither was. That is not proof the numbers are right; it is the first evidence either
of them has, and both had none.

⚠️ **And silence is NOT a verdict on 2 and 4.** The pyre and the pink bullet are things a player either
notices or does not, and *not mentioned* is the same reading as *never appeared*. Both remain unseen in
a still for the rig reasons their decisions state, and neither is closed by this.

## The one thing reported, and it is 0081's first evidence

> *"the ship now takes on a new appearance with upgrades and it looks good"*

⚠️ **That is the exact defect 0081 was written to answer, reported fixed by the player who reported
it.** The third play-test's bug 5 was *"Additional autofire and missile upgrades don't change the look
of the player's ship"*, against
[`docs/game.md`](../docs/game.md)'s rule that **every upgrade changes how the ship looks on screen** —
a rule the ship had been breaking from the first pickup to the last since there were pickups.

⚠️ **The rung that earned it is `UPGRADES_PER_TIER`, and it was a guess.** `src/content/pickups.ts`
argues two upgrades per hull tier on the grounds that *"a player who has taken one pickup and seen
nothing change learns that pickups do not change the ship, and never looks again"*, and records that
nothing asserts on it. It now has a hand behind it — at two, the tier arrived early enough to be seen.

⚠️ **It is about to be re-measured and that is worth writing down here.** The pickup taxonomy collapses
the four upgrade kinds into one and cuts a level from 19–24 entries to six, so a player will take far
fewer upgrades over a run. Two-per-tier against a level that hands out three weapon pickups means the
last hull tier arrives around the second level rather than inside the first. The number that was just
validated is validated **against the old density**, and the next play-test is the one that says whether
it survives the new one.

## What it does not settle

**Nothing about chunks 5 to 8.** The verdict is on the batch, not on the game — the third play-test's
eight chunks are unaffected, and the instruction that came with this verdict was to carry on with them.

⚠️ **A quiet play-test is not the same as a good one, and this project has the receipt.**
[`medium-played`](medium-played-2026-08-07.md)'s headline was *"honestly, it was just boring"* with
every guard in the repository green. Six changes drawing no complaint says those six changes are not
in the way; it says nothing about whether the thing they are not in the way of is any good. The verdict
that answers that is the one after chunk 5.
