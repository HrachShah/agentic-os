function newestSessions(sessions, limit = 20) {
  return [...sessions]
    .sort((a, b) => new Date(b.modified) - new Date(a.modified))
    .slice(0, limit);
}

module.exports = { newestSessions };
