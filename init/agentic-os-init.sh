#!/usr/bin/env bash
# Agentic OS — Primary Init Script (PID 1 alternative / systemd unit)
# Called during first boot to complete OS setup

set -euo pipefail

LOG="/var/log/agentic-os-init.log"
CLAUDE_HOME="/home/claude"
CLAUDE_USER="claude"

exec > >(tee -a "$LOG") 2>&1

log() { echo "[$(date '+%H:%M:%S')] $*"; }
ok()  { echo "[$(date '+%H:%M:%S')] ✓ $*"; }
err() { echo "[$(date '+%H:%M:%S')] ✗ $*" >&2; }

banner() {
cat <<'EOF'

  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗     ██████╗ ███████╗
 ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝    ██╔═══██╗██╔════╝
 ██║     ██║     ███████║██║   ██║██║  ██║█████╗      ██║   ██║███████╗
 ██║     ██║     ██╔══██║██║   ██║██║  ██║██╔══╝      ██║   ██║╚════██║
 ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗    ╚██████╔╝███████║
  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝     ╚═════╝ ╚══════╝

  Agentic OS 1.0.0 "Sonnet" — First Boot Setup
  ─────────────────────────────────────────────

EOF
}

setup_user() {
    log "Setting up claude user..."
    if ! id "$CLAUDE_USER" &>/dev/null; then
        useradd -m -s /bin/bash -G sudo,audio,video,plugdev,netdev "$CLAUDE_USER"
        echo "${CLAUDE_USER}:claude" | chpasswd
        ok "User '${CLAUDE_USER}' created"
    else
        ok "User '${CLAUDE_USER}' already exists"
    fi
}

setup_directories() {
    log "Setting up directories..."
    local dirs=(
        "${CLAUDE_HOME}/.claude/skills"
        "${CLAUDE_HOME}/.claude/memory"
        "${CLAUDE_HOME}/workspace"
        "${CLAUDE_HOME}/projects"
        "/usr/local/share/agentic-os/skills/gstack"
        "/usr/local/share/agentic-os/skills/antigravity"
        "/usr/local/share/agentic-os/skills/builtin"
        "/usr/local/share/agentic-os/bin"
        "/var/log/agentic-os"
    )
    for dir in "${dirs[@]}"; do
        mkdir -p "$dir"
    done
    chown -R "${CLAUDE_USER}:${CLAUDE_USER}" "${CLAUDE_HOME}"
    ok "Directories created"
}

install_node_tools() {
    log "Installing Node.js tools..."
    if ! command -v bun &>/dev/null; then
        curl -fsSL https://bun.sh/install | bash
        ln -sf "${CLAUDE_HOME}/.bun/bin/bun" /usr/local/bin/bun
    fi
    ok "Bun: $(bun --version 2>/dev/null || echo 'pending')"
}

install_python_tools() {
    log "Installing Python tools..."
    if ! command -v uv &>/dev/null; then
        curl -LsSf https://astral.sh/uv/install.sh | sh
        ln -sf "${CLAUDE_HOME}/.cargo/bin/uv" /usr/local/bin/uv
    fi
    # Install anthropic SDK for hermes/blackbox
    uv pip install anthropic --quiet 2>/dev/null || \
        pip install anthropic --quiet 2>/dev/null || true
    ok "Python tools ready"
}

install_claude_code() {
    log "Installing Claude Code..."
    if ! command -v claude &>/dev/null; then
        if command -v npm &>/dev/null; then
            npm install -g @anthropic-ai/claude-code --quiet
        elif command -v bun &>/dev/null; then
            bun add -g @anthropic-ai/claude-code
        else
            log "WARNING: npm/bun not available, skipping Claude Code install"
            return
        fi
    fi
    ok "Claude Code: $(claude --version 2>/dev/null | head -1 || echo 'installed')"
}

install_hermes() {
    log "Installing Hermes AI terminal..."
    cp /usr/local/share/agentic-os/tools/hermes/hermes.py /usr/local/bin/hermes
    chmod +x /usr/local/bin/hermes
    # Create wrapper that resolves python path
    cat > /usr/local/bin/hermes <<'WRAP'
#!/usr/bin/env bash
exec python /usr/local/share/agentic-os/tools/hermes/hermes.py "$@"
WRAP
    chmod +x /usr/local/bin/hermes
    ok "Hermes installed"
}

install_blackbox() {
    log "Installing Blackbox coding terminal..."
    cp /usr/local/share/agentic-os/tools/blackbox/blackbox.py /usr/local/share/agentic-os/tools/blackbox/
    cat > /usr/local/bin/blackbox <<'WRAP'
#!/usr/bin/env bash
exec python /usr/local/share/agentic-os/tools/blackbox/blackbox.py "$@"
WRAP
    chmod +x /usr/local/bin/blackbox
    ok "Blackbox installed"
}

