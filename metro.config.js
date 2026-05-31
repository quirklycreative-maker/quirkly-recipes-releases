// metro.config.js – ensure Metro watches the src folder for module resolution
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const defaultConfig = getDefaultConfig(__dirname);
// Add the src directory to Metro's watch folders so imports like '../screens/…' resolve correctly
defaultConfig.watchFolders = [path.resolve(__dirname, 'src')];

// Resolve Firebase cjs files
defaultConfig.resolver.sourceExts.push('cjs');

// Disable package exports to allow proper Firebase resolution on React Native
defaultConfig.resolver.unstable_enablePackageExports = false;

module.exports = defaultConfig;
