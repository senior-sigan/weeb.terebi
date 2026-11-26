import { record, request, text } from "./anime365";
import { shikimoriAccount, shikimoriApi } from "./shikimoriSession";

declare const __SHIKIMORI_USER_ID__: string;

export function hasShikimoriProfile() {
  return Boolean(shikimoriAccount() || __SHIKIMORI_USER_ID__);
}

export interface AnimeProfile {
  synopsis: string;
  tags: string[];
}

export async function fetchAnimeProfile(id: number): Promise<AnimeProfile> {
  const data = record(
    await request(`https://shikimori.io/api/animes/${id}`, "json"),
  );
  const description = document.createElement("template");
  description.innerHTML = text(data["description_html"]).replace(
    /<br\s*\/?>|<\/p>/gi,
    "\n",
  );
  const genres = data["genres"];
  const tags = Array.isArray(genres)
    ? genres
        .map((value: unknown) => text(record(value)["russian"]))
        .filter(Boolean)
    : [];
  return {
    synopsis:
      text(description.content.textContent) || text(data["description"]),
    tags: [...new Set(tags)],
  };
}

interface Watching {
  animeId: number;
  watched: number;
  updatedAt: number;
}

export async function fetchWatching(): Promise<Watching[]> {
  const account = shikimoriAccount();
  const userId = account ? String(account.id) : __SHIKIMORI_USER_ID__;
  if (!userId) return [];
  const query = new URLSearchParams({
    user_id: userId,
    target_type: "Anime",
    status: "watching",
  });
  const path = `v2/user_rates?${query}`;
  const data = account
    ? await shikimoriApi(account, path)
    : await request(`https://shikimori.io/api/${path}`, "json");
  if (!Array.isArray(data)) throw new Error("Некорректный список Shikimori");
  const watching: Watching[] = [];
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
  return watching.sort((a, b) => b.updatedAt - a.updatedAt);
}
