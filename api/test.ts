import Anizip from "./providers/anizip/index.ts";
import SmotretAnime from "./providers/smotretanime/index.ts";

async function main() {
  const saProvider = new SmotretAnime();
  const azProvider = new Anizip();

  const seriesList = await saProvider.fetchSeries({
    isAiring: true,
    year: 2024,
  });
  const series = seriesList[0];
  const [mappings, episode] = await Promise.all([
    azProvider.fetchSeriesByID(series.myAnimeListId),
    saProvider.fetchEpisode(series.episodes[0].id),
  ]);

  console.log(episode);
  console.log(series);
  console.log(mappings);
}

await main();
