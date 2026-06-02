# Agentic OS — Windows / WSL2 Quick Installer
# Run in PowerShell: .\install-windows.ps1
# Or with API key: .\install-windows.ps1 -ApiKey "sk-ant-..."

param(
    [string]$ApiKey = "",
    [switch]$SkipWSL,
    [switch]$DockerOnly
)

$ErrorActionPreference = "Stop"
$CLAUDE_OS_VERSION = "1.0.0"

function Write-Banner {
    Write-Host @"

  ██████╗██╗      █████╗ ██╗   ██╗██████╗ ███████╗     ██████╗ ███████╗
 ██╔════╝██║     ██╔══██╗██║   ██║██╔══██╗██╔════╝    ██╔═══██╗██╔════╝
 ██║     ██║     ███████║██║   ██║██║  ██║█████╗      ██║   ██║███████╗
 ╚██████╗███████╗██║  ██║╚██████╔╝██████╔╝███████╗    ╚██████╔╝███████║
  ╚═════╝╚══════╝╚═╝  ╚═╝ ╚═════╝ ╚═════╝ ╚══════╝     ╚═════╝ ╚══════╝

  Agentic OS $CLAUDE_OS_VERSION — Windows Installer
  ════════════════════════════════════════════════

"@ -ForegroundColor Cyan
}

function Test-CommandExists($cmd) {
    return $null -ne (Get-Command $cmd -ErrorAction SilentlyContinue)
}

function Install-WithWinget($pkg, $id) {
    Write-Host "→ Installing $pkg..." -ForegroundColor Yellow
    try {
        winget install --id $id --silent --accept-package-agreements --accept-source-agreements
        Write-Host "  ✓ $pkg installed" -ForegroundColor Green
    } catch {
        Write-Host "  ⚠ $pkg install failed (may already be present)" -ForegroundColor Yellow
    }
}

function Install-AgenticOSInWSL {
    Write-Host "`n[WSL2] Setting up Agentic OS in WSL2..." -ForegroundColor Cyan

    # Check WSL is available
    if (-not (Test-CommandExists "wsl")) {
        Write-Host "WSL not found. Installing..." -ForegroundColor Yellow
        wsl --install
        Write-Host "Please restart and run this installer again." -ForegroundColor Yellow
        return
    }

    # Copy setup script into WSL and run it
    $scriptDir = Split-Path -Parent $MyInvocation.ScriptName
    $rootDir = Split-Path -Parent $scriptDir

    # Convert Windows path to WSL path
    $wslRoot = wsl wslpath ($rootDir -replace '\\', '/')

    Write-Host "→ Running Agentic OS setup in WSL2..." -ForegroundColor Yellow
    wsl bash "$wslRoot/packages/setup-all.sh"

    # Set API key if provided
    if ($ApiKey) {
        wsl bash -c "echo 'export ANTHROPIC_API_KEY=$ApiKey' >> ~/.bashrc"
        wsl bash -c "echo '$ApiKey' > ~/.claude/api_key && chmod 600 ~/.claude/api_key"
        Write-Host "  ✓ API key configured in WSL" -ForegroundColor Green
    }

    Write-Host "`n  ✓ Agentic OS installed in WSL2!" -ForegroundColor Green
    Write-Host "  Start it: wsl" -ForegroundColor White
}

function Install-WithDocker {
    Write-Host "`n[Docker] Setting up Agentic OS Docker container..." -ForegroundColor Cyan

    if (-not (Test-CommandExists "docker")) {
        Write-Host "Docker Desktop not found. Installing..." -ForegroundColor Yellow
        Install-WithWinget "Docker Desktop" "Docker.DockerDesktop"
        Write-Host "Please restart Docker Desktop and run again." -ForegroundColor Yellow
        return
    }

    $scriptDir = Split-Path -Parent $MyInvocation.ScriptName
    $rootDir = Split-Path -Parent $scriptDir

    Write-Host "→ Building Agentic OS Docker image..." -ForegroundColor Yellow
    docker build -t "agentic-os:$CLAUDE_OS_VERSION" -f "$rootDir\docker\Dockerfile" $rootDir

    # Create a launcher script
    $launcher = @"
@echo off
docker run -it --rm ^
    -e ANTHROPIC_API_KEY=%ANTHROPIC_API_KEY% ^
    -v agentic-os-workspace:/workspace ^
    --hostname agenticos ^
    agentic-os:$CLAUDE_OS_VERSION
"@
    $launcherPath = "$env:USERPROFILE\Desktop\Agentic OS.bat"
    $launcher | Out-File -FilePath $launcherPath -Encoding ASCII
    Write-Host "  ✓ Desktop shortcut created: $launcherPath" -ForegroundColor Green

    Write-Host "`n  ✓ Agentic OS Docker image ready!" -ForegroundColor Green
    Write-Host "  Run: docker run -it --rm -e ANTHROPIC_API_KEY=sk-ant-... agentic-os:$CLAUDE_OS_VERSION" -ForegroundColor White
}

