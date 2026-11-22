import { useEffect, useRef } from "react";

const observer =
  typeof IntersectionObserver === "function"
    ? new IntersectionObserver(
        (entries) => {
          for (const { target, isIntersecting } of entries) {
            if (
              isIntersecting &&
              target instanceof HTMLImageElement &&
              target.dataset["src"]
            ) {
              target.src = target.dataset["src"];
              observer?.unobserve(target);
            }
          }
        },
        { rootMargin: "250px" },
      )
    : null;

export function Poster({ src }: { src: string }) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const img = ref.current;
    if (!img || !src || !observer) return;
    observer.observe(img);
    return () => observer.unobserve(img);
  }, [src]);
  return (
    <img
      ref={ref}
      alt=""
      data-src={src}
      src={observer ? undefined : src || undefined}
    />
  );
}
