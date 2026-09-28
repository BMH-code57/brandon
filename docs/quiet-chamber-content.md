# Quiet Chamber content

The upper-left tower opens League profiles and a scrollable season journal. The upper-right shelf opens a scrollable watched-anime list. Both lower alcoves are reserved for future additions.

No account links, match results, or watched titles have been guessed. The user still needs to supply OP.GG and YearInLoL URLs, plus an anime profile or watched list.

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
