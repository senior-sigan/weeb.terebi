import type { Anime } from "./catalog";

export function AnimeDetails({
  anime,
  onClose,
}: {
  anime: Anime;
  onClose: () => void;
}) {
  return (
    <div className="modal">
      <section
        className="detail"
        role="dialog"
        aria-modal="true"
        aria-labelledby="detail-title"
      >
        <img
          className="detail-poster"
          src={anime.poster || anime.thumbnail}
          alt=""
        />
        <div className="detail-body">
          <p className="detail-meta">
            {anime.edition}
            {anime.score && `　★ ${anime.score} MAL`}
          </p>
          <h2 id="detail-title">{anime.title}</h2>
          {anime.original !== anime.title && (
            <p className="original">{anime.original}</p>
          )}
          <div id="description">
            <p className="genres">{anime.genres}</p>
            <p>{anime.synopsis}</p>
          </div>
          <button id="close-details" type="button" onClick={onClose}>
            В каталог
          </button>
        </div>
      </section>
    </div>
  );
}
