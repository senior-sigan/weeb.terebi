import { fetchJson } from "../../utils/fetcher.ts";
import {
  EpisodeResponse,
  SeriesResponse,
  SingleSeriesResponse,
  TranslationsResponse,
  ensureResponse,
} from "./models.ts";

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

    return ensureResponse(obj);
  }

  async fetchSeriesByID(seriesID: string) {
    const url = new URL(`/api/series/${seriesID}`, this.baseURL);
    const obj = await fetchJson(url, SingleSeriesResponse);
    return ensureResponse(obj);
  }

  async search(query: string) {
    const url = new URL("/api/series", this.baseURL);
    url.searchParams.set("query", query);

    const obj = await fetchJson(url, SeriesResponse);
    return ensureResponse(obj);
  }

  async fetchEpisode(episodeId: number) {
    const url = new URL(`/api/episodes/${episodeId}`, this.baseURL);
    const obj = await fetchJson(url, EpisodeResponse);
    return ensureResponse(obj);
  }

  async fetchTranslations(afterId: number = 0) {
    const url = new URL(`/api/translations/`, this.baseURL);
    url.searchParams.set("feed", "id");
    url.searchParams.set("limit", "1000");
    url.searchParams.set("afterId", afterId.toString());
    const obj = await fetchJson(url, TranslationsResponse);
    return ensureResponse(obj);
  }

  async *fetchTranslationsIter(afterId: number = 0) {
    let lastSaved = afterId;
    while (true) {
      const translations = await this.fetchTranslations(lastSaved);
      for (const tr of translations) {
        yield tr;
        lastSaved = tr.id;
      }
    }
  }
}
