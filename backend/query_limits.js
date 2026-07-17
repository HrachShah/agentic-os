const DEFAULT_HISTORY_LIMIT = 100;
const MAX_HISTORY_LIMIT = 1000;

function parseHistoryLimit(value) {
  if (value === undefined || value === null || value === '') {
    return DEFAULT_HISTORY_LIMIT;
  }

  const raw = Array.isArray(value) ? value[0] : String(value);
  if (!/^\d+$/.test(raw)) {
    return DEFAULT_HISTORY_LIMIT;
  }

  const limit = Number(raw);
  if (!Number.isSafeInteger(limit) || limit < 1) {
    return DEFAULT_HISTORY_LIMIT;
  }

  return Math.min(limit, MAX_HISTORY_LIMIT);
}

module.exports = { parseHistoryLimit };
