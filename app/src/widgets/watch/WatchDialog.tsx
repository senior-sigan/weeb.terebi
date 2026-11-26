import { useState } from "react";
import type { Anime } from "../../entities/anime/catalog";
import {
  type Choice,
  type Episode,
  translations,
} from "../../entities/episode/playback";
import { remoteKey } from "../../shared/tv/remote";
import { ChoiceList } from "./ChoiceList";
import { Player } from "./Player";
import { SeriesPage } from "./SeriesPage";

type Screen =
  | { kind: "episodes" }
  | { kind: "translations"; episode: Episode }
  | { kind: "player"; episode: Episode; translation: Choice };

export function WatchDialog({
  anime,
  startEpisode,
  onClose,
}: {
  anime: Anime;
  startEpisode: Choice | undefined;
  onClose: () => void;
}) {
  const [screen, setScreen] = useState<Screen>({ kind: "episodes" });
  const number = screen.kind === "player" ? screen.episode.mainNumber : null;
  const progress =
    anime.myAnimeListId !== null &&
    number !== null &&
    Number.isSafeInteger(number)
      ? { animeId: anime.myAnimeListId, episode: number }
      : null;
  function back() {
    if (screen.kind === "player")
      setScreen({ kind: "translations", episode: screen.episode });
    else if (screen.kind === "translations") setScreen({ kind: "episodes" });
    else onClose();
  }

  return (
    <div
      role="dialog"
      aria-modal={screen.kind === "translations" ? undefined : true}
      aria-label={anime.title}
      className="modal"
      onKeyDown={(event) => {
        if (remoteKey(event) === "Back") {
          event.preventDefault();
          if (!event.repeat) back();
        }
      }}
    >
      <SeriesPage
        anime={anime}
        startEpisodeId={startEpisode?.id}
        active={screen.kind === "episodes"}
        visible={screen.kind !== "player"}
        onSelect={(episode, title) =>
          setScreen({
            kind: "translations",
            episode: { ...episode, detail: title },
          })
        }
        onBack={onClose}
      />
      {screen.kind !== "episodes" && (
        <div
          className="translation-overlay"
          role="dialog"
          aria-modal="true"
          aria-label="Выбор перевода"
          hidden={screen.kind === "player"}
        >
          <ChoiceList
            id={screen.episode.id}
            visible={screen.kind === "translations"}
            heading={
              screen.episode.detail
                ? `${screen.episode.title} · ${screen.episode.detail}`
                : screen.episode.title
            }
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
        </div>
      )}
      {screen.kind === "player" && (
        <Player
          id={screen.translation.id}
          title={`${anime.title} · ${screen.episode.title} · ${screen.translation.title}`}
          progress={progress}
          onBack={back}
        />
      )}
    </div>
  );
}
