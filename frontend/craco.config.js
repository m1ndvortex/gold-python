const path = require('path');

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig, { env }) => {
      // Ensure alias is properly configured
      webpackConfig.resolve.alias = {
        ...webpackConfig.resolve.alias,
        '@': path.resolve(__dirname, 'src'),
      };

      // Exclude test files from all builds (especially production)
      if (env === 'production') {
        // Filter out test files from entry points
        const originalEntry = webpackConfig.entry;
        
        // Add module rules to exclude test files
        webpackConfig.module.rules.unshift({
          test: /\.(test|spec)\.(js|jsx|ts|tsx)$/,
          use: 'ignore-loader'
        });

        // Exclude test directories completely
        webpackConfig.module.rules.unshift({
          test: /src\/tests\//,
          use: 'ignore-loader'
        });

        // Add resolve fallback to ignore test modules
        webpackConfig.resolve.fallback = {
          ...webpackConfig.resolve.fallback,
        };

        // Exclude test files from module resolution
        if (!webpackConfig.externals) {
          webpackConfig.externals = [];
        }
        
        // Add ignore patterns
        if (!webpackConfig.ignoreWarnings) {
          webpackConfig.ignoreWarnings = [];
        }
        webpackConfig.ignoreWarnings.push(
          /src\/tests/,
          /\.test\./,
          /\.spec\./
        );
      }

      return webpackConfig;
    },
  },
};