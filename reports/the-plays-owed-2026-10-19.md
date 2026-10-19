# Owed plays before v1.0

Compiled 2026-10-19 from `docs/state-of-play.md` (*OWED A PLAY* sections and *Still open, and small*), the October
reports, and the *Owed* / *What is owed* / *Not held by any guard* sections of `docs/decisions/`. The full pass is
0560–0642; older decisions are included only where nothing later answers them. Links are relative to `reports/`.

**174 play items, 35 vetoes, 25 stale.** Each item says what to look at and what to decide.

**One way to order the sessions** (each one is a single sitting; an item ticked in one sitting does not need another):

1. **Desktop with keyboard, Savior.** Way in → title → hangar's three tabs → Settings (Save tab last) → one whole
   run, levels 1–7 in order. At each level, look at the backdrop and its enemies, then the mid-boss, then the end boss.
   Then the finale, the victory screen, and back to the title.
2. **The same run with a pad.** Use the title, hangar, ray rings, wheel and paint stick, and rumble. Lose a run to a
   boss on purpose, then start again (the run-reset items).
3. **Secret pilots.** Unity in the Hamster Ball and MMXXVI in the Aqua Duck, levels 1–3 and their bosses at least.
4. **Tiers.** One run on Legendary, one on Burn, plus the Labyrinth on all three.
5. **Phone.** Hold it upright and on its side. Check the touch discs, readout, hangar, a crossing, the Save tab's QR and share, and
   left-handed mode.
6. **Ear.** Run `npm run dash` and the built game with headphones. The Audio section lists what to hear.

---

## Way in, title and menus

- [ ] Splash → golfer pick → intro: are the portraits, runners, Viper's launch, jinks, trails and surges right, and is it paced? [0415](../docs/decisions/0415-the-golfer-is-chosen.md) [0411](../docs/decisions/0411-the-chase-begins-at-the-port.md) [0414](../docs/decisions/0414-the-chase-is-a-chase.md) [0416](../docs/decisions/0416-the-viper-has-a-pilot.md) [0444](../docs/decisions/0444-the-intro-is-the-pilots.md)
- [ ] Intro in each of the four ships: is each ship its own size, and is the fighter in the hangar the size it was? [0450](../docs/decisions/0450-the-intro-ships-are-their-size.md) [0444](../docs/decisions/0444-the-intro-is-the-pilots.md)
- [ ] Intro: Marmot and Unity board their ride, and does the flame look right on the pad and in the first second of the chase? [0612](../docs/decisions/0612-the-riders-get-off.md) [0619](../docs/decisions/0619-every-flame-is-the-largest.md)
- [ ] Press **Fly** twice in the same tab: does the intro play every time, and is that welcome or does it need a setting? (17 s on every flight) [0635](../docs/decisions/0635-every-flight-plays-the-intro.md) [0411](../docs/decisions/0411-the-chase-begins-at-the-port.md)
- [ ] Pad alone past the splash: does the press start it with no keyboard? [0531](../docs/decisions/0531-the-pad-begins.md)
- [ ] Title with a pad: do LB/RB step the pilot band, are they drawn at its arrows, and do LT/RT still step it? [0637](../docs/decisions/0637-the-shoulders-step-the-pilot-on-the-title.md) [0624](../docs/decisions/0624-the-triggers-step-the-pilot.md)
- [ ] Title on desktop and phone: are the two plates, *Fly* over a quiet row and the card a line composed right? [0538](../docs/decisions/0538-the-title-is-composed.md) [0547](../docs/decisions/0547-the-card-is-under-the-faces.md)
- [ ] Title's bands on a phone: are the 20 px wrap-round arrows found by a thumb? [0607](../docs/decisions/0607-the-menus-come-round.md)
- [ ] Freeplay chip: is it hidden until a tier is finished, and does it appear for that tier once you finish it? [0608](../docs/decisions/0608-freeplay-is-earned.md)
- [ ] Credits/continue: does one credit get a new player to the later places often enough? [0608](../docs/decisions/0608-freeplay-is-earned.md) [0517](../docs/decisions/0517-no-quarters-given.md)
- [ ] Score table on the title after a run: are the points, streak, break tally and victory tally right, and can an S be reached on each level? [0428](../docs/decisions/0428-the-score-is-kept.md) [0429](../docs/decisions/0429-the-table-is-kept.md) [0438](../docs/decisions/0438-the-score-is-the-credits.md) [0439](../docs/decisions/0439-the-top-is-one-strip.md)
- [ ] Every screen in the violet-into-cyan voice: does any screen still look off? [0440](../docs/decisions/0440-every-screen-speaks-with-the-titles-voice.md) [0436](../docs/decisions/0436-the-title-has-a-voice.md)
- [ ] Title sky and key: is the key's pace right, and does the sky move without distracting? [0432](../docs/decisions/0432-the-key-cycles.md) [0437](../docs/decisions/0437-the-title-is-lit.md)
- [ ] Unlock hints: is the crash count for Unity and the customisation count for the Aqua Duck readable, and does each unlock fire? [0592](../docs/decisions/0592-the-crashes-are-counted.md)
- [ ] Pause and resume: does the count-in's two seconds feel right, and does the audio come back clean? [0511](../docs/decisions/0511-the-run-can-be-paused.md)

## Hangar: Hangin' Out

