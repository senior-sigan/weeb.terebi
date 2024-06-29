import { fetchJson } from "../../utils/fetcher.ts";
import { SeriesResponse } from "./models.ts";

export default class SmotretAnime {
  constructor(public baseURL: string = "https://smotret-anime.ru/") {}

  async fetchSeries(options: { isAiring?: boolean; year?: number }) {
    const url = new URL("/api/series/filter", this.baseURL);
    // TODO: extract into a url query builder
    if (options.isAiring) {
      url.searchParams.set("isAiring", "1");
    }
    if (options.year) {
      url.searchParams.set("year", options.year.toString());
    }

    const obj = await fetchJson(url, SeriesResponse);
    return obj.data;
  }

  async search(query: string) {
    const url = new URL("/api/series", this.baseURL);
    url.searchParams.set("query", query);

    const obj = await fetchJson(url, SeriesResponse);
    return obj.data;
  }
}
