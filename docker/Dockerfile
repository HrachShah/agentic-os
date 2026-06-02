# Agentic OS — Docker Image
# A containerized Agentic OS development environment
# Usage: docker build -t agentic-os . && docker run -it --rm agentic-os

FROM debian:bookworm-slim

LABEL maintainer="Agentic OS Project"
LABEL description="Agentic OS — Claude Code-first developer OS"
LABEL version="1.0.0"

# ── Base packages ─────────────────────────────────────────────────────────────
RUN apt-get update && apt-get install -y --no-install-recommends \
    bash \
    curl \
    wget \
    git \
    ca-certificates \
    gnupg \
    python3 \
    python3-pip \
    python3-venv \
    nano \
    vim \
    htop \
    tree \
    jq \
    sudo \
    locales \
    procps \
    net-tools \
    openssh-client \
    && rm -rf /var/lib/apt/lists/*

# ── Locale ────────────────────────────────────────────────────────────────────
RUN echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen && locale-gen
ENV LANG=en_US.UTF-8 LC_ALL=en_US.UTF-8

# ── Node.js (via NodeSource) ──────────────────────────────────────────────────
RUN curl -fsSL https://deb.nodesource.com/setup_24.x | bash - \
    && apt-get install -y nodejs \
    && rm -rf /var/lib/apt/lists/*

# ── Bun ───────────────────────────────────────────────────────────────────────
RUN curl -fsSL https://bun.sh/install | bash \
    && ln -sf /root/.bun/bin/bun /usr/local/bin/bun
ENV BUN_INSTALL=/root/.bun
ENV PATH=/root/.bun/bin:$PATH

# ── uv (Python package manager) ───────────────────────────────────────────────
RUN curl -LsSf https://astral.sh/uv/install.sh | sh \
    && ln -sf /root/.cargo/bin/uv /usr/local/bin/uv
ENV PATH=/root/.cargo/bin:$PATH

# ── Python dependencies ───────────────────────────────────────────────────────
RUN pip install anthropic --quiet --no-cache-dir

# ── Claude Code ───────────────────────────────────────────────────────────────
RUN npm install -g @anthropic-ai/claude-code 2>/dev/null || true

# ── Agentic OS identity ────────────────────────────────────────────────────────
COPY rootfs/etc/agentic-os-release /etc/agentic-os-release
COPY rootfs/etc/motd /etc/motd
COPY rootfs/etc/profile.d/ /etc/profile.d/

# ── Agentic OS tools ───────────────────────────────────────────────────────────
COPY tools/hermes/hermes.py /usr/local/share/agentic-os/tools/hermes/hermes.py
COPY tools/blackbox/blackbox.py /usr/local/share/agentic-os/tools/blackbox/blackbox.py

RUN cat > /usr/local/bin/hermes <<'EOF'
#!/usr/bin/env bash
exec python3 /usr/local/share/agentic-os/tools/hermes/hermes.py "$@"
EOF
RUN cat > /usr/local/bin/blackbox <<'EOF'
#!/usr/bin/env bash
exec python3 /usr/local/share/agentic-os/tools/blackbox/blackbox.py "$@"
EOF

COPY rootfs/usr/local/bin/skills /usr/local/bin/skills
COPY rootfs/usr/local/bin/claude-doctor /usr/local/bin/claude-doctor

RUN chmod +x /usr/local/bin/hermes \
              /usr/local/bin/blackbox \
              /usr/local/bin/skills \
              /usr/local/bin/claude-doctor

# ── Skills ────────────────────────────────────────────────────────────────────
RUN mkdir -p /usr/local/share/agentic-os/skills/{gstack,antigravity,builtin}
COPY skills/ /usr/local/share/agentic-os/skills/

# ── Default Claude config ─────────────────────────────────────────────────────
RUN mkdir -p /root/.claude/skills
COPY rootfs/home/claude/.claude/CLAUDE.md /root/.claude/CLAUDE.md
COPY rootfs/home/claude/.claude/settings.json /root/.claude/settings.json

# ── Shell setup ───────────────────────────────────────────────────────────────
RUN echo 'source /etc/profile.d/claude-env.sh 2>/dev/null || true' >> /root/.bashrc \
    && echo 'source /etc/profile.d/aliases.sh 2>/dev/null || true' >> /root/.bashrc \
    && echo 'cat /etc/motd' >> /root/.bashrc

# ── Environment ───────────────────────────────────────────────────────────────
ENV CLAUDE_OS=1
ENV CLAUDE_OS_VERSION=1.0.0
ENV CLAUDE_HOME=/root
ENV CLAUDE_SKILLS_DIR=/root/.claude/skills
ENV CLAUDE_CONFIG_DIR=/root/.claude
ENV ANTIGRAVITY_SKILLS=/usr/local/share/agentic-os/skills/antigravity
ENV GSTACK_SKILLS=/usr/local/share/agentic-os/skills/gstack
ENV HERMES_MODEL=claude-haiku-4-5-20251001
ENV BLACKBOX_MODEL=claude-sonnet-4-6
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# ── GUI (pre-built dist) ──────────────────────────────────────────────────────
COPY gui/ /usr/local/share/agentic-os/gui/
RUN if command -v bun >/dev/null 2>&1; then \
      cd /usr/local/share/agentic-os/gui && bun install --frozen-lockfile 2>/dev/null || bun install; \
    fi

WORKDIR /workspace

EXPOSE 3000 4000 5001

# Pass API key at runtime: docker run -e ANTHROPIC_API_KEY=sk-ant-... agentic-os
CMD ["/bin/bash", "--login"]
