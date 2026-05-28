#!/usr/bin/env sh
# Claude OS — Individual tool installer functions
# Sourced by claude-os-setup and claude-os-init.sh
# Each function: install_<toolid> <api_key_or_empty>

GREEN='\033[0;32m'; RED='\033[0;31m'; DIM='\033[2m'; RESET='\033[0m'
ok()   { printf "${GREEN}  ✓${RESET} %s\n" "$*"; }
fail() { printf "${RED}  ✗${RESET} %s\n" "$*"; }
step() { printf "${DIM}    → %s${RESET}\n" "$*"; }

# ── npm/bun helper ────────────────────────────────────────────────────────────
npm_install() {
    pkg="$1"
    step "npm install -g $pkg"
    npm install -g "$pkg" --quiet 2>/dev/null && return 0
    step "bun add -g $pkg (fallback)"
    bun add -g "$pkg" 2>/dev/null && return 0
    return 1
}

pip_install() {
    pkg="$1"
    step "pip install $pkg"
    pip install "$pkg" --quiet --break-system-packages 2>/dev/null && return 0
    pip3 install "$pkg" --quiet 2>/dev/null && return 0
    uv tool install "$pkg" 2>/dev/null && return 0
    return 1
}

# ── OpenCode ──────────────────────────────────────────────────────────────────
install_opencode() {
    npm_install opencode-ai && ok "OpenCode" && return 0
    fail "OpenCode — try: npm install -g opencode-ai"
    return 1
}

# ── Codex CLI ─────────────────────────────────────────────────────────────────
install_codex() {
    npm_install "@openai/codex" && ok "Codex CLI" && return 0
    fail "Codex CLI — try: npm install -g @openai/codex"
    return 1
}

# ── Aider ─────────────────────────────────────────────────────────────────────
install_aider() {
    pip_install aider-chat && ok "Aider" && return 0
    fail "Aider — try: pip install aider-chat"
    return 1
}

# ── Kilocode (VS Code extension) ──────────────────────────────────────────────
install_kilocode() {
    mkdir -p "$HOME/.vscode/extensions"
    if command -v code >/dev/null 2>&1; then
        code --install-extension kilocode.kilocode --force 2>/dev/null && \
            ok "Kilocode (VS Code extension)" && return 0
    fi
    printf 'kilocode.kilocode\n' >> "$HOME/.vscode/extensions/.claudeos-recommended"
    ok "Kilocode (queued for VS Code on next launch)"
    return 0
}

# ── Cline ─────────────────────────────────────────────────────────────────────
install_cline() {
    mkdir -p "$HOME/.vscode/extensions"
    if command -v code >/dev/null 2>&1; then
        code --install-extension saoudrizwan.claude-dev --force 2>/dev/null && \
            ok "Cline (VS Code extension)" && return 0
    fi
    printf 'saoudrizwan.claude-dev\n' >> "$HOME/.vscode/extensions/.claudeos-recommended"
    ok "Cline (queued for VS Code on next launch)"
    return 0
}

# ── Continue.dev ──────────────────────────────────────────────────────────────
install_continue() {
    mkdir -p "$HOME/.vscode/extensions"
    if command -v code >/dev/null 2>&1; then
        code --install-extension Continue.continue --force 2>/dev/null && \
            ok "Continue.dev (VS Code extension)" && return 0
    fi
    printf 'Continue.continue\n' >> "$HOME/.vscode/extensions/.claudeos-recommended"
    ok "Continue.dev (queued for VS Code on next launch)"
    return 0
}

# ── OpenClaw ──────────────────────────────────────────────────────────────────
install_openclaw() {
    # Try pip, then npm, then GitHub clone
    pip_install openclaw 2>/dev/null && ok "OpenClaw" && return 0
    npm_install openclaw 2>/dev/null && ok "OpenClaw" && return 0
    DEST="/usr/local/share/claude-os/tools/openclaw"
    mkdir -p "$DEST"
    if git clone --depth=1 https://github.com/openclaw/openclaw "$DEST" 2>/dev/null; then
        pip_install -e "$DEST" 2>/dev/null || true
        ok "OpenClaw (from source)"
        return 0
    fi
    # Write stub so the command always exists
    cat > /usr/local/bin/openclaw <<'STUB'
#!/usr/bin/env sh
echo "OpenClaw: install manually from https://github.com/openclaw/openclaw"
STUB
    chmod +x /usr/local/bin/openclaw
    ok "OpenClaw stub (source install required)"
    return 0
}

# ── OpenHands ─────────────────────────────────────────────────────────────────
install_openhands() {
    pip_install openhands-ai && ok "OpenHands" && return 0
    fail "OpenHands — try: pip install openhands-ai"
    return 1
}

# ── Goose ─────────────────────────────────────────────────────────────────────
install_goose() {
    if curl -fsSL https://github.com/block/goose/releases/latest/download/goose-installer.sh \
        | bash 2>/dev/null; then
        ok "Goose (Block)"
        return 0
    fi
    pip_install goose-ai 2>/dev/null && ok "Goose (pip)" && return 0
    fail "Goose — see: https://github.com/block/goose"
    return 1
}

# ── SWE-agent ─────────────────────────────────────────────────────────────────
install_swe_agent() {
    pip_install sweagent && ok "SWE-agent" && return 0
    fail "SWE-agent — try: pip install sweagent"
    return 1
}
