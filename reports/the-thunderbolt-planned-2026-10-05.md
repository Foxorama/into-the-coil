# The Thunderbolt, planned — 2026-10-05

One ask, three changes, landed in order, each from `main` and each played on its own branch preview.
This file holds the plan and the answers the player gave while it was being made. What each change
decides lives in its decision once it lands; this is the queue.

## The ask

> *"I want to add in The Thunderbolt from Golf-Stars with The Marmot as the pilot riding it, he'll have
> a cool motorbike spacesuit helmet and will have the lightning gun equipped with it's specials as his
> default.*
>
> *For default weapons, let's move the shurikens to the station wagon to replace the lightning gun
> we're giving to the Marmot*
>
> *and for the Firebird let's give it a fire themed weapon - it fires out a spinning fire wheel disc
> like a catherine wheel firework that shoots out short sparking fire embers and has a fire tether
> back to the spaceship that you can use to hit things with, the tether stays attached to the disc and
> the car and you can go back and forth with it.*
>
> *the catherine wheel fires out every 4 secs and fades away at 3.6 seconds give or take before the
> new one fires out -> we might make it a button, but let's try auto-fire for now.*
>
> *the special for the new weapon will be a roman candle of fireworks blasting out and filling a good
> chunk of the screen with fireworks.*
>
> *we'll need sounds all that good stuff as well"*

## The answers

| asked | answered |
|---|---|
| how does the wheel move once it is out? | **it hangs, on a leash.** It flies out ahead, slows, and hangs spinning where it stopped; moving the ship sweeps the tether across whatever is between them. Past the leash's length it is towed after the ship, so the rope never spans the screen |
| is the Marmot there from the first run? | ***"Locked until you beat the game with every pilot (on any difficulty, but must clear it with all four starting pilots) - he can show up on the list of random rescuee's with some voice lines before he's unlocked as a teaser though"*** |

## What was already true

- **A ship's gun is its own and keyed to it** — [0441](../docs/decisions/0441-a-pilot-flies-their-own-ship.md).
  `shipCarrying` maps every gun to one ship, and `tests/serpent.test.ts` holds that every ship is flown
  by flying every gun in its ship: *"a ship flies no gun here, so it was never flown"*.
- **Any ship can fly any gun once both are won in** — [0525](../docs/decisions/0525-the-gun-is-a-layer.md),
  [0526](../docs/decisions/0526-the-gun-is-fitted.md). A ship's own gun is drawn as part of its hull
  (the Firebird's steel star, the estate's lightning rod); another's is `paintMount` at its hardpoint.
- **`itc_hangar` stores a fitted gun and a fitted special as the SHIP they came from**, not as the gun
  (`src/state/slices/hangar.ts`, `special` and `gun`). And `hangarFrom` returns the base on any other
  version — a bare bump would wipe every win.
- **A win is recorded per ship** (`won`), and a pilot flies one ship, so *cleared with all four pilots*
  is the four starting ships' wins. No new key.
- **The pilot is a person drawn from the row** — `src/render/golfer-art.ts` paints any `RunnerRow` from
  its cap, polo, skin, hair and cut. A marmot is not that body.
- **A cue is a one-shot on the beat grid**; nothing sustains. A beat is 24 steps (`VOLLEY_CYCLE`), so
  **four seconds is exactly ten beats** and 3.6 is nine: the ask is already on the grid.
- **There is no `fire` action and `src/content/actions.ts` says there must never be one.** *"We might
  make it a button"* is therefore a decision against that rule, not a setting, if it is ever wanted.

## Pressure-tested

**The guns move as one change, and cannot be cut finer.** The estate's arc goes to the Thunderbolt,
the Firebird's shuriken goes to the estate, and the Firebird takes a gun that does not exist yet. Each
move needs the next: land the Thunderbolt first and two ships share the arc; land the wheel first and
the shuriken or the arc is nobody's. Either way a ship goes unflown in the boss floor, and that guard
is right to go red. So the roster changes in one PR.

**A disc that hangs is the sound reading of *go back and forth*.** A wheel fixed ahead of the nose is a
lance and moving only moves the whole thing; a flail is fun to whip and hard to aim. A wheel that hangs
in the camera's frame makes the ship the moving end, so the tether is a sweep the player steers — and
the leash is what stops it being a line drawn across the whole lane the moment the player retreats.

**The embers are player fire that looks like hostile fire, and that is raised, not ruled** — 0295.
A hostile bullet takes its place's colour, and in the volcano that is fire. What separates them is the
shape and the motion: an ember is a short streak thrown tangentially off a spinning rim and gone in a
quarter of a second; a bullet is a round body that travels. They are drawn as streaks with a white-hot
head, never as dots, and the volcano is where the picture is checked first.

**The roman candle fills the screen, so it is drawn under the bullets.** The storm and the nova already
cover the screen and the player still has to read fire through them. Every burst is added light below
the hostile layer, short, and gone before the next.

