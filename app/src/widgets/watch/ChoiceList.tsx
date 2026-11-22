import { useEffect, useLayoutEffect, useRef, useState } from "react";
import type { Choice } from "../../entities/episode/playback";

interface Props {
  id: number;
  load: (id: number) => Promise<Choice[]>;
  visible: boolean;
  heading: string;
  onSelect: (item: Choice) => void;
  onBack: () => void;
}

type Result =
  | { kind: "loading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; items: Choice[] };

export function ChoiceList({
  id,
  load,
  visible,
  heading,
  onSelect,
  onBack,
}: Props) {
  const [result, setResult] = useState<Result>({ kind: "loading" });
  const list = useRef<HTMLFieldSetElement>(null);
  const selected = useRef(0);

  useEffect(() => {
    if (result.kind !== "loading") return;
    let active = true;
    load(id).then(
      (items) => {
        if (active) setResult({ kind: "ready", items });
      },
      (error: unknown) => {
        if (active)
          setResult({
            kind: "error",
            message: error instanceof Error ? error.message : "Ошибка загрузки",
          });
      },
    );
    return () => {
      active = false;
    };
  }, [id, load, result.kind]);

  useLayoutEffect(() => {
    if (visible && list.current) {
      const buttons = list.current.querySelectorAll("button");
      buttons[selected.current]?.focus();
    }
  }, [visible, result.kind]);

  return (
    <section hidden={!visible} className="choice-panel">
      <h3>{heading}</h3>
      <fieldset
        aria-label={heading}
        className="choice-list"
        ref={list}
        onKeyDown={(event) => {
          const step = event.keyCode === 38 ? -1 : event.keyCode === 40 ? 1 : 0;
          if (!step || !list.current) return;
          event.preventDefault();
          const buttons = list.current.querySelectorAll("button");
          buttons[
            Math.max(0, Math.min(buttons.length - 1, selected.current + step))
          ]?.focus();
        }}
      >
        {result.kind === "loading" && <p role="status">Загрузка…</p>}
        {result.kind === "error" && (
          <>
            <p role="alert">{result.message}</p>
            <button
              type="button"
              onFocus={() => {
                selected.current = 0;
              }}
              onClick={() => setResult({ kind: "loading" })}
            >
              Повторить
            </button>
          </>
        )}
        {result.kind === "ready" && !result.items.length && (
          <p>Пока ничего нет</p>
        )}
        {result.kind === "ready" &&
          result.items.map((item, index) => (
            <button
              key={item.id}
              data-choice={item.id}
              type="button"
              onFocus={() => {
                selected.current = index;
              }}
              onClick={() => onSelect(item)}
            >
              <strong>{item.title}</strong>
              {item.detail && <small>{item.detail}</small>}
            </button>
          ))}
        <button
          className="back-choice"
          type="button"
          onFocus={() => {
            selected.current =
              result.kind === "ready"
                ? result.items.length
                : result.kind === "error"
                  ? 1
                  : 0;
          }}
          onClick={onBack}
        >
          ← Назад
        </button>
      </fieldset>
    </section>
  );
}
