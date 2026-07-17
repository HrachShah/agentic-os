const test = require('node:test');
const assert = require('node:assert/strict');
const { parseHistoryLimit } = require('./query_limits');

test('parseHistoryLimit uses the default for missing or malformed values', () => {
  for (const value of [undefined, '', 'nope', '0', '-1', '1.5', '1e2']) {
    assert.equal(parseHistoryLimit(value), 100);
  }
});

test('parseHistoryLimit accepts an integer and caps oversized requests', () => {
  assert.equal(parseHistoryLimit('25'), 25);
  assert.equal(parseHistoryLimit(['25']), 25);
  assert.equal(parseHistoryLimit('5000'), 1000);
});
