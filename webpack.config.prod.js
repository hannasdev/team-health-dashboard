// webpack.config.prod.js
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

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
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
  ],
  performance: {
    hints: false,
  },
  target: 'node',
  output: {
    chunkFormat: 'module',
  },
});
