import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import zipPack from "vite-plugin-zip-pack";
import tailwindcss from "@tailwindcss/vite";
import path from "path";

const cwd = process.cwd();

const src = path.join(cwd, "src");

/** Normalize path for cross-platform comparison (Rollup may use / or \). */
// function norm(id: string): string {
//     return id.replace(/\\/g, "/");
// }

/** True if this module is the background entry or is (transitively) imported by it. */
// function isDepOfBackground(
//     id: string,
//     getModuleInfo: (id: string) => { importers?: readonly string[] } | null,
//     visited = new Set<string>(),
// ): boolean {
//     if (visited.has(id)) return false;
//     visited.add(id);
//     if (norm(id).includes("background/index")) return true;
//     const info = getModuleInfo(id);
//     return (info?.importers ?? []).some((imp) => isDepOfBackground(imp, getModuleInfo, visited));
// }

export default defineConfig({
    base: "./",
    publicDir: path.join(cwd, "public"),
    root: src,
    build: {
        emptyOutDir: true,
        rollupOptions: {
            input: {
                main: path.join(src, "main.html"),
                options: path.join(src, "options.html"),
                popup: path.join(src, "popup.html"),
                content: path.join(src, "content/index.ts"),
                background: path.join(src, "background/index.ts"),
            },
            output: [
                {
                    dir: path.join(cwd, "dist"),
                    format: "cjs",

                    entryFileNames: (chunkInfo) => {
                        if (chunkInfo.name === "content") {
                            return "content.cjs.js";
                        } else {
                            return "content-[name]-[hash].js";
                        }
                    },
                },
                {
                    dir: path.join(cwd, "dist"),
                    format: "module",
                    entryFileNames: (chunkInfo) => {
                        if (chunkInfo.name === "background") {
                            return "background.js";
                        } else {
                            return "background-[name]-[hash].js";
                        }
                    },
                },
                {
                    dir: path.join(cwd, "dist"),
                    entryFileNames: "entry-[name]-[hash].js",
                    format: "es",
                },
            ],
        },
    },
    server: {
        port: 8080,
        strictPort: true,
    },
    plugins: [
        paraglideVitePlugin({ project: "./project.inlang", outdir: "./src/paraglide" }),
        tailwindcss({
            // optimize: { minify: true },
        }),
        mkcert(),
        react({}),
        tsconfigPaths({
            root: cwd,
        }),
        zipPack({
            inDir: path.join(cwd, "dist"),
            outDir: path.join(cwd, "build"),
        }),
    ],
    define: {
        "globalThis.__DEV__": JSON.stringify(false),
    },
});
