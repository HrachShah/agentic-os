#!/usr/bin/env bash
# Claude OS ISO Builder — runs INSIDE the Docker build container
# Input:  /build/rootfs (populated Alpine rootfs with Claude OS overlay)
#         /build/vmlinuz-claudeos (compiled kernel)
# Output: /build/output/claude-os-1.0.0-amd64.iso (standalone bootable ISO)
#
# This script has NO dependency on any host Linux distro.
# It runs inside the Alpine-based builder container.

set -euo pipefail

VERSION="1.0.0"
ARCH="amd64"
ISO_NAME="claude-os-${VERSION}-${ARCH}.iso"
BUILD="/build"
ISO_WORK="${BUILD}/iso-work"
OUTPUT="${BUILD}/output"
ROOTFS="${BUILD}/rootfs"
KERNEL="${BUILD}/vmlinuz-claudeos"
INITRD="${ISO_WORK}/boot/initrd.img"
SQUASH="${ISO_WORK}/live/filesystem.squashfs"

GREEN='\033[0;32m'; BOLD='\033[1m'; RESET='\033[0m'
log() { echo -e "${BOLD}[build]${RESET} $*"; }
ok()  { echo -e "${GREEN}✓${RESET} $*"; }

mkdir -p "${ISO_WORK}/"{boot/grub,boot/grub/i386-pc,boot/grub/x86_64-efi,live,EFI/BOOT}
mkdir -p "${OUTPUT}"

# ── 1. Kernel ─────────────────────────────────────────────────────────────────
log "Copying kernel..."
cp "${KERNEL}" "${ISO_WORK}/boot/vmlinuz"
ok "Kernel: $(du -sh "${ISO_WORK}/boot/vmlinuz" | cut -f1)"

# ── 2. initramfs (cpio archive of the rootfs) ─────────────────────────────────
log "Building initramfs..."
(cd "${ROOTFS}" && find . | cpio -H newc -o 2>/dev/null | gzip -9 > "${INITRD}")
ok "initramfs: $(du -sh "${INITRD}" | cut -f1)"

# ── 3. Squashfs (for live persistent access) ──────────────────────────────────
log "Creating squashfs..."
mksquashfs "${ROOTFS}" "${SQUASH}" \
    -comp xz -Xdict-size 100% \
    -noappend \
    -no-progress 2>/dev/null || \
mksquashfs "${ROOTFS}" "${SQUASH}" -comp gzip -noappend
ok "squashfs: $(du -sh "${SQUASH}" | cut -f1)"

# Write filesystem size for live-boot
du -sx --block-size=1 "${ROOTFS}" | cut -f1 > "${ISO_WORK}/live/filesystem.size"

# ── 4. GRUB bootloader ────────────────────────────────────────────────────────
log "Setting up GRUB..."
cat > "${ISO_WORK}/boot/grub/grub.cfg" <<'GRUBCFG'
set default=0
set timeout=5

menuentry "Claude OS 1.0.0" --class linux {
    echo "Loading Claude OS..."
    linux /boot/vmlinuz root=/dev/sr0 boot=live rw quiet loglevel=3 CLAUDE_OS=1
    initrd /boot/initrd.img
}

menuentry "Claude OS (verbose)" --class linux {
    linux /boot/vmlinuz root=/dev/sr0 boot=live rw loglevel=7 CLAUDE_OS=1
    initrd /boot/initrd.img
}

menuentry "Claude OS (RAM)" --class linux {
    linux /boot/vmlinuz root=/dev/sr0 boot=live rw toram quiet CLAUDE_OS=1
    initrd /boot/initrd.img
}
GRUBCFG

# ── 5. GRUB EFI image ─────────────────────────────────────────────────────────
log "Building GRUB EFI image..."
grub-mkimage \
    --format=x86_64-efi \
    --output="${ISO_WORK}/EFI/BOOT/BOOTX64.EFI" \
    --prefix=/boot/grub \
    part_gpt part_msdos fat iso9660 \
    linux echo configfile normal \
    gzio all_video gfxterm \
    2>/dev/null || true

# EFI FAT image
dd if=/dev/zero of="${ISO_WORK}/EFI/efi.img" bs=1M count=5 2>/dev/null
mkfs.vfat "${ISO_WORK}/EFI/efi.img"
mmd -i "${ISO_WORK}/EFI/efi.img" ::/EFI ::/EFI/BOOT
mcopy -i "${ISO_WORK}/EFI/efi.img" "${ISO_WORK}/EFI/BOOT/BOOTX64.EFI" ::/EFI/BOOT/

# ── 6. GRUB BIOS image ────────────────────────────────────────────────────────
log "Building GRUB BIOS image..."
grub-mkimage \
    --format=i386-pc \
    --output="${ISO_WORK}/boot/grub/i386-pc/core.img" \
    --prefix=/boot/grub \
    biosdisk part_msdos iso9660 \
    linux echo configfile normal gzio \
    2>/dev/null || true

cat /usr/lib/grub/i386-pc/cdboot.img \
    "${ISO_WORK}/boot/grub/i386-pc/core.img" \
    > "${ISO_WORK}/boot/grub/bios.img" 2>/dev/null || true

# Copy GRUB modules
cp -r /usr/lib/grub/i386-pc "${ISO_WORK}/boot/grub/" 2>/dev/null || true
cp -r /usr/lib/grub/x86_64-efi "${ISO_WORK}/boot/grub/" 2>/dev/null || true

# ── 7. Build ISO ──────────────────────────────────────────────────────────────
log "Building ISO with xorriso..."
xorriso -as mkisofs \
    -iso-level 3 \
    -volid "CLAUDEOS" \
    -full-iso9660-filenames \
    -appid "Claude OS ${VERSION}" \
    -publisher "Claude OS" \
    -eltorito-boot boot/grub/bios.img \
    -no-emul-boot -boot-load-size 4 -boot-info-table \
    --grub2-boot-info \
    --grub2-mbr /usr/lib/grub/i386-pc/boot_hybrid.img \
    -eltorito-alt-boot \
    --efi-boot EFI/efi.img \
    -efi-boot-part --efi-boot-image \
    --protective-msdos-label \
    -output "${OUTPUT}/${ISO_NAME}" \
    "${ISO_WORK}" \
    2>/dev/null || \
grub-mkrescue \
    --output="${OUTPUT}/${ISO_NAME}" \
    "${ISO_WORK}"

ok "ISO built: ${OUTPUT}/${ISO_NAME}"
echo "Size: $(du -sh "${OUTPUT}/${ISO_NAME}" | cut -f1)"
