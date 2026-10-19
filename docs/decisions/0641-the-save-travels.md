# 0641 — The save travels

**Accepted 2026-10-19.** Asked the same day, and answered the same day.

## The ask

> *"is there a way for a player to export/import their save data if they want to uninstall or move from browser to
> phone or something? possibly needs to be obvious on the main menu so people don't accidentally lose data, but I'm
> not sure on the best UX"*

There was no way. The three keys — the table ([0429](0429-the-table-is-kept.md)), the settings
([0510](0510-the-settings-are-kept.md)) and the hangar ([0521](0521-the-hangar-opens.md)) — live in one browser's
storage for one origin, and nothing asked the browser to keep them. With no server, the only way a save crosses to
another device is the player carrying it. The options put back were a file, a code a phone's camera opens, and asking
the browser to protect its storage. The answer: *"build the file and persist, chuck a QR code in settings rather than
the hangar"*.

## What was measured

- **A save's size.** The fullest one there can be: every ship won, every ware owned, ten different runs on the table.
  It is 3.6 KB of JSON, and the hangar is 2.1 KB of that. Deflated and in base64url, in a link off a long preview
  address, it is **1,509 bytes, a QR symbol of version 28 of 40**. The table's ten rows cost about 300 bytes of it,
  because each row differs from the next.
- **The reader.** jsQR 1.4.0 reads every version at full capacity except **23**. Its table puts that version's fourth
  alignment centre at 74, and the standard puts it at 78. The encoder here was right and the reader was wrong. jsQR is
  inside a good share of the web's scanner pages.

## The rule

**Everything the game keeps can leave the device and come back, from a third tab of Settings: *Save*.** It is beside
*Settings* and *How to play*, the same place the settings live. It is not in the hangar, which holds most of a save but
not all of it.

The tab says where the save is kept and whether the browser has promised to keep it. Then it has four buttons:

| | |
|---|---|
| **Save to a file** | the whole save as a dated JSON file. A download on a desktop; on a touch screen, the share sheet, where *Save to Files* and the cloud drives are |
| **Load a file** | read one, then a sheet with what it holds against what is here: *Replace* or *Keep this one* |
| **Show a code** | the save as a QR code of a link to the game, with the code after `#save=`, and *Copy the code* |
| **Enter a code** | paste one, then the same sheet |

- **All three keys, always.** A backup that dropped one would have lost it. The predecessor's first backup did exactly
  that to its campaign.
- **A restore refuses and never falls back.** The boot readers read a doubtful document as the defaults, which is
  right at boot and wrong here. A damaged hangar read that way would replace a full one with an empty one and report
  success. So the envelope's kind and version are checked first, then every document's own version. A newer version
  is refused as *a newer game*, and anything else as damage. What passes is still read through the boot readers, so a
  restore can hold nothing they would refuse off the device.
- **A restore writes, reads back, and reloads.** The page that shows the restored save read it at boot like any
  other, so there is no second way into the state. A store that takes the write and keeps nothing is told apart by
  the read-back, not reported as a success.
- **A link's code is offered on the title, and taken out of the address bar as it is read.** Everything after the `#`
  stays in the browser and is never sent to the server. A reload does not offer it again.
- **The browser is asked to protect the storage on the title, once there is something to lose**: a run on the table,
  a shard, or a ship won. Once a page. Not at boot, because Firefox asks the player, and a first visit should not ask
  for something before it has shown anything.
- **A file is picked only for a press the browser counts.** A browser opens a file chooser for a click or a key, and a
  pad's button is not one. A pad's press on *Load a file* gets a sheet that says what to press instead.
- **The QR code is made here, not by a library.** It would be the game's first runtime dependency, for a picture drawn
  a few times a year. It uses byte mode, level L, the smallest version that fits, and the standard's mask penalty.
  It never uses version 23 (above): those lengths go up to 24, four modules larger a side.
- **The code is also a line of text**, because a game installed to an iPhone's home screen keeps its own storage, not
  Safari's. A camera opens the link in Safari, so on that phone the code is copied and entered in the app.

## What guards it

- `tests/qr.test.ts`. Every version the encoder makes, at the most it holds, is drawn into pixels with its quiet zone
  and read back by jsQR, a decoder nobody here wrote ([0027](0027-measure-the-picture-not-the-model.md)).
- `tests/backup.test.ts`. A save comes back as it went out, and ten wrong files are each refused with a reason. A
  store that throws, and one that keeps nothing, each report the write as failed. A code survives being pasted bare,
  in a link, or broken over lines.
- `tests/backup.test.ts`, a budget. The fullest save, in a link off a long address, is a symbol of **version 30 at
  most**. That is 137 modules, about four CSS pixels a module at the size the sheet draws on a desktop 1,080 high.
  The owner is whoever adds to what is kept. Past the budget the code still works, and only the picture gets denser.
- `tests/save.browser.test.ts`, over the built page. The file saved is the save the page holds. Then a different file,
  a pasted code and a link are each loaded, and each one is what the store holds after the reload. The link is gone
  from the address bar.

The probes in `scripts/probes/0641-the-save-travels.mjs` break the interleave, the refusal, the read-back and the
compression, and each was seen red. A first probe broke one bit of the format mask and stayed green, which was right:
format bits carry their own error correction, which corrects three bits.

## Owed

- **A phone pointed at a monitor.** Nothing here can check that a real camera reads a version-28 symbol off a real
  screen. The budget above is a number about pixels, not about a phone.
- **The share sheet on a phone, and the download on iOS**, played on the deployed preview.
- **An embedded host** (an itch.io iframe) is untested. Its sandbox may refuse the download and the share, and its
  origin is the host's, not the game's.
- The table's rows could be packed tighter if a save ever outgrows the budget. Nothing asks for that yet.
