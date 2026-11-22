import { useEffect, useState } from "react";
import { OngoingPage } from "../pages/ongoing/OngoingPage";
import { SearchPage } from "../pages/search/SearchPage";
import { remoteKey } from "../shared/tv/remote";
import { type Section, Sidebar } from "../widgets/sidebar/Sidebar";

export function App() {
  const [section, setSection] = useState<Section>("ongoing");
  const [menu, setMenu] = useState(false);
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    function enter(event: KeyboardEvent) {
      if (
        !event.defaultPrevented &&
        remoteKey(event) === "Enter" &&
        event.target instanceof HTMLButtonElement
      ) {
        event.preventDefault();
        if (!event.repeat) event.target.click();
      }
    }
    window.addEventListener("keydown", enter);
    return () => window.removeEventListener("keydown", enter);
  }, []);
  const openMenu = () => setMenu(true);
  return (
    <>
      <Sidebar
        section={section}
        open={menu}
        onOpen={openMenu}
        onClose={() => setMenu(false)}
        onSelect={(value) => {
          setSection(value);
          setMenu(false);
        }}
        onRefresh={() => {
          setRevision((v) => v + 1);
          setMenu(false);
        }}
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
        {section === "ongoing" ? (
          <OngoingPage key={revision} active={!menu} onMenu={openMenu} />
        ) : (
          <SearchPage active={!menu} onMenu={openMenu} />
        )}
        <footer>
          <span>
            <kbd>←</kbd> Меню с левого края
          </span>
          <span>
            <kbd>↑↓←→</kbd> Выбор
          </span>
          <span>
            <kbd>OK</kbd> {section === "search" ? "Выбрать" : "Подробнее"}
          </span>
        </footer>
      </main>
    </>
  );
}
