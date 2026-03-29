const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Expo SDK 53 enables ESM package exports by default, which resolves packages
// like zustand to their ESM builds containing import.meta.env — unsupported in
// Metro's classic script output. Prefer CommonJS builds instead.
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
