#!/usr/bin/env bash
# Claude OS ISO Builder
# Builds a bootable Claude OS ISO using Debian Live or a custom rootfs
# Run on a Debian/Ubuntu host with live-build installed
#
# Requirements:
#   sudo apt-get install live-build squashfs-tools xorriso isolinux
#
# Usage:
#   ./build-iso.sh [--output path/to/output.iso] [--arch amd64]

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BUILD_DIR="${ROOT_DIR}/build"
KERNEL_DIR="${BUILD_DIR}/kernel"
ISO_WORK="${BUILD_DIR}/iso-work"
ISO_OUTPUT="${1:-${BUILD_DIR}/claude-os-1.0.0-amd64.iso}"
ARCH="${ARCH:-amd64}"

GREEN='\033[0;32m'; BOLD='\033[1m'; RESET='\033[0m'
log() { echo -e "${BOLD}[iso]${RESET} $*"; }
ok()  { echo -e "${GREEN}✓${RESET} $*"; }

mkdir -p "${ISO_WORK}/"{boot/grub,boot/isolinux,live,EFI/BOOT}

log "Claude OS ISO Builder"
log "─────────────────────────────────────────────────"
log "Output:       ${ISO_OUTPUT}"
log "Architecture: ${ARCH}"
log "Build dir:    ${ISO_WORK}"
echo ""

# ── Step 1: Create rootfs using debootstrap ───────────────────────────────────
ROOTFS="${BUILD_DIR}/rootfs-debootstrap"
if [[ ! -d "${ROOTFS}" ]]; then
    log "Step 1: Bootstrap Debian rootfs..."
    sudo debootstrap --arch="${ARCH}" --include=\
systemd,systemd-sysv,\
bash,coreutils,util-linux,\
apt,apt-utils,\
curl,wget,git,\
python3,python3-pip,\
openssh-client,\
ca-certificates,\
network-manager,\
sudo,\
nano,vim,\
htop,tree,jq,\
locales,\
zsh,fish \
        bookworm "${ROOTFS}" http://deb.debian.org/debian/
    ok "Rootfs bootstrapped"
else
    ok "Rootfs already exists, skipping debootstrap"
fi

# ── Step 2: Overlay Claude OS files ──────────────────────────────────────────
log "Step 2: Overlaying Claude OS files..."
sudo rsync -av "${ROOT_DIR}/rootfs/" "${ROOTFS}/"
sudo mkdir -p "${ROOTFS}/usr/local/share/claude-os/tools"
sudo cp -r "${ROOT_DIR}/tools/hermes" "${ROOTFS}/usr/local/share/claude-os/tools/"
sudo cp -r "${ROOT_DIR}/tools/blackbox" "${ROOTFS}/usr/local/share/claude-os/tools/"
sudo cp -r "${ROOT_DIR}/init/"* "${ROOTFS}/usr/local/share/claude-os/"
sudo cp -r "${ROOT_DIR}/skills/"{gstack,builtin} \
    "${ROOTFS}/usr/local/share/claude-os/skills/" 2>/dev/null || true
ok "Files overlaid"

# ── Step 3: Chroot setup ──────────────────────────────────────────────────────
log "Step 3: Running chroot setup..."
sudo chroot "${ROOTFS}" /bin/bash <<'CHROOT'
set -e

# OS identity
cp /etc/claude-os-release /etc/os-release 2>/dev/null || true
echo "claudeos" > /etc/hostname

# Locale
echo "en_US.UTF-8 UTF-8" >> /etc/locale.gen
locale-gen
update-locale LANG=en_US.UTF-8

# Enable systemd services
systemctl enable NetworkManager 2>/dev/null || true
systemctl enable ssh 2>/dev/null || true

# Create systemd service for first-boot init
if [[ -f /usr/local/share/claude-os/claude-os-init.sh ]]; then
    cp /usr/local/share/claude-os/claude-os.service /etc/systemd/system/ 2>/dev/null || true
    systemctl enable claude-os.service 2>/dev/null || true
fi

# Install Node.js via official apt repo
curl -fsSL https://deb.nodesource.com/setup_24.x | bash - 2>/dev/null || true
apt-get install -y nodejs 2>/dev/null || true

# Install uv
curl -LsSf https://astral.sh/uv/install.sh | sh 2>/dev/null || true
ln -sf /root/.cargo/bin/uv /usr/local/bin/uv 2>/dev/null || true

# Install Bun
curl -fsSL https://bun.sh/install | bash 2>/dev/null || true
ln -sf /root/.bun/bin/bun /usr/local/bin/bun 2>/dev/null || true

# Install Claude Code
npm install -g @anthropic-ai/claude-code 2>/dev/null || true

