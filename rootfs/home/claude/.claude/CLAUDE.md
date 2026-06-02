# CLAUDE.md — Agentic OS Default Configuration
# Based on Andrej Karpathy's guidelines, extended for Agentic OS

## Environment

- **OS**: Agentic OS 1.0.0 "Sonnet" (Linux-based)
- **Python**: 3.12 — use `python` (not `python3`)
- **Package manager**: `uv` (preferred over pip)
- **JS runtime**: Bun (preferred over Node/npm)
- **Shell**: bash (default), zsh available
- **Skills directory**: `~/.claude/skills/`

## AI Tools Available in Terminal

### Hermes — Fast Task Delegation
```bash
hermes "task description"           # One-shot task execution
hermes --mode code "write XYZ"      # Code generation mode
hermes --mode plan "design XYZ"     # Architecture planning mode
hermes --mode shell "script for X"  # Shell script generation
hermes --interactive                # REPL mode
hermes --file task.txt              # Read task from file
```

### Blackbox — Coding Intelligence
```bash
blackbox "build a REST API"         # Generate code
blackbox --review src/app.py        # Code review
blackbox --fix error.log            # Fix from error log
blackbox --debug "TypeError in..."  # Debug an error
blackbox --refactor lib/old.py      # Refactor code
blackbox --test src/module.py       # Generate tests
blackbox --explain complex.py       # Explain code
blackbox --interactive              # Coding REPL
```

### Skills Manager
```bash
skills list                   # List all skills
skills search "code review"   # Search skills
skills run autoplan           # Run a skill
skills info review            # Skill details
skills install /path/to/skill # Install new skill
```

## Workflow Orchestration

### 1. Skill-First Mentality
Every task starts with a skill check. Before implementing:
- Check `skills list` for relevant skills
- Relevant skills are auto-loaded when their trigger matches the task
- Use `hermes --mode plan` for multi-step architecture decisions

### 2. Plan Mode Default
Enter plan mode for ANY non-trivial task (3+ steps):
- Use `hermes --mode plan "design X"` for architectural decisions
- State assumptions explicitly before implementing
- If uncertain: ask. If multiple interpretations: present them.

### 3. Subagent Strategy
Use `hermes` or `blackbox` liberally to keep main context clean:
- Offload research and exploration: `hermes "research X and summarize"`
- Parallel analysis: run multiple hermes instances
- Code generation: `blackbox "implement Y"`

### 4. Autonomous Bug Fixing
When given a bug report: just fix it.
- `blackbox --debug "error description"` for diagnosis
- `blackbox --fix error.log` for direct fixing
- `blackbox --test src/module.py` to add regression tests

## Coding Behavior (Karpathy Guidelines)

### Think Before Coding
- State assumptions explicitly before implementing
- If uncertain, ask. Don't pick silently between interpretations.
- If a simpler approach exists, say so and push back when warranted.
- Name what's confusing. Ask before proceeding.

### Surgical Changes
- Don't "improve" adjacent code, comments, or formatting that aren't broken.
- Match existing style, even if you'd do it differently.
- If you notice unrelated dead code, mention it — don't delete it.
- Remove only imports/variables/functions that **your** changes made unused.
- Every changed line should trace directly to the user's request.

### Goal-Driven Execution
Transform tasks into verifiable goals before starting:
- "Fix the bug" → write a test that reproduces it, then make it pass
- "Add validation" → write tests for invalid inputs, then make them pass

For multi-step tasks, state a brief plan:
```
1. [Step] → verify: [check]
2. [Step] → verify: [check]
```

### Verification Before Done
- Never mark complete without proving it works
- Run tests, check logs, demonstrate correctness
- Ask: "Would a staff engineer approve this?"

### Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything now, implement the elegant solution"
- Skip for simple, obvious fixes — don't over-engineer

## Core Principles

- **Skill-First**: Never fly blind. Use specialized playbooks from skills.
- **Simplicity First**: Make every change as simple as possible. Minimal impact.
- **No Laziness**: Find root causes. No temporary fixes. Senior dev standards.
- **Minimal Impact**: Changes should only touch what's necessary.

## Common Patterns

- Python projects use `pyproject.toml` with `uv` build backend
- `uv` lockfiles (`uv.lock`) are standard; use `uv add` / `uv remove`
- Dev dependencies: `uv add --dev <pkg>` — install with `uv sync --dev`
- `pytest-asyncio` with `asyncio_mode = "auto"` for async tests
- Ruff is the linter/formatter: `ruff check .`, `ruff format .`
- JS/TS: Bun for runtime, Biome for formatting, Vitest for tests

## Autonomous Mode

When the user says `/auto` or "auto mode on":
- Stop asking clarifying questions. Make the most reasonable assumption and proceed.
- Do not ask for confirmation before file edits, runs, or multi-step tasks.
- Only pause if about to do something **irreversible and large-blast-radius**.
- At the end, summarize what was done and flag anything needing attention.

When the user says `/manual` or starts a new session: return to normal behavior.

## gstack Skills (pre-installed)

Run any gstack skill with `/skill-name` in Claude Code:

```
/browse          — headless browser QA
/review          — production-grade code review
/ship            — prepare and open a PR
/investigate     — root cause debugging
/canary          — canary deploy strategy
/cso             — security audit (OWASP + STRIDE)
/autoplan        — autonomous planning
/qa              — full QA pass
/design-review   — catch AI slop in UI
/codex           — code exploration
```

Full skill list: `skills list gstack`
