# 0053 — The bomb is the first thing the player spends

**Accepted 2026-08-06.** The last item on the list asked for after the two-level play-test: *"bombs —
the first triggered special. The player starts with 2 and gains one per level cleared. A bomb launches
forward and detonates a set distance ahead of the ship, doing 6× a pulse's damage in a wide blast —
and the blast hurts the player, which is the skill in it."*

It is the first consumer of the input half [0030](0030-input-is-actions-and-needs-no-new-layer.md)
landed and never used, and the first thing to put a number in
[0039](0039-a-run-is-lives-and-a-death-costs-the-arsenal.md)'s arsenal.

## The rule

| | |
|---|---|
| **what a special row carries** | `shot`, `becomes`, `reach` — nullable, because `mines` has no weapon behind it |
| **the bomb** | thrown forward, **in no collision pairing**, spent by its fuse |
| **the fuse** | `reach ÷ speed`, derived. `reach` is 80 world units against the **reference view** |
| **the blast** | 6× a pulse, everywhere inside 34 units, landing **once** |
| **who it hurts** | everything inside it, **including the ship** |
| **an arsenal entry** | `{ kind, charges }` — one trigger per owned weapon, charges on the entry |
| **a level cleared** | one charge for **every** special owned |
| **a death** | back to the **starting kit**, which is 0039's own sentence finally cashing |

## The blast hurts the player, and that is the whole design

