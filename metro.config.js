// SPDX-License-Identifier: Apache-2.0
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const defaultConfig = getDefaultConfig(__dirname);

// Paper requires the icon package's root entry, which bundles the font file as a JS asset.
// The font is already linked natively, so point Paper at the static entry instead.
const ICONS = '@react-native-vector-icons/material-design-icons';

/** @type {import('@react-native/metro-config').MetroConfig} */
const config = {
  resolver: {
    // Drizzle migrations are .sql files inlined by babel-plugin-inline-import.
    sourceExts: [...defaultConfig.resolver.sourceExts, 'sql'],
    resolveRequest: (context, moduleName, platform) =>
      context.resolveRequest(
        context,
        moduleName === ICONS ? `${ICONS}/static` : moduleName,
        platform,
      ),
  },
};

module.exports = mergeConfig(defaultConfig, config);
