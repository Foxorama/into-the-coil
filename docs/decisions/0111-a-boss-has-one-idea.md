# 0111 — A boss has one idea, and the picture mentions its phases

**Accepted 2026-08-11.** Item 8 of
[the-ninth-play-test](../../reports/the-ninth-play-test-2026-08-10.md), and the shared half of
`docs/state-of-play.md`'s chunk 8.

## The rules

**A boss's MOVEMENT and its ATTACK are each a closed union on its row**, and no two bosses share both.

**A pattern is the same pattern wherever the player is** — the same rule
[0110](0110-an-attack-is-a-pattern.md) states for enemies, on the half of the game it could not reach.

**A phase change is an event, so something has to remember it.** A phase is derived from health; the
difference between two consecutive answers is the event, and it lives across steps and not within one.

## What was asked for

> *"level 4 (or it might have been 5) was the only boss with a different attack. The rest of them
> either had thick or thin bullets and that was the only difference. up/down motion, spray attack that
> increases number of bullets as health goes down."*

> *"Bosses need much more dynamic movement as well and they need to have chunks and pieces fly off
> when they change states."* — 2026-08-09

⚠️ **`docs/state-of-play.md` PREDICTED THE FIRST REPORT IN WRITING** — *"what exists is one behaviour
with seven silhouettes on it"* — and it was an accurate reading of `stepBoss`: track a drifting
station, slide across the lane, reverse at the edges, fire an aimed fan. What the table varied was
`station`, `drift`, `patrol`, `shot` and the phase numbers, and
[0101](0101-the-sky-is-a-hurry-and-the-boss-holds-back.md) had driven all seven stations into a
fifteen-unit band. Two axes were left that a player can see: the bullet, and the fan.

## Half of what was asked for already existed and could not be seen

⚠️ **A *"spray attack that increases number of bullets as health goes down"* is `phases[].shots`, and
it has been in `src/content/bosses.ts` since [0040](0040-a-level-is-a-script-and-a-boss-is-its-clock.md).**
The sentinel goes 1 → 3 → 5 shots and the harrow 3 → 5 → 5 → 7 across a widening spread.

⚠️ **IT WAS INVISIBLE BECAUSE THE FAN WAS CENTRED ON THE SHIP.** A spread that follows the player
reads as *one shot with error bars* however many bullets are in it — the gaps are always in the same
place relative to where you are standing, so widening it changes nothing you can act on. **The count
was never the problem; the centre was.** That is why this decision costs one field rather than a
re-tune of every phase in the table.

## Seven ideas

| | flies | shoots |
|---|---|---|
| `sentinel` | patrol | **aimed** — the teacher; a first boss must look at you or nothing below is strange |
| `harrow` | **stalk** | **spray** — comes to where you are, fills where you were going |
| `lattice` | patrol | **wall** — the level about the sides of the lane, laying a hole to be in |
| `shoalMother` | **bob** | aimed — the one the report remembered, keeping its darts and gaining the up-and-down |
| `redoubt` | patrol | **ring** — it barely moves, so what it sends has to be the fight |
| `chorus` | **bob** | **rake** — the level with no gaps, in one word |
| `axis` | **stalk** | **ring** — follows you and fills the screen |

⚠️ **EVERY MOVEMENT ARM IS ON THE `across` AXIS AND NONE TOUCHES `along`, WHICH IS A SCOPE DECISION
AND NOT AN OVERSIGHT.** Six assertions in `tests/level.test.ts` are about where a hull settles and how
much screen it leaves at the near end of its swing — [0061](0061-a-boss-keeps-flying.md) and 0101 —
and a movement that changed its distance from the player would either break them or force them to be
loosened. *"Up/down motion"* is what was asked for by name and it is the axis those guards do not
hold. **A lunge is deliberately not built**; it is a real idea and it costs a conversation about six
guards rather than a table edit.

⚠️ **A `bob` is authored against the CAMERA, exactly as the along-axis drift already is** — a shape in
the world can be authored against and a wobble in time cannot, and the fight has to be the same fight
on a machine dropping frames. **It emits a RATE and not a position**, because the renderer interpolates
between `prevAcross` and `across`: a position assigned in `stepBoss` is overwritten by the integrator
on the same step and the hull sits still. That is one of the six probes.

