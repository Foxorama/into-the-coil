# The play-test of 2026-10-18

Three handwritten pages, sixteen notes. This file is the pages read into the game's terms, checked against what
the code does, pressure-tested, and queued. What each change decides lives in its decision once it lands; this is
the queue — the shape [`the-secret-pilots-planned`](the-secret-pilots-planned-2026-10-11.md) gave the last page.

**What is built is in *Landed*, and it is the decisions'.**

## The ask

> *"Latest play test feedback, there's a bit so take your time and work through it carefully"*

## The pages, as read

Photographs of three lined notebook pages. The transcription is a reading of handwriting; a word marked *(read as)*
is a guess, and the guess is said.

| # | heading | line on the page |
|---|---|---|
| 1 | Menu | *"R + B buttons for pilots on all screens"* |
| 2 | Mini-boss | *"remove placeholder graphics with miniboss art"* — *(read as)* replace |
| 3 | Ships | *"update boring blocky gun + missiles with nice art"* |
| 4 | Ships | *"spinny wheels should be faster/slower like the thruster when moving"* |
| 5 | Ships | *"all thrusters should be at the same size → set to max current size"* |
| 6 | Ships | *"weapons need right control stick — catherine wheel, paint gun"* |
| 7 | Ships | *"why does the weasel take off its pants when it gets into the hamster ball"* |
| 8 | Ships | *"water gun special → end needs to be a bit wider + splashier"* |
| 9 | Ships | *"sideview of the Lil Caddie has the spinning lights playing in front of missiles"* |
| 10 | Hangin' Out | *"need a wall section for the cockpit to hang from + some tool/work benches beneath it"* |
| 11 | Hangin' Out | *"Unity, MM, Cosmo's can be standing in front or beside it for moving positions"* |
| 12 | Serpent Boss | *"Roots need to be Rootier"* · *"Roots are walls"* |
| 13 | Serpent Boss | *"Serpent boss dies + takes out a section of roots as it falls off screen clearing a path for the player"* |
| 14 | Pteradactyl Boss | *"Lazers need a chargin hum for their line appearance — then a lazer zap + hiss for the hit"* |
| 15 | Pteradactyl Boss | *"needs to apply to all lazers"* |
| 16 | Enemy Bullets | *"colour is too same across each level — different bullets need some variation in each level"* |
| 17 | Enemy Sprites | *"still look overall a lot like placeholders, can we do something overall with the enemy art"* |

## What was already true

- **No menu screen had a button that changed the pilot.** On the four screens with a pilot band — the title, Hangin'
  Out, Paint & Parts and Cosmo's — the cursor had to be moved onto the faces and along them; on the last two it opens
  below the band. LB and RB turn the tabs (0458, 0548), B is Back, and the triggers were read by nothing on a menu.
- **The mid-bosses are the game's last placeholders, and say so** — `src/render/bake.ts` over `boss3`…`boss7`: *"Still
  placeholders, and the pipeline is still not."* Seven hand-coded primitives (a notched hexagon, three prongs, a
  diamond, a teardrop, a stepped slab, three circles on a bar, three rings), each with one or two plates, a motif and
  an eye. The end bosses run to hundreds of lines each.
- **The blocky gun and missiles** are, on the cars, the bike and the duck, `paintTurrets` — a shaded box and a band
  with the missile's nose poking out — and the fighter's pulse and the estate's shuriken launcher, each a shaded
  rectangle and a seam. The caddie's pods and ray gun are already drawn.
- **A spinner turned on the run's clock alone**, and the flame beside it has three states off the stick.
- **In the fight every ship's flame is one bitmap, already the same size.** The port's — the pad and the intro — is
  baked in each ship's box and blitted at the ship's size, and the saucer is drawn 1.39 times larger, so its flame was
  the largest.
- **The right stick steered the ray alone** (0588), through 22.5° either side.
- **Unity in the ball wore a vest and nothing else**; standing, they wear navy overalls everywhere.
- **The Water Cannon's spray opened in a straight cone** from 1.4 to 4 either side, with three puffs of mist at its tip.
- **Side-on on the pad, the saucer's ring of bulbs was blitted over its own tubes.**
- **The cockpit monitor on Hangin' Out is HTML hung from nothing**: an absolutely placed box at the foot of the stand,
  over bare deck tiles. The keepers stand at five places (the lift, behind, in front, left, right — 0611), drawn again
  after each run; nobody walks.
- **The serpent's roots are five pictures that collide with nothing** (`room.pieces`, 0459). The ship is kept off them
  by its box; shots pass. On its death the body vanishes at once (`wreck: null`), bursts scatter where its head was,
  the two far pieces slide sixty units up the lane over a second and a half, and the camera moves on.
- **Every laser sounded the crash every boss volley shares**, on the step its line was drawn, and nothing when it burned.
- **Five places of seven fired one red-pink-orange family, one ink for every bullet**; two of them under the game's
  contrast floor on their own sky, unmeasured.
- **The enemies were redrawn per place in 0601–0603** — every signature, the swift, and The Approach's eight shared
  bodies. A body is about four or five flat shapes on its hull: no gradient, no rim light, no texture past a motif.

## Pressure-tested

**Item 5 is the pad's, not the fight's.** Measured before anything moved: the fight's flames were already equal. *Max
current size* is the saucer's on the pad, and the change is every other ship's flame grown to it there and in the
intro — not every flame in the fight made bigger, which nobody saw differ.

