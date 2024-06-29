import { z } from "zod";

export const Episode = z.object({
  id: z.number(),
  episodeFull: z.string(),
  episodeInt: z.string(),
  firstUploadedDateTime: z.string(),
});

export const Series = z.object({
  id: z.number(),
  aniDbId: z.number(),
  myAnimeListId: z.number(),
  myAnimeListScore: z.string(),
  season: z.string(),
  year: z.number(),
  titleLines: z.string().array(),
  posterUrl: z.string(),
  descriptions: z
    .object({
      source: z.string(),
      value: z.string(),
    })
    .array()
    .default([]),
  genres: z
    .object({
      title: z.string(),
    })
    .array()
    .default([]),
  episodes: Episode.array().default([]),
});

export const SeriesResponse = z.object({ data: Series.array() });

export type Episode = z.infer<typeof Episode>;
export type Series = z.infer<typeof Series>;
