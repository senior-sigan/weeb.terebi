import { record, request } from "./anime365";

declare const __SHIKIMORI_USER_ID__: string;

export const hasShikimoriProfile = Boolean(__SHIKIMORI_USER_ID__);

interface Watching {
  animeId: number;
  watched: number;
  updatedAt: number;
}

export async function fetchWatching(): Promise<Watching[]> {
  const limit = 100;
  const watching: Watching[] = [];

  for (let page = 1; ; page += 1) {
    const query = new URLSearchParams({
      user_id: __SHIKIMORI_USER_ID__,
      target_type: "Anime",
      status: "watching",
      limit: String(limit),
      page: String(page),
    });
    const data = await request(
      `https://shikimori.io/api/v2/user_rates?${query}`,
      "json",
    );
    if (!Array.isArray(data)) throw new Error("Некорректный список Shikimori");
    for (const value of data) {
      const row = record(value);
      const animeId = row["target_id"];
      const watched = row["episodes"];
      const updated = row["updated_at"];
      if (
        row["status"] === "watching" &&
        row["target_type"] === "Anime" &&
        typeof animeId === "number" &&
        Number.isSafeInteger(animeId) &&
        animeId > 0 &&
        typeof watched === "number" &&
        Number.isSafeInteger(watched) &&
        watched >= 0
      ) {
        watching.push({
          animeId,
          watched,
          updatedAt: typeof updated === "string" ? Date.parse(updated) || 0 : 0,
        });
      }
    }
    if (data.length < limit) break;
  }
  return watching.sort((a, b) => b.updatedAt - a.updatedAt);
}