- [ ] Bios read as pilots'. [0560](../docs/decisions/0560-the-bios-fly.md)
- [ ] Cursor tries on and only a press fits; shut options reachable; Cockpit. Keyboard, pad, phone. [0561](../docs/decisions/0561-the-cursor-tries-on.md)
- [ ] Plate grows at 1920×1080 and ultrawide; focus card at its foot. [0562](../docs/decisions/0562-the-plate-grows.md)
- [ ] Stand's camera closer and fitted to its column: is the ship big enough? [0563](../docs/decisions/0563-the-ship-is-the-picture.md)
- [ ] Dock at 1920×1080, 1280×720, 4:3 and iPad: do the planet, the shutters and the cradle's clamps (the saucer especially) read right? [0568](../docs/decisions/0568-the-hangar-opens-out.md) [0571](../docs/decisions/0571-the-dock.md) [0572](../docs/decisions/0572-the-dock-is-dressed.md)
- [ ] Monitor on its wall section: does the ship sit in the middle of the bay, and is the type legible in a short window? [0628](../docs/decisions/0628-the-monitor-hangs-on-a-wall.md)
- [ ] Monitor wall on a phone: the wall shows whole with no monitor on it. Is that acceptable? [0628](../docs/decisions/0628-the-monitor-hangs-on-a-wall.md)
- [ ] Keepers stand somewhere new after each run: check every spot, above all *behind*, where Unity shows from the waist up. [0611](../docs/decisions/0611-the-keepers-stand-somewhere.md) [0569](../docs/decisions/0569-the-keepers-move.md)
- [ ] Keeper art: Unity's head on the wrench at 3.6 units, the duck's beret and bill, the duck looking out. Do they read? [0554](../docs/decisions/0554-unity-leans-on-the-wrench.md) [0555](../docs/decisions/0555-the-duck-has-a-bill.md) [0556](../docs/decisions/0556-the-duck-looks-out.md)
- [ ] Empty bike and ball on the pad: does the pad read right without the pilot aboard? [0612](../docs/decisions/0612-the-riders-get-off.md)
- [ ] Hangar with a pad: do the tabs on LB/RB and the pilots on LT/RT work on all four screens? [0624](../docs/decisions/0624-the-triggers-step-the-pilot.md) [0548](../docs/decisions/0548-the-hangar-holds-still.md)
- [ ] Fitting a ware: do the hop, the two cues and the count feel like a fitting? [0567](../docs/decisions/0567-a-fitting-is-felt.md)
- [ ] Hangar on a phone, upright and on its side, and on a notch: does the deck's front sit under the plate? [0566](../docs/decisions/0566-the-phone-pass.md) [0611](../docs/decisions/0611-the-keepers-stand-somewhere.md)
- [ ] Bubble on a phone held sideways: is it too small? [0572](../docs/decisions/0572-the-dock-is-dressed.md)

## Hangar: Paint & Parts and Cosmo's

- [ ] Paint & Parts swatches on a pad and a phone. [0565](../docs/decisions/0565-paint-in-swatches.md)
- [ ] Loadout tabs on a phone: do three cut chips in a row read? [0579](../docs/decisions/0579-the-loadout-has-tabs.md)
- [ ] Key sheet: are these the stats wanted, and is a boss's share missed? [0580](../docs/decisions/0580-the-key-opens.md)
- [ ] Caddie on the pad with two tubes of one kind, and with one of each: do the tubes ride over the lights? [0621](../docs/decisions/0621-the-tubes-ride-over-the-lights.md) [0582](../docs/decisions/0582-the-pad-wears-its-tubes.md)
- [ ] Saucer side-on with tubes: its darts stand at the rim without pods. Is that acceptable? [0582](../docs/decisions/0582-the-pad-wears-its-tubes.md)
- [ ] Spinners run with the engines: are 2.5 and 0.35 the right ends, and is the ⅓ s wind-up quick enough? [0618](../docs/decisions/0618-the-spinners-run-with-the-engines.md)
- [ ] Spinners after a won run and after a quit. [0558](../docs/decisions/0558-a-run-ends-at-the-title.md)
- [ ] Ships' lights (fighter's strobes, caddie's ring) in a fight, on a bright place and a dark one. [0586](../docs/decisions/0586-the-ships-are-lit.md)
- [ ] Ray gun as a small saucer on the top half, in the hangar's side view and in play. [0587](../docs/decisions/0587-the-ray-gun-is-a-saucer.md)
- [ ] Twin launcher and the three guns (pulse rod, shuriken launcher, paint box) on the pad: do two missiles read from one launcher? [0629](../docs/decisions/0629-a-launcher-and-not-a-box.md) [0630](../docs/decisions/0630-the-guns-are-not-blocks.md)
- [ ] Shields worn (runes, aurora, disco): aurora against Saurian Belt's mint shots, runes against the frost ship's cyan. [0584](../docs/decisions/0584-the-shields-are-worn.md)
- [ ] Cosmo's: a purchase with each hand, the confirm sheet, the sub-tabs and tiles. [0564](../docs/decisions/0564-cosmos-sells-pictures.md) [0542](../docs/decisions/0542-cosmos-counter.md)
- [ ] Prices after the 15 % rise, and 500 a tube: does a bought rack make the start of a run too easy? [0585](../docs/decisions/0585-the-prices-rise.md) [0578](../docs/decisions/0578-the-tubes-are-sold.md) [0577](../docs/decisions/0577-the-tubes-are-full.md)
- [ ] Every look at the shipped camera on every place's colours: noses, livery, flames, spinners, mounts. [0525](../docs/decisions/0525-the-gun-is-a-layer.md) [0526](../docs/decisions/0526-the-gun-is-fitted.md) [0527](../docs/decisions/0527-the-wheels-turn.md) [0528](../docs/decisions/0528-the-noses-are-painted.md) [0529](../docs/decisions/0529-the-livery-is-free.md)
- [ ] Ion thrusters on the Rime Shelf against the frost ship's volleys. [0530](../docs/decisions/0530-the-ions-burn-blue.md)
- [ ] Yellow submarine dangle: does it swing? [0596](../docs/decisions/0596-the-yellow-submarine-hangs.md)

## Settings (including the Save tab)

- [ ] *Hand: Left* on desktop, pad and phone: do the mirrored field and discs feel right? [0590](../docs/decisions/0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md)
- [ ] Music room motes: are they visibly in the room? No instrument checks this now. [0590](../docs/decisions/0590-the-settings-are-tidied-and-the-game-has-a-left-hand.md)
- [ ] Settings kept across visits (`itc_settings`); is the pilot picked each visit? [0510](../docs/decisions/0510-the-settings-are-kept.md)
- [ ] **Save tab, file:** export on desktop, import on a second browser. Does everything arrive? [0641](../docs/decisions/0641-the-save-travels.md)
- [ ] **Save tab, QR:** point a real phone at the monitor. Does it read the version-28 symbol? [0641](../docs/decisions/0641-the-save-travels.md)
- [ ] **Save tab, share sheet and iOS download** on the deployed preview. [0641](../docs/decisions/0641-the-save-travels.md)
- [ ] **Save tab, pasted code from a friend:** does the sheet say first what the load loses, and does *Undo the last load* restore it? [0642](../docs/decisions/0642-a-load-can-be-undone.md)
- [ ] Save tab in an embedded host (itch.io iframe): do download and share work, or are they refused cleanly? [0641](../docs/decisions/0641-the-save-travels.md)

## In flight, every level (ship, guns, pickups, readout)

