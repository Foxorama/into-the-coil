# Privacy — Into the Coil

**Last updated: 3 August 2026**

## The short version

**Into the Coil collects nothing about you and sends nothing anywhere.**

There are no accounts, no analytics, no advertising, no tracking, no automatic crash reporting, and
no cookies. Nothing you do in the game leaves your device.

That is the whole policy. The rest of this page explains it precisely, because "we don't collect
anything" is a claim worth being able to check — and this page is cross-checked against the source
code by a test, so it cannot quietly fall out of date.

## What the game stores on your device

**The game has no save yet.** It is early, there is nothing to play, and it stores no game data of
any kind.

| What | Where | Why |
|---|---|---|
| A copy of the page itself | Cache Storage, named `into-the-coil-<version>` | So the game still opens when you have no network |

That cache holds the game's own program — the same file the server sent you — and nothing about you.
It is the ordinary mechanism that lets an installed web app work offline.

**When the game does start saving your progress, every key it uses will be listed here**, in a table
like the one above. That is enforced: `tests/privacy.test.ts` reads the source and this page and
fails the build if either names storage the other does not.

You can wipe everything at any time by clearing site data in your browser, or by uninstalling the
app if you installed it.

## What the game sends

Nothing.

Once the page has loaded, the game makes no network requests. It is a single self-contained file —
there are no fonts fetched from anywhere, no downloaded assets, no server for it to talk to, and no
external script of any kind. That last one is not a promise, it is a build rule: the page is
asserted to reference no external script or stylesheet before it can ship.

## Things that are not us

**Wherever you are playing it.** Loading any web page means the host can see the request — your IP
address, roughly when, and which browser. That is true of every website; it is the host's doing, not
the game's.

- **intothecoil.vulpecula.games** is served by GitHub Pages. GitHub's privacy statement covers what
  they see.
- **itch.io**, if you play it there, is covered by itch.io's privacy policy.

⚠️ **next.intothecoil.vulpecula.games is a test site, and it is not the same.** It sits behind
Cloudflare, which injects a small bot-detection script at the edge — code the game does not contain
and cannot see. It is there for us to try builds on before release. If you are playing the game
rather than helping test it, you are not on it. The public site is not behind that proxy and does
not carry that script.

**If you buy or donate.** Payments would be handled entirely by itch.io and its payment providers.
We never see your card details, your address, or your full name.

## Children

There are no accounts, no chat, no user content and no data collection, so there is nothing for a
child to disclose to us. We do not knowingly collect personal information from anyone, of any age,
because we do not collect personal information at all.

## Your rights

Privacy law generally gives you rights to access, correct and delete the personal information a
company holds about you. We hold none, so there is nothing to access, correct or delete — and no
request is needed to exercise that.

## Changes

If the game ever starts collecting anything, this page will say so plainly and the date at the top
will change **before** the release that does it. Given the design, we do not expect that to happen.

## Contact

Questions about this policy: **contact@vulpecula.games**

---

*Into the Coil is made by Vulpecula Games, a sole trader based in Australia. This page is written in
plain language rather than legal boilerplate; it has not been reviewed by a lawyer, and it describes
what the software actually does — which you are welcome to verify against the source.*
