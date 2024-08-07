// webpack.config.dev.js
import { merge } from 'webpack-merge';

import baseConfig from './webpack.config.base.js';

const config = {
  mode: 'development',
  devtool: 'inline-source-map',
  cache: {
    type: 'filesystem',
    buildDependencies: {
      config: [import.meta.url],
    },
  },
};

export default merge(baseConfig, config);