- [ ] Readout: are ships ×2/×1/×0 counted down through a run's deaths, and does the run end on the death at ×0? [0636](../docs/decisions/0636-the-counter-is-the-ships-left.md)
- [ ] Readout plates for every ship, the dice above all; do gold readout and gold score read as two things? [0451](../docs/decisions/0451-the-readout-wears-the-ship.md) [0430](../docs/decisions/0430-the-readout-counts-ships-and-shields.md) [0433](../docs/decisions/0433-the-readout-is-one-voice.md)
- [ ] Readout at arm's length on a phone, with a thumb over it. [0361](../docs/decisions/0361-the-readout-is-read-at-arms-length.md)
- [ ] Shell round the ship against fire. [0430](../docs/decisions/0430-the-readout-counts-ships-and-shields.md) [0492](../docs/decisions/0492-the-shields-wear-the-ship.md)
- [ ] Pickups: does one you cannot wait out feel like a gift or a lottery, is the 15 s right, and does the glow show among enemies? [0575](../docs/decisions/0575-a-pickup-is-what-it-shows.md) [0431](../docs/decisions/0431-a-pickup-glows-in-what-it-offers.md)
- [ ] First tube at full rate: does it make a run's opening too easy? [0577](../docs/decisions/0577-the-tubes-are-full.md)
- [ ] Own bomb and candle thrown close: they no longer hurt you. Does that feel right? [0574](../docs/decisions/0574-nothing-of-mine-hurts-me.md)
- [ ] Each ship's weapons at 0.6 scale, the fighter above all, at play size. [0581](../docs/decisions/0581-the-weapons-sit-right.md)
- [ ] Each ship's guns and engines firing from their own places: blades off the hood, lightning off the rod, roof missiles, bumper flame. [0448](../docs/decisions/0448-each-ship-fires-from-its-own-guns.md) [0449](../docs/decisions/0449-the-wings-are-trimmed.md)
- [ ] Each mount and borrowed gun in its place at the shipped camera. [0526](../docs/decisions/0526-the-gun-is-fitted.md)
- [ ] Twin launcher and guns in the fight: does the drum and grip read at the fight's size? [0629](../docs/decisions/0629-a-launcher-and-not-a-box.md) [0630](../docs/decisions/0630-the-guns-are-not-blocks.md)
- [ ] Borrowed special on each tier, Burn above all: nova on a ship with no shell. [0524](../docs/decisions/0524-the-special-is-fitted.md)
- [ ] Ward: the third button under a thumb. Do the nova and void read? Is the nova Burn's default pick? [0447](../docs/decisions/0447-the-ward-is-a-third-trigger.md)
- [ ] Nova's three rings: do they read as one burst? Does a missed inner ring look like a miss? [0533](../docs/decisions/0533-the-nova-is-three-rings.md)
- [ ] Ray's rings with a pad: is 22.5° at full right, and should the turn ease in near the centre? [0588](../docs/decisions/0588-the-rings-are-thrown.md)
- [ ] Catherine wheel with a pad: is 22.5° the arc, and is `swing` quick enough? Should the keyboard get the arc? [0623](../docs/decisions/0623-the-wheel-and-the-paint-take-the-stick.md)
- [ ] Catherine wheel refire 2.4 s and 2.67 s on screen: long enough, or slow again? [0591](../docs/decisions/0591-the-wheel-stays-a-beat-longer.md)
- [ ] Catherine wheel against bosses, and on 21:9, where the wall decides almost everywhere. [0549](../docs/decisions/0549-the-wheel-is-playable.md) [0551](../docs/decisions/0551-the-wheel-is-held-closer.md)
- [ ] Marmot's crackle, its timing and its 2.4-radian jump, on the pad and in the fight. [0557](../docs/decisions/0557-the-marmot-crackles.md)
- [ ] Marmot's art at the shipped camera: does the helmet read as a marmot? [0546](../docs/decisions/0546-the-marmot-rides.md)
- [ ] Every ship's War Dance and its holds; a dance at a boss from a ship that is not the ball. [0594](../docs/decisions/0594-every-ship-dances.md) [0598](../docs/decisions/0598-the-secret-pilots-reviewed.md)
- [ ] Dance bar at 24: is a dance every 12–15 s in a fight and 15–20 s in a level right? [0613](../docs/decisions/0613-the-dance-is-earned.md)
- [ ] Dance's wave and punch: does the ring read as a shock off the ship against each backdrop? [0613](../docs/decisions/0613-the-dance-is-earned.md)
- [ ] Rumble on a real pad: is the dance's pulse too faint or too much? [0613](../docs/decisions/0613-the-dance-is-earned.md)
- [ ] **Hamster Ball (Unity):** two units back off whatever it does not break: is that a knock or a stall? [0615](../docs/decisions/0615-the-ball-is-solid.md) [0617](../docs/decisions/0617-the-dance-burns.md)
- [ ] Hamster Ball at three shields with the regen: is 2 s and 3 forgiving enough on Burn? [0609](../docs/decisions/0609-the-ball-takes-its-knocks.md)
- [ ] Hamster Ball heat gauge and pip on a phone in a fight: do they read at a glance? [0638](../docs/decisions/0638-the-ball-says-its-heat.md)
- [ ] Hamster Ball flare and burn flame round the ship, against each backdrop. [0609](../docs/decisions/0609-the-ball-takes-its-knocks.md) [0617](../docs/decisions/0617-the-dance-burns.md)
- [ ] Unity's art at the shipped camera: overalls, at speed and in a dance. [0620](../docs/decisions/0620-the-weasel-keeps-its-overalls.md) [0593](../docs/decisions/0593-the-hamster-ball-rolls.md)
- [ ] **Aqua Duck (MMXXVI):** paintball scatter and cadence, the splat's reach. [0595](../docs/decisions/0595-the-aqua-duck-paints.md)
- [ ] Water cannon: a stream that bows ½ rad and runs out. Does it read as water or a waved hose? [0616](../docs/decisions/0616-the-water-flows.md) [0606](../docs/decisions/0606-the-water-cannon-is-a-drop.md)
- [ ] Water cannon's end: is a third wider *a bit*, and is the crown splash or clutter? [0622](../docs/decisions/0622-the-water-breaks-at-its-end.md)
- [ ] Paint sticking: on every boss and mid-boss, the corridor walls and islands, the Mire's bank. How much do 25 marks hide? [0610](../docs/decisions/0610-the-paint-sticks.md)
- [ ] Paintballs and `water` against every place's backdrop. [0595](../docs/decisions/0595-the-aqua-duck-paints.md) [0598](../docs/decisions/0598-the-secret-pilots-reviewed.md)
- [ ] Duck art: bath duck, marker under the chin, dabble and tail. [0595](../docs/decisions/0595-the-aqua-duck-paints.md)
- [ ] Overdrive charge: once through a wave and not a boss. Is it worth picking up, and is once right or twice? [0640](../docs/decisions/0640-a-pod-pierces-a-wave-and-not-a-boss.md)

## Level 1, The Approach: sentinel, then Jormungandr (serpent)

