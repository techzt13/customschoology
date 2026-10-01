import { context } from "esbuild";
import { cp, mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const watch = process.argv.includes("--watch");
const root = resolve(import.meta.dirname, "..");
const outdir = resolve(root, "dist");

await mkdir(outdir, { recursive: true });
await cp(resolve(root, "public"), outdir, { recursive: true });
await cp(resolve(root, "THIRD_PARTY_NOTICES.md"), resolve(outdir, "THIRD_PARTY_NOTICES.md"));
await mkdir(resolve(outdir, "docs"), { recursive: true });
await cp(
  resolve(root, "docs/upstream-source-map.md"),
  resolve(outdir, "docs/upstream-source-map.md")
);

const packageJson = JSON.parse(await readFile(resolve(root, "package.json"), "utf8"));
const manifestPath = resolve(outdir, "manifest.json");
const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
manifest.version = packageJson.version;
await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`);

const build = await context({
  bundle: true,
  entryNames: "[name]",
  entryPoints: {
    background: resolve(root, "src/background/index.ts"),
    content: resolve(root, "src/content/index.ts"),
    options: resolve(root, "src/options/index.ts"),
    popup: resolve(root, "src/popup/index.ts")
  },
  format: "iife",
  logLevel: "info",
  minify: !watch,
  outdir: resolve(outdir, "assets"),
  sourcemap: watch,
  target: "chrome120"
});

if (watch) {
  await build.watch();
  console.log("Watching extension sources...");
} else {
  await build.rebuild();
  await build.dispose();
}
