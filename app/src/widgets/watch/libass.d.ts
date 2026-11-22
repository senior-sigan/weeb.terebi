declare module "@jellyfin/libass-wasm" {
  export default class SubtitlesOctopus {
    constructor(options: {
      video: HTMLVideoElement;
      subContent: string;
      workerUrl: string;
      legacyWorkerUrl: string;
      fallbackFont: string;
      maxRenderHeight: number;
      onError: () => void;
    });
    readonly worker: Worker | null;
    dispose(): void;
  }
}
