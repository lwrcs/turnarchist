const path = require("path");
const baseConfig = require("../webpack.config.js");

module.exports = {
  ...baseConfig,
  mode: "production",
  devtool: false,
  output: {
    ...baseConfig.output,
    path: path.resolve(__dirname, "app/dist"),
    publicPath: "auto",
  },
};
