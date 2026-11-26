declare global {
  interface Window {
    tizen?: {
      ApplicationControl?: new (operation: string, uri: string) => object;
      application?: {
        launchAppControl(
          control: object,
          id: string | null,
          onSuccess: () => void,
          onError: () => void,
        ): void;
      };
      tvinputdevice?: {
        getSupportedKeys(): { name: string }[];
        registerKey(name: string): void;
        unregisterKey(name: string): void;
      };
    };
  }
}

export function openSystemBrowser(url: string) {
  const device = window.tizen;
  const Control = device?.ApplicationControl;
  const application = device?.application;
  if (!Control || !application) {
    window.open(url, "_blank", "noopener");
    return Promise.resolve();
  }
  return new Promise<void>((resolve, reject) => {
    const control = new Control(
      "http://tizen.org/appcontrol/operation/view",
      url,
    );
    application.launchAppControl(control, null, resolve, () =>
      reject(new Error("Не удалось открыть браузер телевизора")),
    );
  });
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
