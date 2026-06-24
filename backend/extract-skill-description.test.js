'use strict';

// Standalone regression test for extractSkillDescription. Run with `node extract-skill-description.test.js`
// (no test framework is installed in the project today; if one is added later this file can be migrated).

const assert = require('node:assert/strict');
const { extractSkillDescription } = require('./extract-skill-description');

const tests = [
  {
    name: 'Agent Skills spec frontmatter with double-quoted description',
    input: [
      '---',
      'name: onboarding-cro',
      'description: "Optimize post-signup onboarding, user activation, first-run experience."',
      'metadata:',
      '  author: example',
      '---',
      '',
      '# Onboarding CRO',
      '',
      'Body content here.',
    ].join('\n'),
    expected: 'Optimize post-signup onboarding, user activation, first-run experience.',
  },
  {
    name: 'Agent Skills spec frontmatter with single-quoted description',
    input: "---\nname: seo\ndescription: 'Plan and ship SEO programs end-to-end.'\n---\n\n# SEO\n",
    expected: 'Plan and ship SEO programs end-to-end.',
  },
  {
    name: 'unquoted description in frontmatter',
    input: '---\ndescription: A short description\nname: x\n---\n\n# X\n',
    expected: 'A short description',
  },
  {
    name: 'no frontmatter, falls back to H1 heading',
    input: '# My Tool\n\nA small helper.\n',
    expected: 'My Tool',
  },
  {
    name: 'no frontmatter and no H1 returns empty string',
    input: 'A small helper.\n',
    expected: '',
  },
  {
    name: 'frontmatter with no description field falls back to H1',
    input: '---\nname: x\n---\n\n# X\n',
    expected: 'X',
  },
  {
    name: 'empty input returns empty string',
    input: '',
    expected: '',
  },
  {
    name: 'frontmatter that spans multiple lines picks the right field',
    input: [
      '---',
      'name: pricing',
      'description: |',
      '  Multi-line description',
      '  that uses the YAML block scalar.',
      'metadata:',
      '  category: marketing',
      '---',
    ].join('\n'),
    // Block-scalar form is not handled by the minimal parser on purpose: the
    // spec says descriptions are inline strings, and we only need to handle
    // the common case. Falls through to the empty fallback.
    expected: '',
  },
];

let passed = 0;
let failed = 0;
for (const t of tests) {
  try {
    const actual = extractSkillDescription(t.input);
    assert.equal(actual, t.expected, `input: ${JSON.stringify(t.input)}`);
    console.log(`✓ ${t.name}`);
    passed++;
  } catch (err) {
    console.log(`✗ ${t.name}`);
    console.log(`  expected: ${JSON.stringify(t.expected)}`);
    console.log(`  actual:   ${JSON.stringify(err.actual)}`);
    failed++;
  }
}
console.log(`\n${passed} pass, ${failed} fail`);
process.exit(failed === 0 ? 0 : 1);
