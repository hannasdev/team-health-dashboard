const nodeExternals = require("webpack-node-externals");
const path = require("path");
const { CleanWebpackPlugin } = require("clean-webpack-plugin");
const TerserPlugin = require("terser-webpack-plugin");

module.exports = {
  entry: "./src/app.ts",
  mode: "production",
  target: "node",
  externals: [nodeExternals()], // Excludes node_modules
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: "ts-loader",
        exclude: /node_modules/,
      },
    ],
  },
  optimization: {
    minimize: true,
    minimizer: [new TerserPlugin()],
    usedExports: true, // Enable tree shaking
    splitChunks: {
      chunks: "all",
    },
  },
  resolve: {
    extensions: [".tsx", ".ts", ".js"],
  },
  output: {
    filename: "[name].[contenthash].js", // Use unique filenames
    path: path.resolve(__dirname, "dist"),
  },
  plugins: [
    new CleanWebpackPlugin(), // Clean the output directory before emit
  ],
};
