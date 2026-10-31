# 0702 — The eight guns are finished

**Accepted 2026-11-01.** Items 9 to 16 of
[`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md) — the report's batch C,
landed at full auto at the player's asking: the pulse, the arc, the shuriken, the ray gun, the Catherine wheel, the
ram, the paintball and the acid. Each gun's mount on every ship it fits (`MOUNTS` in `src/render/bake.ts`, laid by
`paintMount` and `paintMountAt`), its shot and its impact, on [0698](0698-the-fighter-is-finished.md)'s terms: light
and material, contours in the body's own shade, everything added translucent.

## What was there, photographed first

The mounts were answered as silhouettes by [0630](0630-the-guns-are-not-blocks.md) and were still flat inks with a
wash or two; the shots were lit as lights (a halo and a hot heart) and nothing on them said what they were made of.

## The rule

**A gun is finished as the material it is**, at this size — a mount is five to fifteen pixels at the fight's camera
and a shot ten to forty — so each takes two or three translucent marks and no more:

| gun | the mount | the shot and its impact |
|---|---|---|
| **pulse** | chrome: a glint along the barrels' lit edge, the brake's lip caught by it; from the side each barrel's top edge glinting and the pad's top lit | the bolt as plasma — brighter at its limb than across its face, a glint off the lit side |
| **arc** | the rod lit along its upper edge (from the side a cylinder, lit and deep); the coil's chrome glinting; the ball's glass crescent | the join's white point given a corona in the bolt's own cyan, so the join and the bolt are one light. The bolt's own stroke stays [0470](0470-the-light-is-additive.md)'s |
| **shuriken** | the arm lit along its edge; the gold lip glinting on its upper arc; the steel star lit across its upper blades; from the side, the block's edges contours | polished steel: a streak of the room down the blade that points toward the light — on whichever blade it is in each of the two turns, so the light does not turn with the star — and the hub's rivet lit |
| **ray gun** | the band's chrome glinting toward the light; from the side, a glint along the lens and its belly in shadow | each lit ring catching a white point on its upper arc; the burst rings a second, fainter shock inside the first, and the fade's has spread out to meet the rim |
| **Catherine wheel** | the arm lit and deep along its two edges; from the side the post a cylinder | the rim burning white along its inside edge, with a line of soot inside that — both round the whole wheel, because the frame turns this bitmap and a light from one side would turn with it. The tether's rope is [0549](0549-the-wheel-is-playable.md)'s six-layer stroke and was already deep |
| **ram** | rubber: one broad soft sheen, no glint | the glyph the hangar shows — the plastic's deep side and the window on its crown, the ball's own from [0700](0700-the-estate-the-bolt-and-the-ball-are-finished.md). Its heat (`drawBallGlow`, [0648](0648-the-ball-runs-hot.md)) is already a stack of light and is left |
| **paintball** | the body lit along its top; the barrel's glint over a dark lower edge; the hopper a clear shell with a crescent of light | a gelatin shell: light bounced up into its underside, and the seam round its middle; wet, the splat's meniscus darker just inside its rim and a second glint; dry, matte and cracked as it shrank |
| **acid** | the gland wet — a sheen and a glint — the fang's far half in shadow; from the side the post lit | the spit wet, a glint and its tail thinning to light; the void blast's hole lit from inside along its lower lip; the burn's edge eating in |

**Nothing solid was added**, so every mark is held inside the box by `tests/accents.test.ts` and not to
[0106](0106-a-mark-thinner-than-a-pixel-is-not-drawn.md)'s floor; every muzzle and every silhouette is where it was,
which `tests/mounts.test.ts` and `tests/launchers.test.ts` hold and stayed green on.

## What it looks like, measured

At the fight's camera the guns read as what they are made of where they did not before — the steel star with a
streak down it, the gelatin ball, the wet splat against the dry one. At the pad's 365 px each mount shows its glint
and its shadow edge. The pictures are on the branch preview, the sheet and the pad.

## The open calls, from the pictures

- **The paintball's seam** round its middle reads as a ball at the pad and is a darker crescent at the fight's camera;
  if it reads as a dent, it is the second `seam` in the `paintballPink` case.
- **The dry splat's cracks**: three short contours. If a dry splat should be a stain rather than dried paint, they go.

## What guards it — and why no new guard

The containment guards in `tests/accents.test.ts`, the muzzles in `tests/mounts.test.ts` and `tests/launchers.test.ts`,
and the hurt twins in `tests/sheet.test.ts` hold everything this touched, and were run against it. **No finish guard
was added**, by [0192](0192-a-guard-holds-an-invariant.md)'s question: *name a change that would redden it and be
correct* — a shot drawn flat on purpose (the serpent's void is an absence with an edge) would redden any rule that
every shot carry a highlight, and be right. The ships' rim light is an invariant because a ship drawn without one is
the cut-out the ask was about; a shot without a glint is a choice. So this decision adds no probe.

## Not held by any guard

Whether each reads as its material is the player's.
