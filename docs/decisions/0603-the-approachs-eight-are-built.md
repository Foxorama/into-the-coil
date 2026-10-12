# 0603 — The Approach's eight are built

**Accepted 2026-10-12.** The third of the enemy-art pass [0601](0601-the-signatures-are-their-places-own.md)
opened, on the same ask: *"more level specific enemy sprites per each level and make them look better."*

## What the review found

[0446](0446-each-place-has-its-own-faces.md) gave six places a creature or a machine of their own for
each of the eight shared kinds, and left The Approach's roster as *"the eight drawings every place
used to share"*: a diamond, a triangle, a bar, a half-disc, a needle, a ring, a cross and a chevron,
each a flat primitive with a plate, a strip and an eye. Photographed beside the six other places'
eights, level one — the first thing anyone plays — was the only place whose rank-and-file were
geometry rather than things.

## The rule

**Every primitive is kept, and each becomes a raider's machine inside it.** Level one teaches the
shapes 0081 chose to tell the kinds apart; a new player learns *the diamond holds station, the
arrowhead comes for you, the half-disc fans three* here, so the outline classes do not move. What
changes is what each is built as:

| kind | drawn as |
|---|---|
| drifter | a recon drone: the diamond's sides drawn in, its tail forked over a lit drive |
| lancer | a fighter: the arrowhead with a nacelle at each back corner, a drive in each, an engine bay between |
| weaver | a twin-pod glider: the bar across the lane, a pod at each end with a lit nose, a hub at the middle |
| turret | a gun emplacement: a barrel out of the flat face for each of its three shots, a dark muzzle on each, the dome ribbed |
| charger | a ram: the needle with canards at the nose and an engine block aft, its drive lit |
| warden | a ring station: three armoured lugs where its three eyes look out, the plating jointed between |
| spinner | a rotor drone: each arm's tip a blade hooked the same way round, in shadow, so it says which way it turns standing still |
| sower | a V-bomber: an emitter pod at each arm's tip — its two shots — each a dark mouth and a lamp in the ink that hurts |

**A raider is a ship, so it has a drive**, lit in the place's lit ink behind every one that flies
forward. No row, sprite index, extent, hurtbox, cycle or behaviour moved; the constant and function
names the probes anchor on (`paint: paintCharger },` for 0228's) are where they were.

## ⚠️ What the guards changed

- **The first charger was a torpedo**, fins at its tail, and `tests/faces.test.ts` measured it 1.07 px
  from the Labyrinth's missile — the same model in two places, which is 0446's reported defect. A
  missile's fins are aft; a ram's are forward, where it steers, and the canards put it clear.
- **The first warden's lugs swelled gently off a 0.9 ring**, and came out 1.92 px from the Toxic Mire's
  ring of frogspawn, which is lumps round a ring too. They are squarer and prouder, off a 0.84 ring.
- **Two drive glows ran past the bitmap**: the lancer's, which the wingbeat sweeps 0.16 further aft in
  its second pose, and the charger's. Both sit inboard now, in every pose.
- **The charger's canards carry no paint**: at 0.14 across they are under 0106's 2.5 px on a six-unit
  body, so they are outline only.

## ⚠️ What the picture changed

- **The turret's first barrels were prongs**, 0.15 across under a dark muzzle. They are 0.2.

## Owed

- **A play of level one, at speed** — above all whether the drives' light reads as part of the ship
  and not as a shot, since the lit ink is pink in The Approach. The glow is translucent and sits
  behind the body, where a shot never is, which is the argument and not the evidence.
- Any of the eight is the player's to veto; each is one hull and one paint function in
  `src/render/bake.ts`.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). Art baked at load; nothing persisted.

## The probes it rests on

No new guard, so no new probe: every claim is held by a guard 0149, 0227, 0228, 0410 or 0446 already
wrote, and those are the ones that sent the charger, the warden and the two glows back.
