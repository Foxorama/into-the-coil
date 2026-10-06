# 0554 — Unity leans on the wrench

**Accepted 2026-10-06.** A look at the hangar after [0550](0550-every-tab-has-a-keeper.md) merged. Amends
0550's Unity in the port, and gives every keeper's row where they stand at their counter.

## The ask

> *"Least weasel mechanic should be small and standing on the benchtop in overalls. Leaning against a giant
> wrench that is propped up against one of the columns of the trade stand."*

## What was measured first

Off `scripts/shot-menus.mjs` at 1280x720 on `main`: Unity was 0550's bust, Cosmo's size, behind the bench.
Head and shoulders stood about seven units over a counter fourteen high, so a least weasel (the smallest
carnivore there is) read as a person-sized one leaning on the counter.

## The rule

| | |
|---|---|
| **where a keeper stands** | each keeper's own row says it: `at`, where their figure's box is centred against the counter's, and `stands`, `'behind'` (the counter is drawn over them) or `'on'` (it is drawn under them). `STAGE.keeper`, one place for all three, is gone |
| **Unity** | whole, about eight units tall, standing on the bench's timber top in navy overalls over the hi-vis shirt. Legs crossed at the ankle, arms folded, the short brown tail out behind, and the near shoulder against the shaft of a wrench eleven units long. The wrench's ring end rests on the top and its open jaw leans on the post by the pad |
| **the figure's head** | the bust's own (`paintUnityHead`), so the plate and the bench show one face. The bust wears the overalls too: a bib and straps over the hi-vis, which is now orange all over with the silver tape |
| **the bench** | the spanner hung off the post and the one lying on the top are both gone, because the giant wrench replaces them. The oil can moves beside the toolbox at the bar's end, and the pad's end is Unity's |
| **Cosmo and MMXXVI** | behind their counters where they were, now written on their rows: one unit to the bar's side and five up |

## Why it is built the way it is

**On the row, not in the stand.** One shared `STAGE.keeper` point was right while all three were busts
behind a counter. Unity standing on theirs is the first keeper whose place differs, and 0282 says a change
is finished when the thing it added can differ per instance. The draw order differs with it, so it is on
the row as well. The stand's guard now checks the order each row asks for (`tests/stand.test.ts`, 0542's
test), not one order for all three.

**The shoulder is solved onto the shaft, not placed.** The wrench is drawn from two points, ring on the
timber and jaw on the post, so the feet are placed wherever the leaned shoulder meets the shaft's near
edge (`feetAlong`). Changing the lean or the wrench keeps them touching. The two bench numbers the figure
stands against (the top's face and the post's inner face) are written beside it, with the `at` they are
measured from.

**The wrench is in Unity's sprite, not the bench's.** The thing that has to touch exactly is the shoulder
on the shaft, and that holds when both are in one drawing. The jaw meeting the post is a placement, and
the picture shows it at once if it is wrong. The first photograph showed a hair of gap at 1280x720, so the
jaw sits 0.2 units into the post.

**No guard for "small" or "on the top".** The one first written asserted the box's size against the
bench's, and its foot below the timber. The old bust behind the counter passed it too, and its last line
forbade any other keeper from ever standing on a counter, which makes it a content limiter (0295). What
can fail is the order: a keeper on the counter drawn under it is hidden. That is checked, and a probe
breaks it. The rest is the picture, photographed at both shipped sizes.

## What is owed

A look at it. The head is the bust's at 3.6 units across, larger than a weasel's head would be on that
body, so the face reads at a desktop's size. The player may want it smaller.
