# 0305 — The serpent darkens

**Status:** accepted
**Builds on:** [0283](0283-the-serpent-is-a-chain.md), [0285](0285-the-mouth-is-alive.md), [0286](0286-a-serpent-runs-off-the-screen.md), [0304](0304-the-serpent-sprays.md)
**The brief:** [`the-serpent-asked`](../../reports/the-serpent-asked-2026-09-11.md)

## The ask

> *"then when the void blast phase starts it needs to look more menacing and have a dark aura, kind of
> like a super saiyan aura, but dark blue and purple energy and it's horns grow longer*
>
> *and then when the lightning attack phase starts it needs to get a super saiyan red lightning
> flicker through the aura and it's horns grow a bit longer again"*

## What it is

- **A phase may say what the animal looks like.** `BossPhase.look` — the faces its head wears and
  the aura it burns with — required, `null` on every phase but the serpent's last two.
- **The horns grow.** The same seven faces twice more, their horns half again as long at the void
  phase and twice as long at the lightning phase. Only the horns change; the skull is `boss8`'s own
  drawing in a bigger box. Every face wears its phase's horns, or they would shrink each time the
  jaw moved.
- **The aura.** One flame behind every node of the body and one behind the skull: a violet haze the
  animal sits inside, with soft tongues of indigo, violet and blue rising off its whole length. Six
  frames, a new one every three steps, one frame further on from node to node, so the flicker runs
  down the body. At the lightning phase it is six more frames with red lightning forking through two
  of them, so it crackles rather than glows red.

## Why the aura is its own layer

A pool draws in index order and each node covers the one behind it. A flame painted into a node's
own bitmap would lie over the flesh of the node beside it — the flames would smear across the body
they are meant to rise off. So the aura is its own pool, `bossAura`, drawn before `bossBody`, and each
flame is placed where its node is every step, taking the node's previous place too so it interpolates
with the flesh. It is in no pairing.

⚠️ **THAT COSTS THE ENTITY CEILING TWENTY-SEVEN, AND 0286's ARGUMENT PAYS FOR IT.** 515 → 542: the same
line on 0022's list 0286 added, *one boss that is many entities*, argued against desktop (0153) —
twenty-seven more blits of a baked bitmap, on the serpent's last two thirds only.

## Why the horns are frames and not a transform

`blit` cannot deform. A longer horn is a second drawing — the same conclusion 0285 reached for a jaw.
The horns are one description (`HORNS`) spliced into the skull, and a horn grows along its own rake
from between its roots, so a longer horn on the same base reads as the same animal becoming more
dangerous rather than as a different head. The box grows because a halo stops at 1.16 of the drawing
radius and a longer horn reaches past `boss8`'s; the frame is scaled back by the box, which is the
ship's tiers' pattern, and the outline keeps `boss8`'s width so the edge does not thicken at the phase
change.

⚠️ **ONE READING OF A HEAD KIND'S NAME.** 0285 derived the jaw from the name in two places —
`startsWith('boss8Gape')` — and both were wrong the moment `boss8Horn2Gape` existed. `skullOf` reads
jaw, gaze, horn length and box once, for the drawing and the hit wash's cavity alike.

## What the photographs changed

The running game at 1280×720, the fight pinned at each phase:

- **The first aura was a purple sawtooth.** A faint haze under five hard-cornered tongues a node came
  back as a crest of spines ruled along the animal's back — 0277's *rootless spines* in a third
  disguise. The haze is what the body sits inside now, thick enough to read below the belly, and the
  tongues are curves through their samples rather than corners, fewer and of very different heights.
- **The first lightning was a faint pink scribble** once the haze was thick enough to be an aura. It
  is stroked wider and brighter now, so red wins against violet at a node's size.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0305`:

| broken on purpose | went red |
|---|---|
| the aura authored and never laid, so the void phase looks like the whole one | `the void phase burns with an aura behind every node and the head` |
| the aura drawn after the body, so its flames lie over the flesh they rise off | `the void phase burns with an aura behind every node and the head` |
| the lightning phase’s horns drawn at the void phase’s length | `the horns grow at the void phase and grow again at the lightning` |
| the flicker not offset from node to node, so the aura blinks rather than flickers | `and it FLICKERS` |
| the bigger box drawn at its own scale, so the whole skull grows rather than the horns | `the horns grow at the void phase and grow again at the lightning` |
| the lightning on every frame of the storm, so it glows red rather than flickering | `and the red lightning is through the lightning phase’s aura` |

The horns are measured in CSS pixels of the shipped screen (0027): how far the traced hull reaches
above the skull's centre is the horns, and how far below is the jaw, which must not move. The draw
order is read off `src/app/mount.ts`, not the fixture's hand copy of it.

Eleven probes elsewhere were re-anchored — every phase row gained `look: null`, the draw order gained
`bossAura`, the ceiling moved, and the cavity reads `skullOf` — and every one of them was re-run red.

## What this deliberately does not do

- **The body's colour is unchanged.** *"Look more menacing"* is answered by the aura and the horns,
  which are what was named; a darker skin in the later phases is a small change if the play asks.
- **The high-contrast palette draws no aura**: it has no skins, and an aura is the most decorative
  thing on the screen.
- **The flames do not turn with the body.** Energy rises; a flame that leaned with the wave would read
  as spines again.