install_skills() {
    log "Installing pre-bundled skills..."
    local skills_src="/usr/local/share/agentic-os/skills-bundle"
    if [[ -d "$skills_src/gstack" ]]; then
        cp -r "$skills_src/gstack/." "/usr/local/share/agentic-os/skills/gstack/"
        ok "gstack skills installed"
    fi
    if [[ -d "$skills_src/antigravity" ]]; then
        cp -r "$skills_src/antigravity/." "/usr/local/share/agentic-os/skills/antigravity/"
        ok "antigravity skills installed"
    fi
    if [[ -d "$skills_src/builtin" ]]; then
        cp -r "$skills_src/builtin/." "/usr/local/share/agentic-os/skills/builtin/"
        ok "builtin skills installed"
    fi
}

copy_claude_config() {
    log "Setting up Claude configuration..."
    local config_src="/usr/local/share/agentic-os/default-config"
    if [[ -d "$config_src" ]]; then
        cp -n "$config_src/CLAUDE.md" "${CLAUDE_HOME}/.claude/CLAUDE.md" 2>/dev/null || true
        cp -n "$config_src/settings.json" "${CLAUDE_HOME}/.claude/settings.json" 2>/dev/null || true
    fi
    chown -R "${CLAUDE_USER}:${CLAUDE_USER}" "${CLAUDE_HOME}/.claude"
    ok "Claude config installed"
}

setup_shell() {
    log "Configuring shell..."
    # Source claude-env in bashrc
    if ! grep -q "claude-env.sh" "${CLAUDE_HOME}/.bashrc" 2>/dev/null; then
        cat >> "${CLAUDE_HOME}/.bashrc" <<'BASHRC'

# Agentic OS
[[ -f /etc/profile.d/claude-env.sh ]] && source /etc/profile.d/claude-env.sh
[[ -f /etc/profile.d/aliases.sh ]] && source /etc/profile.d/aliases.sh

# Agentic OS welcome (first login only)
if [[ -z "$CLAUDE_OS_WELCOMED" ]]; then
    export CLAUDE_OS_WELCOMED=1
    cat /etc/motd
fi
BASHRC
    fi
    ok "Shell configured"
}

run_tool_wizard() {
    # Launch the interactive tool selection wizard.
    # Runs as the claude user so it has the right home directory.
    log "Launching AI tool selection wizard..."
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Agentic OS — AI Tool Setup"
    echo "  Choose which AI coding tools to install."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""

    # Run wizard as the claude user
    if id "${CLAUDE_USER}" &>/dev/null; then
        su -c "python3 /usr/local/bin/agentic-os-setup" "${CLAUDE_USER}" || \
        python3 /usr/local/bin/agentic-os-setup || \
        log "Tool wizard skipped — run 'agentic-os-setup' after login"
    else
        python3 /usr/local/bin/agentic-os-setup || \
        log "Tool wizard skipped — run 'agentic-os-setup' after login"
    fi
}

mark_first_boot_done() {
    mkdir -p /var/lib/agentic-os
    touch /var/lib/agentic-os/.first-boot-complete
    echo "$(date -Iseconds)" > /var/lib/agentic-os/install-date
    ok "First boot setup complete"
}

# ── Main ──────────────────────────────────────────────────────────────────────
main() {
    banner
    log "Starting Agentic OS first-boot setup..."

    setup_user
    setup_directories
    install_node_tools
    install_python_tools
    install_claude_code
    install_hermes
    install_blackbox
    install_skills
    copy_claude_config
    setup_shell

    # ── Interactive tool wizard ────────────────────────────────────────────────
    # Runs on first boot when a TTY is available (live or installed system).
    # If no TTY (headless/CI), skip and print instructions.
    if [ -t 0 ]; then
        run_tool_wizard
    else
        echo ""
        echo "  Headless boot detected — skipping interactive tool wizard."
        echo "  Run 'agentic-os-setup' after logging in to choose your AI tools."
        echo ""
    fi

    mark_first_boot_done

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  Agentic OS is ready. Log in as: claude / password: claude"
    echo "  Run 'agentic-os-setup'   to manage AI tools"
    echo "  Run 'claude-doctor'     to verify your setup"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo ""
}

# Only run full setup on first boot
if [[ -f /var/lib/agentic-os/.first-boot-complete ]]; then
    log "First boot already completed — skipping setup"
    exit 0
fi

main
