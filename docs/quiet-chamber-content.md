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

Anime entries can also include a verified `cover` image URL, catalog `source` URL, and an explicit `episodesWatched` count when known. Cover hosts are restricted to the supported catalog CDNs. Without an explicit count, the watch-time estimate uses visible episode progress: resume episodes are excluded, replay labels include the displayed episode, and unknown starting points contribute nothing. The estimate assumes 24 minutes per episode and does not invent earlier-season totals or rewatches. The visible label for in-progress titles is Current.

League content supports a dated `snapshot` with `hoursPlayed`, `rank`, `recordedAt`, and `source`, plus `mastery` entries containing `name`, `level`, `points`, and an official Riot Data Dragon `portrait` URL. These are saved records, not a live Riot API connection. All personal values remain in runtime configuration.

Personal records live in runtime configuration so a public source repository does not expose them. `GET /api/secret/content` validates the signed chamber session and uses private, no-store responses. Never put confidential records in committed files or public assets.

For larger collections, split the serialized JSON into pieces of at most 4,000 UTF-8 bytes and store them in order in `QUIET_CHAMBER_CONTENT`, `QUIET_CHAMBER_CONTENT_2`, `QUIET_CHAMBER_CONTENT_3`, and `QUIET_CHAMBER_CONTENT_4`. The authenticated route joins these values before parsing. Keep every chunk secret; clear unused continuation variables when replacing a larger collection with a smaller one. Do not insert extra separators between chunks.

Live third-party profiles open in a new tab. The site does not scrape or iframe third-party pages, and does not imply that manually supplied season notes update automatically. The panel itself scrolls through supplied seasons or watched titles. An automated stats integration can be designed after the exact accounts and available APIs are confirmed.

All four corners can be opened using E near the prop, its clickable label, the chamber navigation, or touch controls. Movement pauses while a panel is open. Nearby props glow, and motion settings apply to the pulsing light.

## Hevy training journal

Configure the optional server secret `HEVY_API_KEY` using the key from [Hevy developer settings](https://hevy.com/settings?developer). Never use a browser-exposed environment variable for it. Local development reads ignored `.env` and `.dev.vars` files; production reads the hosted secret.

`GET /api/secret/gym` requires the same signed chamber session before reading Hevy. The integration makes read-only requests to the official `/v1/workouts` endpoint, ten workouts per page. It displays workout dates, descriptions, exercises, notes, set types, weight, reps, distance, duration, RPE, and custom measurements when present. Weight is shown in both kilograms and pounds.

The Best sets tab compares the heaviest recorded working set for each exercise among the loaded workouts, using reps to break equal-weight ties and excluding warm-ups. Load more workouts expands that comparison to older sessions. It does not claim an estimated one-rep max or an all-time record before the full history has loaded.

Responses use private, no-store headers. A bounded, 60-second server memory cache reduces repeated upstream requests. Reopening the journal refreshes its data. API keys, raw responses, and personal workout records are never committed. Missing connections and upstream errors have explicit states instead of sample records.
