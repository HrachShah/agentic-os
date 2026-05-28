# Claude OS — Windows Build Script
# Builds a fully standalone bootable ISO using Docker.
# Requirements: Docker Desktop (running)
# Usage: .\build.ps1
#        .\build.ps1 -Target iso
#        .\build.ps1 -Target docker-run -ApiKey "sk-ant-..."

param(
    [ValidateSet("iso","docker","docker-run","install","help")]
    [string]$Target = "iso",
    [string]$ApiKey = $env:ANTHROPIC_API_KEY,
    [string]$OutputDir = ".\build\output"
)

$VERSION = "1.0.0"
$IMAGE   = "claude-os-builder:$VERSION"
$ISO     = "claude-os-$VERSION-amd64.iso"

function Write-Step($msg) { Write-Host "  → $msg" -ForegroundColor Cyan }
function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Warn($msg) { Write-Host "  ⚠ $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "  ✗ $msg" -ForegroundColor Red }

function Test-Docker {
    if (-not (Get-Command docker -ErrorAction SilentlyContinue)) {
        Write-Err "Docker not found. Install Docker Desktop from https://docker.com"
        exit 1
    }
    try {
        docker info 2>&1 | Out-Null
    } catch {
        Write-Err "Docker Desktop is not running. Please start it."
        exit 1
    }
    Write-Ok "Docker is running"
}

function Build-ISO {
    Write-Host ""
    Write-Host "  ╔══════════════════════════════════════════════╗" -ForegroundColor Magenta
    Write-Host "  ║   Building Claude OS $VERSION ISO              ║" -ForegroundColor Magenta
    Write-Host "  ║   This compiles the kernel from source.       ║" -ForegroundColor Magenta
    Write-Host "  ║   Estimated time: 20-40 min (first build)     ║" -ForegroundColor Magenta
    Write-Host "  ╚══════════════════════════════════════════════╝" -ForegroundColor Magenta
    Write-Host ""

    Test-Docker
    New-Item -ItemType Directory -Force $OutputDir | Out-Null

    Write-Step "Building Claude OS in Docker (kernel + rootfs + ISO)..."
    Write-Step "All build steps run inside Docker — no host Linux required."
    Write-Host ""

    # Build the full OS using the builder Dockerfile
    $buildContext = Split-Path -Parent $MyInvocation.ScriptName
    docker build `
        --file "$buildContext\build\builder\Dockerfile" `
        --target artifacts `
        --output "type=local,dest=$OutputDir" `
        $buildContext

    if ($LASTEXITCODE -ne 0) {
        Write-Err "Build failed. Check output above."
        exit 1
    }

    $isoPath = Join-Path $OutputDir $ISO
    if (Test-Path $isoPath) {
        $size = (Get-Item $isoPath).Length / 1MB
        Write-Host ""
        Write-Host "  ════════════════════════════════════════════════" -ForegroundColor Green
        Write-Ok   "ISO built: $isoPath"
        Write-Ok   "Size: $([math]::Round($size, 1)) MB"
        Write-Host ""
        Write-Host "  Flash to USB:  Use Rufus or balenaEtcher" -ForegroundColor White
        Write-Host "  Test in VM:    .\build.ps1 -Target qemu (needs QEMU installed)" -ForegroundColor White
        Write-Host "  ════════════════════════════════════════════════" -ForegroundColor Green
    } else {
        Write-Warn "ISO not found at expected path. Check build logs."
    }
}

function Build-DockerImage {
    Write-Host ""
    Write-Step "Building Claude OS Docker image..."
    Test-Docker

    docker build `
        --file ".\docker\Dockerfile" `
        --tag "claude-os:$VERSION" `
        .

    if ($LASTEXITCODE -eq 0) {
        Write-Ok "Docker image built: claude-os:$VERSION"
        Write-Host "  Run: .\build.ps1 -Target docker-run" -ForegroundColor White
    }
}

function Run-Docker {
    Test-Docker

    if (-not (docker image inspect "claude-os:$VERSION" 2>&1 | Select-String "Id")) {
        Write-Step "Image not found, building first..."
        Build-DockerImage
    }

    $envFlag = if ($ApiKey) { "-e ANTHROPIC_API_KEY=$ApiKey" } else { "" }

    Write-Host ""
    Write-Host "  Starting Claude OS container..." -ForegroundColor Cyan
    Write-Host "  Type 'exit' to stop." -ForegroundColor DarkGray
    Write-Host ""

    $cmd = "docker run -it --rm $envFlag -v claude-os-workspace:/workspace --hostname claudeos claude-os:$VERSION"
    Invoke-Expression $cmd
}

function Install-Local {
    Write-Host ""
    Write-Step "Installing Claude OS tools on this Windows machine..."

    # Check for WSL2
    $wslAvail = $null
    try { $wslAvail = wsl --status 2>&1 } catch {}

    if ($wslAvail) {
        Write-Step "WSL2 detected — installing full Claude OS toolchain in WSL2..."
        wsl bash -c "bash '$(wsl wslpath ($PSScriptRoot -replace '\\','/'))/packages/setup-all.sh'"
        if ($ApiKey) {
            wsl bash -c "echo 'export ANTHROPIC_API_KEY=$ApiKey' >> ~/.bashrc"
        }
        Write-Ok "Full Claude OS installed in WSL2. Run: wsl"
    } else {
        Write-Warn "WSL2 not found — installing Windows-native tools only."
        & "$PSScriptRoot\packages\install-windows.ps1" -ApiKey $ApiKey
    }
}

function Show-Help {
    Write-Host @"

  Claude OS $VERSION — Build System
  ════════════════════════════════════════════════

  .\build.ps1 -Target iso          Build standalone bootable ISO (needs Docker)
  .\build.ps1 -Target docker       Build Claude OS Docker image
  .\build.ps1 -Target docker-run   Run Claude OS interactively in Docker
  .\build.ps1 -Target install      Install tools on this machine (WSL2 or native)

  Options:
    -ApiKey "sk-ant-..."   Set your Anthropic API key
    -OutputDir <path>      Where to put the ISO (default: .\build\output)

  Requirements for ISO build:
    ✓ Docker Desktop (running)
    ✓ 10 GB free disk space
    ✓ 30-60 min build time (downloads + compiles Linux kernel from source)

  Quick start (Docker, no build required):
    .\build.ps1 -Target docker-run -ApiKey "sk-ant-..."

"@
}

switch ($Target) {
    "iso"        { Build-ISO }
    "docker"     { Build-DockerImage }
    "docker-run" { Run-Docker }
    "install"    { Install-Local }
    "help"       { Show-Help }
    default      { Show-Help }
}
