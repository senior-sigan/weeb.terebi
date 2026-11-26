import { execFileSync } from "node:child_process";
import { copyFile, mkdir } from "node:fs/promises";
import { build } from "esbuild";

process.loadEnvFile("../.env");
const token = process.env.ACCESS_TOKEN?.trim();
if (!token) throw new Error("Укажите ACCESS_TOKEN в .env в корне проекта");
const shikimoriUserId = process.env.SHIKIMORI_USER_ID?.trim() ?? "";
if (
  shikimoriUserId &&
  (!/^\d+$/.test(shikimoriUserId) ||
    !Number.isSafeInteger(Number(shikimoriUserId)) ||
    Number(shikimoriUserId) < 1)
)
  throw new Error("SHIKIMORI_USER_ID должен быть положительным целым числом");
const shikimoriClientId = process.env.SHIKIMORI_CLIENT_ID?.trim() ?? "";
const shikimoriClientSecret =
  process.env.SHIKIMORI_CLIENT_SECRET?.trim() ||
  process.env.SHIKIMORI_CLIENT_SECRET_ID?.trim() ||
  "";

await mkdir("dist", { recursive: true });
await build({
  entryPoints: ["src/app/main.tsx"],
  outfile: "dist/app.js",
  bundle: true,
  minify: true,
  target: ["chrome58", "firefox57", "safari11"],
  // The target engines support the simple array and object bindings used by React components.
  supported: { destructuring: true },
  define: {
    __ACCESS_TOKEN__: JSON.stringify(token),
    __SHIKIMORI_USER_ID__: JSON.stringify(shikimoriUserId),
    __SHIKIMORI_CLIENT_ID__: JSON.stringify(shikimoriClientId),
    __SHIKIMORI_CLIENT_SECRET__: JSON.stringify(shikimoriClientSecret),
    "process.env.NODE_ENV": '"production"',
  },
});
const assets = ["config.xml", "index.html", "icon.jpg"];
await Promise.all(assets.map((file) => copyFile(file, `dist/${file}`)));
const libass = "node_modules/@jellyfin/libass-wasm/dist/js";
await mkdir("dist/libass", { recursive: true });
for (const name of [
  "subtitles-octopus-worker.js",
  "subtitles-octopus-worker-legacy.js",
  "subtitles-octopus-worker.wasm",
  "default.woff2",
  "COPYRIGHT",
]) {
  await copyFile(`${libass}/${name}`, `dist/libass/${name}`);
}
execFileSync(
  "python3",
  [
    "-m",
    "zipfile",
    "-c",
    "weebterebi.wgt",
    ...assets,
    "app.js",
    "app.css",
    "libass",
  ],
  { cwd: "dist" },
);
