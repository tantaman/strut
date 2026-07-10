1. Create a $10/mo Price in Stripe and paste its price_... id into STRIPE_PRICE_PRO in commercial/wrangler.jsonc. I only changed the display label — the actual charge is driven by that Price ID, which still points at the old $3 price. I left an inline ⚠️ note there.
2. Apply the migration in prod: wrangler d1 migrations apply strut-auth.

---

Maybe just a single chat and actions in it rather than buttons all over...


---
Let AI create images for slide, svgs, etc.
Author markdown
Provide input
Suggest edits

SHow is the main thing tho so start with transitions:w

AI integration is streaming into a local-only table and using the user's OAuth to Claude or whatever.


---

- incoroprate refineSchema for component types.
- publish to rindle cloud
- get rindle-realtime setup for it. only open with > 2 editors.

- theme rather than surface and bg
- theme has font stuff too

- markdown editor / swap slide to markdown mode
  - markdown theme
  - slide "profiles" within the theme

- maleable software... let them auth claude/gpt and let that make edits we apply...
  - first step is editing the presentation
  - next step is editing the code. wasmscript?