- [ ] The Approach's eight shared bodies at speed: do the pink drive lights read as part of the ship, not as a shot? [0603](../docs/decisions/0603-the-approachs-eight-are-built.md)
- [ ] Enemy finish, palette and three bullet inks (spit, lance, flak) in motion. [0632](../docs/decisions/0632-the-enemies-are-finished.md) [0626](../docs/decisions/0626-a-place-fires-more-than-one-colour.md)
- [ ] Star field in motion: shimmer, repeat. [0343](../docs/decisions/0343-the-stars-are-drawn-for-a-desk.md)
- [ ] Turret column at 2231 re-laned 30→40: see Vetoes. [0382](../docs/decisions/0382-a-roam-waits-to-be-seen.md)
- [ ] Sentinel in its own place: do the seams read at the fight's size? [0631](../docs/decisions/0631-the-mid-bosses-are-drawn.md)
- [ ] Serpent's roots as walls: do they read rootier, is a hit off a root fair, and does the break read as a path? [0627](../docs/decisions/0627-the-roots-are-walls.md)
- [ ] Serpent with the knot gone: is the arrival better with the middle empty? [0515](../docs/decisions/0515-the-knot-is-gone.md) [0488](../docs/decisions/0488-the-roots-are-roots.md)
- [ ] Serpent's last third: lightning on the animal; is the haze too faint? [0487](../docs/decisions/0487-the-storm-is-lightning.md)
- [ ] Serpent fight on 21:9: the far root wall shows sky past it. [0459](../docs/decisions/0459-the-bosses-are-placed.md) [0335](../docs/decisions/0335-the-fight-happens-in-a-room.md)

## Level 2, Ember Nebula: harrow, then Volans (fish)

- [ ] Ember swift, and the signature body at speed through its arc. [0602](../docs/decisions/0602-the-swift-is-its-places-own.md) [0601](../docs/decisions/0601-the-signatures-are-their-places-own.md)
- [ ] Harrow in its own place; its volleys now leave 11–13 units nearer. [0631](../docs/decisions/0631-the-mid-bosses-are-drawn.md) [0452](../docs/decisions/0452-a-boss-fires-from-its-guns.md)
- [ ] Fish's last stage: leap shot down mid-air; the dive, arcs and turn home; the jaw at one snap a second. [0477](../docs/decisions/0477-the-leap-is-a-target.md) [0478](../docs/decisions/0478-the-leap-has-its-own-flight.md)
- [ ] Fish's flame at 1.1: slow enough to read, fast enough to matter? [0479](../docs/decisions/0479-the-flame-slows.md)
- [ ] Volans's adds filling the dance bar in three. Too generous? [0613](../docs/decisions/0613-the-dance-is-earned.md)

## Level 3, Saurian Belt: shoal mother, then Quetzal (pterodactyl)

- [ ] Draco swift and the signature at speed. [0602](../docs/decisions/0602-the-swift-is-its-places-own.md) [0601](../docs/decisions/0601-the-signatures-are-their-places-own.md)
- [ ] Volcano rocks: can a thrown rock be taken for a shot? [0347](../docs/decisions/0347-the-belt-is-a-jungle-under-a-live-volcano.md) [0363](../docs/decisions/0363-the-rock-goes-up.md)
- [ ] Shoal mother in its place. [0631](../docs/decisions/0631-the-mid-bosses-are-drawn.md) [0452](../docs/decisions/0452-a-boss-fires-from-its-guns.md)
- [ ] Pterodactyl flight and plumage: does the 1 s beat read as a bird, and the heave as flight or a wobble? [0483](../docs/decisions/0483-the-pterodactyl-flies.md) [0485](../docs/decisions/0485-the-pterodactyl-is-plumed.md)
- [ ] Pterodactyl's throat beam fanned out: much harder to dodge. Too hard? [0453](../docs/decisions/0453-the-laser-fans-out.md)
- [ ] Laser charge sound over the pterodactyl's 0.3 s warning. [0625](../docs/decisions/0625-the-lasers-are-heard.md)

## Level 4, The Labyrinth: lattice, then the gyre

- [ ] **Forks on each tier:** does it read as a labyrinth, does a way read as a choice, and does an island's point read as stone at speed? [0600](../docs/decisions/0600-the-corridor-forks.md) [0350](../docs/decisions/0350-the-corridor-turns.md)
- [ ] Lattice in its place: does its field read at the fight's size? Does the fight run long at Burn now that adds come? [0631](../docs/decisions/0631-the-mid-bosses-are-drawn.md) [0502](../docs/decisions/0502-the-window-is-the-fight.md)
- [ ] Gyre's walls, its own pink wheels, and the hole moving with each wall: is any of the eight unfair from where the last left you? [0494](../docs/decisions/0494-the-gyre-throws-its-own.md) [0501](../docs/decisions/0501-the-hole-moves-with-the-wall.md)
- [ ] Gyre's wreck: the bar after death, the flashing and the kill. Arc and ray fights are 8 s longer. [0475](../docs/decisions/0475-the-wreck-can-be-killed.md) [0532](../docs/decisions/0532-the-legend-holds-longer.md)

## Level 5, Rime Shelf: redoubt, then Hoarfrost (frost ship)

- [ ] Ice whites against the luminance floor: icy enough? Arc over ice. [0351](../docs/decisions/0351-rime-shelf-is-ice.md) [0470](../docs/decisions/0470-the-light-is-additive.md)
- [ ] Ice blades' ring now flies: three ripples a volley. Too much? [0474](../docs/decisions/0474-a-wave-keeps-its-heading.md)
- [ ] Redoubt turned to face the lane, in its place. [0452](../docs/decisions/0452-a-boss-fires-from-its-guns.md) [0631](../docs/decisions/0631-the-mid-bosses-are-drawn.md)
- [ ] **Frost pulse every 10 s:** is the freeze at the top too much? A respawn mid-pulse starts slowed. Is that fair? [0459](../docs/decisions/0459-the-bosses-are-placed.md) [0484](../docs/decisions/0484-the-cold-reaches-the-start.md) [0471](../docs/decisions/0471-the-cold-breathes.md)
- [ ] Cold field at halved alpha; the hanging frost cloud as a field to thread; teal frost reaching across, at Savior and at Burn. [0481](../docs/decisions/0481-the-cold-grows.md) [0482](../docs/decisions/0482-the-frost-is-a-cloud.md) [0534](../docs/decisions/0534-the-frost-reaches-across.md)

## Level 6, The Toxic Mire: chorus, then the hydra

