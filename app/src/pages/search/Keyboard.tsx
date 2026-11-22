import { useLayoutEffect, useRef, useState } from "react";
import { remoteKey } from "../../shared/tv/remote";

const layouts = {
  ru: {
    digits: "ё1234567890-",
    top: "йцукенгшщзхъ",
    home: "фывапролджэ",
    bottom: "ячсмитьбю",
  },
  en: {
    digits: "1234567890-",
    top: "qwertyuiop",
    home: "asdfghjkl",
    bottom: "zxcvbnm",
  },
};
const symbols = {
  erase: <path d="M9 5h12v14H9l-7-7z M11 9l6 6m0-6-6 6" />,
  space: <path d="M3 9v6h18V9" />,
  language: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
};

interface Props {
  active: boolean;
  onType: (letter: string) => void;
  onErase: () => void;
  onMenu: () => void;
  onResults: () => void;
}

export function Keyboard({
  active,
  onType,
  onErase,
  onMenu,
  onResults,
}: Props) {
  const [language, setLanguage] = useState<"ru" | "en">("ru");
  const board = useRef<HTMLFieldSetElement>(null);
  const last = useRef<HTMLButtonElement | null>(null);
  const layout = layouts[language];
  const labels = {
    erase: "Стереть",
    space: "Пробел",
    language: language === "ru" ? "Английская раскладка" : "Русская раскладка",
  };
  const rows = [
    { name: "digits", keys: [...layout.digits, "erase"] },
    { name: "top", keys: [...layout.top] },
    { name: "home", keys: [...layout.home] },
    { name: "bottom", keys: [...layout.bottom, "space", "language"] },
  ];

  useLayoutEffect(() => {
    if (active)
      (
        last.current ??
        board.current?.querySelector<HTMLButtonElement>(
          '[data-row="top"] button',
        )
      )?.focus();
  }, [active]);

  function move(event: React.KeyboardEvent<HTMLButtonElement>) {
    const button = event.currentTarget;
    const row = button.parentElement;
    if (!row) return;
    const key = remoteKey(event);
    switch (key) {
      case "Back":
        onMenu();
        break;
      case "ArrowLeft":
        if (button.previousElementSibling instanceof HTMLButtonElement)
          button.previousElementSibling.focus();
        else onMenu();
        break;
      case "ArrowRight":
        if (button.nextElementSibling instanceof HTMLButtonElement)
          button.nextElementSibling.focus();
        break;
      case "ArrowUp":
      case "ArrowDown": {
        const next =
          key === "ArrowUp"
            ? row.previousElementSibling
            : row.nextElementSibling;
        if (next) {
          const center = button.offsetLeft + button.offsetWidth / 2;
          const neighbors = Array.from(next.querySelectorAll("button"));
          const distance = (candidate: HTMLButtonElement) =>
            Math.abs(candidate.offsetLeft + candidate.offsetWidth / 2 - center);
          neighbors
            .reduce((nearest, candidate) =>
              distance(candidate) < distance(nearest) ? candidate : nearest,
            )
            .focus();
        } else if (key === "ArrowDown") onResults();
        break;
      }
      default:
        return;
    }
    event.preventDefault();
  }

  return (
    <fieldset className="keyboard" aria-label="Экранная клавиатура" ref={board}>
      {rows.map(({ name, keys }) => (
        <div className="key-row" data-row={name} key={name}>
          {keys.map((key) => {
            const action =
              key === "erase" || key === "space" || key === "language"
                ? key
                : null;
            return (
              <button
                type="button"
                className={action ? `key key-action key-${action}` : "key"}
                key={key}
                aria-label={action ? labels[action] : undefined}
                onFocus={(e) => {
                  last.current = e.currentTarget;
                }}
                onKeyDown={move}
                onClick={() => {
                  if (action === "erase") onErase();
                  else if (action === "language")
                    setLanguage(language === "ru" ? "en" : "ru");
                  else onType(action === "space" ? " " : key);
                }}
              >
                {action ? (
                  <svg
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    aria-hidden="true"
                  >
                    {symbols[action]}
                  </svg>
                ) : (
                  key
                )}
              </button>
            );
          })}
        </div>
      ))}
    </fieldset>
  );
}
