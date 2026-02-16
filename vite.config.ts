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
            output: {
                dir: path.join(cwd, "dist"),
                entryFileNames(chunkInfo) {
                    if (chunkInfo.name === "content") {
                        return "content.js";
                    } else if (chunkInfo.name === "background") {
                        return "background.js";
                    } else {
                        return "entry-[name]-[hash].js";
                    }
                },
            },
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
