// webpack.config.prod.js
import path from 'path';
import { fileURLToPath } from 'url';

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import TerserPlugin from 'terser-webpack-plugin';
import webpack from 'webpack';
import { merge } from 'webpack-merge';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

import baseConfig from './webpack.config.base.js';

const config = {
  mode: 'production',
  devtool: 'source-map',
  optimization: {
    minimize: true,
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          format: {
            comments: false,
          },
        },
        extractComments: false,
        parallel: true,
      }),
    ],
    usedExports: true,
    sideEffects: true,
  },
  plugins: [
    new CleanWebpackPlugin(),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.optimize.AggressiveMergingPlugin(),
    new webpack.ids.HashedModuleIdsPlugin(),
  ],
  performance: {
    hints: 'warning',
    maxEntrypointSize: 512000,
    maxAssetSize: 512000,
  },
  output: {
    ...baseConfig.output,
    libraryTarget: 'commonjs2',
  },
};

export default merge(baseConfig, config);
