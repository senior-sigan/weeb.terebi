import { useEffect, useLayoutEffect, useState } from "react";
import { type Anime, fetchOngoing } from "../../entities/anime/catalog";
import { Poster } from "../../entities/anime/Poster";
import { Sidebar } from "../../widgets/sidebar/Sidebar";
import { WatchDialog } from "../../widgets/watch/WatchDialog";

const columns = 5;
const arrowKeys: Readonly<Record<number, string>> = {
  37: "ArrowLeft",
  38: "ArrowUp",
  39: "ArrowRight",
  40: "ArrowDown",
};
type Catalog =
  | { kind: "loading" }
  | { kind: "error" }
  | { kind: "ready"; items: Anime[] };
type Panel = "grid" | "menu" | "details";

export function OngoingPage() {
  const [catalog, setCatalog] = useState<Catalog>({ kind: "loading" });
  const [index, setIndex] = useState(0);
  const [panel, setPanel] = useState<Panel>("grid");
  const items = catalog.kind === "ready" ? catalog.items : [];
  const anime = items[index];

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

  function refresh() {
    setCatalog({ kind: "loading" });
    setIndex(0);
    setPanel("grid");
  }

  const focusId =
    panel === "menu"
      ? "catalog-menu"
      : panel === "details"
        ? null
        : anime
          ? `anime-${anime.id}`
          : catalog.kind === "loading"
            ? null
            : "retry";
  useLayoutEffect(() => {
    if (focusId) document.getElementById(focusId)?.focus();
  }, [focusId]);

  useEffect(() => {
    if (panel === "details") return;
    function keydown(event: KeyboardEvent) {
      if (event.key === "Enter" || event.keyCode === 13) {
        event.preventDefault();
        if (
          !event.repeat &&
          document.activeElement instanceof HTMLButtonElement
        )
          document.activeElement.click();
        return;
      }
      const back =
        event.keyCode === 10009 ||
        event.key === "Escape" ||
        event.key === "Backspace";
      if (back && panel !== "grid") {
        event.preventDefault();
        setPanel("grid");
        return;
      }
      const key = arrowKeys[event.keyCode] ?? event.key;
      if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(key))
        return;
      event.preventDefault();
      if (panel === "menu") {
        if (key === "ArrowRight") setPanel("grid");
        if (key === "ArrowUp") document.getElementById("catalog-menu")?.focus();
        if (key === "ArrowDown")
          document.getElementById("refresh-menu")?.focus();
      } else if (key === "ArrowLeft" && index % columns === 0) setPanel("menu");
      else if (key === "ArrowLeft") setIndex(index - 1);
      else if (
        key === "ArrowRight" &&
        index % columns < columns - 1 &&
        index + 1 < items.length
      )
        setIndex(index + 1);
      else if (key === "ArrowUp" && index >= columns) setIndex(index - columns);
      else if (
        key === "ArrowDown" &&
        (Math.floor(index / columns) + 1) * columns < items.length
      )
        setIndex(Math.min(index + columns, items.length - 1));
    }
    window.addEventListener("keydown", keydown);
    return () => window.removeEventListener("keydown", keydown);
  }, [panel, index, items.length]);

  return (
    <>
      <Sidebar
        open={panel === "menu"}
        onOpen={() => setPanel("menu")}
        onClose={() => setPanel("grid")}
        onRefresh={refresh}
      />
      <main>
        <header className="mast">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true">
              w
            </span>
            weeb<span className="brand-dot">.</span>terebi
          </div>
          <span className="source">Anime 365</span>
        </header>
        <div className="catalog-heading">
          <h1>Онгоинги</h1>
          {items.length > 0 && <span className="count">{items.length}</span>}
        </div>
        {anime ? (
          <section className="scroller" aria-label="Каталог онгоингов">
            <div className="tiles">
              {items.map((item, position) => (
                <button
                  key={item.id}
                  id={`anime-${item.id}`}
                  type="button"
                  className="tile"
                  tabIndex={panel === "grid" && index === position ? 0 : -1}
                  onFocus={() => setIndex(position)}
                  onClick={() => {
                    setIndex(position);
                    setPanel("details");
                  }}
                >
                  <span className="poster">
                    <Poster src={item.thumbnail} />
                  </span>
                  <span className="tile-title">{item.title}</span>
                  <span className="meta">{item.edition}</span>
                </button>
              ))}
            </div>
          </section>
        ) : (
          <div className="status" role="status">
            <p>
              {catalog.kind === "loading"
                ? "Загружаем онгоинги…"
                : catalog.kind === "error"
                  ? "Не удалось загрузить каталог"
                  : "Сейчас нет онгоингов"}
            </p>
            {catalog.kind !== "loading" && (
              <button id="retry" type="button" onClick={refresh}>
                Обновить
              </button>
            )}
          </div>
        )}
        <footer>
          <span>
            <kbd>←</kbd> Меню с левого края
          </span>
          <span>
            <kbd>↑↓←→</kbd> Выбор
          </span>
          <span>
            <kbd>OK</kbd> Подробнее
          </span>
        </footer>
      </main>
      {panel === "details" && anime && (
        <WatchDialog anime={anime} onClose={() => setPanel("grid")} />
      )}
    </>
  );
}