- [ ] Pools joined and teal, the shore lower: do they read *larger* and *vibrant*? Are the bubbles mistaken for shots? [0535](../docs/decisions/0535-the-mire-runs-teal.md) [0352](../docs/decisions/0352-the-mire-is-a-swamp.md) [0353](../docs/decisions/0353-the-acid-bubbles.md)
- [ ] Waves firing in turn: was the wall the turns, or the waves on the screen at once? [0499](../docs/decisions/0499-the-wave-fires-in-turn.md)
- [ ] Chorus in its place. [0631](../docs/decisions/0631-the-mid-bosses-are-drawn.md)
- [ ] Hydra's neck bending and the joint; the hit feedback at five heads; does it read as one beast? [0486](../docs/decisions/0486-the-neck-bends.md) [0519](../docs/decisions/0519-the-beast-lights-thrice.md) [0464](../docs/decisions/0464-the-hydra-is-one-beast.md)
- [ ] Hydra's second-head flame at 1.1, and its frost head after the teal change. [0479](../docs/decisions/0479-the-flame-slows.md) [0534](../docs/decisions/0534-the-frost-reaches-across.md)

## Level 7, The Black Heart: axis, then Medusa (jellyfish)

- [ ] Veins, the room over the heart, vessels as arteries; is it stationary rather than stalled? [0354](../docs/decisions/0354-the-heart-has-veins.md) [0400](../docs/decisions/0400-the-heart-is-the-room.md)
- [ ] Vessels beat with the music on a real machine: are they in sync? [0401](../docs/decisions/0401-the-vessels-beat-with-the-music.md)
- [ ] Axis in its place. [0631](../docs/decisions/0631-the-mid-bosses-are-drawn.md)
- [ ] Jellyfish: does it open, does the rain still matter, do the tentacles read? Chamber darkness; glow steps as health. [0476](../docs/decisions/0476-the-jellyfish-opens.md) [0402](../docs/decisions/0402-the-jellyfish-is-glass.md) [0403](../docs/decisions/0403-the-tentacles-pull-out-of-the-heart.md) [0489](../docs/decisions/0489-the-heart-has-a-chamber.md) [0490](../docs/decisions/0490-the-tentacles-are-tentacles.md) [0491](../docs/decisions/0491-the-glow-is-its-health.md)
- [ ] **Arc on Burn:** does the jellyfish fight ever finish? It stalled for minutes in the open phase, cause unchecked. [0476](../docs/decisions/0476-the-jellyfish-opens.md)
- [ ] Ray and shuriken against Medusa with a moving pilot: is either nearly immune? [0455](../docs/decisions/0455-the-weighed-lanes-are-shares.md) [0357](../docs/decisions/0357-a-void-blunts-a-blade.md)
- [ ] Jellyfish laser hiss against its 0.3 s burn. [0625](../docs/decisions/0625-the-lasers-are-heard.md)

## Every place (one run through all seven)

- [ ] Enemies at the fight's size: does any still read as a placeholder? Does any one need its own redraw? [0632](../docs/decisions/0632-the-enemies-are-finished.md) [0601](../docs/decisions/0601-the-signatures-are-their-places-own.md) [0446](../docs/decisions/0446-each-place-has-its-own-faces.md)
- [ ] Three bullet inks per place: do they read as three, and does any palette fight its sky? [0626](../docs/decisions/0626-a-place-fires-more-than-one-colour.md)
- [ ] Each animal's motion at speed: is any too busy? [0410](../docs/decisions/0410-the-enemies-move.md)
- [ ] Each level's middle with the 20 s mid-boss window, and the climb after it at Savior. [0576](../docs/decisions/0576-the-window-is-twenty.md) [0502](../docs/decisions/0502-the-window-is-the-fight.md) [0503](../docs/decisions/0503-the-levels-close-up.md)
- [ ] Every boss's damage sheds: does a fragment read as *hurt*, and is 5 a second right? [0480](../docs/decisions/0480-damage-sheds.md)
- [ ] Light is additive: bolts, laser columns and flashes on each place, the Rime Shelf above all. [0470](../docs/decisions/0470-the-light-is-additive.md) [0520](../docs/decisions/0520-the-light-is-loud.md)
- [ ] Wall reveal near the no-fly edge: does it read as a limit or as something appearing? [0359](../docs/decisions/0359-the-wall-is-drawn-while-it-is-met.md)
- [ ] Boss health bar over a bright place: do the notches read as coming turns? [0360](../docs/decisions/0360-the-boss-has-a-health-bar.md) [0634](../docs/decisions/0634-the-boss-bar-goes-with-the-run.md)

## Crossings and chart

- [ ] Crossing on a real phone: is the chug gone? [0604](../docs/decisions/0604-the-place-is-baked-on-the-way.md) [0605](../docs/decisions/0605-a-place-rebakes-only-what-it-changes.md)
- [ ] Chart redrawn: look at it in play, not on a still. [0604](../docs/decisions/0604-the-place-is-baked-on-the-way.md) [0341](../docs/decisions/0341-the-crossing-reads-as-a-nav-plate.md)
- [ ] The burn between places is silent. Acceptable for 1.0? [0340](../docs/decisions/0340-the-coil-is-a-route.md)

## Finale and the run's end

- [ ] A win: finale at speed, voices against the moving bubbles, the pair flying home across the middle. [0418](../docs/decisions/0418-the-heart-lets-go.md) [0426](../docs/decisions/0426-the-finale-is-the-fight-going-on.md) [0455](../docs/decisions/0455-the-weighed-lanes-are-shares.md)
- [ ] A win by ear: explosions heard in the outro, then silence to the title. [0633](../docs/decisions/0633-a-beat-that-stands-still-holds-nothing.md)
- [ ] Lose a run to a boss, then start a new one: no bar until the next end boss. [0634](../docs/decisions/0634-the-boss-bar-goes-with-the-run.md)
- [ ] A run's end, its line, and the shard balance in the hangar. [0522](../docs/decisions/0522-the-score-pays-in-shards.md) [0521](../docs/decisions/0521-the-hangar-opens.md)

## Difficulty tiers

- [ ] **Savior and Burn** on three shields a life: a whole run each. [0614](../docs/decisions/0614-the-shields-come-down-a-tier.md) [0356](../docs/decisions/0356-the-tuned-tier-is-savior.md)
- [ ] **Legendary:** each end boss gets its last attack off; mid-bosses at 1.7 with the arc and one other gun; serpent's two balls; three lives. [0573](../docs/decisions/0573-the-legend-bites.md) [0532](../docs/decisions/0532-the-legend-holds-longer.md)
- [ ] Legendary: does three shields a life with five lives leave anything to feel? [0355](../docs/decisions/0355-a-tier-opens-on-a-shell.md) [0614](../docs/decisions/0614-the-shields-come-down-a-tier.md)
- [ ] Every level at Savior: the fights thin, the arms per place. [0472](../docs/decisions/0472-the-fights-thin.md) [0473](../docs/decisions/0473-each-place-has-its-own-arms.md)
- [ ] Ice staggered on all three tiers: is Burn's quarter more enough? [0371](../docs/decisions/0371-the-ice-is-staggered.md)
- [ ] Shields in each ship's livery on Legendary: do the cars' gold and the Labyrinth's flak stay apart? [0492](../docs/decisions/0492-the-shields-wear-the-ship.md)
- [ ] Pyre and gyre wall at Legend, now that the pool has room. [0479](../docs/decisions/0479-the-flame-slows.md)

