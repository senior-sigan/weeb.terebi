import { useLayoutEffect, useRef, useState } from "react";
import type { AnimeTile } from "../../entities/anime/catalog";
import { Poster } from "../../entities/anime/Poster";
import { remoteKey } from "../../shared/tv/remote";
import { WatchDialog } from "../watch/WatchDialog";

interface Props {
  items: AnimeTile[];
  label: string;
  active: boolean;
  onMenu: () => void;
  onTop?: () => void;
  onActivate?: () => void;
}

export function AnimeGrid({
  items,
  label,
  active,
  onMenu,
  onTop,
  onActivate,
}: Props) {
  const grid = useRef<HTMLDivElement>(null);
  const [index, setIndex] = useState(0);
  const [opened, setOpened] = useState<AnimeTile | null>(null);
  const columns = 5;

  useLayoutEffect(() => {
    if (active && !opened)
      grid.current?.querySelectorAll("button")[index]?.focus();
  }, [active, index, opened]);

  return (
    <>
      <section className="scroller" aria-label={label}>
        <div className="tiles" ref={grid}>
          {items.map((item, position) => (
            <button
              key={item.id}
              id={`anime-${item.id}`}
              type="button"
              className="tile"
              tabIndex={active && !opened && index === position ? 0 : -1}
              onFocus={() => setIndex(position)}
              onClick={() => {
                onActivate?.();
                setIndex(position);
                setOpened(item);
              }}
              onKeyDown={(event) => {
                const key = remoteKey(event);
                switch (key) {
                  case "ArrowLeft":
                    if (position % columns === 0) onMenu();
                    else setIndex(position - 1);
                    break;
                  case "ArrowRight":
                    if (
                      position % columns < columns - 1 &&
                      position + 1 < items.length
                    )
                      setIndex(position + 1);
                    break;
                  case "ArrowUp":
                    if (position >= columns) setIndex(position - columns);
                    else onTop?.();
                    break;
                  case "ArrowDown":
                    if (
                      (Math.floor(position / columns) + 1) * columns <
                      items.length
                    )
                      setIndex(Math.min(position + columns, items.length - 1));
                    break;
                  case "Back":
                    if (onTop) onTop();
                    else return;
                    break;
                  default:
                    return;
                }
                event.preventDefault();
              }}
            >
              <span className="poster">
                <Poster src={item.thumbnail} />
              </span>
              <span className="tile-title">{item.title}</span>
              <span className="meta">
                {item.nextEpisode?.title || item.edition}
              </span>
            </button>
          ))}
        </div>
      </section>
      {opened && (
        <WatchDialog
          anime={opened}
          startEpisode={opened.nextEpisode}
          onClose={() => setOpened(null)}
        />
      )}
    </>
  );
}