**Item 7's answer is a regression, not a choice.** 0612 redrew the weasel to stop it reading as a platypus and the
trousers went with the platypus; nothing said they should.

**Item 13 changes what a room is.** A room's pieces are pictures of a bound the ship already has (0335) and collide with
nothing. *Roots are walls* makes them stone the ship meets, on 0349's terms or the assist's `solid` — a new thing a
room can hold — and *takes out a section as it falls* makes a boss's death a thing that changes the room. Both are
the serpent's row's to author (0282), not a rule for every room. It is the largest item that is not art.

**Item 16 is two complaints, and the measurement found a third.** *Too same across each level* and *different bullets
need some variation* are both true; two places' bullets were under the floor too. The hostile hues are scarce — the
player's, fire's, acid's, void's and frost's are taken — so what fits is said in 0626, with what it cost the Aqua Duck's
paint.

**Item 17 is the ask that most risks being answered by a rename.** *Can we do something overall* with the enemy art,
after 0601–0603 redrew every body per place, means the redraw did not reach the bar. A fourth per-place repaint at the
same detail would be the same answer again ([0280](../docs/decisions/0280-a-cheap-mechanism-does-not-rename-the-ask.md)).
What the measurement says is missing is a level of finish every body shares — shading that turns a form, a rim light,
a lit edge, an outline weight that reads as drawn — and that is a change to the shared painter every body goes
through (`drawShared`, `seal`), weighed against 0149's hull containment and 0106's floor, then each body's own detail.
It is planned before it is built, with photographs.

## Read, and decided without asking — each can be vetoed

- **Item 1: the triggers, LT and RT**, on every screen with the pilots. *"R + B"* could be RB, or RB with LB, which
  would mean moving the tabs; 0624 says what the change would be. The keyboard gets no pair.
- **Item 6: the ray's arc for both**, 22.5° either side. The wheel's hanging place swings round the ship while the
  stick is pushed and stays put when it is let go.
- **Item 14: *"for the hit"* is the beam's strike**, the step it burns — the ship being hit already sounds.
- **Item 16: three inks a place**, for spit, lance and flak; every other place-inked shot keeps the place's main one.
- **Item 9 and 10–11 are read as the pad.** The *side view* is the stand behind every hangar tab, the only place the
  saucer is drawn side-on with its lights.

## The queue

One PR at a time from `main` (0033). The first carries items 1 and 4–9, 14–16, which were each small enough to land
together with their own decisions, as the play-test of 2026-10-10's six did. After it, in this order:

1. **The serpent's roots** — items 12 and 13: rootier roots (the art), roots that are walls (the room's pieces as stone
   on the serpent's row), and the death that falls and breaks a section of them, clearing the way on. Gameplay first,
   because it changes a fight; the picture of the roots rides it.
2. **Hangin' Out's wall** — items 10 and 11: a wall section on the canvas that the cockpit monitor hangs from, work
   benches under it, and a place for the keepers in front of it and one beside it, on 0611's terms (one keeper to a
   place, standing whole on the deck).
3. **The guns and the tubes** — item 3: `paintTurrets` drawn as missile pods, and the blockiest guns (the pulse mount,
   the shuriken launcher) as machined parts, on every ship that wears them, photographed on the pad and in the fight.
4. **The mid-bosses** — item 2: seven redrawn as the end bosses were (0264), one at a time, each with its hull held to
   its hurtbox. The largest single piece of art on the pages.
5. **The enemy art** — item 17: planned with photographs first, as *Pressure-tested* says, then built.

## Landed

- **Item 4** — [0618](../docs/decisions/0618-the-spinners-run-with-the-engines.md): the spinners wind up with the burn
  and run down with the brake.
- **Item 5** — [0619](../docs/decisions/0619-every-flame-is-the-largest.md): every ship's flame on the pad and in the
  intro is the saucer's size.
- **Item 7** — [0620](../docs/decisions/0620-the-weasel-keeps-its-overalls.md): Unity keeps their overalls on.
- **Item 9** — [0621](../docs/decisions/0621-the-tubes-ride-over-the-lights.md): the saucer's tubes are laid over its
  lights on the pad.
- **Item 8** — [0622](../docs/decisions/0622-the-water-breaks-at-its-end.md): the Water Cannon's end bells out a third
  wider and throws a crown of splash.
- **Item 6** — [0623](../docs/decisions/0623-the-wheel-and-the-paint-take-the-stick.md): the right stick aims the paint
  gun and throws and swings the Catherine wheel.
- **Item 1** — [0624](../docs/decisions/0624-the-triggers-step-the-pilot.md): LT and RT step the pilot on every screen
  that shows the pilots.
- **Items 14 and 15** — [0625](../docs/decisions/0625-the-lasers-are-heard.md): every laser charges as its line is
  drawn and zaps and hisses as it burns.
- **Item 16** — [0626](../docs/decisions/0626-a-place-fires-more-than-one-colour.md): three inks a place, every one over
  the floor on its sky.
- **Items 12 and 13** — [0627](../docs/decisions/0627-the-roots-are-walls.md): the serpent's roots are rootier and
  are walls to the ship and to every shot, and its body falls through the far wall when it dies, breaking a way on.

## Owed

Each decision's *Owed* names its play. Across them: a play with a pad (items 1 and 6), an ear on the lasers (14), a
look at the pad and the intro (5, 9), a run through the seven places (16), and a fight with the serpent and an ear
on its roots breaking (12, 13).
