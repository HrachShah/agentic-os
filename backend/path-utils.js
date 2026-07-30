'use strict';

const fs = require('fs');
const path = require('path');

function resolveWithin(root, requestedPath) {
  const base = path.resolve(root);
  const candidate = path.resolve(
    path.isAbsolute(requestedPath) ? requestedPath : path.join(base, requestedPath),
  );
  if (candidate === base || candidate.startsWith(`${base}${path.sep}`)) return candidate;
  return null;
}

function resolveExistingWithin(root, requestedPath) {
  const candidate = resolveWithin(root, requestedPath);
  if (!candidate) return null;
  try {
    const resolvedRoot = path.realpathSync(root);
    const resolvedCandidate = path.realpathSync(candidate);
    if (resolvedCandidate === resolvedRoot || resolvedCandidate.startsWith(`${resolvedRoot}${path.sep}`)) {
      return resolvedCandidate;
    }
  } catch {
    return null;
  }
  return null;
}

module.exports = { resolveExistingWithin, resolveWithin };