⚠️ **The phase scales a bob by dividing its WAVELENGTH, never by widening its amplitude.** `across` is
a fixed hundred units on every device ([0023](0023-the-long-axis-is-the-scroll-axis.md)), so a later
phase that swung wider would put the hull off the lane. Faster over the same span is what escalation
means here.

## The phase change, which no channel mentioned

⚠️ **[0036](0036-an-event-the-model-knows-about-the-picture-mentions.md) UNAPPLIED ON THE MOST-WATCHED
EVENT IN A LEVEL.** From the step a phase turns over, the boss fires wider, faster and flies
differently — and nothing on screen or in the mix said so. 0036 records three separate play reports of
exactly this shape being filed as collision faults that did not exist.

⚠️ **A PHASE IS DERIVED FROM HEALTH, SO THERE IS NO MOMENT THE MODEL STORES.** `phaseFor` is a pure
function and that is right for deciding what the boss does; an *event* needs a memory, which is
`bossPhaseAt` on the world — an index, so the world stays plain data
([0017](0017-the-state-is-slices.md)).

⚠️ **THE FIRST DRAFT READ THE PHASE EITHER SIDE OF `stepBoss` AND A GUARD CAUGHT IT.** Health does not
change there — collisions are resolved later in the step — so the two reads were **identical by
construction** and the burst could never fire. It looks completely correct on the page. It is one of
the six probes, and the guard that found it drives a damaged boss through the real frame rather than
asking `phaseFor`, which is the only reason it was noticed.

⚠️ **The arrival is not a change and sheds nothing.** `bossPhaseAt` starts at −1, so the transition
from *no boss* to *phase one* is suppressed. The guard's own fixture reported zero until it stopped
damaging the hull on the spawn step, and that is written into it.

## A hand-kept list of four names had gone wrong in both directions

⚠️ **`tests/sound.test.ts` held *everything that ducks is one of `['kill', 'bossDown', 'blast',
'death']`*.** [0109](0109-a-death-is-a-drum.md) took the duck off `kill` and this decision put one on
`bossPhase`, so the list was wrong at both ends inside two decisions — and it was standing in for a
rule nobody had written down.

⚠️ **THE RULE IS *A CUE DUCKS EXACTLY WHEN IT OUTLASTS A BEAT*, and it is 0109's length rule from the
other end.** A cue shorter than a beat is punctuation: two of them are two events, the ear places them
in the bar, and the music must not move for them. A cue longer than a beat takes the bar over, and the
music getting out of the way is what makes it read as one event. **Both directions are held**, so a
long cue that did not duck fails as loudly as a short one that did. Driven over the whole table it
separates the nine short cues from the four long ones exactly, and there is no list to keep in step.

## What the proof found

⚠️ **Six probes, six guards, and the decision's own last boss was written wrong first.** `axis` was
drafted with the harrow's movement and the harrow's attack — the mistake a hand makes writing a row by
analogy — and *no two bosses fly the same way AND shoot the same way* refused it before it was
committed.

## Rollback

**None owed.** No storage key, no save field, no service-worker cache prefix and no origin.
`bossPhaseAt` is a number on the per-frame world, which is explicitly not reducer state
([0022](0022-frame-rate-is-a-feature.md)), and nothing about it is serialised.

## What this does not settle

⚠️ **How hard these fights are.** Every phase number is untouched, but a ring puts the phase's shots
in every direction where an aimed fan put them in one — a boss that fired seven at you now fires seven
around itself, which is fewer arriving and more to be inside. Nothing in the repository measures a
fight's difficulty and nothing here pretends to; it is the first thing a play-test should say.

⚠️ **A LUNGE**, named above and deliberately deferred with its cost stated.

⚠️ **Whether a phase should change what a boss LOOKS like.** `src/content/sprites.ts` rejected three
silhouettes per boss on the argument that a phase is legible in motion — which is more true now than
it was — and names the gap it leaves: nothing says how much boss is left. The burst is a change
*marker*, not a health bar, and that gap is still open.

⚠️ **The per-boss sessions the player asked for are still available and are now cheaper.**
`docs/state-of-play.md` records the instruction — *"might even do a separate session for each
individual boss to keep them unique and interesting"* — and this decision is the shared machinery it
said should land once first. What a per-boss session now edits is one row.
