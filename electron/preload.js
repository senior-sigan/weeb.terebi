const { ipcRenderer, webFrame } = require("electron");

// Electron 3 predates contextBridge. Only the exit event crosses worlds.
window.addEventListener("weebterebi:exit", () => ipcRenderer.send("exitApp"));
webFrame.executeJavaScript(`
  window.electronUtilsRender = {
    exitApp: function () { window.dispatchEvent(new Event("weebterebi:exit")); }
  };
  void 0;
`);
