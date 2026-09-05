# 0247 — A level has a mid-boss and a real one

**Accepted 2026-09-05**, the same day as [0246](0246-a-seeker-hunts-on-the-screen.md), from
[`the-bosses-asked`](../../reports/the-bosses-asked-2026-09-05.md):

> *"change the current bosses to have about 50% less health and then be mid-level bosses and add in
> the actual real bosses. these'll be first iteration of the bosses, let's see how good we can get
> them, but I expect we'll need to refine and improve them."*

The first of the boss decisions, and the one that gives the rest somewhere to land: the structure,
the roster, and seven hulls on the vocabulary the game has. **Amends
[0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md)**: a level has two bosses, and only
the second is its clock. **Amends [0111](0111-a-boss-has-one-idea.md)**: fourteen ideas, no pair
of flight and fan repeated.

## The rules

**A level carries two fights: a mid-boss inside it and the real boss at its end.** `LevelRow.midBoss`
is `{ kind, at }` or `null`, level-local like `bossAt` and before it. A mid-boss holds station and
must be killed like an end boss — the end boss does not arrive until it is dead, however far the
camera has got — but its death is a beat and not the level's end (`bossBurstIn` in
`src/app/frame.ts`, beside `clearedIn`), and the waves keep coming around it. The frame's boss
state is the current fight's, `fight` 0 then 1, and is reset at the seam on the step the mid-boss
dies. `THE TWO FIGHTS` in `tests/bosses.test.ts` drives both and the seam between them.

**A mid-boss is fought under the section it is in; the fight's own piece is the end boss's.** 0114
wrote a piece for THE fight, and a level with two fights plays it once: `bossOnField` in
`src/app/frame.ts` is what the music reads, and it is false for a mid-boss on the field. `THE MUSIC`
holds it across both fights. The twelve-second floor 0124 sets against the piece is therefore the
end bosses' floor and not the mid-bosses': a mid-boss over in seven seconds at max weapons IS the
miniboss that guard's message names, on purpose.

**The seven bosses the run had are its mid-bosses, at half their health.** The sentinel, the harrow,
the redoubt, the chorus and the axis keep their places; the lattice moves from the Saurian Belt's
end to the Labyrinth's middle, and the shoal mother from the Labyrinth's end to the Saurian Belt's
middle — *"the labyrinth current end boss will be a mid-tier flying dino in the saurian belt"* —
which is why the mid roster climbs through the TABLE and not through the run. Each arrives once
the level's push has begun, three hundred units into it.

⚠️ **Half the health is fewer phases, and that was not a choice.** 0124 refuses a phase under three
seconds at max weapons and 0150 a bared window shorter than the death it runs into; at half the
health, every one of the old tables broke one or both. The sentinel and the harrow are two phases
now, the lattice, the shoal mother and the redoubt three, the chorus and the axis three fans and an
eye that opens at a third of the bar rather than a fifth. The chorus's curtain starts at 0.7 rather
than 0.5, because a curtain is not thrown to a bared boss and the four notches the fight throws
have to sit above the eye. The ideas are the same ideas, said in fewer breaths, which is what a
mid-boss is.

**Seven real bosses, one per place, each a first iteration on the vocabulary the game has.** Their
rows are in `src/content/bosses.ts`, after the seven, each tougher than the last:

| place | boss | flight and fan | health | what its own decision owes |
|---|---|---|---|---|
| the Approach | `jormungandr`, the serpent | bob, wall | 700 | acid blasts, void blasts, lightning from the sky with warning lines |
| Ember Nebula | `hellkite`, the eagle | stalk, aimed | 760 | whips of fire; hordes of kites and raptors summoned through the fight |
| Saurian Belt | `quetzal`, the pterodactyl | patrol, spray | 820 | lasers on the wings; the mouth that opens for one huge beam |
| the Labyrinth | `gyre`, the lattice upgraded | patrol, rake, and the tightest curtain in the game | 880 | the spin: walls at every angle |
| Rime Shelf | `hoarfrost`, the frost ship | stalk, wall | 940 | frost bolts and blasts; the cold that slows and freezes; adds |
| Toxic Mire | `hydra` | bob, spray, a head at every fifth of its health | 1000 | a kind of shot per head: acid, flame, laser, frost, void |
| the Black Heart | `medusa`, the jellyfish | bob, ring, a curtain, and the eye | 1100 | tendrils that pulse lightning; moon jellies that rain down; the rain of void when it opens |

The gyre's curtain is the second half of its ask today — *"the bullet gaps will be close so you
can't fit through them, the spaceship gaps will be the same size"*: a spacing of three against the
chorus's four and a half, and the same fourteen-unit hole. The hydra's heads are its phases: a
head at 80, 60, 40 and 20 per cent, each one more shot in the spray. The medusa's opening is its
bared window. Everything in the last column is a decision of its own, on its own boss, with its own
probe, and they are listed in `docs/state-of-play.md` in the order the brief gave them.

**Each real boss has its own hull, the biggest things in the game.** `boss8` to `boss14` in
`src/content/sprites.ts`, thirty-three to forty-six units, painted in `src/render/bake.ts` as the
thing the ask named — a sinuous band, a spread of wings, a beak and a crest, a cog, a crystal, five
necks, a bell with a fringe — with one shadowed plate, one lit edge and an eye each, and every
mark inside its hull as 0149 holds. Every station, drift and radius keeps the whole hull on the
narrowest view (0061) and the near end of every swing past 55% of the screen (0101), which the
biggest hulls buy with the smallest drifts.

## ⚠️ What was rejected

**Ending the level on the mid-boss too, and making the end boss the next "level".** A level is a
place with a script; a mid-boss is a fight inside it, and the music, the sections and the pickups
that place it would all have had to be cut in two.

**A mid-boss the camera can leave behind.** A fight the player may skip is not a fight, and a boss
that holds station is what the whole boss vocabulary is built on.

**Keeping the mid-bosses' full phase tables at half the health.** Two seconds is not a phase (0124),
and a guard that says so is not a guard to widen for a mid-boss.

**The real bosses' own attacks in this decision.** Seven new attack kinds, five new shot kinds, a
summons, a slow and a multi-part hull in one change is the shape 0033 warns about from the other
side: the largest PR that session merged first try because it was one thing. This is one thing —
the structure and the roster — and each attack is the next.

## What is owed

- **The real bosses' own decisions**, one per row of the table above, in the brief's order.
- **The scripts around the mid-bosses.** Each arrives three hundred units into the push with the
  waves still authored around it; whether a fight inside a wave reads, or the waves want a gap cut
  for it, is a play-test.
- **A picture of each hull at the shipped camera**, and of the mid-boss's death not ending the
  level.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Content, a field on the level row
and the frame's fight state; nothing persisted — the save stores the level reached, and a level
is entered from its beginning.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0247`:

| broken on purpose | went red |
|---|---|
| the mid-boss's death ending the level | `THE TWO FIGHTS: the mid-boss arrives` |
| the end boss arriving at its distance whether or not the mid-boss is dead | `and the end boss waits for the mid-boss` |
| the music turning for the mid-boss | `THE MUSIC: a mid-boss is fought` |
| the Approach's mid-boss authored beyond its end boss | `THE ROSTER: every level has a mid-boss` |
| the axis authored back at its full health, tougher than the jellyfish | `and the old end bosses are the mid-bosses now` |
