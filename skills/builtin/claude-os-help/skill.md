# claude-os-help

Complete reference for Claude OS tools, commands, and skills.

## Quick Reference

### AI Terminals
```bash
hermes "task"              # Fast task delegation (Haiku)
hermes --mode code "..."   # Code generation
hermes --mode plan "..."   # Architecture planning
hermes -i                  # Interactive REPL
blackbox "build X"         # Code generation (Sonnet)
blackbox --review file.py  # Code review
blackbox --debug "error"   # Debug
blackbox --test file.py    # Generate tests
blackbox -i                # Interactive coding REPL
```

### Skills
```bash
skills list                # All skills
skills search "query"      # Search
skills run <name>          # Execute
skills info <name>         # Details
skills install <path>      # Add new skill
```

### System
```bash
claude-doctor              # Health check
claude --version           # Claude Code version
```

### Aliases
```bash
cc    → claude
h     → hermes
bb    → blackbox
sk    → skills
gs    → git status
py    → python
```
