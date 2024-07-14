import { z } from "zod";

export const Title = z.object({
  ja: z.string().nullable().optional(),
  "x-jat": z.string().nullable().optional(),
  en: z.string().nullable().optional(),
});

export const Episode = z.object({
  episodeNumber: z.number().optional(),
  episode: z.string(),
  seasonNumber: z.number().optional(),
  title: Title.transform((t) =>
    !t.en && !t["x-jat"] && !t.ja ? undefined : t
  ),
  airDate: z.string().optional(),
  airDateUtc: z.string().optional(),
  summary: z.string().default(""),
  image: z.string().default(""),
  rating: z.string().default(""),
});

export const Series = z.object({
  titles: Title,
  episodes: z.record(Episode).transform((r) => new Map(Object.entries(r))),
  episodeCount: z.number(),
  specialCount: z.number(),
  images: z
    .object({
      coverType: z.string(),
      url: z.string(),
    })
    .array(),
});
