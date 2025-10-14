const path = require('path');
const { getDefaultConfig } = require('expo/metro-config');

const projectRoot = __dirname;
const workspaceRoot = path.resolve(__dirname, '..', '..');

const config = getDefaultConfig(projectRoot);
config.resolver.disableHierarchicalLookup = true;
config.resolver.nodeModulesPaths = [
  path.join(projectRoot, 'node_modules'),
  path.join(workspaceRoot, 'node_modules'),
];
config.watchFolders = [workspaceRoot];

// Add resolver alias for @ paths to work with Metro bundler
config.resolver.alias = {
  '@': path.join(projectRoot, 'src'),
  '@/components': path.join(projectRoot, 'src/components'),
  '@/features': path.join(projectRoot, 'src/features'),
  '@/lib': path.join(projectRoot, 'src/lib'),
  '@/assets': path.join(projectRoot, 'src/assets'),
};

module.exports = config;
