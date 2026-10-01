# 0447 — The ward is a third trigger

**Accepted 2026-10-01.** The second change in
[`the-roster-planned`](../../reports/the-roster-planned-2026-10-01.md), landed on the roster's own
branch because the first play of it found it missing. Amends [0355](0355-a-tier-opens-on-a-shell.md),
[0376](0376-a-trigger-for-the-gun-and-one-for-the-tubes.md) and [0377](0377-the-void.md); completes
[0442](0442-the-ray-gun.md)'s owed special.

## The ask

> *"For shields → instead of void bombs at shield cap, the void bomb will be on rotation with the
> shield on that pickup so a player can choose to pick up a void bomb or a shield. The void bomb will
> need to have its own unique button as well because it can be used strategically to avoid enemy
> fire."*

> *"In Burn difficulty, when a miniboss dies it'll spit out a void bomb pickup in place of the shield
> … let's also let them start with 1 void bomb as well."* — and answered: *"only burn, and if the
> player starts as feather with the nova ring that pops bullets, they don't get a bonus void bomb on
> top."*

> *"The void bomb also needs updated graphics to make it look cooler, some kind of animation and a
> swirl."*

> Of the ray gun's special, the nova ring: *"at burn difficulty seems like it's going to be the
> default choice if it pops bullets. It should probably share the shield/void cycle instead of the
> regular weapon cycle."*

And from the first play of the roster on its preview: *"in saviour it didn't seem like the shield
powerup was rotating with the void bomb and pulse bomb powerups"* — it was not; this is that.

## The rule

| | was | is |
|---|---|---|
| **the triggers** | two: the gun's (Space) and the tubes' (Shift) | three: `SIDES` gains `ward` — `special3`, on E and X, the pad's third face button, and a third touch band |
| **the void** | the tubes' special, earned only by a shield taken at a full shell | the ward's; a face on the shield pickup, and still what a full shell spills into |
| **the nova** | owed; the caddie opened on two bombs | the ray's special on the ward: a ring from the ship across the screen that pops every shot its band touches, strikes every body it crosses once for 12, and a boss once for a twentieth; the caddie opens on two |
| **the shield pickup** | one face | three: the shield, the void, the nova (`WARD_KINDS`) |
| **a shield on a tier with no shell** | withheld (0355) | offered as its row's `bare`: the **ward** pickup, the void and the nova |
| **a Burn run opens with** | two of its own gun's special | that, and one void — unless the ship's own special is already the ward's (`DifficultyRow.opensWith`) |
| **the void's picture** | a ball with a wake; a dark disc | a swirl: three arms of light curling into a dark heart, turned by the frame every step; the rift a five-armed swirl turning slowly |
| **the worst case** | 646 | 686 — the nova's forty pieces |

## Why it is built the way it is

**A third stack and not a flag on the tubes'.** 0376 split one stack into two because a press could
throw a charge through a weapon it was not earned from. The void on the tubes' trigger is the same
fault from the other side: a press meant to save the ship would fire whatever tube special was on
top. The two specials that unmake enemy fire are their own stack on their own button, and
`SIDES` was already what the reducer, the bindings, the pad, the touch bands and the readout walk —
so the third trigger is a member, a binding row and one stack, and nothing switches on a name.

**The shield pickup is one row with three faces; the ward pickup is its other two.** The ask is
*"on rotation with the shield"*, so the shield row cycles. On Burn the shield face can only ever have
been nothing — the shell is zero — and *"in place of the shield"* names what goes there. The shield's
row says so in `bare`, and the frame offers that wherever it would have withheld the shield
(`offeredAs`). Nothing a tier can use is changed, so the level guards are untouched.

**Burn's opening void is on the tier's row, read by the side.** `opensWith` is per tier — the
character — and `startingArsenal` skips it for any ship whose own special is on the ward's trigger,
which today is the caddie. A fifth ship with a ward special is handled without a name.

**The nova is drawn in pieces.** A ring that grows from the ship to past every corner of the view
is no bitmap at every size, and it is round and lavender, which a bolt is not. So it is one baked
piece of band, blitted round the ring at this step's radius and turned to lie along it, laid only
where the view can show it — the whirlpool's way of drawing a thing that grows (0374). The piece's
glow is a triangle window and the pieces are half a piece apart, so overlapping halves sum to an even
band. The ceiling moved for its forty blits, on 0153's terms, as it did for the whirlpool's.

**A nova strikes on a crossing.** The radius only grows, so `prev < d ≤ now` is true for one step per
thing, and nothing is struck twice. Shots are popped on the band, wider than the centre, because a
shot is the thing it is for.

**A nova is under no throw gap.** 0375's gap holds the explosions under three filled flashes a
second; a nova is a thin band, and a second one replaces the first.

**The void turns rather than animating in pages.** A swirl turned is every moment of a swirl, so one
bake and the blit's own `turn` (0306) are the animation. The wake 0379 gave the ball would have swung
round it, so it is gone; the arms reach past the hull and the turning says it is moving.

## Rollback

⚠️ **None owed** — [0001](0001-revertability-not-risk-rating.md). No storage key, save field or
shipped surface moves: the arsenal is run state, and the run is not saved.

## Owed

- **A play of the ward on its preview**: the third button under a thumb, whether the nova reads as
  *a ring that pops* at speed, and whether the turning void reads as a swirl.
- **The ear on the nova's cue**, which is new.
- **Whether the nova is the default choice on Burn**, the thing the player foresaw. It shares the
  ward's cycle with the void so taking one is not taking the other; if it still dominates, the lever
  is its `damage` and `bossShare`, not its reach.
