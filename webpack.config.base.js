// webpack.config.base.js
import path from 'path';
import { fileURLToPath } from 'url';

import { CleanWebpackPlugin } from 'clean-webpack-plugin';
import nodeExternals from 'webpack-node-externals';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default {
  target: 'node',
  externals: [nodeExternals()],
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: {
          loader: 'ts-loader',
          options: {
            configFile: path.resolve(__dirname, 'tsconfig.json'),
            compilerOptions: {
              module: 'ESNext',
              target: 'ES2022',
              declaration: false,
            },
          },
        },
        exclude: /node_modules/,
      },
    ],
  },
  resolve: {
    extensions: ['.tsx', '.ts', '.js'],
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    modules: [path.resolve(__dirname, 'src'), 'node_modules'],
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    chunkFormat: 'module',
  },
  experiments: {
    outputModule: true,
  },
  plugins: [new CleanWebpackPlugin()],
};
