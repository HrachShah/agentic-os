'use strict';

const assert = require('node:assert/strict');
const path = require('node:path');
const { test } = require('node:test');
const { resolveWithin } = require('./path-utils');

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
