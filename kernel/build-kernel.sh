#!/usr/bin/env bash
# Agentic OS kernel build script
# Downloads Linux 6.6 LTS and builds with agentic-os.config
set -euo pipefail

KERNEL_VERSION="6.6.30"
KERNEL_URL="https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-${KERNEL_VERSION}.tar.xz"
BUILD_DIR="$(dirname "$0")/../build/kernel"
JOBS="${NPROC:-$(nproc)}"

echo "── Agentic OS Kernel Builder ──────────────────────────────"
echo "  Kernel:  Linux ${KERNEL_VERSION}"
echo "  Jobs:    ${JOBS}"
echo "  Config:  agentic-os.config"
echo "──────────────────────────────────────────────────────────"

mkdir -p "${BUILD_DIR}"
cd "${BUILD_DIR}"

if [[ ! -f "linux-${KERNEL_VERSION}.tar.xz" ]]; then
    echo "→ Downloading kernel source..."
    curl -LO "${KERNEL_URL}"
    curl -LO "${KERNEL_URL}.sign"
fi

if [[ ! -d "linux-${KERNEL_VERSION}" ]]; then
    echo "→ Extracting..."
    tar -xf "linux-${KERNEL_VERSION}.tar.xz"
fi

cd "linux-${KERNEL_VERSION}"

echo "→ Applying Agentic OS kernel config..."
cp "$(dirname "$0")/agentic-os.config" .config

echo "→ Completing config with defaults..."
make ARCH=x86_64 olddefconfig

echo "→ Building kernel (${JOBS} jobs)..."
make ARCH=x86_64 -j"${JOBS}" bzImage modules

echo "→ Installing modules to staging..."
make ARCH=x86_64 INSTALL_MOD_PATH="${BUILD_DIR}/modules-staging" modules_install

echo ""
echo "✓ Kernel built successfully!"
echo "  bzImage:  arch/x86/boot/bzImage"
echo "  Modules:  ${BUILD_DIR}/modules-staging"
echo ""
echo "Next: run iso/build-iso.sh"