**The wheel's damage is measured, not asked for.** The ray's was solved on the boss instruments
against the other guns ([0442](../docs/decisions/0442-the-ray-gun.md)); the wheel is three damage
sources (the disc, the tether, the embers), each gated per target as the blades are
([0391](../docs/decisions/0391-a-target-takes-a-blade-so-often.md)) so the tether cannot bill a boss
sixty times a second. Its numbers are set where its time-to-kill sits among the other four guns'.

**A marmot is a second body, and the row says which.** 0282: the row authors its figure, shared code
holds the default — the four golfers and the Viper's pilot keep the human runner, and the Marmot's row
names his.

## Read, and decided without asking — each can be vetoed

- **The Thunderbolt** is drawn from the side, as the cars are: a black hot-rod chopper on fat knobby
  tyres with lime rims, a long ribbed seat, raked forks and high bars, flame licking along the frame,
  the golf bag stood behind the seat — and the Marmot riding it, in his helmet. Its arc leaves a Tesla
  ball on the headlamp. Missiles in a pannier on each side; one pipe; its wheels turn (0527).
- **Its look across the hangar** — a hot-rod readout in flame orange crackling with forked lightning
  (the predecessor's chopper bridge, carried); a shell that is a cage of forked lightning; three arts
  (a lightning bolt on the tank, a paw-print crest, pinstripes); its own rims.
- **The Marmot** — *The Far Carry*'s Marmot Bartender, who pocketed golf balls from the trade tents.
  He/him. A full-face motorbike helmet: black shell, lime lightning stripe, an orange visor, moulded
  bumps for his ears — visor up in the portrait so his face shows, down when he rides. He runs out of
  the bar upright and leaps for the saddle. His voice blips high.
- **Locked, he is a dark card** on the pilot select with the four starting pilots' faces beneath it,
  each lit once that pilot has cleared the game. While locked he is in the rescue pool, with lines.
- **The wheel** — launched from a pinwheel launcher on the Firebird's hood every 240 steps, on the
  beat; it flies out, slows to hang about two fifths of the way up the view, spins and throws embers,
  and fades over the last half-second of its 216. The tether is the bolt verb in fire's inks.
- **The roman candle** — on the gun trigger: a candle on the hood fires eight stars in a sweeping fan
  up the lane, one every half beat, each bursting into a firework that lands on everything inside it.
  It joins the bomb pickup's pool for every ship, as every gun's special does.
- **Sounds**: the wheel's launch (a thump and a fuse hiss), a crackle on each beat while it spins, a
  sizzle when the tether lands, a quieter ember spit, rate-limited; the candle's thumps and each
  burst's crack and crackle tail; a whistle for the Marmot's voice blip. All on the beat grid.

## The queue

1. **The roman candle**, with its cues and its face. It lands before its gun, because a special
   does not need one to be played: the bomb pickup offers every gun's special to every ship, so the
   candle is in every run from this item on, and the Firebird's own stack takes it in item 2.
2. **The Thunderbolt, the Marmot, the Catherine wheel.** The roster change, atomic for the reason
   above: the fifth ship and pilot, the lock and the teaser, the arc on the Thunderbolt, the shuriken
   drawn as the estate's own gun, the wheel and its launcher on the Firebird with the candle as its
   special, the wheel's cues and the Marmot's lines; the hangar's grids at five; the boss floor flown
   in every ship and the gun floor in every pairing; the wheel's numbers set on the instruments.
3. **The hangar keeps guns by kind.** `itc_hangar` v2: `gun` and `special` hold a `WeaponKind` and a
   `SpecialKind` rather than the ship they came from, and the unlock rule becomes *a win in a ship
   opens its own gun and special*, written against the row rather than a ship name. Last, and still
   worth doing: answered, *"don't worry about the saves for now, there are currently no saved games or
   anything to worry about, and I don't currently plan to do a weapon swap like this in future … so
   let's do the save state as the last thing because it's worth doing anyway."* So item 2 moves the
   guns under v1, where a fit saved as *the Firebird's gun* follows the Firebird's new gun, and no v1
   document is translated. **Rollback note**: v2 cannot be read by v1.

## Landed, and what moved while it was built

- **Item 1** — [0537](../docs/decisions/0537-the-candle-is-lit.md), merged as #554. The candle is called
  *Candle* on screen: *Roman candle* widened How to play's key until the guide's Back button sat off the
  smallest phone on CI's fonts.
- **Item 2** — [0545](../docs/decisions/0545-the-catherine-wheel.md) and
  [0546](../docs/decisions/0546-the-marmot-rides.md). Three things changed against the plan:
  - **The cars' hoods were redrawn round their new guns**, where the plan kept the old drawings and stood
    the new defaults on the hardpoints. The paint guard refused that: a ship's own gun is part of its
    silhouette, and a borrowed mount stands off it by design.
  - **The Marmot's locked card is a silhouette and a sentence**, where the plan drew the four pilots'
    faces under it, lit as each clears. The band's line names who is left, which says the same.
  - **The wheel weighs 0.6 on a boss**, and the gyre and the fish weigh it lower still, measured; at one
    it took them in 24 to 26 seconds against the floor's forty.

## Owed

A play of each on its branch preview, the ear on every new cue, and the volcano checked for embers
against its fire.
