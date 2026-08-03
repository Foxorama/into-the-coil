# 0003 — The build emits one self-contained file

**Accepted 2026-08-03**, landed in TEST SPINE — earlier than the scaffold plan scheduled it.

## The rule

`vite-plugin-singlefile` inlines the whole bundle into `dist/index.html`. The build emits no
external asset.

## Why, and why it could not wait

The plan put this in SHELL & IDENTITY, where a test asserts single-file output. The first browser
test written in TEST SPINE failed immediately, and the cause was structural rather than a bug in
the test:

**An external module script is a cross-origin request, and Chrome blocks it under `file://`.** The
page rendered, the module never evaluated, `#app` stayed empty, and the only evidence was a console
error nobody was reading:

```
Access to script at 'file:///…/dist/assets/index-*.js' from origin 'null'
has been blocked by CORS policy
```

So the ordering had a dependency the plan did not state: **any test that drives the built artifact
off a file path requires single-file output.** The plugin cannot wait for the phase that merely
asserts single-file output.

It also removes a whole failure class the predecessor paid for repeatedly — hashed-asset 404s, CDN
index/asset skew, service-worker interception, each producing a white screen. With no external
asset there is nothing to 404 and nothing to block.

## Known limit

This fixes `file://` for the *page*. It does not fix it for a *service worker*, which needs a
secure context. The SW tests arriving with SHELL & IDENTITY will need a real HTTP fixture — work
the plan does not currently budget for.
