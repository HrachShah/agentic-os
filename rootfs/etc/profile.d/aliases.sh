#!/usr/bin/env bash
# Claude OS — shell aliases

# Navigation
alias ll='ls -lah --color=auto'
alias la='ls -A --color=auto'
alias l='ls -CF --color=auto'
alias ..='cd ..'
alias ...='cd ../..'
alias ~='cd ~'

# Claude Code shortcuts
alias cc='claude'
alias ccc='claude --continue'
alias ccr='claude --resume'

# Hermes shortcuts
alias h='hermes'
alias hask='hermes --interactive'
alias hcode='hermes --mode code'

# Blackbox shortcuts
alias bb='blackbox'
alias bbr='blackbox --review'
alias bbf='blackbox --fix'
alias bbd='blackbox --debug'

# Skills
alias sk='skills'
alias skl='skills list'
alias skr='skills run'

# Git shortcuts
alias gs='git status'
alias ga='git add'
alias gc='git commit'
alias gp='git push'
alias gl='git log --oneline --graph'

# Python
alias py='python'
alias pip='uv pip'
alias venv='uv venv'

# Process management
alias ports='ss -tlnp'
alias psg='ps aux | grep'
alias myip='curl -s ifconfig.me'

# Clipboard helpers (if X11/Wayland available)
alias pbcopy='xclip -selection clipboard 2>/dev/null || wl-copy 2>/dev/null || cat'
alias pbpaste='xclip -selection clipboard -o 2>/dev/null || wl-paste 2>/dev/null || cat'

# System info
alias sysinfo='claude-doctor'
alias os-version='cat /etc/claude-os-release'

# Quick workspace access
alias ws='cd ~/workspace'
alias skils='cd ~/.claude/skills'
