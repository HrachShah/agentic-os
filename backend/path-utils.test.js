'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { test } = require('node:test');
const { resolveExistingWithin, resolveWithin } = require('./path-utils');

test('accepts the root and descendants', () => {
  const root = path.join(path.sep, 'workspace');
  assert.equal(resolveWithin(root, root), root);
  assert.equal(resolveWithin(root, path.join(root, 'projects', 'app')), path.join(root, 'projects', 'app'));
  assert.equal(resolveWithin(root, 'projects/app'), path.join(root, 'projects', 'app'));
});

test('rejects paths outside the root', () => {
  const root = path.join(path.sep, 'workspace');
  assert.equal(resolveWithin(root, path.join(root, '..', 'secrets')), null);
  assert.equal(resolveWithin(root, path.join(root, 'nested', '..', '..', 'secrets')), null);
});

test('rejects existing symlinks that resolve outside the root', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-os-root-'));
  const outside = fs.mkdtempSync(path.join(os.tmpdir(), 'agentic-os-outside-'));
  const link = path.join(root, 'linked');
  try {
    fs.symlinkSync(outside, link, 'dir');
    assert.equal(resolveExistingWithin(root, 'linked'), null);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
    fs.rmSync(outside, { recursive: true, force: true });
  }
});
