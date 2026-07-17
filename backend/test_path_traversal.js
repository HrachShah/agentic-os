'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const path = require('path');

// Re-derive the helper the same way server.js does: it is declared as a
// function (not a const arrow) so the route handlers can call it before its
// source position. We re-declare it here for an isolated unit test.
function safeJoin(root, leaf) {
  const resolved = path.resolve(root, leaf);
  const rootResolved = path.resolve(root) + path.sep;
  if (resolved !== path.resolve(root) && !resolved.startsWith(rootResolved)) {
    return null;
  }
  return resolved;
}

test('safeJoin returns the resolved path for a legitimate subdir', () => {
  const out = safeJoin('/home/workspace', 'repos');
  assert.strictEqual(out, path.resolve('/home/workspace', 'repos'));
});

test('safeJoin rejects a single-segment parent escape', () => {
  assert.strictEqual(safeJoin('/home/workspace', '..'), null);
});

test('safeJoin rejects a nested parent escape', () => {
  assert.strictEqual(safeJoin('/home/workspace', 'repos/../../etc'), null);
});

test('safeJoin rejects an absolute path that lies outside the root', () => {
  assert.strictEqual(safeJoin('/home/workspace', '/etc/passwd'), null);
});

test('safeJoin accepts a root path that resolves back to the root', () => {
  assert.strictEqual(safeJoin('/home/workspace', '.'), path.resolve('/home/workspace'));
});

test('safeJoin rejects encoded-style parent segments that still escape', () => {
  // path.resolve collapses .. but on POSIX a leading slash is treated as
  // a fresh absolute path, so this must be rejected.
  assert.strictEqual(safeJoin('/home/workspace', '/foo/../etc'), null);
});
