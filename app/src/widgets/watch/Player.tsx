import SubtitlesOctopus from "@jellyfin/libass-wasm";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { stream } from "../../entities/episode/playback";
import { request } from "../../shared/api/anime365";

import { registerMediaKeys } from "../../shared/tv/mediaKeys";

function clock(seconds: number) {
  const value = Number.isFinite(seconds) ? Math.floor(seconds) : 0;
  return `${Math.floor(value / 60)}:${String(value % 60).padStart(2, "0")}`;
}

export function Player({
  id,
  title,
  onBack,
}: {
  id: number;
  title: string;
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
  const hideTimer = useRef(0);

  function reveal() {
    setShowControls(true);
    window.clearTimeout(hideTimer.current);
    hideTimer.current = window.setTimeout(() => setShowControls(false), 3500);
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
      media.onerror = null;
      if (renderer?.worker) renderer.dispose();
      media.pause();
      media.removeAttribute("src");
      media.load();
    };
  }, [id, attempt]);

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
            if (Number.isFinite(media.duration))
              media.currentTime = Math.max(
                0,
                Math.min(
                  media.duration,
                  media.currentTime + (event.keyCode === 37 ? -10 : 10),
                ),
              );
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
        onTimeUpdate={() => setTime(video.current?.currentTime ?? 0)}
        onEnded={onBack}
      />
      {(paused || showControls || status) && (
        <div className="play-hud">
          <strong>{title}</strong>
          <p role="status">
            {status || (paused ? "Пауза" : "Воспроизведение")}　{clock(time)} /{" "}
            {clock(video.current?.duration ?? 0)}
          </p>
          <span>
            <kbd>OK</kbd> {failed ? "Повторить" : "Пуск / пауза"}　{" "}
            <kbd>← →</kbd> 10 сек　 <kbd>Return</kbd> К переводам
          </span>
        </div>
      )}
    </div>
  );
}
