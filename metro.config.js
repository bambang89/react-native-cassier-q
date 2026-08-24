const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const metroSourceMap = require('metro-source-map');

const projectRoot = __dirname;
const srcRoot = path.resolve(projectRoot, 'src');

function sanitizeRawMappingModules(modules) {
  return modules.map((mod) => (Array.isArray(mod.map) || mod.map == null ? mod : { ...mod, map: [] }));
}
const originalFromRawMappings = metroSourceMap.fromRawMappings;
const originalFromRawMappingsNonBlocking = metroSourceMap.fromRawMappingsNonBlocking;
metroSourceMap.fromRawMappings = (modules, offsetLines) =>
  originalFromRawMappings(sanitizeRawMappingModules(modules), offsetLines);
metroSourceMap.fromRawMappingsNonBlocking = (modules, offsetLines) =>
  originalFromRawMappingsNonBlocking(sanitizeRawMappingModules(modules), offsetLines);

const config = getDefaultConfig(projectRoot);

const { resolveRequest: defaultResolveRequest } = config.resolver;

config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName === '@' || moduleName.startsWith('@/')) {
    const aliased = path.join(srcRoot, moduleName.slice(1));
    return (defaultResolveRequest ?? context.resolveRequest)(context, aliased, platform);
  }
  return (defaultResolveRequest ?? context.resolveRequest)(context, moduleName, platform);
};

module.exports = config;
