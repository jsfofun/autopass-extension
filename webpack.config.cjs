const path = require("path");
const HtmlWebpackPlugin = require("html-webpack-plugin");
const CopyWebpackPlugin = require("copy-webpack-plugin");
const MiniCssExtractPlugin = require("mini-css-extract-plugin");
const ZipPlugin = require("zip-webpack-plugin");

const isProd = process.env.NODE_ENV === "production";
const distDir = path.join(__dirname, "dist");
const srcDir = path.join(__dirname, "src");

/** @type {import("webpack").Configuration} */
module.exports = {
    mode: isProd ? "production" : "development",
    devtool: isProd ? false : "cheap-module-source-map",
    context: __dirname,
    entry: {
        popup: path.join(srcDir, "app", "popup.tsx"),
        options: path.join(srcDir, "app", "options.tsx"),
        background: path.join(srcDir, "background", "index.ts"),
        content: path.join(srcDir, "content", "index.ts"),
    },
    output: {
        path: distDir,
        // filename: "[name].js",

        chunkFilename: (pathData) => {
            return pathData.chunk.name === "main" ? "[name].js" : "chunks/[contenthash].js";
        },
        clean: true,
    },
    resolve: {
        extensions: [".ts", ".tsx", ".js", ".jsx", ".json"],
        alias: {
            "@": srcDir,
            "@app": srcDir,
        },
    },
    module: {
        rules: [
            {
                test: /\.tsx?$/,
                use: {
                    loader: "ts-loader",
                    options: {
                        configFile: path.join(__dirname, "tsconfig.app.json"),
                        compilerOptions: {
                            noEmit: false,
                            allowImportingTsExtensions: false,
                        },
                    },
                },
                exclude: /node_modules/,
            },
            {
                test: /\.css$/,
                use: [isProd ? MiniCssExtractPlugin.loader : "style-loader", "css-loader", "postcss-loader"],
            },
        ],
    },
    plugins: [
        new HtmlWebpackPlugin({
            template: path.join(srcDir, "popup.html"),
            filename: "popup.html",
            chunks: ["popup"],
            scriptLoading: "module",
        }),
        new HtmlWebpackPlugin({
            template: path.join(srcDir, "options.html"),
            filename: "options.html",
            chunks: ["options"],
            scriptLoading: "module",
        }),
        new CopyWebpackPlugin({
            patterns: [
                {
                    from: "manifest.json",
                    to: distDir,
                    transform: (content) => {
                        const manifest = JSON.parse(content.toString());
                        if (manifest.background) {
                            delete manifest.background.type;
                            manifest.background.service_worker = "background.js";
                            if (Array.isArray(manifest.background.scripts))
                                manifest.background.scripts = ["background.js"];
                        }
                        if (manifest.content_scripts?.[0]) manifest.content_scripts[0].js = ["content.js"];
                        if (manifest.options_ui) manifest.options_ui.page = "./options.html";
                        if (manifest.action?.default_popup) manifest.action.default_popup = "./popup.html";
                        return JSON.stringify(manifest, null, 2);
                    },
                },
                { from: "icon.png", to: distDir },
            ],
        }),
        ...(isProd ? [new MiniCssExtractPlugin({ filename: "[name].css" })] : []),

        new ZipPlugin({
            path: path.resolve(__dirname, "build"),
            filename: "build.zip",
            extension: "zip",
            fileOptions: {
                compress: true,
            },
        }),
    ],
    optimization: {
        // Only split async chunks (dynamic import). Keeps background.js and content.js as single files.
        splitChunks: {
            chunks: "async",
        },
    },
    stats: "errors-warnings",
};