## Phone and touch

- [ ] Bomb disc and trigger discs under a moving thumb: is the floor at 0.75 rem big enough? [0358](../docs/decisions/0358-a-trigger-is-a-button.md) [0465](../docs/decisions/0465-the-chrome-fits-the-phone.md) [0512](../docs/decisions/0512-the-touch-is-yours.md)
- [ ] Steering's three ratios on a phone. [0512](../docs/decisions/0512-the-touch-is-yours.md)
- [ ] *Tap to see, tap again to fly* on the title. [0513](../docs/decisions/0513-the-pilot-flies.md)
- [ ] Camera at 83 % on a phone: too small to read? [0364](../docs/decisions/0364-the-view-zooms-out.md)
- [ ] Crackle and pop on a phone with earbuds: watch Render Capacity through Ember Nebula. [0583](../docs/decisions/0583-a-bake-ahead-takes-one-worker.md)
- [ ] iOS: does the turn leave nothing behind? [0369](../docs/decisions/0369-a-turn-leaves-nothing-behind-it.md)
- [ ] Frame budget's counts calibrated against milliseconds on a physical 2021-class Android, once. [0022](../docs/decisions/0022-frame-rate-is-a-feature.md) [0025](../docs/decisions/0025-the-frame-budget-is-counted-not-timed.md)

## Audio (the ear)