# Install anthropic Python SDK
pip install anthropic 2>/dev/null || uv pip install anthropic 2>/dev/null || true

# Make tools executable
chmod +x /usr/local/bin/hermes 2>/dev/null || true
chmod +x /usr/local/bin/blackbox 2>/dev/null || true
chmod +x /usr/local/bin/skills 2>/dev/null || true
chmod +x /usr/local/bin/claude-doctor 2>/dev/null || true

# Setup profile
echo "source /etc/profile.d/claude-env.sh" >> /etc/bash.bashrc
echo "source /etc/profile.d/aliases.sh" >> /etc/bash.bashrc

echo "Chroot setup complete"
CHROOT
ok "Chroot setup complete"

# ── Step 4: Kernel ────────────────────────────────────────────────────────────
log "Step 4: Copying kernel..."
VMLINUZ="${KERNEL_DIR}/linux-6.6.30/arch/x86/boot/bzImage"
if [[ -f "${VMLINUZ}" ]]; then
    cp "${VMLINUZ}" "${ISO_WORK}/boot/vmlinuz-claudeos"
    ok "Custom kernel copied"
else
    log "⚠ Custom kernel not found, using host kernel"
    cp /boot/vmlinuz-* "${ISO_WORK}/boot/vmlinuz-claudeos" 2>/dev/null | head -1 || true
    cp /boot/initrd.img-* "${ISO_WORK}/boot/initrd.img-claudeos" 2>/dev/null | head -1 || true
fi

# ── Step 5: Generate initrd ────────────────────────────────────────────────────
log "Step 5: Generating initrd..."
sudo chroot "${ROOTFS}" update-initramfs -c -k all 2>/dev/null || true
INITRD=$(ls "${ROOTFS}/boot/initrd.img-"* 2>/dev/null | head -1)
if [[ -n "$INITRD" ]]; then
    cp "$INITRD" "${ISO_WORK}/boot/initrd.img-claudeos"
    ok "initrd generated"
fi

# ── Step 6: Squash rootfs ─────────────────────────────────────────────────────
log "Step 6: Creating squashfs (this may take a while)..."
sudo mksquashfs "${ROOTFS}" "${ISO_WORK}/live/filesystem.squashfs" \
    -comp xz -Xdict-size 100% \
    -e "${ISO_WORK}" \
    -noappend \
    -no-progress 2>/dev/null || \
sudo mksquashfs "${ROOTFS}" "${ISO_WORK}/live/filesystem.squashfs" \
    -comp gzip -noappend
ok "squashfs created: $(du -sh "${ISO_WORK}/live/filesystem.squashfs" | cut -f1)"

# ── Step 7: Bootloader ────────────────────────────────────────────────────────
log "Step 7: Setting up bootloader..."
cp "${ROOT_DIR}/bootloader/grub.cfg" "${ISO_WORK}/boot/grub/grub.cfg"
cp "${ROOT_DIR}/bootloader/isolinux.cfg" "${ISO_WORK}/boot/isolinux/isolinux.cfg"
cp /usr/lib/ISOLINUX/isolinux.bin "${ISO_WORK}/boot/isolinux/" 2>/dev/null || true
cp /usr/lib/syslinux/modules/bios/ldlinux.c32 "${ISO_WORK}/boot/isolinux/" 2>/dev/null || true
cp /usr/lib/syslinux/modules/bios/vesamenu.c32 "${ISO_WORK}/boot/isolinux/" 2>/dev/null || true
ok "Bootloader configured"

# ── Step 8: Build ISO ─────────────────────────────────────────────────────────
log "Step 8: Building ISO..."
sudo xorriso -as mkisofs \
    -iso-level 3 \
    -full-iso9660-filenames \
    -volid "CLAUDEOS" \
    -appid "Claude OS 1.0.0" \
    -publisher "Claude OS Project" \
    -preparer "build-iso.sh" \
    -eltorito-boot boot/isolinux/isolinux.bin \
    -eltorito-catalog boot/isolinux/boot.cat \
    -no-emul-boot -boot-load-size 4 -boot-info-table \
    --efi-boot EFI/BOOT/bootx64.efi \
    -efi-boot-part --efi-boot-image \
    --protective-msdos-label \
    -output "${ISO_OUTPUT}" \
    "${ISO_WORK}"

ok "ISO built: ${ISO_OUTPUT}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "  Claude OS ISO ready: ${ISO_OUTPUT}"
echo "  Size: $(du -sh "${ISO_OUTPUT}" | cut -f1)"
echo ""
echo "  Flash to USB:  dd if=${ISO_OUTPUT} of=/dev/sdX bs=4M status=progress"
echo "  Test with VM:  qemu-system-x86_64 -cdrom ${ISO_OUTPUT} -m 4G -enable-kvm"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
