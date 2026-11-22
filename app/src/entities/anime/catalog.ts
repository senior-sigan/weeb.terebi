declare const __ACCESS_TOKEN__: string;

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

function record(value: unknown): Record<string, unknown> {
  return typeof value === "object" && value !== null ? { ...value } : {};
}

function text(value: unknown) {
  return typeof value === "string" ? value.trim() : "";
}

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

export function fetchOngoing(): Promise<Anime[]> {
  const fields =
    "id,titles,title,posterUrl,posterUrlSmall,typeTitle,season,genres,descriptions,myAnimeListScore";
  const query = new URLSearchParams({
    isAiring: "1",
    isActive: "1",
    fields,
    limit: "1000",
    access_token: __ACCESS_TOKEN__,
  });
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://smotret-anime.app/api/series?${query}`);
    xhr.responseType = "json";
    xhr.timeout = 20000;
    xhr.onerror = xhr.ontimeout = () =>
      reject(new Error("Нет связи с Anime 365"));
    xhr.onload = () => {
      try {
        const data = record(xhr.response)["data"];
        if (xhr.status !== 200 || !Array.isArray(data))
          throw new Error("Anime 365 не вернул каталог");
        resolve(data.map(parseAnime));
      } catch (error) {
        reject(error);
      }
    };
    xhr.send();
  });
}
