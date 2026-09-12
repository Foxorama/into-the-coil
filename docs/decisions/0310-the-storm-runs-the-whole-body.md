# 0310 — The storm runs the whole body, and the horns fire it

**The lightning phase's aura crackles on five frames of six instead of two, at two thirds the weight;
the horns grow to three times their drawn length; and for the half-second before a strike the crown
discharges between them.**

## What was asked

> *"3. the red lightning flickers need to be across the whole body and a bit more subdued*
>
> *4. the horns need to grow and .5sec before the lightning attack happens, they need to flare with red
> lightning"*

Both are reports against what [0305](0305-the-serpent-darkens.md) shipped, which is the useful part:
every one of them is a thing that measured correct and read wrong.

## Across the whole body — the arithmetic says why two frames was not

`Aura.stride` is 1 and the body is twenty-six nodes, so node `k` wears frame `(t + k) % 6`. With two of
six carrying lightning that is **nine of the twenty-seven flames** lit at any instant, evenly spaced
down the animal. Which *is* across the body in the model — and reads as **a row of sparks**, because
two thirds of the creature is dark at every moment and the lit ones are a regular pattern.

⚠️ **FIVE OF SIX AND NOT ALL SIX, BECAUSE THE WORD WAS *FLICKERS*.** Every frame lit is a constant
crackle. At five, each node goes dark for one frame in six — three hundredths of a second in every
eighteen — and the dark one walks down the body with the stride, so the animal crackles everywhere and
never evenly.

⚠️ **AND *SUBDUED* IS THE SAME CHANGE, NOT A SECOND ONE.** Nine bolts at 0305's weight was a row of
sparks; twenty-two at that weight would be a second aura in red. The glow narrows 0.085 → 0.062 at
0.5 alpha and the core 0.03 → 0.022 at 0.8 — **a single flame is fainter than it was and the animal
carries more light than it did.**

## The horns — the ladder got smaller as the animal got more dangerous

0305 grew them by **half** at the void phase and by a further **third** at the lightning. That is why
the second step did not read: the escalation shrank exactly where it was meant to peak.

At **3** the last step is three times the first. And three is the ceiling of the tile rather than a
taste — `tests/accents.test.ts` refuses a mark past 1.16 of the drawing radius, because that is where
the next bitmap in the atlas begins. Driven against the traced hull:

| growth | reach, in drawing radii |
|---|---|
| 2.8 | 1.056 |
| **3.0** | **1.114** |
| 3.2 | 1.172 — past the bound |

Anything further wants `SPRITE_EXTENT.boss8Horn3` to grow, which costs atlas space and bake resolution
across all eight of that face's frames.

## The flare — a tell inside a tell

⚠️ **IT IS THE HEAD'S AURA FLAME AND NOT A NEW FACE, WHICH IS THE WHOLE ECONOMY.** The head wears seven
faces in this phase (0285) and each has a hurt twin; a flaring variant of every one is sixteen more
bakes of the widest sprite in the game, for a state lasting thirty steps. The aura already carries one
flame for the skull, in a layer drawn before the body — so this is **three tiles and no new faces**, and
the frame chooses between them by swapping one bitmap. The horns are swept back off the crown, so what
shows from behind the head is exactly the arc between their tips.

⚠️ **READ OFF THE BOLT THAT IS ALREADY IN THE AIR, NOT A TIMER OF ITS OWN.** A `rain` bolt is spawned
with `lifeFor = warning + BOLT_STEPS` and strikes on the step that reaches `BOLT_STEPS`, so *thirty
steps before the strike* is `lifeFor <= BOLT_STEPS + 30` — exactly, for every column, on every tier,
with nothing to reset when the boss dies. A countdown stored beside it would be a second answer to
*when does the lightning land*, and 0248's warning is the first.

⚠️ **AND IT SITS INSIDE 0248's FORTY-FIVE-STEP WARNING RATHER THAN IN FRONT OF IT.** The column has
been drawn for three quarters of a second by then; what the flare adds is **now**.

## What the picture cost, twice

[0027](0027-measure-the-picture-not-the-model.md) again, and it earned its keep twice in one evening.

⚠️ **THE FIRST DRAFT PHOTOGRAPHED AS A NEON STAPLE.** Five jittered points under a 0.1-wide stroke:
too few corners to read as electricity and too heavy for any of them to be sharp. Nine segments at
0.038 with a 0.014 core is a filament — which is the thing the player already said they liked about the
gun's own bolts, *"it looks more like lightning with the thinner graphics"* (0302).

⚠️ **AND THE MAPPING WAS WRONG IN A WAY ONLY THE PICTURE SHOWED.** The discharge is placed on the grown
horn tips, which means carrying a point from the skull's authored frame into the flame's — two tiles of
different extents, one of them blitted at a swell. The draft kept a `0.42` that cancels and **assumed
the body diameter was 11 when `SERPENT_BODY_DIAMETER` is 15.7**, so the tips landed somewhere the horns
are not. Measured after the fix: the discharge reaches 1.02–1.08 of the tile's radius against the
flame's own fills at 0.958 — just outside the flame, which is where a horn sticking out of a head is.

## Where the bake and the row have to agree

`paintSerpentFlare` needs to know how much bigger than its tile the head's flame is blitted, which is
`aura.head / SERPENT_BODY_DIAMETER` — **a number on the boss row**. Importing `BOSSES` into
`src/render/bake.ts` would make every sprite in the game depend on the boss table, so the constant is
in the bake and `tests/serpent.test.ts` asserts the two agree. Same shape `src/content/sprites.ts` uses
for the atlas order, and the same reason it gives.

And the guard that the sheet cannot give: **the discharge reaches further from the centre than the
skull's own drawing does**, in world units, across two tiles. `scripts/shot-sheet.mjs` photographs the
flame alone; in the fight the head is drawn over it, so that comparison is what separates *a flare on
the horns* from *a scribble behind the face*.

## What is owed

- **The picture in situ.** Every shot here is of the tile. The head over the flame, at 20% health, in
  the half-second before a strike, is a branch-preview screenshot and nothing else can stand in for it.
- **The aura frames are in `HULLLESS` and so nothing checks their atlas bound.** 0305's own comment
  claims *"the tallest outer tongue stops at 1.1 of `r`, inside the 1.16 where the next bitmap begins
  (`tests/accents.test.ts`)"* — and that guard walks `BODIES`, which excludes them. Measured by hand
  here at 0.958 fills and 1.084 strokes, so the claim is true today and is held by nobody.
