# Brandon's Cavern

A playable personal portfolio with a hooded adventurer, a purple torch, four discoverable landmarks, and a password-protected secret chamber. The welcome page offers either cave exploration or a standard scrolling portfolio.

## Run locally

Use Node.js 24 and pnpm.

```sh
pnpm install
pnpm dev
```

The main portfolio works without private configuration. Copy `.env.example` to `.env.local` and configure the private environment values when enabling protected content. Keep real values out of Git. Generate a random password, salted verifier, and matching signing key with:

```sh
node scripts/create-secret-key.mjs
```

Share the password only with intended visitors. Set up the durable private store and environment values using [the Vercel deployment guide](docs/vercel-migration.md).

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

## Protected content

Authorization happens on the server. Protected routes require a valid signed session and return private, no-store responses. Production uses Secure, HttpOnly, SameSite=Lax cookies with the __Host prefix. Sessions last seven days after the last verified visit. Passwords use salted PBKDF2-SHA-256 with a server-side HMAC pepper.

Upstash Redis stores the five-attempt, 15-minute rate limit durably across deployments and function instances. Vercel's trusted client-IP header identifies the rate-limit bucket. Legacy identity headers and client-supplied alternative headers are ignored. Cross-origin mutation requests and missing storage configuration are rejected.

Private records, credentials, and uploaded personal images must stay outside Git and public assets. Original illustrative artwork in the source repository is visible to anyone with repository access. Store confidential data only in protected runtime configuration or private storage.

## Content and artwork

Edit `lib/portfolio.ts` for Lean Lab, Threadline, Ambient Index, experience, and landmark positions. The biography, interests, and supplied email, GitHub, and LinkedIn links are in the same file. Add project-specific links when confirmed.

The game uses Phaser 3.90 and React with the Next.js App Router. Phaser loads only in the browser. Content panels are accessible HTML dialogs and remain available if the cave cannot load.

Original generated art is preserved in `assets/source`. `scripts/prepare-art.py` exports the main runtime artwork using Pillow. The adventurer uses a 256 by 256 sheet divided into 64 by 64 cells. Rows are down, left, right, and up, each with four walk frames. The foot anchor is (32, 60). Import the runtime PNG in Aseprite as a 64 by 64 sprite sheet, or edit the original at higher resolution.

The glowing summoning circle at the spawn point, idle bounce, torch lighting, rotating portal core, particles, flickering lanterns, crystal glints, and proximity glows are runtime effects over the painted cave. The quiet chamber adds clipped water refraction, expanding pool ripples, falling waterfall streaks, pulsing crystal cores, and warm lantern flicker. These effects respect the reduced-motion setting. The floating book uses transparent artwork. The sprite frames are normalized from generated art and can be refined in Aseprite.

## Verification

```sh
pnpm exec tsc --noEmit
node --experimental-strip-types --test tests/*.test.mjs
pnpm build
```

Tests cover movement bounds, the four-interaction sequence, password verification, signed-session tampering and expiration, protected route responses, cookie properties, and durable-store request handling and rate limits. Hevy checks cover request handling, normalization, best-set comparisons, private caching, and rejection of unauthenticated requests before upstream access.

## Project conventions

Do not use em dash characters in copy, documentation, comments, or commit messages. See `AGENTS.md`.

Source lives at [BMH-code57/brandon](https://github.com/BMH-code57/brandon). The project is configured for Vercel. See [the deployment guide](docs/vercel-migration.md) for account setup, private configuration, and domain connection. Runtime secrets and personal records are excluded from Git.
