const test = require('node:test');
const assert = require('node:assert/strict');
const { newestSessions } = require('./session_utils');

test('newestSessions sorts before limiting the result', () => {
  const sessions = [
    { id: 'old', modified: '2026-07-01T00:00:00Z' },
    { id: 'newest', modified: '2026-07-03T00:00:00Z' },
    { id: 'middle', modified: '2026-07-02T00:00:00Z' },
  ];

  assert.deepEqual(newestSessions(sessions, 2).map(session => session.id), [
    'newest',
    'middle',
  ]);
  assert.deepEqual(sessions.map(session => session.id), ['old', 'newest', 'middle']);
});
