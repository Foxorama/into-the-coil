# 0569 — The keepers move about

**Accepted 2026-10-07.** The second half of the play that [0568](0568-the-hangar-opens-out.md)
answers. Amends [0554](0554-unity-leans-on-the-wrench.md)'s `at` and `stands` on a keeper's row,
which are now the keeper's first spot.

## The ask

> *"I want the spaceship hangar with trader - it doesn't have to be in the dorky stand, we can probably do
> something more interesting with them."*

Asked how they should be staged:

> *"make it dynamic and mix it up … after a run finishes the position of the figure can be in a few
> different random locations, behind the stall, working the ship, out for coffee, something else etc"*

## The rule

**A keeper's row lists where they may be found** (`spots`), and after every run the shell draws one for
each keeper. Before any run of a visit they are at their counter, the first spot.

| keeper | at the counter | at the ship | away |
|---|---|---|---|
| **Unity** | on the bench, against the wrench (0554) | standing on the ship's roof, wrench and all — *"Just tightening a few things up top. She'll be right."* | *"Gone for a flat white. Back in a tick."* |
| **MMXXVI** | behind the booth (0556) | looking over the ship from behind it — *"Checking the finish. Hold still — it's nearly perfect."* | *"Out for more paint. Touch nothing wet."* |
| **Cosmo** | behind the stall (0542) | looking over the ship from behind it — *"Just admiring the lines on her. Shop's open — I'll be right there."* | *"Out on a stock run — honesty box is on the counter, friend."* |

- **A spot is the row's own** (0282). Unity is drawn whole, so they can stand on the roof. Cosmo and
  MMXXVI are busts, so they look over the ship from behind it. A fourth keeper writes their own spots.
- **The counter is always there.** Away, it stands empty and the keeper's line says where they are. At
  the ship, a keeper rides the ship's bob.
- **The line** is the spot's, on the keeper's card. Cosmo's says it on arrival in place of a greeting, and
  the shop is open whatever Cosmo is doing.
- **Drawn from a stream of its own** (0021), seeded by the clock once a visit: the shell's to be random,
  and nothing a save or a seeded test reads. A keeper's draw moves nothing else's.

## Not done, and why

**"Something else"** beyond these three wants art: a whole figure for Cosmo and MMXXVI to walk the deck,
or a prop for coffee. The spots table is where they go, one row each, once the art exists. The busts at the
ship show their cut-off shoulders over the roof's line, and that is the first thing to judge in a look.

## What the guards say

`tests/stand.test.ts` (*draws each keeper where their spot says*) checks every keeper's every spot in the
picture: the counter is always drawn; away, the keeper is not; at the ship, within a ship's length of it
and on the screen. Every keeper's first spot is the counter, and every keeper has another with a line.
Its probe draws every keeper at the counter whatever the spot. Two probes, 0550's and 0554's, were
re-anchored on the spot-reading lines.

## What is owed

A look at each spot, especially the busts over the roof, and more spots once there is art for them.
