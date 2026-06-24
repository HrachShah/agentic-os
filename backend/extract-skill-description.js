'use strict';

// Pull a one-line human description out of a skill manifest.
//
// Skills written to the Agent Skills spec (https://agentskills.io/specification)
// start with a YAML frontmatter block delimited by `---`. The `description:`
// field is what the dashboard shows on the skill card.
//
// Falls back to the first H1 heading (`# Title`) when there is no frontmatter,
// and to the empty string when neither is found.

function extractSkillDescription(content) {
  if (typeof content !== 'string') return '';
  if (content.startsWith('---')) {
    const end = content.indexOf('\n---', 3);
    if (end !== -1) {
      const frontmatter = content.slice(3, end);
      // Capture either a double-quoted, single-quoted, or bare inline value.
      // The bare-value alternative excludes the YAML block-scalar indicators
      // `|` and `>` so we fall through to the H1 search when the author
      // used a multi-line block scalar (we do not currently parse those).
      const match = frontmatter.match(/^description:\s*(?:"([^"]*)"|'([^']*)'|([^\s|>][^\r\n]*?))\s*$/m);
      if (match) {
        const value = (match[1] || match[2] || match[3] || '').trim();
        if (value) return value;
      }
    }
  }
  const lines = content.split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (trimmed.startsWith('# ')) return trimmed.slice(2).trim();
  }
  return '';
}

module.exports = { extractSkillDescription };
