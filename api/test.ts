import SmotretAnime from "./providers/smotretanime/index.ts";

async function main() {
  const provider = new SmotretAnime();
  // const series = await provider.fetchSeries({
  //   isAiring: true,
  //   year: 2024,
  // });
  const series = await provider.search("gate");
  console.log(series);
}

await main();