- [ ] Title track in the menu: the take-over on the title, the hand-back into a run, the join where the score loops; how long the bed plays before the title lands. [0597](../docs/decisions/0597-the-title-track-plays-in-the-menu.md)
- [ ] Water and paint: does the spray sound like one jet, are splat + `hit` one sound, and are the levels right? [0599](../docs/decisions/0599-the-water-and-the-paint-are-heard.md)
- [ ] Ball and dance cues: `danceHum`, `danceBounce`, `ballBurns`, `shieldBack`, `danceReady`, both pinball sounds, War Dance on every ship. [0609](../docs/decisions/0609-the-ball-takes-its-knocks.md) [0613](../docs/decisions/0613-the-dance-is-earned.md) [0615](../docs/decisions/0615-the-ball-is-solid.md) [0594](../docs/decisions/0594-every-ship-dances.md) [0593](../docs/decisions/0593-the-hamster-ball-rolls.md)
- [ ] The dance's burn has no sound. Is one wanted? [0617](../docs/decisions/0617-the-dance-burns.md)
- [ ] Lasers: the charge and the hiss in the three fights. [0625](../docs/decisions/0625-the-lasers-are-heard.md)
- [ ] Roots breaking (`rootsBreak`). [0627](../docs/decisions/0627-the-roots-are-walls.md)
- [ ] Fitting cues in the hangar: right, or does the hangar want its own? [0567](../docs/decisions/0567-a-fitting-is-felt.md)
- [ ] Shuriken throw: the whetstone beside the other four voices on `npm run dash`; the pick becomes the throw. [0496](../docs/decisions/0496-the-throw-is-a-whetstone.md)
- [ ] Catherine wheel's throw, crackle and sizzle; candle's three cues. [0545](../docs/decisions/0545-the-catherine-wheel.md) [0537](../docs/decisions/0537-the-candle-is-lit.md)
- [ ] Intro's five cues and the alarm and launch; Marmot's voice at 1.38. [0412](../docs/decisions/0412-the-port-is-heard.md) [0546](../docs/decisions/0546-the-marmot-rides.md)
- [ ] Ray cue at full autofire; nova cue. [0448](../docs/decisions/0448-each-ship-fires-from-its-own-guns.md) [0463](../docs/decisions/0463-the-ships-are-cooler.md) [0447](../docs/decisions/0447-the-ward-is-a-third-trigger.md)
- [ ] Specials' cues, and the void's own cue (it borrowed the bomb's). [0378](../docs/decisions/0378-the-specials-are-heard.md) [0377](../docs/decisions/0377-the-void.md)
- [ ] Black Heart: two player questions. Does this place follow the right layers, and may a level climb? [0331](../docs/decisions/0331-the-heart-beats-under-it.md) [0329](../docs/decisions/0329-a-level-may-fall.md)
- [ ] The pause's resume of a suspended audio context. [0511](../docs/decisions/0511-the-run-can-be-paused.md)
- [ ] No victory piece exists yet. Is it needed for 1.0? [0418](../docs/decisions/0418-the-heart-lets-go.md)

---

## Vetoes owed

Calls Claude made that the player may overturn. One line each.

- [ ] Labyrinth: a body steering into an island is held beside it, not destroyed (departs from 0349). [0600](../docs/decisions/0600-the-corridor-forks.md)
- [ ] Triggers step the pilot on every pilot screen and the keyboard gets no pair. (The shoulders on the title are settled by 0637.) [0624](../docs/decisions/0624-the-triggers-step-the-pilot.md)
- [ ] Ray's 22.5° arc applied to the wheel and the paint as well; the arc is the pad's alone. [0623](../docs/decisions/0623-the-wheel-and-the-paint-take-the-stick.md)
- [ ] "For the hit" read as the beam's strike, not the ship being hit. [0625](../docs/decisions/0625-the-lasers-are-heard.md)
- [ ] Three inks a place (spit, lance, flak); every other shot keeps the place's main ink. [0626](../docs/decisions/0626-a-place-fires-more-than-one-colour.md)
- [ ] 0572's centred monitor gives way to the wall; smaller type at a short window. [0628](../docs/decisions/0628-the-monitor-hangs-on-a-wall.md)
- [ ] Pad shows the bike and ball empty. Should the pilot ride? Should Unity's bush hat come back, hung on their back? Should the pilot card and thumbnails be empty too? [0612](../docs/decisions/0612-the-riders-get-off.md)
- [ ] Unity's roof spot cut; the *away* spot kept. [0611](../docs/decisions/0611-the-keepers-stand-somewhere.md)
- [ ] Freeplay hidden until earned, rather than shown shut with a hint. [0608](../docs/decisions/0608-freeplay-is-earned.md)
- [ ] Legend: the Black Heart's green, the arc weights, the two serpent balls on Burn. Should the Labyrinth, Rime Shelf and Saurian Belt shots move off amber too? [0573](../docs/decisions/0573-the-legend-bites.md)
- [ ] Any of the seven signatures, the swifts and The Approach's eight bodies (each is one hull). [0601](../docs/decisions/0601-the-signatures-are-their-places-own.md) [0602](../docs/decisions/0602-the-swift-is-its-places-own.md) [0603](../docs/decisions/0603-the-approachs-eight-are-built.md)
- [ ] The six mid-bosses drawn before the player answered on the sentinel sample. [0631](../docs/decisions/0631-the-mid-bosses-are-drawn.md)
- [ ] The twin launcher, chosen from sketches. Look again in play. [0629](../docs/decisions/0629-a-launcher-and-not-a-box.md)
- [ ] Shield prices (runes 600, aurora 750, disco 900 before the rise), and every look's price. [0584](../docs/decisions/0584-the-shields-are-worn.md) [0589](../docs/decisions/0589-more-looks.md)
- [ ] Hangar stand: may the stall and viewport move so the ship is larger? Should there be a dolly between tabs? [0563](../docs/decisions/0563-the-ship-is-the-picture.md)
- [ ] Every tab has a keeper: the counter swaps in place; the card is a step smaller on Cosmo's. [0550](../docs/decisions/0550-every-tab-has-a-keeper.md)
- [ ] Paint & Parts close-up. [0548](../docs/decisions/0548-the-hangar-holds-still.md)
- [ ] Unity's head size on the wrench; the duck's beret and the duck turned to the pad. [0554](../docs/decisions/0554-unity-leans-on-the-wrench.md) [0555](../docs/decisions/0555-the-duck-has-a-bill.md)
- [ ] Cosmo's departures from the plan's camera. [0542](../docs/decisions/0542-cosmos-counter.md)
- [ ] Gyre wreck by tier: the gun alone kills it on Legend, nothing named does on Burn. [0475](../docs/decisions/0475-the-wreck-can-be-killed.md)
- [ ] Jellyfish tentacles still feed it (the plan proposed the bell eats and the arms do not). [0476](../docs/decisions/0476-the-jellyfish-opens.md)
- [ ] Savior's mid-boss ladder: the eighth on top of `MID_BOSS_SECONDS`, or raise the ladder? [0532](../docs/decisions/0532-the-legend-holds-longer.md)
- [ ] Black Heart: close it up with its music moved four bars, or leave it. [0503](../docs/decisions/0503-the-levels-close-up.md)
- [ ] Desk bar: black or the place's own dark. [0500](../docs/decisions/0500-the-desk-has-a-bar.md)
- [ ] Roam turns 20 units past the screen's edge rather than at it; turret column at 2231 re-laned 30→40. [0382](../docs/decisions/0382-a-roam-waits-to-be-seen.md)
- [ ] Shoal's gap: re-author it? [0338](../docs/decisions/0338-the-arrival-is-seen.md)
- [ ] Mire bubbles are scenery, not obstacles. [0353](../docs/decisions/0353-the-acid-bubbles.md)
- [ ] Shell stands still rather than turning; the title sky is CSS, not the music room's flythrough. [0430](../docs/decisions/0430-the-readout-counts-ships-and-shields.md) [0437](../docs/decisions/0437-the-title-is-lit.md)
- [ ] Ship dressing: car neon and the Firebird spoiler; phoenix flame tail; the estate lost its neon unasked. [0461](../docs/decisions/0461-the-ships-are-jazzed.md) [0463](../docs/decisions/0463-the-ships-are-cooler.md)
- [ ] Firebird black's lift and bird shape; pods' cigar length; dice marks; ray gun direction A over B or C. [0468](../docs/decisions/0468-the-firebird-is-black-and-gold.md) [0469](../docs/decisions/0469-the-pods-are-cigars.md) [0466](../docs/decisions/0466-the-dice-swing-once.md) [0467](../docs/decisions/0467-the-ray-gun-is-a-turret.md)
- [ ] Fighter wings trimmed 18 % (the player remembers a quarter). [0449](../docs/decisions/0449-the-wings-are-trimmed.md)
- [ ] Floor-capped whites and pool colours (accepted; adjust on play). [0351](../docs/decisions/0351-rime-shelf-is-ice.md) [0352](../docs/decisions/0352-the-mire-is-a-swamp.md)
- [ ] Any of the thirty per-place arms; the spinner's ring on the Rime Shelf. [0473](../docs/decisions/0473-each-place-has-its-own-arms.md) [0474](../docs/decisions/0474-a-wave-keeps-its-heading.md)
- [ ] Gyre's hole per stance (item 4.2) is not built without the player's word. [0494](../docs/decisions/0494-the-gyre-throws-its-own.md)
- [ ] The Catherine wheel as a button would need a decision against "no fire action". [0545](../docs/decisions/0545-the-catherine-wheel.md)

## Probably stale

Superseded by a later decision, so they need no play of their own.

- [0418](../docs/decisions/0418-the-heart-lets-go.md)'s four finale shots: replaced by one continuous shot. [0426](../docs/decisions/0426-the-finale-is-the-fight-going-on.md)
- [0428](../docs/decisions/0428-the-score-is-kept.md)'s continue half of the score: reversed by the player. [0438](../docs/decisions/0438-the-score-is-the-credits.md)
- [0442](../docs/decisions/0442-the-ray-gun.md)/[0467](../docs/decisions/0467-the-ray-gun-is-a-turret.md)/[0493](../docs/decisions/0493-the-ray-gun-hangs-under-the-lip.md): the ray gun as a turret and under the lip, superseded by the saucer on the top half. [0587](../docs/decisions/0587-the-ray-gun-is-a-saucer.md)
- [0533](../docs/decisions/0533-the-nova-is-three-rings.md)'s ring look: the rings were redrawn and steered. [0588](../docs/decisions/0588-the-rings-are-thrown.md) (the "slower" question is kept above)
- [0545](../docs/decisions/0545-the-catherine-wheel.md)/[0549](../docs/decisions/0549-the-wheel-is-playable.md)/[0551](../docs/decisions/0551-the-wheel-is-held-closer.md)/[0553](../docs/decisions/0553-the-wheel-comes-round-sooner.md): the wheel's refire and reach, superseded by 2.4 s / 2.67 s and the stick. [0591](../docs/decisions/0591-the-wheel-stays-a-beat-longer.md) [0623](../docs/decisions/0623-the-wheel-and-the-paint-take-the-stick.md)
- [0495](../docs/decisions/0495-the-throw-is-a-listening-set.md)'s listening set: narrowed to the whetstone. [0496](../docs/decisions/0496-the-throw-is-a-whetstone.md)
- [0523](../docs/decisions/0523-cosmo-opens.md)'s purchase sound and *who Cosmo is*: answered by the fitting cues and the keepers. [0567](../docs/decisions/0567-a-fitting-is-felt.md) [0550](../docs/decisions/0550-every-tab-has-a-keeper.md)
- [0538](../docs/decisions/0538-the-title-is-composed.md)–[0541](../docs/decisions/0541-the-looks-are-on-the-pad.md)'s room and cameras, and [0540](../docs/decisions/0540-the-hangar-is-the-port.md)'s port: replaced by the dock and the hangar rebuild. [0571](../docs/decisions/0571-the-dock.md) [0568](../docs/decisions/0568-the-hangar-opens-out.md)
- [0569](../docs/decisions/0569-the-keepers-move.md)'s keeper spots: amended (the spot at the ship is gone). [0611](../docs/decisions/0611-the-keepers-stand-somewhere.md)
- [0546](../docs/decisions/0546-the-marmot-rides.md)'s Marmot in the Viper: the riders get off. [0612](../docs/decisions/0612-the-riders-get-off.md)
- [0559](../docs/decisions/0559-a-run-ends-whole.md) ("nothing to play beyond [0558](../docs/decisions/0558-a-run-ends-at-the-title.md)"), and [0558](../docs/decisions/0558-a-run-ends-at-the-title.md)'s run-end report: the 2026-10-18 run-reset play found the next defects. [0633](../docs/decisions/0633-a-beat-that-stands-still-holds-nothing.md) [0636](../docs/decisions/0636-the-counter-is-the-ships-left.md)
- [0537](../docs/decisions/0537-the-candle-is-lit.md)'s "is a firework landing on the ship fair": your own fire no longer hurts you. [0574](../docs/decisions/0574-nothing-of-mine-hurts-me.md)
- [0593](../docs/decisions/0593-the-hamster-ball-rolls.md)'s ram numbers (heat, recharge, dance speed): retuned three times since. [0609](../docs/decisions/0609-the-ball-takes-its-knocks.md) [0615](../docs/decisions/0615-the-ball-is-solid.md) [0617](../docs/decisions/0617-the-dance-burns.md)
- [0595](../docs/decisions/0595-the-aqua-duck-paints.md)'s jet numbers: amended by the drop, the paint sticking, the flowing stream and the break at its end. [0606](../docs/decisions/0606-the-water-cannon-is-a-drop.md) [0610](../docs/decisions/0610-the-paint-sticks.md) [0616](../docs/decisions/0616-the-water-flows.md) [0622](../docs/decisions/0622-the-water-breaks-at-its-end.md)
- [0624](../docs/decisions/0624-the-triggers-step-the-pilot.md)'s "R + B" ambiguity: the morning play used the triggers and asked only for the shoulders on the title. [0637](../docs/decisions/0637-the-shoulders-step-the-pilot-on-the-title.md)
- [0341](../docs/decisions/0341-the-crossing-reads-as-a-nav-plate.md)'s nav plate second look: the chart is redrawn. [0604](../docs/decisions/0604-the-place-is-baked-on-the-way.md)
- [0446](../docs/decisions/0446-each-place-has-its-own-faces.md)'s "the swift is still one drawing": drawn per place. [0602](../docs/decisions/0602-the-swift-is-its-places-own.md)
- [0592](../docs/decisions/0592-the-crashes-are-counted.md)'s "nothing to play yet": it is now played through Unity's unlock. [0593](../docs/decisions/0593-the-hamster-ball-rolls.md)
- [0322](../docs/decisions/0322-the-ball-is-worth-shooting.md)–[0325](../docs/decisions/0325-the-fight-sounds-like-the-fight.md), [0304](../docs/decisions/0304-the-serpent-sprays.md)–[0311](../docs/decisions/0311-the-acid-and-the-void-come-as-one-ball.md): the serpent's early fight and mix questions. The serpent was rebuilt and replayed since (roots, storm, knot, Legend balls). [0487](../docs/decisions/0487-the-storm-is-lightning.md) [0488](../docs/decisions/0488-the-roots-are-roots.md) [0515](../docs/decisions/0515-the-knot-is-gone.md) [0573](../docs/decisions/0573-the-legend-bites.md) [0627](../docs/decisions/0627-the-roots-are-walls.md)
- [0315](../docs/decisions/0315-the-fish-throws-a-breaker.md)–[0321](../docs/decisions/0321-the-shoal-is-drawn.md), [0373](../docs/decisions/0373-the-fish-spits-its-adds.md)–[0381](../docs/decisions/0381-the-fish-is-bigger.md): the fish's per-stage art and fight questions. The fish was uplifted. [0395](../docs/decisions/0395-the-fish-wears-its-fire.md) [0396](../docs/decisions/0396-the-fish-has-a-tail.md) [0397](../docs/decisions/0397-the-leap-is-a-rush.md) [0477](../docs/decisions/0477-the-leap-is-a-target.md) [0478](../docs/decisions/0478-the-leap-has-its-own-flight.md)
- [0332](../docs/decisions/0332-the-gyre-is-set-into-the-wall.md)–[0336](../docs/decisions/0336-the-wheel-comes-off-its-post.md): the gyre's cog, wall cadence and pinwheel. The gyre was reworked. [0494](../docs/decisions/0494-the-gyre-throws-its-own.md) [0501](../docs/decisions/0501-the-hole-moves-with-the-wall.md)
- [0383](../docs/decisions/0383-the-mire-floor-is-a-wall.md)–[0393](../docs/decisions/0393-the-icicle-is-cut.md): the hydra and frost first looks. The hydra was rebuilt and the frost recut. [0464](../docs/decisions/0464-the-hydra-is-one-beast.md) [0486](../docs/decisions/0486-the-neck-bends.md) [0399](../docs/decisions/0399-the-frost-is-crystal.md)
- [0342](../docs/decisions/0342-the-hulks-come-out.md)'s empty places: all seven are painted. [0354](../docs/decisions/0354-the-heart-has-veins.md)
- [0457](../docs/decisions/0457-the-flash-cap-is-measured.md)'s flash cap and loud pass: measured since. [0519](../docs/decisions/0519-the-beast-lights-thrice.md) [0520](../docs/decisions/0520-the-light-is-loud.md)
- [0459](../docs/decisions/0459-the-bosses-are-placed.md)'s flakes soft at the top of the pulse, and the bolt's glow set by the mount: superseded by the frost cloud and additive light. [0482](../docs/decisions/0482-the-frost-is-a-cloud.md) [0470](../docs/decisions/0470-the-light-is-additive.md)
