declare global {
  interface Window {
    tizen?: {
      tvinputdevice?: {
        getSupportedKeys(): { name: string }[];
        registerKey(name: string): void;
        unregisterKey(name: string): void;
      };
    };
  }
}

export function registerMediaKeys() {
  const input = window.tizen?.tvinputdevice;
  if (!input) return;
  const keys = input
    .getSupportedKeys()
    .filter((key) =>
      ["MediaPlayPause", "MediaPause", "MediaPlay"].includes(key.name),
    );
  for (const key of keys) input.registerKey(key.name);
  return () => {
    for (const key of keys) input.unregisterKey(key.name);
  };
}
