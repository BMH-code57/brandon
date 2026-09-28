# Moving to Vercel later

The current live site runs on Sites with Vinext, a Cloudflare Worker, and a D1 database. The present `pnpm build` output is for that environment. Importing this repository into Vercel without adapting the server code will not produce an equivalent working site.

## Migration plan

1. Create a migration branch and run the existing App Router pages with standard Next.js. Preserve the React/Phaser UI, artwork, controls, and the two viewing modes. Replace Vinext build/dev scripts and Cloudflare-specific Vite configuration with the Next.js equivalents, then verify the installed package versions on Vercel.
2. Replace `cloudflare:workers` environment access with server-only environment variables. Keep the password verifier and session signing key out of browser bundles.
3. Replace the D1 attempt counter with a durable server-side store supported from Vercel. Preserve the five-attempt, 15-minute rate limit. Do not replace it with process memory in serverless functions.
4. Remove reliance on Sites identity headers. Determine a trusted visitor identity and trusted client-IP source for the new host. A client-supplied identity or forwarded header must not bypass rate limiting. Invalidate existing sessions when migrating.
5. Configure `SECRET_PASSWORD_VERIFIER`, `SECRET_SESSION_KEY`, `SECRET_ALLOWED_ORIGIN`, and optional `QUIET_CHAMBER_CONTENT` and `HEVY_API_KEY` in Vercel. Keep the Hevy key server-only and retain the authenticated read-only workout route. Set a fixed trusted origin for each tested environment. Revisit cookie attributes for standalone hosting and keep HttpOnly, Secure, and exact-origin checks.
6. Import the GitHub repository into Vercel and select the migration branch for initial previews. Check welcome, both portfolio views, mobile controls, password entry, remembered access, content protection, and all four chamber corners before switching production.
7. Add the intended domain and verify HTTPS. Decide whether the main portfolio should become public; the current Sites audience is private. Keep chamber access separate from that decision.

The visual site does not need a redesign for this move. Server authentication, persistence, and build configuration need adaptation.

## Official references

- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Deploying Git repositories](https://vercel.com/docs/git)
- [Vercel environment variables](https://vercel.com/docs/environment-variables)

No Vercel deployment has been created for this project yet.
