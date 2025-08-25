const path = require("path");

module.exports = {
  entry: "./src/game.ts",
  output: {
    path: path.resolve(__dirname, "dist"),
    filename: "bundle.js",
    publicPath: "/dist/",
  },
  resolve: {
    // Add `.ts` and `.tsx` as a resolvable extension.
    extensions: [".webpack.js", ".web.js", ".ts", ".tsx", ".js"],
  },
  module: {
    rules: [
      // all files with a `.ts` or `.tsx` extension will be handled by `ts-loader`
      {
        test: /\.tsx?$/,
        use: { loader: "ts-loader", options: {} },
        exclude: [/node_modules/, /server/],
      },
      // emit PNG files with content hashing for cache busting
      {
        test: /\.png$/,
        type: "asset/resource",
        generator: {
          filename: "assets/[name].[contenthash][ext]",
        },
      },
    ],
  },
  devtool: "source-map",
  mode: "development",
};
