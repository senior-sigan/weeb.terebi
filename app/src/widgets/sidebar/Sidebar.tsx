import { useLayoutEffect, useRef } from "react";
import { remoteKey } from "../../shared/tv/remote";

const menuItems = [
  { section: "home", title: "Главная" },
  { section: "catalog", title: "Список аниме" },
  { section: "search", title: "Поиск" },
  { section: "shikimori", title: "Shikimori" },
] as const;

export type Section = (typeof menuItems)[number]["section"];
interface Props {
  section: Section;
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onSelect: (section: Section) => void;
  onRefresh: () => void;
}

export function Sidebar({
  section,
  open,
  onOpen,
  onClose,
  onSelect,
  onRefresh,
}: Props) {
  const nav = useRef<HTMLElement>(null);
  useLayoutEffect(() => {
    if (open)
      nav.current
        ?.querySelector<HTMLButtonElement>('[aria-current="page"]')
        ?.focus();
  }, [open]);
  function menuKey(event: React.KeyboardEvent<HTMLButtonElement>) {
    if (!open) return;
    const buttons = Array.from(
      nav.current?.querySelectorAll<HTMLButtonElement>(".rail-item") ?? [],
    );
    const position = buttons.indexOf(event.currentTarget);
    switch (remoteKey(event)) {
      case "Back":
      case "ArrowRight":
        onClose();
        break;
      case "ArrowUp":
        buttons[Math.max(0, position - 1)]?.focus();
        break;
      case "ArrowDown":
        buttons[Math.min(buttons.length - 1, position + 1)]?.focus();
        break;
      default:
        return;
    }
    event.preventDefault();
  }
  return (
    <>
      {open && <div className="shade" />}
      <nav
        ref={nav}
        className={open ? "rail rail-open" : "rail"}
        aria-label="Меню"
      >
        <button
          className="menu-toggle"
          type="button"
          aria-label="Меню"
          aria-expanded={open}
          onClick={open ? onClose : onOpen}
          onKeyDown={menuKey}
          tabIndex={-1}
        >
          <span className="hamburger" aria-hidden="true">
            ☰
          </span>
        </button>
        {menuItems.map(({ section: item, title }) => (
          <button
            key={item}
            id={`${item}-menu`}
            type="button"
            className={section === item ? "rail-item current" : "rail-item"}
            aria-current={section === item ? "page" : undefined}
            aria-label={title}
            tabIndex={open ? 0 : -1}
            onClick={open ? () => onSelect(item) : onOpen}
            onKeyDown={menuKey}
          >
            {item === "catalog" ? (
              <span className="grid-icon" aria-hidden="true">
                <i />
                <i />
                <i />
                <i />
              </span>
            ) : (
              <span className={`${item}-icon`} aria-hidden="true" />
            )}
            {open && title}
          </button>
        ))}
        {open && (section === "home" || section === "catalog") && (
          <button
            id="refresh-menu"
            className="rail-item"
            type="button"
            onClick={onRefresh}
            onKeyDown={menuKey}
          >
            <span className="refresh-icon" aria-hidden="true">
              ↻
            </span>
            Обновить
          </button>
        )}
      </nav>
    </>
  );
}
