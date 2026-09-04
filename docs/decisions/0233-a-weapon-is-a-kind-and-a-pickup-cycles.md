# 0233 — A weapon is a kind, and a pickup cycles

**Accepted 2026-09-05.** The first of the new weapons, asked for the same day:

> *"each new weapon needs thematically change the style of the ship so you have a visual indicator of
> the weapon equipped. The weapon power ups need to cycle between the weapons with about a 2sec time
> and they need to hang around and bounce off all the screen walls long enough that the player can
> see at least 2 repetitions of each weapon so that they can make a choice and collect that weapon
> upgrade. If they collect a different weapon upgrade power up, they start from level one with that
> weapon upgrade."*

> *"first new weapon is a chain lightning gun, that jumps to more targets and gets more powerful with
> each upgrade. For single target bosses it needs to arc and bounce and jump around to hit different
> parts of the boss. It needs to be arcing lightning and it needs to look lightning. It needs an
> appropriate lightning sound when it fires and when it hits enemies that also fits into the game
> sounds -> this is probably the most tricky bit."*

**Amends [0083](0083-two-ladders-of-four.md)** (the ladders move off the ship), **[0082](0082-a-pickup-is-rare-and-says-what-it-is.md)**
(the cycle returns, one level down), **[0064](0064-a-pickup-waits-to-be-taken.md)** and
**[0087](0087-a-pickup-never-parks.md)** (the wait is a wander of the box), and the render seam of
**[0022](0022-frame-rate-is-a-feature.md)** (one verb that is not a blit). It also moves *additional
player weapons* off the end of the 2026-08-17 sequencing instruction in `docs/state-of-play.md`, on
the player's own word.

## The rules

**A gun is a row in `src/content/weapons.ts` and a tube is a row in `src/content/missiles.ts`.** Each
kind carries its own four-tier ladders, its pickup face and — for a gun — its three hull tiers. The
ship row names which kind it opens on; the run slice remembers which is fitted, beside the upgrade
list, and a death puts both back. Nothing downstream switches on a kind's name: the frame switches on
`flight` with a `never` arm.

**A weapon pickup cycles through the guns every `PICKUP_CYCLE_STEPS` and hands over the face it was
showing.** It waits for at least `PICKUP_REPEATS` full turns of its faces, and while it waits it
wanders the player's box, turning at all four walls. A scattered piece starts on the gun the player
just lost.

**A pickup of another kind is an upgrade whatever the fitted kind's ladder says, and taking it starts
the new ladder at one rung.** The other ladder is untouched. The hull tier follows the list, so a
switched gun is drawn a tier smaller — the cost of switching, made visible.

**The arc is chain lightning: resolved on the step it fires, stroked rather than blitted.** From the
nose, the nearest body in reach is struck; from that body, the nearest body in reach not already lit;
`links` times. Each strike is `collide.ts`'s own arrival landed by hand (`strike`), so a bolt's hit
and a pulse's hit are one description. When the nearest thing is the boss, every further link lands
on a fresh point inside its disc, rolled on the arc's own stream. A volley with nothing in reach fires
dry: one link ahead into nothing, the discharge without the strike.

**`Surface` has a third verb, `bolt`, counted beside the blits and never inside them.** A bolt is a
line between two points the model chose on the step it fired, re-jagged every couple of frames — a
shape not known until the frame it is drawn on, which is the one thing a bake cannot hold. It is one
stroke of a dozen vertices from a typed array the scene owns; it allocates nothing and hides nothing.
`CLAUDE.md`'s *art is baked to bitmaps and blitted* carries this one exception by name.

**Two cues, at two places.** `arc` is the discharge at the nose — sample-and-hold noise falling
through the kilohertz, a driven crack, and the pulse's own sub — and `zap` is the strike at the first
body struck. Both are dry and both are shorter than the arc's fastest cadence, on 0104's terms. The
player's-weapons-have-a-bottom floor (0102) now holds over three weapons.

**The ship wears its gun.** Three more hulls with hit twins: the same fighter with a two-pronged coil
at the nose and a spark across it, coil bands on the pods where the pulse's carry a muzzle. Every
combination of tier and kind is its own bake because a blit is one bitmap per entity.

