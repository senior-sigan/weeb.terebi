import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Anime } from "../../entities/anime/catalog";
import { Poster } from "../../entities/anime/Poster";
import { type Episode, episodes } from "../../entities/episode/playback";
import { type AnimeArtwork, fetchAnimeArtwork } from "../../shared/api/anizip";
import {
  type AnimeProfile,
  fetchAnimeProfile,
} from "../../shared/api/shikimori";
import { remoteKey } from "../../shared/tv/remote";

type EpisodeList =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; items: Episode[] };

interface Props {
  anime: Anime;
  startEpisodeId: number | undefined;
  active: boolean;
  visible: boolean;
  onSelect: (episode: Episode, title: string) => void;
  onBack: () => void;
}

export function SeriesPage({
  anime,
  startEpisodeId,
  active,
  visible,
  onSelect,
  onBack,
}: Props) {
  const [list, setList] = useState<EpisodeList>({ kind: "loading" });
  const [profile, setProfile] = useState<AnimeProfile>();
  const [artwork, setArtwork] = useState<AnimeArtwork>();
  const [brokenBackdrop, setBrokenBackdrop] = useState("");
  const back = useRef<HTMLButtonElement>(null);
  const retry = useRef<HTMLButtonElement>(null);
  const info = useRef<HTMLElement>(null);
  const strip = useRef<HTMLDivElement>(null);
  const selected = useRef(startEpisodeId);

  useEffect(() => {
    if (list.kind !== "loading") return;
    let current = true;
    episodes(anime.id).then(
      (items) => {
        if (current) setList({ kind: "ready", items });
      },
      () => {
        if (current) setList({ kind: "error" });
      },
    );
    return () => {
      current = false;
    };
  }, [anime.id, list.kind]);

  useEffect(() => {
    if (anime.myAnimeListId === null) return;
    let current = true;
    fetchAnimeProfile(anime.myAnimeListId).then(
      (profile) => {
        if (current) setProfile(profile);
      },
      () => {},
    );
    fetchAnimeArtwork(anime.myAnimeListId).then(
      (artwork) => {
        if (current) setArtwork(artwork);
      },
      () => {},
    );
    return () => {
      current = false;
    };
  }, [anime.myAnimeListId]);

  function focusEpisodes() {
    const row = strip.current;
    return (
      row?.querySelector<HTMLButtonElement>(
        `[data-episode="${selected.current}"]`,
      ) ??
      row?.querySelector<HTMLButtonElement>("button") ??
      retry.current
    );
  }

  useLayoutEffect(() => {
    if (active) (focusEpisodes() ?? back.current)?.focus();
  }, [active, list.kind]);

  const image =
    artwork?.backdrop && artwork.backdrop !== brokenBackdrop
      ? artwork.backdrop
      : anime.poster || anime.thumbnail;
  const hasInfo = Boolean(profile?.synopsis || profile?.tags.length);
  const tabIndex = active ? 0 : -1;
  return (
    <section
      className="series-page"
      aria-labelledby="series-title"
      aria-hidden={!active}
      hidden={!visible}
    >
      <header className="series-hero">
        <div className="series-art" aria-hidden="true">
          {image && (
            <img
              key={image}
              className={
                image === artwork?.backdrop ? undefined : "cover-fallback"
              }
              src={image}
              alt=""
              onError={(event) => {
                event.currentTarget.hidden = true;
                if (image === artwork?.backdrop) setBrokenBackdrop(image);
              }}
            />
          )}
        </div>
        <button
          className="series-back"
          type="button"
          ref={back}
          tabIndex={tabIndex}
          onClick={onBack}
          onKeyDown={(event) => {
            if (remoteKey(event) !== "ArrowDown") return;
            event.preventDefault();
            (info.current ?? focusEpisodes())?.focus();
          }}
        >
          ← Назад
        </button>
        <div className="series-copy">
          <p className="detail-meta">
            {anime.edition}
            {anime.score && `　★ ${anime.score} MAL`}
          </p>
          <h2 id="series-title">{anime.title}</h2>
          {anime.original && anime.original !== anime.title && (
            <p className="series-original">{anime.original}</p>
          )}
          {hasInfo && (
            <section
              ref={info}
              className="series-info"
              tabIndex={tabIndex}
              aria-label="Описание и жанры"
              onKeyDown={(event) => {
                const node = event.currentTarget;
                const key = remoteKey(event);
                if (key === "ArrowUp" || key === "ArrowDown") {
                  event.preventDefault();
                  if (key === "ArrowUp" && node.scrollTop === 0)
                    back.current?.focus();
                  else if (
                    key === "ArrowDown" &&
                    node.scrollTop + node.clientHeight >= node.scrollHeight - 1
                  )
                    focusEpisodes()?.focus();
                  else
                    node.scrollTop +=
                      (key === "ArrowDown" ? 1 : -1) * node.clientHeight * 0.65;
                }
              }}
            >
              {Boolean(profile?.tags.length) && (
                <ul className="series-tags" aria-label="Жанры">
                  {profile?.tags.map((tag) => (
                    <li key={tag}>{tag}</li>
                  ))}
                </ul>
              )}
              {profile?.synopsis && (
                <p className="series-synopsis">{profile.synopsis}</p>
              )}
            </section>
          )}
        </div>
      </header>
      <section
        className="series-episodes"
        aria-labelledby="series-episodes-title"
      >
        <h3 id="series-episodes-title">Серии</h3>
        {list.kind === "loading" && <p role="status">Загружаем серии…</p>}
        {list.kind === "error" && (
          <>
            <p role="alert">Не удалось загрузить серии</p>
            <button
              className="series-retry"
              type="button"
              ref={retry}
              tabIndex={tabIndex}
              onClick={() => setList({ kind: "loading" })}
              onKeyDown={(event) => {
                if (remoteKey(event) !== "ArrowUp") return;
                event.preventDefault();
                (info.current ?? back.current)?.focus();
              }}
            >
              Повторить
            </button>
          </>
        )}
        {list.kind === "ready" && !list.items.length && (
          <p>Пока нет доступных серий</p>
        )}
        {list.kind === "ready" && list.items.length > 0 && (
          <div className="episode-strip" ref={strip}>
            {list.items.map((episode) => {
              const extra =
                episode.mainNumber === null
                  ? undefined
                  : artwork?.episodes.get(episode.mainNumber);
              const title = extra?.title || episode.detail;
              return (
                <button
                  className="episode-card"
                  key={episode.id}
                  data-episode={episode.id}
                  type="button"
                  tabIndex={tabIndex}
                  onFocus={() => {
                    selected.current = episode.id;
                  }}
                  onClick={() => onSelect(episode, title)}
                  onKeyDown={(event) => {
                    const button = event.currentTarget;
                    switch (remoteKey(event)) {
                      case "ArrowLeft":
                        if (
                          button.previousElementSibling instanceof
                          HTMLButtonElement
                        )
                          button.previousElementSibling.focus();
                        break;
                      case "ArrowRight":
                        if (
                          button.nextElementSibling instanceof HTMLButtonElement
                        )
                          button.nextElementSibling.focus();
                        break;
                      case "ArrowUp":
                        (info.current ?? back.current)?.focus();
                        break;
                      default:
                        return;
                    }
                    event.preventDefault();
                  }}
                >
                  <span className="episode-preview">
                    {extra?.image && <Poster src={extra.image} />}
                  </span>
                  <span className="episode-number">{episode.title}</span>
                  {title && <span className="episode-title">{title}</span>}
                </button>
              );
            })}
          </div>
        )}
      </section>
    </section>
  );
}
