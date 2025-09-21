const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Optimize for development
config.resolver.platforms = ['ios', 'android', 'native', 'web'];

// Enable faster reloading
config.transformer.minifierConfig = {
  keep_fnames: true,
  mangle: {
    keep_fnames: true,
  },
};

// Reduce bundle size during development
config.transformer.enableBabelRCLookup = false;

module.exports = config;
