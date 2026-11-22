import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { type Anime, searchAnime } from "../../entities/anime/catalog";
import { remoteKey } from "../../shared/tv/remote";
import { AnimeGrid } from "../../widgets/catalog/AnimeGrid";
import { Keyboard } from "./Keyboard";

type Result =
  | { query: string; kind: "ready"; items: Anime[] }
  | { query: string; kind: "error" };
export function SearchPage({
  active,
  onMenu,
}: {
  active: boolean;
  onMenu: () => void;
}) {
  const [input, setInput] = useState("");
  const [zone, setZone] = useState<"keyboard" | "results">("keyboard");
  const [result, setResult] = useState<Result | null>(null);
  const [attempt, setAttempt] = useState(0);
  const query = input.trim();
  useEffect(() => {
    if (!query) return;
    let current = true;
    const timer = window.setTimeout(() => {
      searchAnime(query).then(
        (items) => {
          if (current) setResult({ query, kind: "ready", items });
        },
        () => {
          if (current) setResult({ query, kind: "error" });
        },
      );
    }, 350);
    return () => {
      current = false;
      window.clearTimeout(timer);
    };
  }, [query, attempt]);

  const match = result?.query === query ? result : null;
  const items = match?.kind === "ready" ? match.items : [];
  const retry = useRef<HTMLButtonElement>(null);
  useLayoutEffect(() => {
    if (active && zone === "results") retry.current?.focus();
  }, [active, zone]);
  function update(value: string) {
    setZone("keyboard");
    if (value.trim() !== query) setResult(null);
    setInput(value);
  }
  function showResults() {
    if (items.length || match?.kind === "error") setZone("results");
  }
  return (
    <>
      <div className="search-heading">
        <h1>Поиск</h1>
        <output
          aria-label="Поисковый запрос"
          className={!input ? "query empty-query" : "query"}
        >
          {input || "Название аниме"}
        </output>
      </div>
      <Keyboard
        active={active && zone === "keyboard"}
        onType={(letter) => update(input + letter)}
        onErase={() => update(input.slice(0, -1))}
        onMenu={onMenu}
        onResults={showResults}
      />
      <div className="results-heading" role="status">
        {!query
          ? "Введите название для поиска"
          : !match
            ? "Ищем…"
            : match.kind === "error"
              ? "Не удалось загрузить результаты"
              : items.length
                ? "Результаты поиска"
                : "Ничего не найдено"}
      </div>
      {match?.kind === "error" && (
        <button
          className="search-retry"
          type="button"
          ref={retry}
          onClick={() => {
            setZone("keyboard");
            setResult(null);
            setAttempt((n) => n + 1);
          }}
          onKeyDown={(event) => {
            const key = remoteKey(event);
            if (key === "Back" || key === "ArrowUp") {
              event.preventDefault();
              setZone("keyboard");
            }
            if (key === "ArrowLeft") {
              event.preventDefault();
              onMenu();
            }
          }}
        >
          Повторить поиск
        </button>
      )}
      {items.length > 0 && (
        <AnimeGrid
          key={query}
          items={items}
          label="Результаты поиска"
          active={active && zone === "results"}
          onTop={() => setZone("keyboard")}
          onActivate={showResults}
          onMenu={onMenu}
        />
      )}
      {!items.length && <div className="search-space" />}
    </>
  );
}
