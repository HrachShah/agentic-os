# auto-commit

Intelligently stage, summarize, and commit your changes with a well-crafted commit message.

## What it does
1. Runs `git diff --staged` and `git status`
2. Analyzes what changed and why
3. Writes a conventional commit message (feat/fix/refactor/docs/etc.)
4. Stages relevant files (avoids secrets)
5. Creates the commit

## Trigger
Use when: changes are ready to commit and you want a smart message.

## Usage
```
/auto-commit
```

Or with context:
```
/auto-commit "this fixes the login redirect bug"
```
