# quick-review

Fast, focused code review of the current diff or a specific file.
Produces: CRITICAL / WARNING / INFO findings only. No filler.

## What it does
1. Reads the current `git diff` or specified file
2. Scans for: bugs, security issues, performance problems, type errors
3. Returns a ranked list of findings with line references
4. Suggests exact fixes for CRITICAL items

## Usage
```
/quick-review
/quick-review src/api.py
```

## Output format
```
CRITICAL: [issue] — src/api.py:42
  Fix: [exact fix]

WARNING: [issue] — src/utils.py:17

INFO: [suggestion]
```
