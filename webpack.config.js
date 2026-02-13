import { resolve as _resolve } from "path";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
    mode: "production",
    entry: {
        content: "./src/content/index.ts",
        background: "./src/background/index.ts",
    },
    output: {
        filename: "[name].js",
        path: _resolve(__dirname, "dist"),
    },
    resolve: {
        extensions: [".ts", ".js"],
    },
    module: {
        rules: [
            {
                test: /\.ts$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: _resolve(__dirname, "tsconfig.webpack.json"),
                    },
                },
                exclude: /node_modules/,
            },
        ],
    },
};
