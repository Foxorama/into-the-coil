# 0706 — The version is one

**Accepted 2026-11-01.** Step 7 of [`the-road-to-v1`](../../reports/the-road-to-v1-2026-10-19.md) and
step 3 of [`the-release-review`](../../reports/the-release-review-2026-10-29.md), on
[0696](0696-the-candidate-is-cut.md)'s rule: *"`v1.0.0` is the same tree with only the version moved."*

## The ask

> *"alright, so I think the last thing we need is to push the versions to 1.0 and a devblog for itch"*

## The rule

**`1.0.0` in `package.json`, and nothing else in this repository moves.** The version is written in
one place ([0002](0002-brand-identity-contract.md)); the lockfile repeats it in its own two fields and
is moved with it, because `npm ci` reads both and `tests/brand.test.ts` reads the page the build
stamps from the first. No gun, boss, bullet, screen or sound changes between `v0.9.0` and this.

**What has moved since the candidate is already on `main`.** `v0.9.0` was tagged on 2026-10-29 and
deployed green to both destinations. Between it and this change sit 0697–0705, the ships-and-weapons
polish ([`the-ships-and-weapons-polished`](../../reports/the-ships-and-weapons-polished-2026-10-31.md)),
every one merged through the whole proof ([0434](0434-the-whole-proof-is-cis.md)). So 1.0 is the
candidate plus that pass, and 0696's *"no changes"* is read as *no change rides the bump*, which was
the player's meaning on 2026-10-20 (*"the v0.9.0 to v1.0 bump should essentially be no changes"*).

**The devlog is not here.** The itch page's source, its settings and its launch devlog live in the
site repository's `ITCH-COIL.md`, where the rest of the release copy is, and the devlog for 1.0 lands
there in its own change. This repository holds no marketing copy
([0020](0020-the-fiction-transfers-the-code-does-not.md) keeps the fiction in `docs/game.md`, which
is a definition and not a pitch).

## What is left after it, and whose it is

| | whose |
|---|---|
| the tag `v1.0.0`, which is the only thing that deploys ([0012](0012-a-release-is-a-tag-and-a-deploy-must-prove-itself.md)); `release.yml` refuses a tag that disagrees with `package.json` | the player's — *"never tag unasked"* |
| the itch page set Public, the devlog posted, the site's itch links put back per `ITCH-COIL.md` | the player's, on release day |
| the candidate play the release review names — one run inside the itch embed, the Save tab's QR from inside the iframe, a phone, and one run by someone who has never played | still owed; it does not block the bump, and what it finds lands as `1.0.x` |
| the state-of-play rewrite (the road report's step 6) | owed, and not a release blocker |

## What guards it

`tests/brand.test.ts` holds that the shipped page carries `package.json`'s version and not a
placeholder, and `release.yml`'s first step holds that a tag agrees with it. Neither is new and
neither needs a probe: the bump adds no guard ([0005](0005-a-guard-must-be-seen-to-fail.md) is about
guards, and this change has none of its own).

## Rollback

The version is a shipped surface ([0001](0001-revertability-not-risk-rating.md)). As 0696 says: a
build between tags carries the new string, and the service worker's cache name is stamped with it
(`vite.config.ts`), so every player's precached shell is replaced once on the first visit after the
tag — the designed path for every release. To take it back: move `package.json` and the lockfile to
`0.9.0`. Nothing deploys until the tag, and this change makes none.
