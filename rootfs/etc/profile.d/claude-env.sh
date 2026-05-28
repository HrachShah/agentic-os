#!/usr/bin/env bash
# Claude OS — global environment setup
# Sourced for all login shells

# ── Claude OS identity ────────────────────────────────────────────────────────
export CLAUDE_OS=1
export CLAUDE_OS_VERSION="1.0.0"
export CLAUDE_OS_CODENAME="Sonnet"

# ── Paths ─────────────────────────────────────────────────────────────────────
export CLAUDE_HOME="/home/claude"
export CLAUDE_SKILLS_DIR="/home/claude/.claude/skills"
export CLAUDE_CONFIG_DIR="/home/claude/.claude"
export ANTIGRAVITY_SKILLS="/usr/local/share/claude-os/skills/antigravity"
export GSTACK_SKILLS="/usr/local/share/claude-os/skills/gstack"

export PATH="/usr/local/bin:/usr/local/sbin:/usr/bin:/usr/sbin:/bin:/sbin"
export PATH="${CLAUDE_HOME}/.local/bin:${PATH}"
export PATH="${CLAUDE_HOME}/.bun/bin:${PATH}"
export PATH="${CLAUDE_HOME}/.cargo/bin:${PATH}"
export PATH="${CLAUDE_HOME}/.deno/bin:${PATH}"
export PATH="/usr/local/share/claude-os/bin:${PATH}"

# ── Editor / pager ────────────────────────────────────────────────────────────
export EDITOR="nano"
export VISUAL="nano"
export PAGER="less"
export LESS="-RFX"

# ── Python ────────────────────────────────────────────────────────────────────
export PYTHONDONTWRITEBYTECODE=1
export PYTHONUNBUFFERED=1
export UV_LINK_MODE=copy

# ── Node / Bun ────────────────────────────────────────────────────────────────
export NODE_ENV="development"
export BUN_INSTALL="${CLAUDE_HOME}/.bun"

# ── Claude Code ───────────────────────────────────────────────────────────────
export CLAUDE_CODE_DISABLE_TELEMETRY=0
export CLAUDE_CODE_AUTO_UPDATE=1

# ── Hermes & Blackbox AI terminals ───────────────────────────────────────────
export HERMES_MODEL="claude-haiku-4-5-20251001"
export HERMES_MAX_TOKENS=8192
export BLACKBOX_MODEL="claude-sonnet-4-6"
export BLACKBOX_MAX_TOKENS=16384

# ── Git ───────────────────────────────────────────────────────────────────────
export GIT_EDITOR="nano"

# ── Colors ────────────────────────────────────────────────────────────────────
export CLICOLOR=1
export COLORTERM=truecolor
export TERM="${TERM:-xterm-256color}"

# ── Locale ────────────────────────────────────────────────────────────────────
export LANG="en_US.UTF-8"
export LC_ALL="en_US.UTF-8"
