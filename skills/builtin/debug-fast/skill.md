# debug-fast

Rapid debugging assistant. Paste an error and get the root cause + fix immediately.

## What it does
1. Reads the error message / stack trace
2. Identifies root cause (not symptoms)
3. Provides the minimal fix
4. Optionally adds a regression test

## Usage
```
/debug-fast
```
Then paste your error or stack trace.

Or:
```
blackbox --debug "your error message"
```

## Philosophy
- Root cause first, always
- Minimal diff to fix
- Never mask the error — fix it
