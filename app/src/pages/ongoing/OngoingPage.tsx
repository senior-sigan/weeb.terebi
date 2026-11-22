import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Anime, fetchOngoing } from "../../entities/anime/catalog";
import { remoteKey } from "../../shared/tv/remote";
import { AnimeGrid } from "../../widgets/catalog/AnimeGrid";

type Catalog =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; items: Anime[] };

export function OngoingPage({
  active,
  onMenu,
}: {
  active: boolean;
  onMenu: () => void;
}) {
  const [catalog, setCatalog] = useState<Catalog>({ kind: "loading" });
  const status = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (catalog.kind !== "loading") return;
    let current = true;
    fetchOngoing().then(
      (items) => {
        if (current) setCatalog({ kind: "ready", items });
      },
      () => {
        if (current) setCatalog({ kind: "error" });
      },
    );
    return () => {
      current = false;
    };
  }, [catalog.kind]);
  useLayoutEffect(() => {
    const node = status.current;
    if (active && node) (node.querySelector("button") ?? node).focus();
  }, [active, catalog.kind]);
  const items = catalog.kind === "ready" ? catalog.items : [];
  return (
    <>
      <div className="catalog-heading">
        <h1>Онгоинги</h1>
        {items.length > 0 && <span className="count">{items.length}</span>}
      </div>
      {items.length ? (
        <AnimeGrid
          items={items}
          label="Каталог онгоингов"
          active={active}
          onMenu={onMenu}
        />
      ) : (
        <div
          ref={status}
          className="status"
          role="status"
          tabIndex={-1}
          onKeyDown={(event) => {
            if (remoteKey(event) === "ArrowLeft") {
              event.preventDefault();
              onMenu();
            }
          }}
        >
          <p>
            {catalog.kind === "loading"
              ? "Загружаем онгоинги…"
              : catalog.kind === "error"
                ? "Не удалось загрузить каталог"
                : "Сейчас нет онгоингов"}
          </p>
          {catalog.kind !== "loading" && (
            <button
              id="retry"
              type="button"
              onClick={() => setCatalog({ kind: "loading" })}
            >
              Обновить
            </button>
          )}
        </div>
      )}
    </>
  );
}
