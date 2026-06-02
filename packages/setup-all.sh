#!/usr/bin/env bash
# Agentic OS — Complete Package Installer
# Run this on any Debian/Ubuntu system to install the full Agentic OS toolchain
# Works on: native Linux, WSL2, live OS, Docker container

set -euo pipefail

BOLD='\033[1m'; GREEN='\033[0;32m'; RED='\033[0;31m'
YELLOW='\033[1;33m'; CYAN='\033[0;36m'; RESET='\033[0m'

log()  { echo -e "${BOLD}[setup]${RESET} $*"; }
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
warn() { echo -e "${YELLOW}⚠${RESET} $*"; }
err()  { echo -e "${RED}✗${RESET} $*" >&2; }

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
INSTALL_USER="${SUDO_USER:-${USER}}"
HOME_DIR=$(eval echo "~${INSTALL_USER}")

banner() {
cat <<'EOF'

  ╔══════════════════════════════════════════════════╗
  ║   Agentic OS — Package Installer                  ║
  ║   Installing all Agentic OS tools and skills      ║
  ╚══════════════════════════════════════════════════╝

EOF
}

require_root_or_sudo() {
    if [[ $EUID -ne 0 ]] && ! sudo -n true 2>/dev/null; then
        warn "Some steps may require sudo. Continuing as user..."
    fi
}

install_apt_packages() {
    log "Installing APT packages..."
    sudo apt-get update -qq 2>/dev/null || true
    sudo apt-get install -y --no-install-recommends \
        curl wget git ca-certificates gnupg \
        python3 python3-pip python3-venv \
        jq htop tree nano \
        build-essential \
        openssl libssl-dev \
        2>/dev/null || warn "Some APT packages failed (non-critical)"
    ok "APT packages"
}

install_node() {
    if command -v node &>/dev/null; then
        ok "Node.js already installed: $(node --version)"
        return
    fi
    log "Installing Node.js..."
    curl -fsSL https://deb.nodesource.com/setup_24.x | sudo bash - 2>/dev/null
    sudo apt-get install -y nodejs 2>/dev/null || true
    ok "Node.js: $(node --version 2>/dev/null || echo 'installed')"
}

install_bun() {
    if command -v bun &>/dev/null; then
        ok "Bun already installed: $(bun --version)"
        return
    fi
    log "Installing Bun..."
    curl -fsSL https://bun.sh/install | bash 2>/dev/null
    BUN_PATH="${HOME_DIR}/.bun/bin/bun"
    if [[ -f "$BUN_PATH" ]]; then
        sudo ln -sf "$BUN_PATH" /usr/local/bin/bun 2>/dev/null || true
        ok "Bun: $(bun --version 2>/dev/null || echo 'installed')"
    fi
}

install_uv() {
    if command -v uv &>/dev/null; then
        ok "uv already installed: $(uv --version)"
        return
    fi
    log "Installing uv (Python package manager)..."
    curl -LsSf https://astral.sh/uv/install.sh | sh 2>/dev/null
    UV_PATH="${HOME_DIR}/.cargo/bin/uv"
    if [[ -f "$UV_PATH" ]]; then
        sudo ln -sf "$UV_PATH" /usr/local/bin/uv 2>/dev/null || true
    fi
    ok "uv: $(uv --version 2>/dev/null || echo 'installed')"
}

install_claude_code() {
    if command -v claude &>/dev/null; then
        ok "Claude Code already installed: $(claude --version 2>/dev/null | head -1)"
        return
    fi
    log "Installing Claude Code..."
    if command -v bun &>/dev/null; then
        bun add -g @anthropic-ai/claude-code 2>/dev/null && ok "Claude Code via Bun" && return
    fi
    npm install -g @anthropic-ai/claude-code 2>/dev/null && ok "Claude Code via npm" && return
    warn "Could not install Claude Code automatically. Run: npm install -g @anthropic-ai/claude-code"
}

install_python_deps() {
    log "Installing Python dependencies (anthropic SDK)..."
    if command -v uv &>/dev/null; then
        uv pip install anthropic --quiet 2>/dev/null || pip install anthropic --quiet 2>/dev/null
    else
        pip install anthropic --quiet 2>/dev/null || pip3 install anthropic --quiet 2>/dev/null
    fi
    ok "anthropic SDK installed"
}

install_hermes() {
    log "Installing Hermes AI terminal..."
    sudo mkdir -p /usr/local/share/agentic-os/tools/hermes
    sudo cp "${ROOT_DIR}/tools/hermes/hermes.py" /usr/local/share/agentic-os/tools/hermes/
    sudo tee /usr/local/bin/hermes > /dev/null <<'WRAP'
#!/usr/bin/env bash
exec python3 /usr/local/share/agentic-os/tools/hermes/hermes.py "$@"
WRAP
    sudo chmod +x /usr/local/bin/hermes
    ok "Hermes: $(hermes --version 2>/dev/null || echo 'installed')"
}

install_blackbox() {
    log "Installing Blackbox coding terminal..."
    sudo mkdir -p /usr/local/share/agentic-os/tools/blackbox
    sudo cp "${ROOT_DIR}/tools/blackbox/blackbox.py" /usr/local/share/agentic-os/tools/blackbox/
    sudo tee /usr/local/bin/blackbox > /dev/null <<'WRAP'
#!/usr/bin/env bash
exec python3 /usr/local/share/agentic-os/tools/blackbox/blackbox.py "$@"
WRAP
    sudo chmod +x /usr/local/bin/blackbox
    ok "Blackbox installed"
}

install_skills_tool() {
    log "Installing skills manager..."
    sudo cp "${ROOT_DIR}/rootfs/usr/local/bin/skills" /usr/local/bin/skills
    sudo chmod +x /usr/local/bin/skills
    ok "skills manager installed"
}

