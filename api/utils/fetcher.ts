import { z } from "zod";

const USER_AGENT = "weeb.terebi/1.0.0";

export async function fetchJson<T extends z.ZodRawShape>(
  url: URL,
  model: z.ZodObject<T>
) {
  const response = await fetch(url, {
    headers: { "User-Agent": USER_AGENT },
  });
  if (!response.ok) {
    const rawData = await response.text();
    throw new Error(
      `Bad response url="${url.toString()}" status="${
        response.statusText
      }" data="${rawData}"`
    );
  }
  const data = await response.json();
  try {
    return await model.parseAsync(data);
  } catch (e) {
    const rawData = JSON.stringify(data);
    console.error(`Failed to parse data="${rawData}" error=${e.toString()}`);
    throw e;
  }
}
