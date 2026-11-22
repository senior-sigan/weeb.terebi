import { execFileSync } from "node:child_process";
import { copyFile, mkdir } from "node:fs/promises";
import { build } from "esbuild";

process.loadEnvFile("../.env");
const token = process.env.ACCESS_TOKEN?.trim();
if (!token) throw new Error("Укажите ACCESS_TOKEN в .env в корне проекта");

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
    "process.env.NODE_ENV": '"production"',
  },
});
const assets = ["config.xml", "index.html", "icon.jpg"];
await Promise.all(assets.map((file) => copyFile(file, `dist/${file}`)));
execFileSync(
  "python3",
  ["-m", "zipfile", "-c", "weebterebi.wgt", ...assets, "app.js", "app.css"],
  { cwd: "dist" },
);