install_claude_doctor() {
    log "Installing claude-doctor..."
    sudo cp "${ROOT_DIR}/rootfs/usr/local/bin/claude-doctor" /usr/local/bin/claude-doctor
    sudo chmod +x /usr/local/bin/claude-doctor
    ok "claude-doctor installed"
}

install_setup_wizard() {
    log "Installing agentic-os-setup (tool selection wizard)..."
    sudo cp "${ROOT_DIR}/rootfs/usr/local/bin/agentic-os-setup" /usr/local/bin/agentic-os-setup
    sudo chmod +x /usr/local/bin/agentic-os-setup
    sudo mkdir -p /usr/local/share/agentic-os/setup
    sudo cp "${ROOT_DIR}/rootfs/usr/local/share/agentic-os/setup/tool-installers.sh" \
        /usr/local/share/agentic-os/setup/
    ok "agentic-os-setup installed"
}

setup_skills_dirs() {
    log "Setting up skill directories..."
    sudo mkdir -p /usr/local/share/agentic-os/skills/{gstack,antigravity,builtin}
    mkdir -p "${HOME_DIR}/.claude/skills"

    # Copy bundled gstack skills
    if [[ -d "${ROOT_DIR}/skills/gstack" ]]; then
        sudo cp -r "${ROOT_DIR}/skills/gstack/." /usr/local/share/agentic-os/skills/gstack/
        ok "gstack skills installed"
    fi

    # Copy builtin skills
    if [[ -d "${ROOT_DIR}/skills/builtin" ]]; then
        sudo cp -r "${ROOT_DIR}/skills/builtin/." /usr/local/share/agentic-os/skills/builtin/
        ok "builtin skills installed"
    fi

    chown -R "${INSTALL_USER}:${INSTALL_USER}" "${HOME_DIR}/.claude" 2>/dev/null || true
    ok "Skill directories ready"
}

setup_claude_config() {
    log "Setting up Claude config..."
    mkdir -p "${HOME_DIR}/.claude/skills"

    # Install CLAUDE.md only if not already customized
    if [[ ! -f "${HOME_DIR}/.claude/CLAUDE.md" ]]; then
        cp "${ROOT_DIR}/rootfs/home/claude/.claude/CLAUDE.md" "${HOME_DIR}/.claude/CLAUDE.md"
        ok "CLAUDE.md installed"
    else
        warn "CLAUDE.md already exists — skipping (keeping existing)"
    fi

    # Install settings.json if not present
    if [[ ! -f "${HOME_DIR}/.claude/settings.json" ]]; then
        cp "${ROOT_DIR}/rootfs/home/claude/.claude/settings.json" "${HOME_DIR}/.claude/settings.json"
        ok "settings.json installed"
    fi
}

setup_shell_profile() {
    log "Setting up shell profile..."
    # Copy profile.d files
    sudo cp "${ROOT_DIR}/rootfs/etc/profile.d/claude-env.sh" /etc/profile.d/ 2>/dev/null || \
        cp "${ROOT_DIR}/rootfs/etc/profile.d/claude-env.sh" "${HOME_DIR}/.claude-env.sh"

    sudo cp "${ROOT_DIR}/rootfs/etc/profile.d/aliases.sh" /etc/profile.d/ 2>/dev/null || true

    # Add to bashrc if not present
    local BASHRC="${HOME_DIR}/.bashrc"
    if ! grep -q "claude-env.sh" "$BASHRC" 2>/dev/null; then
        cat >> "$BASHRC" <<'BASHRC_APPEND'

# Agentic OS
[[ -f /etc/profile.d/claude-env.sh ]] && source /etc/profile.d/claude-env.sh
[[ -f /etc/profile.d/aliases.sh ]] && source /etc/profile.d/aliases.sh
BASHRC_APPEND
        ok "Shell profile updated"
    else
        ok "Shell profile already configured"
    fi
}

setup_os_identity() {
    log "Setting OS identity..."
    if [[ ! -f /etc/agentic-os-release ]]; then
        sudo cp "${ROOT_DIR}/rootfs/etc/agentic-os-release" /etc/agentic-os-release 2>/dev/null || true
    fi
    sudo cp "${ROOT_DIR}/rootfs/etc/motd" /etc/motd 2>/dev/null || true
    ok "OS identity configured"
}

print_summary() {
    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo -e "  ${GREEN}Agentic OS tools installed successfully!${RESET}"
    echo ""
    echo "  Installed:"
    command -v claude   &>/dev/null && echo "  ✓ claude ($(claude --version 2>/dev/null | head -1))"
    command -v hermes   &>/dev/null && echo "  ✓ hermes"
    command -v blackbox &>/dev/null && echo "  ✓ blackbox"
    command -v skills   &>/dev/null && echo "  ✓ skills"
    command -v claude-doctor &>/dev/null && echo "  ✓ claude-doctor"
    echo ""
    echo "  Next steps:"
    echo "  1. Choose your AI tools:  agentic-os-setup"
    echo "  2. Set your API key:      export ANTHROPIC_API_KEY='sk-ant-...'"
    echo "  3. Verify setup:          claude-doctor"
    echo "  4. List skills:           skills list"
    echo "  5. Try Hermes:            hermes 'create a hello world in Python'"
    echo "  6. Try Blackbox:          blackbox --interactive"
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ── Main ──────────────────────────────────────────────────────────────────────
banner
require_root_or_sudo

install_apt_packages
install_node
install_bun
install_uv
install_claude_code
install_python_deps
install_hermes
install_blackbox
install_skills_tool
install_claude_doctor
install_setup_wizard
setup_skills_dirs
setup_claude_config
setup_shell_profile
setup_os_identity
print_summary
