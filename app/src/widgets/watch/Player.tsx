import SubtitlesOctopus from "@jellyfin/libass-wasm";
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";
import { stream } from "../../entities/episode/playback";
import { passesWatchedThreshold } from "../../entities/episode/watched";
import { request } from "../../shared/api/anime365";
import { shikimoriAccount } from "../../shared/api/shikimoriSession";
import {
  saveWatchProgress,
  type WatchProgress,
} from "../../shared/api/watchSync";
import { registerMediaKeys } from "../../shared/tv/mediaKeys";

const SEEK_DEBOUNCE_MS = 400;

function clock(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function Player({
  id,
  title,
  progress,
  onBack,
}: {
  id: number;
  title: string;
  progress: WatchProgress | null;
  onBack: () => void;
}) {
  const video = useRef<HTMLVideoElement>(null);
  const surface = useRef<HTMLDivElement>(null);
  const [attempt, setAttempt] = useState(0);
  const [status, setStatus] = useState("Загружаем видео…");
  const [failed, setFailed] = useState(false);
  const [paused, setPaused] = useState(true);
  const [time, setTime] = useState(0);
  const [showControls, setShowControls] = useState(true);
  const [syncStatus, setSyncStatus] = useState("");
  const hideTimer = useRef(0);
  const pendingSeek = useRef<{ target: number; timer: number } | null>(null);
  const mark = useRef<
    { state: "ready"; retryAt: number } | { state: "pending" | "saved" }
  >({
    state: "ready",
    retryAt: 0,
  });

  function reveal() {
    setShowControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), 3500);
  }

  const cancelSeek = useCallback(() => {
    if (pendingSeek.current) {
      window.clearTimeout(pendingSeek.current.timer);
      pendingSeek.current = null;
    }
  }, []);

  function seekBy(media: HTMLVideoElement, seconds: number) {
    if (!Number.isFinite(media.duration)) return;
    const from = pendingSeek.current?.target ?? media.currentTime;
    const target = Math.max(0, Math.min(media.duration, from + seconds));
    cancelSeek();
    setTime(target);
    const timer = window.setTimeout(() => {
      pendingSeek.current = null;
      const resume = media.ended && target < media.duration;
      if (media.currentTime !== target) media.currentTime = target;
      if (resume)
        media.play().catch(() => setStatus("Не удалось продолжить видео"));
    }, SEEK_DEBOUNCE_MS);
    pendingSeek.current = { target, timer };
  }

  function recordProgress(media: HTMLVideoElement) {
    if (
      !shikimoriAccount() ||
      !progress ||
      mark.current.state !== "ready" ||
      Date.now() < mark.current.retryAt ||
      media.seeking ||
      !passesWatchedThreshold(media.duration, media.currentTime)
    )
      return;
    mark.current = { state: "pending" };
    saveWatchProgress(progress).then(
      () => {
        mark.current = { state: "saved" };
        if (video.current) {
          setSyncStatus("Просмотр отмечен в Shikimori");
          reveal();
        }
      },
      () => {
        mark.current = { state: "ready", retryAt: Date.now() + 15000 };
        if (video.current) {
          setSyncStatus("Не удалось отметить просмотр в Shikimori");
          reveal();
        }
      },
    );
  }

  useEffect(registerMediaKeys, []);

  useLayoutEffect(() => {
    surface.current?.focus();
    return () => window.clearTimeout(hideTimer.current);
  }, []);

  useEffect(() => {
    const media = video.current;
    if (!media) return;
    let active = true;
    let renderer: SubtitlesOctopus | undefined;
    function fail(message: string) {
      if (!active) return;
      cancelSeek();
      media?.pause();
      setStatus(message);
      setFailed(true);
    }
    setFailed(false);
    setStatus("Загружаем видео…");
    async function start(element: HTMLVideoElement) {
      const source = await stream(id);
      if (!active) return;
      if (source.subtitles) {
        const ass = await request(source.subtitles, "text");
        if (!active) return;
        if (typeof ass !== "string" || !/^\[Events\]/im.test(ass))
          throw new Error("Не удалось прочитать субтитры");
        renderer = new SubtitlesOctopus({
          video: element,
          subContent: ass,
          workerUrl: "libass/subtitles-octopus-worker.js",
          legacyWorkerUrl: "libass/subtitles-octopus-worker-legacy.js",
          fallbackFont: new URL("libass/default.woff2", document.baseURI).href,
          maxRenderHeight: 720,
          onError: () => fail("Не удалось отобразить субтитры"),
        });
      }
      let next = 0;
      function playSource() {
        cancelSeek();
        const url = source.urls[next++];
        if (!url) {
          fail("Не удалось воспроизвести видео");
          return;
        }
        element.src = url;
        element.play().catch((error: unknown) => {
          if (
            active &&
            error instanceof Error &&
            error.name === "NotAllowedError"
          )
            setStatus("Нажмите OK для воспроизведения");
        });
      }
      element.onerror = playSource;
      playSource();
    }
    start(media).catch((error: unknown) =>
      fail(error instanceof Error ? error.message : "Ошибка воспроизведения"),
    );
    return () => {
      active = false;
      cancelSeek();
      media.onerror = null;
      if (renderer?.worker) renderer.dispose();
      media.pause();
      media.removeAttribute("src");
      media.load();
    };
  }, [id, attempt, cancelSeek]);

  function toggle() {
    if (failed) {
      setAttempt(attempt + 1);
      return;
    }
    const media = video.current;
    if (!media?.getAttribute("src")) return;
    if (media.paused)
      media.play().catch(() => setStatus("Не удалось продолжить видео"));
    else media.pause();
    reveal();
  }

  return (
    <div
      className="screen"
      ref={surface}
      tabIndex={-1}
      role="application"
      aria-label="Видеоплеер"
      onKeyDown={(event) => {
        const media = video.current;
        if (!media) return;
        switch (event.keyCode) {
          case 13:
          case 10252:
            event.preventDefault();
            event.stopPropagation();
            if (!event.repeat) toggle();
            break;
          case 415:
          case 19:
            event.preventDefault();
            if (
              (event.keyCode === 415 && media.paused) ||
              (event.keyCode === 19 && !media.paused)
            )
              toggle();
            break;
          case 37:
          case 39:
            event.preventDefault();
            event.stopPropagation();
            seekBy(media, event.keyCode === 37 ? -10 : 10);
            reveal();
            break;
          case 38:
          case 40:
            event.preventDefault();
            event.stopPropagation();
            reveal();
            break;
        }
      }}
    >
      {/* biome-ignore lint/a11y/useMediaCaption: ASS subtitles are rendered by libass on the video. */}
      <video
        ref={video}
        playsInline
        onPlaying={() => {
          setPaused(false);
          setStatus("");
          reveal();
        }}
        onPause={() => setPaused(true)}
        onWaiting={() => setStatus("Буферизация…")}
        onTimeUpdate={(event) => {
          if (!pendingSeek.current) setTime(event.currentTarget.currentTime);
          recordProgress(event.currentTarget);
        }}
        onEnded={(event) => {
          recordProgress(event.currentTarget);
          if (
            pendingSeek.current &&
            pendingSeek.current.target < event.currentTarget.duration
          )
            return;
          onBack();
        }}
      />
      {(paused || showControls || status) && (
        <div className="play-hud">
          <strong>{title}</strong>
          <p role="status">
            {status || (paused ? "Пауза" : "Воспроизведение")}　{clock(time)} /{" "}
            {clock(video.current?.duration ?? 0)}
          </p>
          {syncStatus && <p role="status">{syncStatus}</p>}
          <span>
            <kbd>OK</kbd> {failed ? "Повторить" : "Пуск / пауза"}　{" "}
            <kbd>← →</kbd> 10 сек　 <kbd>Return</kbd> К переводам
          </span>
        </div>
      )}
    </div>
  );
}
