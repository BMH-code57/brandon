# Brandon's Cavern

A playable personal portfolio with a hooded adventurer, a purple torch, four discoverable landmarks, and a password-protected secret chamber. The welcome page offers either cave exploration or a standard scrolling portfolio.

## Run locally

Use Node.js 24 and pnpm.

```sh
pnpm install
pnpm dev
```

The main portfolio works without secret-room configuration. For the hidden passage, configure the three variables in `.env.example` using local `.env` and `.dev.vars` files. Keep both files out of Git. Generate a random password, salted verifier, and session key with:

```sh
node scripts/create-secret-key.mjs
```

Store the password securely and share it only with intended visitors. Put only `SECRET_PASSWORD_VERIFIER` and `SECRET_SESSION_KEY` in the environment, never the plaintext password. Set `SECRET_ALLOWED_ORIGIN` to the exact site origin, including scheme and port where needed. Sites hosts the production values as environment secrets.

The hidden passage uses the D1 `DB` binding and the schema-only migration under `drizzle`. After a local build, apply the migration once to an empty local database:

```sh
node --import ./scripts/sites-env.mjs ./node_modules/wrangler/bin/wrangler.js d1 execute DB --local --config dist/server/wrangler.json --persist-to .wrangler/state --file drizzle/0000_abnormal_blue_marvel.sql
```

Sites applies production schema migrations when publishing.

## Viewing options

- `/`: welcome screen with two viewing choices.
- `/cave`: immersive cave with keyboard and touch controls.
- `/portfolio`: scrolling About, Projects, Experience, and Contact sections.

Both views use `components/portfolio-content.tsx` and `lib/portfolio.ts` for identical content and contact links. Both have a visible link to switch views.

## Controls

- WASD or arrow keys: walk.
- E near a landmark: inspect it.
- Click a landmark or a navigation link: open the same portfolio section directly.
- Escape: close the current panel.
- On a touch screen: use the direction pad and E button.
- Moon button: reduce ambient animation, including the idle bounce.
- Return button: reset the adventurer's position.
- Inspect the upside-down book at the top center four consecutive times, either by clicking it or pressing E nearby. Moving or opening another destination resets the sequence. The fourth interaction checks for remembered access and otherwise opens the password prompt. Returning visitors with a valid session can use the Return to the quiet chamber button or inspect the book once.
- In the secret chamber, use the Return to cavern button or press E near the lower entrance to leave while keeping remembered access. Use Forget access to clear this browser's access cookie.

## Secret passage security

The book sequence reveals the prompt. Authorization always happens on the server. Both the chamber metadata and its artwork require a valid signed session. The browser receives an HttpOnly cookie with Secure, SameSite=None, Partitioned, and the __Host prefix in production. Partitioning allows the passage to work in the ChatGPT embedded view and in a standalone tab. Local HTTP previews use SameSite=Lax. Sessions last seven days after the last verified visit and are bound to the authenticated Site visitor when available.

Five password attempts are allowed in a 15-minute window, persisted in D1. Missing configuration fails closed. Cross-origin unlock and logout requests are rejected. Passwords use salted PBKDF2-SHA-256 with 100,000 iterations and a domain-separated HMAC pepper derived from the server session key. Neither the password nor the verifier is included in the public build.

To rotate access, generate new values and update the two production secrets, then redeploy. Generate and replace both values together, because the password verifier also depends on the session key. This invalidates existing sessions. The secret artwork is bundled only in the server module `lib/server/secret-room-art.ts`, never under `public`. Original artwork remains in the source repository, so source-repository access also permits viewing those originals. Keep any future confidential content in authenticated server routes or private storage.

The hosted site retains its existing private audience. The passage password does not grant access to the outer Site.

Only a signed, HttpOnly session cookie remembers access. The password is never stored in localStorage or sessionStorage. A verified session check renews the seven-day window, including valid sessions from older versions. Hidden tabs do not run the chamber keepalive.

## Content and artwork

Edit `lib/portfolio.ts` for Lean Lab, Threadline, Ambient Index, experience, and landmark positions. The biography, interests, and supplied email, GitHub, and LinkedIn links are in the same file. Add project-specific links when confirmed.

The game uses Phaser 3.90 and React with the Vinext starter. Phaser loads only in the browser. Content panels are accessible HTML dialogs and remain available if the cave cannot load.

Original generated art is preserved in `assets/source`. `scripts/prepare-art.py` exports the main runtime artwork using Pillow. The adventurer uses a 256 by 256 sheet divided into 64 by 64 cells. Rows are down, left, right, and up, each with four walk frames. The foot anchor is (32, 60). Import the runtime PNG in Aseprite as a 64 by 64 sprite sheet, or edit the original at higher resolution.

The glowing summoning circle at the spawn point, idle bounce, torch lighting, rotating portal core, particles, flickering lanterns, crystal glints, and proximity glows are runtime effects over the painted cave. The quiet chamber adds clipped water refraction, expanding pool ripples, falling waterfall streaks, pulsing crystal cores, and warm lantern flicker. These effects respect the reduced-motion setting. The floating book uses transparent artwork. The sprite frames are normalized from generated art and can be refined in Aseprite.

## Quiet Chamber corners

The League tower, anime shelf, and two construction alcoves have keyboard, touch, and HTML navigation. Personal content is supplied through the authenticated `/api/secret/content` route. See [content configuration](docs/quiet-chamber-content.md) for profile URLs, season notes, and the watched list. Empty collections are labeled honestly until the user supplies their accounts and titles.

## Verification

```sh
pnpm exec tsc --noEmit
node --experimental-strip-types --test tests/*.test.mjs
pnpm build
```

Tests cover movement bounds, the four-interaction sequence, password verification, signed-session tampering and expiration, protected route responses, cookie properties, and rate limits against SQLite using the actual migration.

## Project conventions

Do not use em dash characters in copy, documentation, comments, or commit messages. See `AGENTS.md`.

The current private site is hosted with Sites. Source is mirrored to [BMH-code57/brandon](https://github.com/BMH-code57/brandon). Runtime secrets and personal chamber records are excluded. See [the Vercel migration plan](docs/vercel-migration.md) before deploying on another host.
