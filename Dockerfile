FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV NODE_VERSION=20
ENV CLAUDE_HOME=/root/.claude

RUN apt-get update && apt-get install -y \
    curl wget git build-essential \
    python3 python3-pip python3-venv \
    ripgrep fd-find jq tmux vim nano \
    ca-certificates gnupg lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash - \
    && apt-get install -y nodejs \
    && npm install -g npm@latest

# Bun
RUN curl -fsSL https://bun.sh/install | bash
ENV PATH="/root/.bun/bin:$PATH"

# uv (Python package manager)
RUN pip3 install uv

# Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code

# Pre-load backend deps
WORKDIR /app/backend
COPY backend/package.json .
RUN npm install

# Pre-load dashboard
WORKDIR /app/dashboard
COPY dashboard/package.json .
RUN npm install

# Copy everything
WORKDIR /app
COPY . .

# Build dashboard
WORKDIR /app/dashboard
RUN npm run build

WORKDIR /app

EXPOSE 3000 5173

CMD ["node", "backend/server.js"]
