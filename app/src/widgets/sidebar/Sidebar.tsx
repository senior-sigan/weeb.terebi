interface Props {
  open: boolean;
  onOpen: () => void;
  onClose: () => void;
  onRefresh: () => void;
}

export function Sidebar({ open, onOpen, onClose, onRefresh }: Props) {
  return (
    <>
      {open && <div className="shade" />}
      <nav className={open ? "rail rail-open" : "rail"} aria-label="Меню">
        <button
          className="menu-toggle"
          type="button"
          aria-label="Меню"
          aria-expanded={open}
          onClick={open ? onClose : onOpen}
          tabIndex={-1}
        >
          <span className="hamburger" aria-hidden="true">
            ☰
          </span>
        </button>
        <button
          id="catalog-menu"
          type="button"
          className="rail-item current"
          aria-current="page"
          aria-label="Онгоинги"
          onClick={open ? onClose : onOpen}
          tabIndex={open ? 0 : -1}
        >
          <span className="grid-icon" aria-hidden="true">
            <i />
            <i />
            <i />
            <i />
          </span>
          {open && "Онгоинги"}
        </button>
        {open && (
          <button
            id="refresh-menu"
            className="rail-item"
            type="button"
            onClick={onRefresh}
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
