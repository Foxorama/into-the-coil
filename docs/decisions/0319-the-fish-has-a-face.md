# 0319 — The fish has a face

**Status:** accepted
**Builds on:** [0285](0285-the-mouth-is-alive.md) — the six frames; [0318](0318-the-fish-is-drawn.md) — the hull they are worn on
**Tests:** [0282](0282-a-mechanism-for-every-instance-makes-them-one-instance.md) — *the day a second creature could not wear this is the day the type was wrong*

## The ask

The second of the four items in *"a fully great graphics pass over the fish and the shoal and kites
and get them up to par with the serpent pass in style."* 0285's own report is the reason it is on the
list at all:

> *"It needs to be aggressively moving its mouth to watch the player's ship moving… it still feels
> like a non-interactive wall object rather than a living space serpent trying to battle the player."*

⚠️ **AND NOTHING IN THAT SENTENCE WAS ABOUT A SERPENT.** The fish is the one end boss that **stalks
onto the player's lane** ([0258](0258-one-pilot-a-level.md)) — it is the boss they spend the whole
fight looking straight at, and until now it looked back with a fixed stare.

## It is six bakes and a row field, which is the test 0285's type had to pass

⚠️ **`wearFace` ALREADY RAN FOR EVERY BOSS AND RETURNED EARLY ON A `null` FACE.** 0285 put `Face` on
the ROW rather than on the chain and said why; this is the first creature to take it up, and **not one
line of `src/app/frame.ts` changed to let it.** That is 0282's shape working as written: a feature
lands on one boss and not the others, and the mechanism is the same mechanism.

| | |
|---|---|
| six sprite kinds | `boss9Up`, `boss9Down`, `boss9Gape`, `boss9GapeHit`, `boss9Shut`, `boss9ShutHit` |
| one row field | `BOSSES.volans.face` |
| frame changes | **none** |

## A mouth seen from above opens ACROSS, not down

⚠️ **THE SERPENT HINGES ITS JAW AND THIS CANNOT, AND THAT IS THE VIEW RATHER THAN A SHORTCUT.** A
hinge is a thing you see in PROFILE. Every hull in this game is drawn from overhead
([0023](0023-the-long-axis-is-the-scroll-axis.md)), so what a fish's mouth does on this screen is **two
mandibles splaying apart with the throat between them**. Same ladder, same three silhouettes, a
geometry of its own — *"the pattern is what we want, the style is what makes the different bosses
unique"*, which is [0313](0313-the-fish-breaches.md)'s own quote about the entrance.

| | |
|---|---|
| `rest` | **byte-for-byte what 0318 shipped.** *"The shape is good"* was said about that silhouette, and a face set is not a licence to redraw the animal |
| `gape` | the mandibles splay to 0.23 across and a notch cuts back to 0.85 along, with a tapered gullet behind it |
| `shut` | the point stays where it is and the cheeks pack out to 0.17. **It must not lengthen** — a snap is not a lunge |

⚠️ **AND ONLY THE SNOUT IS WRITTEN THREE TIMES.** `VOLANS_BODY` is one list; the mouth is the only
part of the hull that moves. `paintSerpentHead`'s own note is the reason: *"three authored jaws is
three sets of coordinates to keep in step, and the day one of them gains a tooth the other two do not
is the day the animal flickers."*

## Three things the photographs changed

- ⚠️ **THE GAPE'S NOTCH REACHED BACK PAST THE EYES.** Cut to 0.74 along, it ran behind the eye at 0.8,
  and `tests/accents.test.ts` reported the eye's own dark ring 3.42px outside the hull — the fish was
  looking out through its own open mouth. The apex is at 0.85 now, forward of everything.
- ⚠️ **THE THROAT BAKED AS A DARK RECTANGLE PARKED BETWEEN THE EYES.** Held at an even width it read as
  a hole in the paint rather than a depth in the animal. It tapers from the notch to nothing now,
  which is what a throat seen down is.
- ⚠️ **AND THE PUPIL TRAVELS 1.8 PIXELS, WHICH IS AS FAR AS AN EYE THIS SIZE ALLOWS.** At 42 units the
  eye is 5.3px across and its pupil 3.3px, so a pupil that stays inside its own eye cannot move more
  than 2px. Sliding the whole eye was measured and refused: at rest it already sits 0.011 of the
  radius off the outline, so it has nowhere to go. **The serpent ships the same fidelity on a smaller
  head**, and whether it reads at speed is a play-test question and not a guard's.

## What is held, and the one guard that is new to this repository

Three, all in `tests/volans.test.ts`, and the first two are the serpent's claims asked of a second
animal rather than restated:

1. **The mouth has three silhouettes and the two throws go opposite ways from rest.** ⚠️ **Measured as
   flesh on a SCAN LINE across the snout and not as the area the outline encloses**, which is where
   the serpent's version of this cannot be copied: a fish opening its mouth splays outward as it cuts
   inward and the two nearly cancel — the three whole-hull areas differ by **under half a percent**, a
   number no player will ever see. What a player sees is how much animal is in front of the eyes.
2. **It answers the pilot and not a clock.** One who cuts across it is snapped at; one who holds a
   lane a third of the span away never sees the snap and is watched instead.
3. ⚠️ **THE GAPE IS THE VOLLEY'S OWN TELL, WHICH NOTHING IN THIS REPOSITORY ASKED BEFORE.** Guard 2
   silences the gun to test the snap; this one lets it fire and asks the opposite question. **A mouth
   that hangs open between volleys means nothing when one comes** — that is *aggressively moving its
   mouth* with the information taken out, and it would pass 0285's report in the letter.

⚠️ **AND THE THIRD GUARD'S FIRST DRAFT READ `fireIn` BACK, WHICH IS THE CODE AGREEING WITH ITSELF.**
`wearFace` gapes when `fireIn <= FACE_GAPE`, so a guard reading that same number would stay green over
any constant at all — [0027](0027-measure-the-picture-not-the-model.md)'s named defect exactly. It is
measured off the **bullet pool**: every step the mouth is open, three or more shots have to leave
within half a second.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0319`:

| broken on purpose | went red |
|---|---|
| the snap drawn as a smaller gape, so the tell and the bite are two degrees of one thing | `THE ASKED-FOR ONE: the mouth has three silhouettes` |
| the bite armed off a step counter rather than off the ship crossing the head | `it answers the PILOT and not a clock` |
| the gape held for the whole cadence, so the mouth is open more often than it is shut | `the GAPE is the volley's own tell` |

⚠️ **AND THE THIRD GUARD REDDENED BECAUSE IT STOPPED LOOKING, ONCE.** Its first draft counted the
last thirteen steps of the window as mouths opened for nothing: they were correct, and the volley they
were telling the player about landed seven steps after the fixture stopped watching. A guard that
reddens on its own window is measuring the window.

## What this deliberately does not do

- **It does not morph the fish between phases.** `Look` bundles a `face` with an `aura`, so this is the
  thing that had to exist first; the morph is the next item.
- **It gives the fish no aura.** 0305's is authored per phase and belongs with the morph.
- **It does not touch the serpent.** `eye` takes a `gaze` argument that defaults to nothing, so eleven
  other callers are unchanged — 0282's DEFAULT rather than a constant.
- **It has not been played.** Photographed at 4× and 8× on the sheet; the pupil's two pixels and
  whether a 20-step gape reads at speed are both play questions.