function Install-WindowsTools {
    Write-Host "`n[Windows] Installing development tools..." -ForegroundColor Cyan

    # Node.js
    if (-not (Test-CommandExists "node")) {
        Install-WithWinget "Node.js" "OpenJS.NodeJS.LTS"
    } else {
        Write-Host "  ✓ Node.js: $(node --version)" -ForegroundColor Green
    }

    # Git
    if (-not (Test-CommandExists "git")) {
        Install-WithWinget "Git" "Git.Git"
    } else {
        Write-Host "  ✓ Git: $(git --version)" -ForegroundColor Green
    }

    # Python
    if (-not (Test-CommandExists "python")) {
        Install-WithWinget "Python 3.12" "Python.Python.3.12"
    } else {
        Write-Host "  ✓ Python: $(python --version)" -ForegroundColor Green
    }

    # uv
    if (-not (Test-CommandExists "uv")) {
        Write-Host "→ Installing uv..." -ForegroundColor Yellow
        powershell -c "irm https://astral.sh/uv/install.ps1 | iex"
    } else {
        Write-Host "  ✓ uv: $(uv --version)" -ForegroundColor Green
    }

    # Bun
    if (-not (Test-CommandExists "bun")) {
        Write-Host "→ Installing Bun..." -ForegroundColor Yellow
        powershell -c "irm https://bun.sh/install.ps1 | iex"
    } else {
        Write-Host "  ✓ Bun: $(bun --version)" -ForegroundColor Green
    }

    # Claude Code
    if (-not (Test-CommandExists "claude")) {
        Write-Host "→ Installing Claude Code..." -ForegroundColor Yellow
        npm install -g "@anthropic-ai/claude-code" 2>$null
        if (Test-CommandExists "claude") {
            Write-Host "  ✓ Claude Code installed" -ForegroundColor Green
        }
    } else {
        Write-Host "  ✓ Claude Code installed" -ForegroundColor Green
    }

    # Install hermes/blackbox as Windows commands
    $toolsDir = "$env:USERPROFILE\.agentic-os\tools"
    New-Item -ItemType Directory -Force $toolsDir | Out-Null

    $scriptDir = Split-Path -Parent $MyInvocation.ScriptName
    $rootDir = Split-Path -Parent $scriptDir

    Copy-Item "$rootDir\tools\hermes\hermes.py" "$toolsDir\hermes.py" -Force
    Copy-Item "$rootDir\tools\blackbox\blackbox.py" "$toolsDir\blackbox.py" -Force

    # Create wrapper batch files
    @"
@echo off
python "$toolsDir\hermes.py" %*
"@ | Out-File "$env:USERPROFILE\.agentic-os\hermes.bat" -Encoding ASCII

    @"
@echo off
python "$toolsDir\blackbox.py" %*
"@ | Out-File "$env:USERPROFILE\.agentic-os\blackbox.bat" -Encoding ASCII

    # Add to PATH
    $currentPath = [Environment]::GetEnvironmentVariable("PATH", "User")
    $claudeOsBin = "$env:USERPROFILE\.agentic-os"
    if ($currentPath -notlike "*$claudeOsBin*") {
        [Environment]::SetEnvironmentVariable("PATH", "$currentPath;$claudeOsBin", "User")
        Write-Host "  ✓ Added to PATH: $claudeOsBin" -ForegroundColor Green
    }

    # Install anthropic SDK
    pip install anthropic --quiet 2>$null

    Write-Host "  ✓ hermes and blackbox installed" -ForegroundColor Green
}

function Set-ApiKey {
    if (-not $ApiKey) {
        Write-Host "`n  Set your API key to use Agentic OS tools:" -ForegroundColor Yellow
        Write-Host "  `$env:ANTHROPIC_API_KEY = 'sk-ant-...'" -ForegroundColor White
        Write-Host "  Or add to system env variables" -ForegroundColor White
        return
    }
    [Environment]::SetEnvironmentVariable("ANTHROPIC_API_KEY", $ApiKey, "User")
    Write-Host "  ✓ ANTHROPIC_API_KEY set in user environment" -ForegroundColor Green
}

function Show-Summary {
    Write-Host @"

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
  Agentic OS $CLAUDE_OS_VERSION — Installation Complete

  On Windows (native):
    hermes "task"           -- AI task delegation
    blackbox --interactive  -- Coding assistant REPL
    claude                  -- Claude Code CLI

  In WSL2 (full experience):
    wsl                     -- Enter Agentic OS environment
    claude-doctor           -- Verify setup

  Via Docker:
    docker run -it --rm -e ANTHROPIC_API_KEY=... agentic-os:$CLAUDE_OS_VERSION

  Next: Set ANTHROPIC_API_KEY to activate all features
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
"@ -ForegroundColor Cyan
}

# ── Main ──────────────────────────────────────────────────────────────────────
Write-Banner

Install-WindowsTools
Set-ApiKey

if (-not $SkipWSL) {
    Install-AgenticOSInWSL
}

if ($DockerOnly) {
    Install-WithDocker
}

Show-Summary
