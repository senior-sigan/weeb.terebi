import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type AnimeTile, fetchOngoing } from "../../entities/anime/catalog";
import { fetchWatchQueue } from "../../entities/anime/watchQueue";
import { remoteKey } from "../../shared/tv/remote";
import { AnimeGrid } from "../../widgets/catalog/AnimeGrid";

type Catalog =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; items: AnimeTile[]; notice?: string };

const pages = {
  home: {
    title: "Серии к просмотру",
    loading: "Загружаем список Shikimori…",
    error: "Не удалось загрузить серии к просмотру",
    empty: "Пока нет новых серий к просмотру",
    load: fetchWatchQueue,
  },
  catalog: {
    title: "Онгоинги",
    loading: "Загружаем онгоинги…",
    error: "Не удалось загрузить каталог",
    empty: "Сейчас нет онгоингов",
    load: async () => ({ items: await fetchOngoing() }),
  },
};

export function CatalogPage({
  section,
  active,
  onMenu,
}: {
  section: keyof typeof pages;
  active: boolean;
  onMenu: () => void;
}) {
  const page = pages[section];
  const [catalog, setCatalog] = useState<Catalog>({ kind: "loading" });
  const status = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (catalog.kind !== "loading") return;
    let current = true;
    page.load().then(
      (result) => {
        if (current) setCatalog({ kind: "ready", ...result });
      },
      () => {
        if (current) setCatalog({ kind: "error" });
      },
    );
    return () => {
      current = false;
    };
  }, [catalog.kind, page]);
  useLayoutEffect(() => {
    const node = status.current;
    if (active && node) (node.querySelector("button") ?? node).focus();
  }, [active, catalog.kind]);
  const items = catalog.kind === "ready" ? catalog.items : [];
  const notice = catalog.kind === "ready" ? catalog.notice : undefined;
  return (
    <>
      <div className="catalog-heading">
        <h1>{page.title}</h1>
        {items.length > 0 && <span className="count">{items.length}</span>}
        {items.length > 0 && notice && (
          <span className="catalog-notice" role="status">
            {notice}
          </span>
        )}
      </div>
      {items.length ? (
        <AnimeGrid
          items={items}
          label={page.title}
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
            const key = remoteKey(event);
            if (key === "ArrowLeft" || key === "Back") {
              event.preventDefault();
              onMenu();
            }
          }}
        >
          <p>
            {catalog.kind === "loading"
              ? page.loading
              : catalog.kind === "error"
                ? page.error
                : notice || page.empty}
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
