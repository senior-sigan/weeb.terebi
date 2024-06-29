import { z } from "zod";

export async function fetchJson<T extends z.ZodRawShape>(
  url: URL,
  model: z.ZodObject<T>
) {
  const response = await fetch(url);
  if (!response.ok) {
    const rawData = await response.text();
    throw new Error(
      `Bad response url="${url.toString()}" status="${
        response.statusText
      }" data="${rawData}"`
    );
  }
  const data = await response.json();
  return await model.parseAsync(data);
}
