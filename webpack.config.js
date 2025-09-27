const path = require("path");
const CopyWebpackPlugin = require("copy-webpack-plugin");

module.exports = (mode) => {
  return {
    mode: mode,
    devtool: "cheap-module-source-map",
    entry: {
      injector: "./src/injector.js",
      Kibi: "./src/Kibi",
    },
    module: {
      rules: [
        {
          test: /\.tsx?$/,
          use: "ts-loader",
          exclude: /node_modules/,
        },
      ],
    },
    resolve: {
      extensions: [".tsx", ".ts", ".js"],
    },
    plugins: [
      new CopyWebpackPlugin({
        patterns: [
          { from: "./manifest.json" },
          { from: "./icons/icon48.png" },
          { from: "./icons/icon16.png" },
          { from: "./icons/icon128.png" },
        ],
      }),
    ],
    output: {
      clean: true,
      filename: "[name].js",
      path: path.resolve(__dirname, `dist`),
    },
  };
};
