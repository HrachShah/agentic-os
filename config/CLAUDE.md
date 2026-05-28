# Claude OS - Pre-configured CLAUDE.md

## Environment

- OS: Ubuntu 22.04 (Claude OS)
- Python: 3.11 — use `python3`
- Package manager: uv (preferred)
- JS: Node.js 20 / Bun 1.x / npm

## Autonomous Mode

When the user says `/auto` or "go autonomous":
- Stop asking clarifying questions
- Proceed with most reasonable assumption
- Only pause for irreversible large-blast-radius actions
- Summarize what was done at the end

## Skills Pre-loaded

All skills from the gstack library are pre-loaded:
- /review, /ship, /qa, /browse, /investigate
- /design-html, /webapp-testing, /clone-website
- /autoplan, /careful, /freeze, /guard
- /document-generate, /changelog-generator
- And 80+ more (see /skills panel in Claude OS)

## Coding Behavior

- Surgical changes: touch only what's needed
- No comments unless WHY is non-obvious
- Run tests before marking complete
- Default to no features beyond what's asked
- Match existing code style

## Workflow

1. Check skills for task → load relevant playbook
2. Plan before implementing (3+ steps)
3. Make changes → verify → ship
4. Log lessons from corrections
