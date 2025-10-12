const createExpoWebpackConfigAsync = require('@expo/webpack-config');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Use non-eval source maps in dev to avoid CSP 'eval()' warning
  if (config.mode === 'development') {
    // good choices: 'source-map' or 'cheap-module-source-map'
    config.devtool = 'source-map';
  }

  return config;
};
