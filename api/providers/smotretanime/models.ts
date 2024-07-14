import { z } from "zod";

export const Translation = z.object({
  id: z.number(),
  seriesId: z.number(),
  episodeId: z.number(),
  title: z.string(),
  width: z.number(),
  height: z.number(),
  duration: z.string(),
  embedUrl: z.string(),
  qualityType: z.string(), // tv
  type: z.string(), // subRu, raw, subEn, voiceRu, voiceEn
  typeKind: z.string(), // sub, raw, voice
  typeLang: z.string(), // ru, en, ja
  authorsSummary: z.string(),
  addedDateTime: z.string(),
  isActive: z.number().transform((v) => v === 1),
  fansubsTranslationId: z.number().default(0),
});

export const Episode = z.object({
  id: z.number(),
  seriesId: z.number(),
  episodeFull: z.string(),
  episodeInt: z.string(),
  firstUploadedDateTime: z.string(),
  translations: Translation.array().optional(),
  isActive: z.number().transform((v) => v === 1),
});

export const Series = z.object({
  id: z.number(),
  isActive: z.number().transform((v) => v === 1),
  isAiring: z.number().transform((v) => v === 1),
  isHentai: z.number().transform((v) => v === 1),
  aniDbId: z.number(),
  myAnimeListId: z.number(),
  myAnimeListScore: z.string(),
  season: z.string(),
  year: z.number(),
  titleLines: z.string().array(),
  titles: z.object({
    ja: z.string().optional(),
    en: z.string().optional(),
    ru: z.string().optional(),
    romaji: z.string().optional(),
  }),
  fansubsId: z.number(),
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
  numberOfEpisodes: z.number(),
  episodes: Episode.array().optional(),
});

const TranslationFull = Translation.extend({
  series: Series,
  episode: Episode,
});

export const ErrorSchema = z.object({
  code: z.number(),
  message: z.string(),
});
export type ErrorSchema = z.infer<typeof ErrorSchema>;

export const SeriesResponse = z.object({
  data: Series.array().optional(),
  error: ErrorSchema.optional(),
});
export const SingleSeriesResponse = z.object({
  data: Series.optional(),
  error: ErrorSchema.optional(),
});
export const EpisodeResponse = z.object({
  data: Episode.optional(),
  error: ErrorSchema.optional(),
});
export const TranslationsResponse = z.object({
  data: TranslationFull.array().optional(),
  error: ErrorSchema.optional(),
});

export function ensureResponse<T>(response: {
  data?: T | undefined;
  error?: ErrorSchema | undefined;
}) {
  const { data, error } = response;
  if (error) {
    throw new Error(`API error: ${error.message}`);
  }
  if (!data) {
    throw new Error("Empty response");
  }
  return data;
}

export type Episode = z.infer<typeof Episode>;
export type Series = z.infer<typeof Series>;
