# 0464 — The hydra is one beast

**Accepted 2026-10-02.** A play report on the Mire's hydra. **Amends [0384](0384-the-hydra-stands-in-the-acid.md)**:
a neck is still one drawing behind the body, and its root is now drawn again in front of it.

## The ask

> *"lastly the hydra bosses heads and body are cool, but the extra heads don't really fit and blend
> into the body that well, can we smooth that out a lot more?"*

## What was on the screen

Photographed on the bench (`rig/bench.html?proof`, the Mire, health pinned at 85, 45 and 15) at the
shipped camera and at twice it, at three offset times each. Every one of four defects was in every
picture:

| on screen | why |
|---|---|
| **the body's outline drawn straight across every neck where it met the body** | every neck is in the aura's layer, behind the hull, and nothing of a neck was in front of it. An outline across a shape is how a picture says *behind*, not *grows out of* |
| **pipes of one width** | a neck was 8.7 units wide at its root and 5.8 at its head, out of a body 61 units across |
| **the lord's colour from the first pixel** | the fish's orange, the pterodactyl's olive and the cog's teal began at the body's edge, on a violet body |
| **dorsal plates down the shoulders** | the ridge ran from the shoulders, where every neck rises |

## The rule

**A neck is thick where it leaves the body.** Its back runs on up the neck nearly straight and its
throat swells into the chest, as a long-necked animal's do: at the root 0.12 of the neck's `r` on its
back and 0.26 on its throat, falling to 0.085 each side at the head on a power of 2.2. Sixteen knots,
not nine, so the flare is a curve. Each head's hurtbox, mouth, reach and root are untouched; a neck
is still a picture with no hurtbox, so **the fight is unchanged**.

**A neck is the body's flesh at its root and its lord's at its head.** Up to where the neck has wholly
left the body it is the body — lit by the body's own gradient carried into the neck's frame, so the two
are the same colour at the same place — and the lord's colours, bands, fin and crystals come up through
it over the next few knots. Two gradients at once, which one fill cannot hold: the neck's paint is taken
back out along the neck (`destination-out`) and the body's light laid under what is left
(`destination-over`), both inside the neck's own outline. Every head keeps all of its own colours.

**And the root is drawn again in front of the body** — a *collar* (`hydraCollar0..4`), the neck's own
drawing to just past the join, at the neck's scale, placed every step exactly where its neck is and
turned as it is. It is taken back out of its bitmap at both ends: deeper in the body than six units
inside the body's outline, fading in along that outline so the throat's line runs a little way into
the chest and stops; and a knot past where the neck has left the body, where the neck behind it is the
same picture. Where the outline crosses the neck, the collar is whole. It lives in a new pool,
`bossFront`, drawn straight after the hull and before everything that flies.

**Every number that places the join is solved per neck from the row** (`hydraCollarOf`): where each
knot's back, spine and throat stand at rest and at either end of the sway, against the body's outline.
The ice's short neck leaves the body three knots later than the others, and a single constant would
have put its collar's end inside the body.

**A collar comes on in the rise's last tenth.** Its join is drawn for the neck at rest; on a neck still
swinging up out of the acid it would draw that join across the chest.

**Crests start where the neck has left the body**, and stand on two lengths each, as broad as they were
on nine knots. A fin or a row of crystals on the body's flesh was a row of spikes on its back.

**The dorsal ridge runs from behind the shoulders to the haunch**, five plates a tenth of the body inside
its back wherever the back is, where it was six down the shoulders.

## What it costs

- **Entities: five**, one collar a grown neck, and 0022's worst case goes 686 → 691 on
  [0286](0286-a-serpent-runs-off-the-screen.md)'s line — one boss that is many — on a desktop target
  ([0153](0153-desktop-is-the-target.md)). The particle share was not touched.
- **Sprites: five**, 48 units each, baked once per place.
- **Two guards changed, each with its reason.** `tests/budget.test.ts`'s worst case, above. And
  `tests/accents.test.ts`'s *every solid mark on a body is inside its hull* no longer measures a mark
  laid with `destination-out`: an erase takes ink away and cannot put any off the silhouette, which is
  what that guard holds. Nothing else in the game erases.
- **Probe anchors moved**, the break unchanged in kind: 0229's two on the draw order, 0286's on the
  worst case.

## The guards, and that each was seen to fail

`tests/hydra.test.ts`. Six breaks in `scripts/probes/0464-the-hydra-is-one-beast.mjs`, each red:

| broken on purpose | went red |
|---|---|
| no neck's collar ever laid | `THE ASK: every grown neck leaves the body IN FRONT of it` |
| the collars drawn under the body | `THE ASK: every grown neck leaves the body IN FRONT of it` |
| every collar laid on the hull's centre rather than its neck's root | `THE ASK: every grown neck leaves the body IN FRONT of it` |
| the first collar's tile shrunk to thirty units | `AND IT COVERS THE JOIN, IN WORLD UNITS` |
| every collar fading out three knots early, inside the body | `AND IT COVERS THE JOIN, IN WORLD UNITS` |
| the front pool a slot short of five necks | `every row's necks fit the pool in front of the body` |

The join's guard is in world units: where each neck's spine crosses the body's outline at rest, its
collar is still whole a unit and a half further out.

## Not held by any guard

- **Whether it reads as one animal.** Photographed before and after at one, three and five heads and
  through a rise; the judgement is the picture's, and the player's.
- **The rise.** For about a second a rising neck is behind the body with the outline across it, as every
  neck was before this, and its thicker root shows past the chest while it points down into the acid.
- **The overlap of a collar with a neighbouring neck** just past the body's edge, where the collar of an
  earlier neck draws over a later one for a few units. Not seen in any photograph at the shipped camera.

## Rollback

Nothing irreversible: no storage key, no save shape, no cache name.
