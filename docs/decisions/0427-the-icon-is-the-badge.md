# 0427 — The icon is the badge

**Accepted 2026-09-30.** Asked for, with the business card's back in hand: the Into the Coil badge
*"should be our app install graphic as well."* [0008](0008-the-shell-sidecars.md) refused placeholder
art because it *"would ship a launcher icon nobody chose"*; the spiral that followed was generated,
and this is the first icon somebody chose.

## The rule

**The launcher icon is the game's badge as the studio's card draws it** — the hoodie v12 painting
clipped to a circle, a violet ring on a dark-violet halo. `scripts/icon.mjs` draws every variant from
one committed crop, `scripts/icon-art.webp`, and its header holds the ffmpeg line that recuts the crop
from the master, which lives outside this repository. The card is the authority for the framing: a
change to the badge there is a recut here, never a second framing invented beside it.

## One circle, three surfaces

The crop is cut so the badge's circle is centred with a radius of 0.4 of the side — the card's own
framing, carried from its `badge()` onto the 3000px master. Each variant is that circle at a
different radius:

| surface | what it gets | why |
|---|---|---|
| `any` (192, 512) | the badge, transparent outside the halo | a desktop launcher draws what it is given, so a round badge stays round |
| `maskable` (512) | the painting full-bleed, the circle on the 0.4 safe circle | Android cuts its own shape; its mask becomes the badge's edge |
| apple-touch (180) | the painting full-bleed, the circle filling the square | iOS fills transparency with black and rounds its own corners |

⚠️ **THE RING IS LEFT OFF BOTH FULL-BLEED VARIANTS.** A launcher's mask may be a squircle or a
teardrop, and a ring its crop cuts through reads as a mistake rather than a frame.

## What was rejected

**The spiral, kept on its 48px argument.** The spiral's case was that at launcher size only geometry
survives — three passes at the firebird collapsed to a chevron in 13 pixels. That argument was about a
creature whose wings, body and tail must be told apart. The badge is one bright vertical plume on a
dark disc; it was rendered at 48px and looked at before the spiral went, and the plume, the cone and
the ring all hold.

**Committing the master.** It is 3000px, 10 MB, and carries the title lettering and the studio line,
neither of which should ever reach a launcher. The crop is 1024px at 230 KB and holds exactly the
square the widest variant uses.

**The transparent badge on iOS.** iOS fills the corners black, so it would be the badge on a black
rounded square — a disc in a box.
