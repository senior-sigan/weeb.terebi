import { fetchJson } from "../../utils/fetcher.ts";
import { Series } from "./models.ts";

export default class Anizip {
  constructor(public baseURL: string = "https://api.ani.zip/") {}

  async fetchSeriesByID(id: number, source: string = "mal") {
    const url = new URL(`/mappings`, this.baseURL);
    url.searchParams.set(`${source}_id`, id.toString());
    const obj = await fetchJson(url, Series);
    return obj;
  }
}
