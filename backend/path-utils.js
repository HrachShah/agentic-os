'use strict';

const path = require('path');

function resolveWithin(root, requestedPath) {
  const base = path.resolve(root);
  const candidate = path.resolve(
    path.isAbsolute(requestedPath) ? requestedPath : path.join(base, requestedPath),
  );
  if (candidate === base || candidate.startsWith(`${base}${path.sep}`)) return candidate;
  return null;
}

module.exports = { resolveWithin };
