import { api, origin, record, text } from "../../shared/api/anime365";

export interface Choice {
  id: number;
  title: string;
  detail: string;
}

export interface Episode extends Choice {
  mainNumber: number | null;
}

function activeRows(data: unknown, key: string) {
  const list = record(data)[key];
  if (!Array.isArray(list)) throw new Error("Некорректный ответ Anime 365");
  return list.map(record).filter((row) => row["isActive"] === 1);
}

export async function episodes(id: number): Promise<Episode[]> {
  const series = record(await api(`series/${id}`, { fields: "type,episodes" }));
  const rows = activeRows(series, "episodes");
  // The API includes trailers among numbered episodes.
  rows.sort(
    (a, b) =>
      Number(a["episodeType"] === "preview") -
        Number(b["episodeType"] === "preview") ||
      Number(a["episodeInt"]) - Number(b["episodeInt"]),
  );
  return rows.map((row) => {
    const number = row["episodeInt"];
    return {
      ...episodeChoice(row),
      mainNumber:
        typeof number === "number" &&
        number >= 1 &&
        isMainEpisode(series["type"], row["episodeType"])
          ? number
          : null,
    };
  });
}

function episodeChoice(row: Record<string, unknown>): Choice {
  return {
    id: numericId(row),
    title: text(row["episodeFull"]) || `Серия ${row["episodeInt"]}`,
    detail: text(row["episodeTitle"]),
  };
}

export function findPublishedEpisode(
  series: Record<string, unknown>,
  number: number,
): Choice | undefined {
  const type = series["type"];
  const rows = activeRows(series, "episodes");
  const row = rows.find((row) => {
    return (
      row["episodeInt"] === number &&
      row["isFirstUploaded"] === 1 &&
      isMainEpisode(type, row["episodeType"])
    );
  });
  return row && episodeChoice(row);
}

function isMainEpisode(seriesType: unknown, episodeType: unknown) {
  return (
    typeof seriesType === "string" &&
    (episodeType === seriesType ||
      (seriesType === "special" && episodeType === "tv_special"))
  );
}

function numericId(row: Record<string, unknown>) {
  const id = row["id"];
  if (typeof id !== "number")
    throw new Error("Нет идентификатора в ответе Anime 365");
  return id;
}

export async function translations(id: number): Promise<Choice[]> {
  const rows = activeRows(
    await api(`episodes/${id}`, { fields: "translations" }),
    "translations",
  );
  return rows.map((row) => {
    const kind = row["typeKind"];
    const label =
      kind === "sub"
        ? "Субтитры"
        : kind === "voice"
          ? "Озвучка"
          : kind === "raw"
            ? "Оригинал"
            : text(row["type"]) || "Перевод";
    return {
      id: numericId(row),
      title: text(row["authorsSummary"]) || label,
      detail: [label, text(row["typeLang"]).toUpperCase()]
        .filter(Boolean)
        .join(" · "),
    };
  });
}

export interface Stream {
  urls: string[];
  subtitles: string;
}

function mediaUrl(value: unknown) {
  if (!text(value)) return "";
  const url = new URL(text(value), origin);
  return url.protocol === "https:" ? url.href : "";
}

export async function stream(id: number): Promise<Stream> {
  const data = record(await api(`translations/embed/${id}`));
  const sources = data["stream"];
  const urls: string[] = [];
  if (Array.isArray(sources)) {
    const sorted = sources.map(record).sort((a, b) => {
      const first = Number(a["height"]),
        second = Number(b["height"]);
      return Number(first > 1080) - Number(second > 1080) || second - first;
    });
    for (const source of sorted) {
      const links = source["urls"];
      if (Array.isArray(links))
        urls.push(...links.map(mediaUrl).filter(Boolean));
    }
  }
  if (!urls.length) throw new Error("Для этого перевода пока нет видео");
  return { urls, subtitles: mediaUrl(data["subtitlesUrl"]) };
}
