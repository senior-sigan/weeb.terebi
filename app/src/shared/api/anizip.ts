import { record, request, text } from "./anime365";

export interface AnimeArtwork {
  backdrop: string;
  episodes: Map<number, EpisodeArtwork>;
}

interface EpisodeArtwork {
  image: string;
  title: string;
}

function imageUrl(value: unknown) {
  const url = text(value);
  return url.startsWith("https://") ? url : "";
}

export async function fetchAnimeArtwork(id: number): Promise<AnimeArtwork> {
  const data = record(
    await request(`https://api.ani.zip/mappings?mal_id=${id}`, "json"),
  );
  const images = data["images"];
  let backdrop = "";
  let banner = "";
  if (Array.isArray(images)) {
    for (const value of images) {
      const image = record(value);
      if (image["coverType"] === "Fanart") backdrop ||= imageUrl(image["url"]);
      if (image["coverType"] === "Banner") banner ||= imageUrl(image["url"]);
    }
  }

  const episodes = new Map<number, EpisodeArtwork>();
  for (const [number, value] of Object.entries(record(data["episodes"]))) {
    const episodeNumber = Number(number);
    if (!Number.isFinite(episodeNumber) || episodeNumber < 1) continue;
    const episode = record(value);
    const titles = record(episode["title"]);
    episodes.set(episodeNumber, {
      image: imageUrl(episode["image"]),
      title: text(titles["ru"]) || text(titles["en"]),
    });
  }
  return { backdrop: backdrop || banner, episodes };
}
