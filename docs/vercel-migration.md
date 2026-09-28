# Vercel deployment

This branch runs the portfolio with standard Next.js on Node.js 24. Import `BMH-code57/brandon` into Vercel, select the Next.js framework, and use pnpm with the committed lockfile. `vercel.json` supplies the install and build commands. The production branch can be `main`; pushes then trigger deployments automatically.

## Private configuration

Set these values in Vercel Project Settings > Environment Variables. Keep all credentials and collection JSON server-only. Do not give these names a `NEXT_PUBLIC_` prefix.

| Variable | Purpose |
| --- | --- |
| `SECRET_PASSWORD_VERIFIER` | Existing salted password verifier |
| `SECRET_SESSION_KEY` | Matching session signing key and password pepper |
| `SECRET_ALLOWED_ORIGIN` | Exact site origin, initially the Vercel project URL and later `https://brandonholda.com` |
| `UPSTASH_REDIS_REST_URL` | HTTPS REST endpoint of the connected Redis database |
| `UPSTASH_REDIS_REST_TOKEN` | Redis standard token with read and write access |
| `CAVERN_REDIS_PREFIX` | `brandon-cavern`; keep stable across deployments |
| `QUIET_CHAMBER_CONTENT` | Private JSON collection; existing numbered continuation variables also work |
| `HEVY_API_KEY` | Existing read-only workout connection |

The password verifier and signing key must be moved together. Existing cookies from the former host are rejected by the new session context. A successful login is remembered for seven days and renewed on verified visits. Do not put the plaintext password in Vercel or GitHub.

Connect an Upstash Redis database through Vercel's Storage/Marketplace flow or use an existing Upstash database. Set its REST URL and standard token on the project. Redis stores password attempt counters with a 15-minute expiry and the private receipt. Missing storage causes password entry to fail closed. Production must never use a process-local substitute for rate limiting.

Use separate Redis credentials or a distinct `CAVERN_REDIS_PREFIX` for untrusted preview environments. Only assign private production data to previews you intend to share with trusted people. Keep Vercel's preview deployment protection enabled.

## Receipt import

The receipt cannot be bundled into the public repository. It also exceeds Vercel's environment budget when combined with the other settings. Upload it once to the connected private store:

```sh
node --env-file=.env.local scripts/upload-private-receipt.mjs /absolute/path/to/receipt.webp
```

Only the authenticated receipt route reads the resulting key. Do not upload this image to public assets. Do not copy the former `LEAGUE_RECEIPT_1` through `LEAGUE_RECEIPT_14` environment variables to Vercel.

## Domain

After purchasing the domain, add `brandonholda.com` and `www.brandonholda.com` under the project's Settings > Domains. Choose the apex domain as primary and redirect `www` to it. Copy the exact DNS records displayed by Vercel into the registrar's DNS settings. Keep any existing mail records intact. Wait for Vercel to confirm the domain and issue HTTPS before sharing it.

Update `SECRET_ALLOWED_ORIGIN` to `https://brandonholda.com` and redeploy. Vercel's server-injected deployment URL is also allowed for preview checks; arbitrary request Host or Origin headers never extend the allowlist. Keep the domain pointed directly at Vercel so its trusted IP header identifies visitors correctly.

## Release checks

Run `pnpm test` and `pnpm build`. Check the welcome page, both portfolio views, the protected passage, remembered access, the receipt, and Hevy workouts on the preview deployment before promoting it. Confirm unauthenticated private endpoints return 401. Production publication is a separate account action; a successful local build does not mean the site has been deployed.

The existing Sites deployment remains available until the Vercel deployment is verified. Migration does not automatically change the old site's sharing or DNS.

## References

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Vercel Git integration](https://vercel.com/docs/git)
- [Environment variables](https://vercel.com/docs/environment-variables)
- [Trusted request headers](https://vercel.com/docs/headers/request-headers)
- [Upstash REST transactions](https://upstash.com/docs/redis/features/restapi)
