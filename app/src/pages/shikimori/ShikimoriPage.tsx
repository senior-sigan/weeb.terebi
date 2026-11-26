import { useLayoutEffect, useRef, useState } from "react";
import {
  canConnectShikimori,
  connectShikimori,
  disconnectShikimori,
  shikimoriAccount,
  shikimoriAuthorizationUrl,
} from "../../shared/api/shikimoriSession";
import { openSystemBrowser } from "../../shared/tv/mediaKeys";
import { remoteKey } from "../../shared/tv/remote";

export function ShikimoriPage({
  active,
  onMenu,
}: {
  active: boolean;
  onMenu: () => void;
}) {
  const panel = useRef<HTMLElement>(null);
  const [account, setAccount] = useState(shikimoriAccount);
  const [code, setCode] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");
  const tabIndex = active ? 0 : -1;
  useLayoutEffect(() => {
    if (!active || pending) return;
    const node = panel.current;
    (node?.querySelector<HTMLButtonElement>("button") ?? node)?.focus();
  }, [active, account, pending]);

  function openBrowser() {
    setError("");
    openSystemBrowser(shikimoriAuthorizationUrl()).catch((error: unknown) => {
      setError(
        error instanceof Error ? error.message : "Не удалось открыть Shikimori",
      );
    });
  }
  function connect(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!code.trim() || pending) return;
    setPending(true);
    setError("");
    connectShikimori(code).then(
      (account) => {
        setAccount(account);
        setCode("");
        setPending(false);
      },
      (error: unknown) => {
        setError(
          error instanceof Error
            ? error.message
            : "Не удалось подключить Shikimori",
        );
        setPending(false);
      },
    );
  }
  function disconnect() {
    try {
      disconnectShikimori();
      setAccount(null);
      setError("");
    } catch {
      setError("Не удалось удалить сессию с телевизора");
    }
  }

  return (
    <>
      <div className="catalog-heading">
        <h1>Shikimori</h1>
      </div>
      <section
        ref={panel}
        className="shikimori-page"
        aria-label="Подключение Shikimori"
        tabIndex={-1}
        onKeyDown={(event) => {
          const input = event.target instanceof HTMLInputElement;
          const key = remoteKey(event);
          if (
            (key === "Back" && (!input || event.key !== "Backspace")) ||
            (key === "ArrowLeft" && !input)
          ) {
            event.preventDefault();
            onMenu();
          } else if (key === "ArrowUp" || key === "ArrowDown") {
            event.preventDefault();
            const controls = Array.from(
              panel.current?.querySelectorAll<HTMLElement>(
                "button:enabled, input:enabled",
              ) ?? [],
            );
            const position =
              event.target instanceof HTMLElement
                ? controls.indexOf(event.target)
                : -1;
            const next = position + (key === "ArrowUp" ? -1 : 1);
            controls[Math.max(0, Math.min(controls.length - 1, next))]?.focus();
          }
        }}
      >
        {account ? (
          <>
            <p>Профиль подключён. {account.name || account.id}</p>
            <button type="button" tabIndex={tabIndex} onClick={disconnect}>
              Выйти
            </button>
          </>
        ) : canConnectShikimori ? (
          <form onSubmit={connect}>
            <p>
              Откройте Shikimori, разрешите доступ к списку и введите
              одноразовый код.
            </p>
            <button
              type="button"
              tabIndex={tabIndex}
              disabled={pending}
              onClick={openBrowser}
            >
              Открыть Shikimori
            </button>
            <label htmlFor="shikimori-code">Одноразовый код</label>
            <input
              id="shikimori-code"
              type="text"
              autoComplete="off"
              autoCapitalize="none"
              spellCheck={false}
              tabIndex={tabIndex}
              disabled={pending}
              value={code}
              onChange={(event) => setCode(event.currentTarget.value)}
            />
            <button
              type="submit"
              tabIndex={tabIndex}
              disabled={pending || !code.trim()}
            >
              {pending ? "Подключаем…" : "Подключить"}
            </button>
          </form>
        ) : (
          <p>
            Укажите Client ID и Client Secret Shikimori в настройках приватной
            сборки.
          </p>
        )}
        {error && <p role="alert">{error}</p>}
      </section>
    </>
  );
}
