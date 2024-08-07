// webpack.config.prod.js
import path from 'path';
import { fileURLToPath } from 'url';

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { merge } from 'webpack-merge';
import nodeExternals from 'webpack-node-externals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import baseConfig from './webpack.config.base.js';

export default merge(baseConfig, {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        parallel: true,
      }),
    ],
    usedExports: true,
    splitChunks: {
      chunks: 'all',
      maxSize: 244000,
    },
    concatenateModules: true,
  },
  plugins: [
    new CleanWebpackPlugin({}),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.optimize.AggressiveMergingPlugin({}),
  ],
  performance: {
    hints: false,
  },
  target: 'node',
  output: {
    filename: 'main.js',
    path: path.resolve(__dirname, 'dist'),
    chunkFormat: '',
  },
  experiments: {
    outputModule: true,
  },
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    modules: [],
  },
});
