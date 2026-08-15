const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const projectRoot = __dirname;
const srcRoot = path.resolve(projectRoot, 'src');

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
