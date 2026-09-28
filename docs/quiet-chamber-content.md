# Quiet Chamber content

The upper-left purple tower and animated caster minion mark the League profiles and season journal. The upper-right shelf opens the anime collection. A bench press in the lower-left corner opens the Hevy training journal. The lower-right alcove remains under construction.

The supplied OP.GG and YearInLoL profiles and anime titles from the user's Crunchyroll screenshots are configured privately at runtime. Screenshot progress labels are preserved; inclusion in the collection does not imply a completed watch. Match results and season notes are not invented.

Set the optional runtime secret `QUIET_CHAMBER_CONTENT` to JSON using this shape:

```json
{
  "league": {
    "riotId": "",
    "opgg": null,
    "yearinlol": null,
    "seasons": []
  },
  "anime": {
    "profile": null,
    "watched": []
  }
}
```

Season records have `year` and `summary` strings. Watched titles have `title`, optional `year`, and optional `note` strings. Put confirmed profile URLs in the corresponding fields. Supported anime profile hosts are AniList, MyAnimeList, Anime-Planet, and Kitsu. Links must use HTTPS.

Personal records live in runtime configuration so a public source repository does not expose them. `GET /api/secret/content` validates the signed chamber session and uses private, no-store responses. Never put confidential records in committed files or public assets.

Live third-party profiles open in a new tab. The site does not scrape or iframe third-party pages, and does not imply that manually supplied season notes update automatically. The panel itself scrolls through supplied seasons or watched titles. An automated stats integration can be designed after the exact accounts and available APIs are confirmed.

All four corners can be opened using E near the prop, its clickable label, the chamber navigation, or touch controls. Movement pauses while a panel is open. Nearby props glow, and motion settings apply to the pulsing light.

## Hevy training journal

Configure the optional server secret `HEVY_API_KEY` using the key from [Hevy developer settings](https://hevy.com/settings?developer). Never use a browser-exposed environment variable for it. Local development reads ignored `.env` and `.dev.vars` files; production reads the hosted secret.

`GET /api/secret/gym` requires the same signed chamber session before reading Hevy. The integration makes read-only requests to the official `/v1/workouts` endpoint, ten workouts per page. It displays workout dates, descriptions, exercises, notes, set types, weight, reps, distance, duration, RPE, and custom measurements when present. Weight is shown in both kilograms and pounds.

The Best sets tab compares the heaviest recorded working set for each exercise among the loaded workouts, using reps to break equal-weight ties and excluding warm-ups. Load more workouts expands that comparison to older sessions. It does not claim an estimated one-rep max or an all-time record before the full history has loaded.

Responses use private, no-store headers. A bounded, 60-second server memory cache reduces repeated upstream requests. Reopening the journal refreshes its data. API keys, raw responses, and personal workout records are never committed. Missing connections and upstream errors have explicit states instead of sample records.