⚠️ **It goes through `collideIntoOne` — the same call every other threat in the game uses — rather
than through a check of its own.** So the hit costs exactly what any other hit costs: one shield, or
the life, with the same invulnerable window afterwards
([0050](0050-the-ship-is-one-hit-and-the-shield-is-what-stands-in-front-of-it.md)'s clamp). A separate
path would be a second description of *what a hit is*, and the two would disagree the first time
either moved.

⚠️ **A blast lands ONCE, on the step it appears.** What stays on screen for `BLAST_STEPS` after that
is the ring it left. The alternative — dangerous for its whole life — bills every body inside it once
a step, which is ten times what the row says and only on the frames the screen is fullest. So the way
to be hurt by your own bomb is to *chase* it, which is exactly the mistake the ask wanted to make
possible.

## The bomb is spent by its fuse and hurts nothing on the way

⚠️ **In no collision pairing at all, like debris.** A bomb that detonated on contact would be a
missile with a bigger number; choosing the **place** is the whole of what makes it a skill. Its row
carries `damage: 0` as well, which is the belt to that braces — `src/content/debris.ts` writes its
zeros out for the same reason.

⚠️ **And the guard for that had to assert the bomb SURVIVES, not just that nothing was hurt.** The
first version checked the enemy's health and passed with a pairing added, because a bomb in a pairing
deals its zero damage and is *consumed* — the enemy is unharmed either way, and the weapon the player
spent simply never arrives. `npm run prove` is what said so.

## Where "a fraction of the screen" had to land

⚠️ **The ask states the reach and the blast as fractions of the SCREEN, and
[0023](0023-the-long-axis-is-the-scroll-axis.md) refuses screen-space authoring outright.**
`alongSpan` runs 150 to 240 units by device, so a bomb thrown *halfway up the screen* would be a
longer weapon on a 21:9 monitor than on a phone — the difficulty parity 0023 exists to protect.

So both are authored in **world units against the reference view**: 16:9, 177.8 units along, the
aspect `src/content/levels.ts` is already written for. 80 is a little under half of it; 34 is about a
third of the dodge lane. On the aspect the levels assume, those are the stated fractions; everywhere
else they are the same weapon.

⚠️ **And the fuse is derived from the reach rather than written beside it.** `reach ÷ speed` in whole
steps: a third number agreeing with the other two by hand is the drift this project keeps paying for.

## The blast's picture IS its hurtbox, and the picture caught the mistake

Everywhere else in this game the hurtbox is deliberately smaller than the art — a shooter whose
hurtbox is the whole sprite reads as unfair (`src/content/sprites.ts`). A blast is the one body where
that would be a lie: **the player is inside it too**, and is being asked to judge the edge.

⚠️ **It shipped a fifth too small and no assertion in the suite could have seen it.** Every sprite is
drawn at 42% of its extent — a margin that keeps silhouettes off their neighbours — so the ring drew
at 28 units while the damage reached 34. The extent and the radius agreed; the *drawing* did not.
`scripts/shot.mjs`, firing a real bomb on the shipped page, is what said so.
[0027](0027-measure-the-picture-not-the-model.md), again, and the second time in this batch of four.

## The arsenal is entries, not repeated kinds

⚠️ **Charges live ON the entry, because `src/content/actions.ts` says `special1` and `special2` are
POSITIONS in the arsenal.** Representing two bombs as two entries would put the same weapon on two
triggers and, at three, on none — the third would be past the binding budget and unreachable.

⚠️ **An entry at zero is kept.** The weapon is still owned: it holds its trigger, it appears in the
readout, and the next thing that grants charges finds it. Removing it shuffles every trigger below
it, so spending the last bomb would silently rebind the player's buttons.

⚠️ **A level clear pays the ARSENAL, not the bomb.** *"Gains one per level cleared"* is stated over
the list, so a second special inherits it without anybody remembering to — which is the whole reason
0039 made the arsenal a list rather than a slot.

⚠️ **And a death goes back to the starting kit rather than to nothing.** 0039 says *"back to the
ship's base weapon and starting special"*; `[]` was the placeholder for a game that had no starting
special. What a death costs is everything **earned**, and never the thing the ship came with — which
would otherwise hand a player who has just died the hardest stretch of the level with no answer at all.

## The bug this uncovered in the readout

⚠️ **`dispatch` compared `next.run` to `state.run` after `state` had already been reassigned to
`next`.** A thing compared to itself: the HUD only ever refreshed when the **screen** moved. It looked
correct because both things it showed happened to change at a screen boundary — a death that ended the
run raised the game-over screen, and the lives count updated on the way past.

A charge is the first thing in the game that changes mid-run with no screen anywhere near it, so the
bomb is what made it visible: the player pressed the trigger and watched the count stay where it was.
`tests/hud.browser.test.ts` drives exactly that now, and it is deterministic — press, read the number.

## What was rejected

**A `bombs: number` on the run.** `docs/game.md` names it as a code constraint rather than a flourish:
*"a ship modelled with one special field … makes a second special a rewrite instead of a pickup."*

**Giving `mines` a weapon so the table has no nulls.** [0016](0016-a-hub-enumerates-kinds.md) says a
table forces every kind to answer, and `mines` answers *nothing fires me*. Inventing a second weapon
in the same change as the first is the *product to satisfy a shape* `src/content/ships.ts` refuses for
the character roster.

**A blast that grows.** The painter blits a baked bitmap at the view's scale and has no per-entity
size, so a growing blast is a render change rather than a content one — and a fixed ring at exactly
the damage radius is the more honest picture anyway: it is where the edge *was*, which is the thing
the player has to learn.

## Confirmed, not assumed

`npm run prove 0053` — every guard broken on purpose and seen to fail.

| broken | what went red |
|---|---|
| the blast made harmless to the player, so a bomb is free | `hurts the player, and costs exactly what any other hit costs` |
| the blast left armed after it landed, so it bills everything inside it once a step | `bills nothing twice` |
| the blast spent on the first body it touches, like a shot | `takes six pulses off everything inside it` |
| the bomb put into a collision pairing, so it is eaten before it can go off | `hurts nothing on its way there` |
| the fuse fixed rather than derived from the reach the row states | `travels ahead of the ship and detonates about a reach away` |
| the blast drawn at a size that is not the reach of its damage | `leaves a blast drawn at exactly the radius that does the damage` |
| a death emptying the arsenal instead of restoring the ship's own kit | `a death costs what was earned and never the starting kit` |
| an empty special dropped from the arsenal, so the triggers below it move | `spends one charge per press, and stops at empty` |
| presses latched to one a step rather than counted | `reports every press in a step` |
| a level clear paying one named special rather than the arsenal | `gains one per level cleared, for every special owned` |
| the readout refreshed only when the screen changes, so a spent charge never shows | `follows a spent charge, which changes no screen at all` |

Looked at as well as measured: a real bomb thrown on the shipped page at 1280×720, which is how the
ring's size was found to be wrong and how the readout was found not to move.
