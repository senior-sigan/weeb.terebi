import { fetchWatching, hasShikimoriProfile } from "../../shared/api/shikimori";
import { type AnimeTile, fetchNextEpisode } from "./catalog";

export async function fetchWatchQueue(): Promise<{
  items: AnimeTile[];
  notice?: string;
}> {
  if (!hasShikimoriProfile())
    return {
      items: [],
      notice: "Подключите профиль в разделе Shikimori",
    };

  const watching = await fetchWatching();
  const items: AnimeTile[] = [];
  const batchSize = 6;
  let failed = 0;
  for (let start = 0; start < watching.length; start += batchSize) {
    const batch = await Promise.all(
      watching.slice(start, start + batchSize).map(({ animeId, watched }) =>
        fetchNextEpisode(animeId, watched + 1).catch(() => {
          failed += 1;
          return null;
        }),
      ),
    );
    for (const item of batch) {
      if (item) items.push(item);
    }
  }
  if (failed && !items.length) throw new Error("Не удалось проверить серии");
  return failed ? { items, notice: "Часть списка не загрузилась" } : { items };
}
