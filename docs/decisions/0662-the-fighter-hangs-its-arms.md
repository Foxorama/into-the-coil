# 0662 — The fighter hangs its arms

**Accepted 2026-10-24.** From [`the-notebook-pages`](../../reports/the-notebook-pages-2026-10-24.md), item 3. Amends
[0581](0581-the-weapons-sit-right.md): a mount was laid on last, over the hull, and the loaded tubes were the last
layer drawn, on every ship.

## The ask

> *"Fighter → tubes + gun should be under + not over ship."*

## The rule

**A ship's row says whether what it carries hangs under its hull or stands on it** — `hang: 'under' | 'over'` on
`ShipRow` in `src/content/ships.ts`, authored on every row (0282): the fighter `under`, every other ship `over`, since
a car's turret is in its roof and the saucer's pods are in its outline.

- **The gun**: `drawPlayerShip` in `src/render/bake.ts` lays the mount on FIRST for `under`, and the hull closes over
  all of it but what stands past its outline — the muzzle ahead of the nose. The pulse's silhouette in the fighter's
  outline (0581) is left out for `under`, where a gun-shaped patch of hull would paint over the gun beneath it. The
  pylons go too: each was a rail inside the wing's chord (`paintPylon`'s own note), so under the wing it is wholly
  hidden, and drawing it would be work nobody sees.
- **The tubes**: `hangTubes` in `src/app/frame.ts` keeps the loaded tubes' layer just under the ship's own for `under`
  and last for `over`, moved in place in `World.layers` when it is on the wrong side. It runs at the top of
  `stepLoaded`, so every way a ship is set — a run, the stands, a test — is answered the next step.
- **The hangar's pad** paints the tubes before the ship for `under` (`paintBlue` in `src/render/port-bake.ts`), so
  the pad is what the run flies.

## Rejected

- **A second pool for slung tubes.** It cost two entities against 0022's worst case, which is full (916 of 916), and
  only one of the two pools would ever hold anything. The tubes are one pool whose layer moves.

## What the picture did

At 1280×720, device scale 2, the fighter on its station with a mixed rack: before, the nose gun and both tubes were
drawn over the hull with their own outlines; after, the hull covers the gun to its muzzle and the tubes to their
noses, which show their kinds' inks ahead of the wings' leading edges.

## What guards it

- `tests/weapons-sit.test.ts`, *0662 — THE ASK*: every ship flown in turn and back again, its tubes' layer is just
  under the ship's on a row that hangs them and last on any other, and no layer is lost or doubled by the move.
- `tests/gun-layer.test.ts`: the mount is laid on first under a hanging hull, and that hull is the same outline over
  every gun; last on any other ship, as before. Rewritten from *laid on last*, which was the rule this changed.

- `tests/accents.test.ts` takes a hanging mount's own passes off the front of a sprite's trace before it reads
  `passes[0]` as the hull — only when they are exactly the mount's, traced alone — because they are under the hull and
  not paint on it.

The probes in `scripts/probes/0662-the-fighter-hangs-its-arms.mjs` leave the layer where the mount built it, and make
the bake ignore the row. 0582's probe is re-anchored, and 0525's names the gun-layer test by its new title.
`tests/launchers.test.ts` holds 0630's brake on the fighter's drawn silhouette — the hull and the mount hanging under
it — and 0630's probe breaks the brake the mount draws. **0581's probe of the pulse's silhouette in the fighter's
outline is retired**: that silhouette is traced only for a fighter whose row stands its gun on top, no row does, so
taking it out changes no picture and no guard could go red on it.

## Not held by any guard

Whether enough of the tubes shows. Under the wing, a tube is seen by its nose; if that is too little to read what is
loaded, the places move forward on the row, which is where a missile leaves and is 0448's.

## Rollback

None owed ([0001](0001-revertability-not-risk-rating.md)).
