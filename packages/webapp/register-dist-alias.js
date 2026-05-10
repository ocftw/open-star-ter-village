const Module = require('module');
const path = require('path');

const distRoot = path.join(__dirname, 'dist', 'src');
const originalResolveFilename = Module._resolveFilename;

Module._resolveFilename = function resolveDistAlias(request, parent, isMain, options) {
  if (request.startsWith('@/')) {
    return originalResolveFilename.call(
      this,
      path.join(distRoot, request.slice(2)),
      parent,
      isMain,
      options
    );
  }

  return originalResolveFilename.call(this, request, parent, isMain, options);
};
