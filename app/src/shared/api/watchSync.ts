import { record } from "./anime365";
import { shikimoriAccount, shikimoriApi } from "./shikimoriSession";

export interface WatchProgress {
  animeId: number;
  episode: number;
}

let queue = Promise.resolve();

export function saveWatchProgress({
  animeId,
  episode,
}: WatchProgress): Promise<void> {
  const account = shikimoriAccount();
  if (!account)
    return Promise.reject(new Error("Подключите профиль Shikimori"));
  const result = queue.then(async () => {
    const query = new URLSearchParams({
      user_id: String(account.id),
      target_id: String(animeId),
      target_type: "Anime",
    });
    const data = await shikimoriApi(account, `v2/user_rates?${query}`);
    if (!Array.isArray(data)) throw new Error("Некорректный список Shikimori");
    const rate = data
      .map(record)
      .find(
        (item) =>
          item["user_id"] === account.id &&
          item["target_id"] === animeId &&
          item["target_type"] === "Anime",
      );
    let updated: unknown;
    if (rate) {
      const id = rate["id"];
      const watched = rate["episodes"];
      if (
        typeof id !== "number" ||
        !Number.isSafeInteger(id) ||
        id <= 0 ||
        typeof watched !== "number" ||
        !Number.isSafeInteger(watched) ||
        watched < 0
      )
        throw new Error("Некорректная запись Shikimori");
      if (watched >= episode) return;
      updated = await shikimoriApi(account, `v2/user_rates/${id}`, {
        method: "PATCH",
        body: { user_rate: { episodes: episode } },
      });
    } else {
      updated = await shikimoriApi(account, "v2/user_rates", {
        method: "POST",
        body: {
          user_rate: {
            user_id: account.id,
            target_id: animeId,
            target_type: "Anime",
            status: "watching",
            episodes: episode,
          },
        },
      });
    }
    const saved = record(updated)["episodes"];
    if (
      typeof saved !== "number" ||
      !Number.isSafeInteger(saved) ||
      saved < episode
    )
      throw new Error("Shikimori не подтвердил отметку");
  });
  queue = result.catch(() => {});
  return result;
}
