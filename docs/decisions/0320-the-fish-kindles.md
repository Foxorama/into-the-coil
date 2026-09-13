# 0320 — The fish kindles

**Status:** accepted
**Builds on:** [0305](0305-the-serpent-darkens.md) — the per-phase `Look`; [0319](0319-the-fish-has-a-face.md) — the faces it wears
**Amends:** [0318](0318-the-fish-is-drawn.md) — the halo's outer ring is capped in absolute terms

## The ask

> *"We need the boss to change/morph between phases."*

The third of the four items in *"a fully great graphics pass over the fish and the shoal and kites."*
0305 answered this same sentence for the serpent with **grown horns and a dark aura**. This is the
fish's own version, and the fish's version is **fire**: it is a creature of the Ember Nebula, and at
half health its shot already becomes `flame` ([0248](0248-the-serpent-strikes.md)'s per-phase
shot, on that row since long before the art existed).

⚠️ **SO THE MORPH LANDS ON THE RUNG WHERE THE ANIMAL AGREES WITH ITS OWN WEAPON**, rather than on a
rung near it. That is the difference between an escalation and a costume change on a timer.

## Two stages, and the first one is free

⚠️ **`Look` CARRIES A FACE *AND* AN AURA, AND NOTHING SAYS THE FACE HAS TO BE A NEW ONE.** The first
stage names the row's own faces and changes only what burns around the animal — **zero new drawings of
the fish** for the thing that reads hardest, which is a creature that was cold and is now alight.

| | at | what it costs | what changes |
|---|---|---|---|
| `KINDLED` | half health, where the shot becomes flame | **six ember frames** | the fire behind it |
| `ABLAZE` | the last sixth | eight faces on a second body | fins risen, every light up by half, the fire bigger and quicker |

The serpent buys its own escalation the same way and at twice the price — 0305 spends sixteen faces
and six frames. What makes this two stages rather than one is that the first is free.

⚠️ **AND THE MIDDLE PHASE CARRIES THE KINDLED LOOK FORWARD RATHER THAN DROPPING IT.** A look that
switched off between two phases would read as the fire **going out**, which is the opposite of what an
escalation says. Carrying a phase's state on is 0261's own pattern, and this is it for the picture.

## What grows on a fish is not what grows on a serpent

⚠️ **A SKULL IN PROFILE HAS A CROWN TO GROW HORNS ON, AND A FISH SEEN FROM ABOVE HAS TWO ENORMOUS
WINGS.** What rises here is **fin**: each pectoral's trailing edge into three long swept rays, the
pelvics longer, the caudal lobes drawn out.

⚠️ **AFT, BECAUSE AFT IS WHERE THE ROOM IS.** The leading edge already reaches 1.0 across at the wing
tip and the sprite's own box begins at 1.19 — barbs on the leading edge would have to grow into the
next bitmap of the atlas or not grow at all. Everything grows into the empty quarter behind each wing,
which is also the direction a fin that is streaming would grow.

⚠️ **AND THE GROWN FISH IS THE SAME ANIMAL TO DODGE.** `SPRITE_EXTENT.boss9Barbed` is 42, the same as
the fish's, and the guard checks **twenty stations down the leading edge**: the part a player flies
into has not moved. A boss that grew its own hurtbox at a health threshold would spend four phases
teaching where 42 units of fish ends and then hand it back at the rung where the fight is hardest.

## Two things the photographs sent back

- ⚠️ **THE RAYS WERE A SAWTOOTH FIRST, AND IT READ AS DAMAGE.** Cut as shallow teeth — 0.1 deep and as
  wide as they were long — every notch came back a **bump** and every point a **hook**, because
  `curveLoop` rounds a lone sample. The wing looked torn rather than grown. A ray is three times
  longer than it is wide; that is what makes it a ray, and the notches between them are deep and
  narrow.
- ⚠️ **THE EMBER WAS FIVE CONCENTRIC HARD RINGS AND FOUR SLUGS.** `Pen` has no transform — and must not
  gain one, see below — so an elliptical haze is built out of shrinking ovals rather than a radial
  gradient, and **five of them at a sixth alpha is a target, not a falloff**: every edge was visible.
  Sixteen at 0.045 reach about half in the middle and no single edge is worth a twentieth. The flames
  were slugs because one `scale` on a teardrop shrinks it toward its own root, so the inner layers
  piled into a pale bulb at the base; they taper in **width** and barely in length now.

## `Pen` does not get a transform, and that is the load-bearing refusal

⚠️ **`save`, `restore`, `translate` and `scale` ARE EXACTLY THE FOUR MEMBERS `Pen` LEAVES OUT.** An
elliptical falloff wants the canvas squeezed under a radial gradient, which is two lines and would have
been the obvious thing to write. It is refused: every coordinate `tests/paths.ts` records would become
a coordinate in some other frame, and **every containment claim in the repository is measured off those
numbers**. The harness would go on reporting, quietly, about the wrong space — which is the failure
[0027](0027-measure-the-picture-not-the-model.md) is named for, aimed at the guards instead of the
game. The haze is built out of the kit the halo already uses.

## The halo's outer ring is capped in absolute terms now — an amendment to 0318

⚠️ **A FIXED SWELL WAS RIGHT FOR ONE HULL AND WRONG FOR TWO.** 0318 put the faintest halo ring at 1.12
of the hull; the kindled body's tail reaches 1.05, so the same multiplier put that ring at **1.19 of
the drawing radius** and into the next bitmap of the atlas. `tests/accents.test.ts` caught it on the
first run. The cap is read off the hull the arm was handed — `Math.min(1 + gap, 1.13 / skirt)` — so a
third body cannot reintroduce it.

⚠️ **AND IT STRANDED TWO OF 0318's OWN PROBES**, which `npm run prove` refused to run over rather than
reporting green on. Both are re-anchored and both still break the same thing.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0320`:

| broken on purpose | went red |
|---|---|
| the second stage dropped, so the fish kindles once and never grows | `THE ASKED-FOR ONE: it is drawn three different ways` |
| the fire lit from the first phase, so it decorates the boss instead of measuring it | `the fire is OFF for the first half` |
| the wings grown on the LEADING edge, so the hull a player flies into changes at a health threshold | `the grown body is the same animal to DODGE` |

⚠️ **THE FIRST GUARD WATCHES THE PAIR AND NOT THE FACE.** The first stage of this morph changes only
what burns around the animal, so a guard reading `spriteBase` alone would see two states and call the
middle one missing. What the player sees is the body and the fire together, and that is what is
recorded: `calm/cold → calm/lit → grown/lit`, in order, never going back.

## What this deliberately does not do

- **It does not touch the fight.** Not a cadence, not a spread, not a health number — the phase table's
  behaviour is 0317's and this changes only what those phases LOOK like.
- **`Aura.stride` does nothing on this boss, and that is not a defect.** It is how far a flicker walks
  from one node of a chain to the next, and the fish has no chain: `layAura` gives a chainless boss
  exactly one flame. A field that is inert on one instance is what a shared type looks like when
  [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) is being followed; two `Aura`
  types would drift.
- **It does not redraw the shoal or the kites** — the fourth and last item of the same ask.
- **It has not been played.** Photographed on the sheet; whether a 61-unit fire behind a 42-unit fish
  reads as menace or as clutter on a starfield is a question only the screen answers, and
  [0295](0295-a-ranking-guard-is-a-content-limiter.md)'s *consider what else shares the screen* is the
  thing to look at — the last phase has kites and a shoal on the field at the same time.
