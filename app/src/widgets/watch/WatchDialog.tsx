import { useRef, useState } from "react";
import type { Anime } from "../../entities/anime/catalog";
import {
  type Choice,
  episodes,
  translations,
} from "../../entities/episode/playback";
import { ChoiceList } from "./ChoiceList";
import { Player } from "./Player";

type Screen =
  | { kind: "episodes" }
  | { kind: "translations"; episode: Choice }
  | { kind: "player"; episode: Choice; translation: Choice };

export function WatchDialog({
  anime,
  startEpisode,
  onClose,
}: {
  anime: Anime;
  startEpisode: Choice | undefined;
  onClose: () => void;
}) {
  const [screen, setScreen] = useState<Screen>(
    startEpisode
      ? { kind: "translations", episode: startEpisode }
      : { kind: "episodes" },
  );
  const info = useRef<HTMLDivElement>(null);
  const lastButton = useRef<HTMLButtonElement | null>(null);
  function back() {
    if (screen.kind === "player")
      setScreen({ kind: "translations", episode: screen.episode });
    else if (screen.kind === "translations") setScreen({ kind: "episodes" });
    else onClose();
  }
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={anime.title}
      className="modal"
      onKeyDown={(event) => {
        if (
          event.keyCode === 10009 ||
          event.key === "Escape" ||
          event.key === "Backspace" ||
          event.key === "XF86Back"
        ) {
          event.preventDefault();
          if (!event.repeat) back();
        } else if (
          event.keyCode === 13 &&
          document.activeElement instanceof HTMLButtonElement
        ) {
          event.preventDefault();
          if (!event.repeat) document.activeElement.click();
        } else if (
          screen.kind !== "player" &&
          event.keyCode === 37 &&
          document.activeElement instanceof HTMLButtonElement
        ) {
          event.preventDefault();
          lastButton.current = document.activeElement;
          info.current?.focus();
        } else if (document.activeElement === info.current && info.current) {
          if (event.keyCode === 39) {
            event.preventDefault();
            lastButton.current?.focus();
          }
          if (event.keyCode === 38 || event.keyCode === 40) {
            event.preventDefault();
            info.current.scrollTop +=
              (event.keyCode === 38 ? -1 : 1) *
              info.current.clientHeight *
              0.65;
          }
        }
      }}
    >
      <section
        className="detail"
        aria-labelledby="detail-title"
        hidden={screen.kind === "player"}
      >
        <div className="film-info">
          <img
            className="film-art"
            src={anime.poster || anime.thumbnail}
            alt=""
          />
          <p className="detail-meta">
            {anime.edition}
            {anime.score && `　★ ${anime.score} MAL`}
          </p>
          <h2 id="detail-title">{anime.title}</h2>
          {anime.original !== anime.title && (
            <p className="original">{anime.original}</p>
          )}
          <div id="description" ref={info} tabIndex={-1}>
            <p className="genres">{anime.genres}</p>
            <p>{anime.synopsis}</p>
          </div>
        </div>
        <ChoiceList
          id={anime.id}
          visible={screen.kind === "episodes"}
          heading="Серии"
          load={episodes}
          onSelect={(episode) => setScreen({ kind: "translations", episode })}
          onBack={onClose}
        />
        {screen.kind !== "episodes" && (
          <ChoiceList
            id={screen.episode.id}
            visible={screen.kind === "translations"}
            heading={`${screen.episode.title} · Переводы`}
            load={translations}
            onSelect={(translation) =>
              setScreen({
                kind: "player",
                episode: screen.episode,
                translation,
              })
            }
            onBack={back}
          />
        )}
      </section>
      {screen.kind === "player" && (
        <Player
          id={screen.translation.id}
          title={`${anime.title} · ${screen.episode.title} · ${screen.translation.title}`}
          onBack={back}
        />
      )}
    </div>
  );
}
