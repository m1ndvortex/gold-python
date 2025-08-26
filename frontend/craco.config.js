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

      // Exclude test files from production builds
      if (env === 'production') {
        // Find the TypeScript loader and configure it to exclude test files
        const tsRule = webpackConfig.module.rules.find(rule => 
          rule.oneOf && rule.oneOf.some(oneOfRule => 
            oneOfRule.test && oneOfRule.test.toString().includes('tsx?')
          )
        );
        
        if (tsRule) {
          const tsLoader = tsRule.oneOf.find(oneOfRule => 
            oneOfRule.test && oneOfRule.test.toString().includes('tsx?')
          );
          
          if (tsLoader) {
            // Exclude test files from TypeScript compilation
            tsLoader.exclude = [
              /node_modules/,
              /\.test\.(ts|tsx)$/,
              /\.spec\.(ts|tsx)$/,
              /src\/tests\//
            ];
          }
        }
      }

      return webpackConfig;
    },
  },
  typescript: {
    enableTypeChecking: true,
  },
};