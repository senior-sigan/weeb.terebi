export function passesWatchedThreshold(duration: number, position: number) {
  if (!Number.isFinite(duration) || duration <= 0) return false;
  const threshold =
    duration < 600
      ? Math.floor(duration * 0.6)
      : duration - (duration < 3000 ? 300 : 900);
  return position > threshold;
}
