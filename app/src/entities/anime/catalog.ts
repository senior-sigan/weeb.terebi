import { api, publicApi, record, text } from "../../shared/api/anime365";
import { type Choice, findPublishedEpisode } from "../episode/playback";

export interface Anime {
  id: number;
  title: string;
  original: string;
  poster: string;
  thumbnail: string;
  edition: string;
  genres: string;
  synopsis: string;
  score: string;
}

export type AnimeTile = Anime & { nextEpisode?: Choice };

const seriesFields =
  "id,titles,title,posterUrl,posterUrlSmall,typeTitle,season,genres,descriptions,myAnimeListScore";

function parseAnime(value: unknown): Anime {
  const item = record(value);
  const titles = record(item["titles"]);
  const title =
    text(titles["ru"]) || text(titles["romaji"]) || text(item["title"]);
  const id = item["id"];
  if (typeof id !== "number" || !title)
    throw new Error("Некорректная карточка в каталоге");
  const genres = item["genres"];
  const descriptions = item["descriptions"];
  const rating = item["myAnimeListScore"];
  const poster = text(item["posterUrl"]);
  return {
    id,
    title,
    original: text(titles["romaji"]),
    poster,
    thumbnail: text(item["posterUrlSmall"]) || poster,
    edition: [text(item["typeTitle"]), text(item["season"])]
      .filter(Boolean)
      .join("  ·  "),
    genres: Array.isArray(genres)
      ? genres
          .map((g: unknown) => text(record(g)["title"]))
          .filter(Boolean)
          .join(" · ")
      : "",
    synopsis: Array.isArray(descriptions)
      ? text(record(descriptions[0])["value"])
      : "",
    score: typeof rating === "number" && rating > 0 ? rating.toFixed(2) : "",
  };
}

async function fetchSeries(params: Record<string, string>): Promise<Anime[]> {
  const data = await api("series", {
    ...params,
    isActive: "1",
    fields: seriesFields,
  });
  if (!Array.isArray(data)) throw new Error("Некорректный каталог");
  return data.map(parseAnime);
}

export async function fetchNextEpisode(
  myAnimeListId: number,
  episodeNumber: number,
): Promise<AnimeTile | null> {
  const data = await publicApi("series", {
    myAnimeListId: String(myAnimeListId),
    isActive: "1",
    fields: `${seriesFields},myAnimeListId,type,episodes`,
  });
  if (!Array.isArray(data)) throw new Error("Некорректный каталог");
  for (const series of data.map(record)) {
    if (series["myAnimeListId"] !== myAnimeListId) continue;
    const nextEpisode = findPublishedEpisode(series, episodeNumber);
    if (nextEpisode) return { ...parseAnime(series), nextEpisode };
  }
  return null;
}
export function fetchOngoing() {
  return fetchSeries({ isAiring: "1", limit: "1000" });
}

export function searchAnime(query: string) {
  return fetchSeries({ query, limit: "36" });
}