## ⚠️ What was rejected, and the test that rejected it

**Baked bolt segments blitted end to end.** No rotation on `blit`, so a segment per angle — a dozen
sprite kinds and their sheet rows for a picture whose ends could never quite reach the body. The
pixel guard in `tests/weapons.test.ts` — the stroke ends within a unit and a half of the struck body's
blit — is the assertion that shape could not have passed.

**A bolt entity carrying a vertex buffer.** A `Float32Array` per entity is five hundred buffers for
twelve links. A link is an entity at its landing point carrying its start as an offset, and the jag is
a hash of its seed, the vertex and the page — the same picture however many times a painter that
draws twice per step asks for it.

**The bolt pool out of the particle share.** `tests/flares.test.ts` has a boss and a ship dying in the
same second spending it to within a fragment. The twelve came out of the pulse's pool instead, because
a ship carries one gun: the pulse's pool and the arc's are never full at once, and 80 against 88 still
closes the volley arithmetic.

**A cue on the weapon row.** `tests/sound.test.ts` holds that every cue is played by the frame, by
name; a name read out of a content table is a cue nothing in the frame can be seen to play.
`cueOfFlight` is the frame's own switch, exported so the test can ask it.

**Keeping 0077's bob probe.** With the wander, a bob of zero leaves a pickup that still never tracks
one line, so the probe went STILL GREEN and is retired in `scripts/probes/0077-pickup-arrival.mjs`;
the bob stays in the picture. Twenty-eight other probes were re-anchored rather than retired, and
five re-aimed at the guard that can now see their break — each says so beside its edit.

**Flipping the pickup's velocity at the wall.** The velocity is eased toward a target (0077), so a
flipped velocity is pulled straight back into the wall. The heading flips and the ease carries it
round — and it flips `PICKUP_TURN_ROOM` early, because the turn measured seven units of overshoot
with the flip on the wall itself.

## What is owed

- **An ear on `arc` and `zap`.** Every claim about them is a model quantity; whether a coil reads as
  a coil is the next play-test's, and `scripts/hear.mjs --only=arc,zap` writes what it plays.
- **An eye on the bolt in motion, at the camera the game ships.** The jag, the twig and the fade are
  three numbers in `src/render/scene.ts` with nothing asserted on any of them.
- **The balance.** The arc cannot miss and cannot reach; its ladders were chosen so its cap lands
  four of two every eight steps against the pulse's four of one every four. A hand settles it.
- **The shuriken (0234) and homing missiles (0235)**, which are rows, a flight and a guidance on this
  axis rather than mechanisms — that is what this decision is for.

## Rollback

⚠️ **None owed —** [0001](0001-revertability-not-risk-rating.md). The run slice gained two fields and
nothing persists it yet; no storage key, no schema, no cache prefix moved.

## Confirmed, not assumed

`node scripts/prove-guard.mjs 0233`:

| broken on purpose | went red |
|---|---|
| the pulse's third rung authored so it changes nothing about the gun (re-aimed by 0236: the arc's reach is a ladder, so its rungs cannot be emptied by one edit) | `every rung changes the ship` |
| the arc's pickup face given the pulse's chevron | `THE FACES: the weapon pickup offers every gun` |
| the arc's first hull made the pulse's | `THE HULLS: every gun has its own` |
| the switch removed from `effectOf` | `THE SWITCH: another gun is an upgrade` |
| a switch keeping the old gun's rungs | `THE SWITCH: another gun is an upgrade` |
| the cycle turning the face without turning the sprite | `THE CYCLE, in the real frame` |
| the wait typed short and without the faces | `PICKUP_REPEATS full turns` |
| the back wall of the box removed | `wanders the whole box` |
| every link fired from the nose, so the chain is a fan | `THE CHAIN: a volley lands` |
| the reach ignored | `beyond its reach it fires dry` |
| the strike cue removed | `THE CHAIN: a volley lands` |
| a bolt on the boss landing every link on one point | `ON A BOSS ALONE, every link` |
| the bolt's ends jagged with the rest | `THE PICTURE, in pixels` |
| the bolt pool cut below one overlapping volley | `the bolt pool never fills` |
