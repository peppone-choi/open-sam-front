const Module = require('module');
const path = require('path');

const runtimeConfigPath = path.join(__dirname, 'node_modules/next/dist/shared/lib/runtime-config.js');

const originalResolveFilename = Module._resolveFilename;
Module._resolveFilename = function patchedResolve(request, parent, isMain, options) {
  if (request === 'next/config') {
    return runtimeConfigPath;
  }
  return originalResolveFilename.call(this, request, parent, isMain, options);
};
