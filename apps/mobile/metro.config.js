// Learn more: https://docs.expo.dev/guides/monorepos/
const { getDefaultConfig } = require("expo/metro-config");
const path = require("path");

const projectRoot = __dirname;
const workspaceRoot = path.resolve(projectRoot, "../..");

const config = getDefaultConfig(projectRoot);

// 1. Watch all files in the monorepo so changes to shared packages hot-reload.
config.watchFolders = [workspaceRoot];

// 2. Resolve modules from both the app's and the workspace's node_modules.
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, "node_modules"),
  path.resolve(workspaceRoot, "node_modules"),
];

// 3. Force Metro to resolve (sub)dependencies only from `nodeModulesPaths`.
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
