import { paraglideVitePlugin } from "@inlang/paraglide-js";
import { defineConfig } from "vite";
import mkcert from "vite-plugin-mkcert";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
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
                background: path.join(src, "background/index.ts"),
            },
            output: {
                dir: path.join(cwd, "dist"),
                format: "module",
                entryFileNames: "entry-[name]-[hash].js",
                inlineDynamicImports: true,
            },
        },
    },
    server: {
        port: 8080,
        strictPort: true,
    },
    plugins: [
        paraglideVitePlugin({ project: "./project.inlang", outdir: "./src/paraglide" }),
        tailwindcss(),
        mkcert(),
        react({}),
        tsconfigPaths({ root: cwd }),
    ],
    define: {
        "globalThis.__DEV__": JSON.stringify(false),
    },
});
