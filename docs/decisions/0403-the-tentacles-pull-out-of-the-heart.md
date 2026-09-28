# 0403 — The tentacles pull out of the heart

**Accepted 2026-09-28.** The jellyfish has five tentacles, each a body of eight lengths. They lie in
the heart's arteries until the fight's camera is still, then pull out and wave. They sting, and they
take hits for the bell. Each fires its laser from its tip, and the five fire as one jagged formation.
**Amends [0388](0388-the-laser-is-jagged.md)**: the jellyfish's lasers were held straight, and now
they jag, all five `together`. **Raises [0286](0286-a-serpent-runs-off-the-screen.md)'s worst case**
on its own line: 632 → 646.

## The ask

> 8. when the player gets to the screen, the jellyfish tentacles need to 'pull out' from the background
>    where the arteries of the heart are and start waving around.
> 11. the lazes fire from the tentacles is a jagged formation like the updated pteradactyl and hydra,
>     there's still 5 that fire, but they need to be jagged so that there's a safe gap.

Asked whether touching a tentacle hurts the ship: *"They sting."*

## The rules

**A tentacle is `nodes` bodies in `bossBody`** (`BossRow.tendrils`), laid every step down the line from
its `root` on the bell's margin to its tip. A wave runs down it, growing to `sway` lane units at the
tip, each tentacle a little out of step with the next. As a hydra's head is ([0384](0384-the-hydra-stands-in-the-acid.md)),
a hit on one is spent on the hull at the row's `hurt`, **here all of it**. A ship that touches one is
hurt as it would be by the hull.

⚠️ **The first draft passed half, and that doubled the fight.** The tentacles hang between the ship
and the bell, so nearly every frontal shot meets one first. At half, the fight would have run at about
half the damage [0386](0386-every-phase-is-fought-for-as-long.md) banded its phases against. The
player's answer was *they sting*, and a shot on the animal is a shot on the animal. Each length is drawn at its thickness there and turned to the next one out.
They overlap with no outline, so eight read as one tentacle.

**They lie in the arteries and pull out when the room is still.** Tentacle `k` lies along artery `k`,
down the same curve the painter lays the vessel, until the step the camera comes to rest. It then eases
off it into its hanging place over `draw` steps. **It stings only once it is out**: a thing sweeping out
of the background across the ship is not something to dodge. It can be shot throughout, as the bell
can.

**A tentacle fires from its tip, and straightens to.** Beam `k` of a volley leaves `tips[k]` across the
lane and `reach` down it: the throw sets the root there (`beamRootOf`) and `pinBeams` keeps it there. While
a volley is held, `tendrilBrace` eases to one over `brace` steps and the wave with it to nothing, so
each tip sits on its laser when it burns.

**One zigzag a volley** (`together`). Five beams each jagged their own way close on each other wherever
two knots swing inward, and the room left is whatever the dice left. One seed for the volley puts the
same knots on every beam, so they bend as one and the room between two neighbours is their spacing less
their widths, the whole way down. The tips are thirteen apart: nine lane units of room at the thicker
hold. **Eleven was tried first**, and on the bench the beams' glow closed most of each gap even where
the hurtbox left it open. They are warned for 0.4 s rather than 0.2, because a zigzag has to be read
before it is dodged.

**Forty entities where the serpent's twenty-six were the most.** Eight lengths a tentacle is what bends
as a tentacle rather than as a chain of rods. `bossBody`'s capacity is `TENDRIL_SLOTS`, and the budget
grows by fourteen blits on 0286's line, *one boss that is many*.

## The guards, and that each was seen to fail

`scripts/probes/0403-the-tentacles-pull-out-of-the-heart.mjs`, in `tests/medusa.test.ts`:

| guard | the break |
|---|---|
| *THE TENTACLES, DRIVEN: … harmless until the room is still and they are out, and stinging after* | stinging from the start; never stinging |
| *THE LASERS FROM THE TIPS, IN ONE ZIGZAG* | the beams from the hull's centre; a seed a beam; the brace ignored |
| *IN LANE UNITS: the room between two neighbouring lasers is a ship's width and more* | the tips back at six apart |

`tests/quetzal.test.ts`'s *every laser … jags* now holds the jellyfish's too, and that they fly together.

## Not held by any guard

**Whether the pull-out reads as tentacles coming out of the vessels, and whether the formation reads as
dodgeable in the time it is warned.** Owed a play.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md).
