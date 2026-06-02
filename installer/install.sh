#!/usr/bin/env sh
# Agentic OS Disk Installer
# Run from inside the LIVE Agentic OS environment to install to a physical disk.
# This script is entirely self-contained — no external packages needed.

set -e

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BOLD='\033[1m'; RESET='\033[0m'

log()  { printf "${BOLD}[installer]${RESET} %s\n" "$*"; }
ok()   { printf "${GREEN}✓${RESET} %s\n" "$*"; }
err()  { printf "${RED}✗${RESET} %s\n" "$*" >&2; }
warn() { printf "${YELLOW}⚠${RESET} %s\n" "$*"; }

if [ "$(id -u)" -ne 0 ]; then
    err "Run as root: sudo $0 [disk]"
    exit 1
fi

TARGET_DISK="${1:-}"
HOSTNAME="${2:-agenticos}"
USERNAME="${3:-claude}"

# ── Disk selection ────────────────────────────────────────────────────────────
if [ -z "$TARGET_DISK" ]; then
    echo ""
    log "Available disks:"
    lsblk -d -o NAME,SIZE,MODEL 2>/dev/null | grep -v "^NAME\|loop\|sr" || fdisk -l 2>/dev/null | grep "^Disk /dev"
    echo ""
    printf "Enter target disk (e.g. sda): "
    read -r disk_input
    TARGET_DISK="/dev/${disk_input}"
fi

if [ ! -b "$TARGET_DISK" ]; then
    err "Not a block device: $TARGET_DISK"
    exit 1
fi

# ── Confirmation ──────────────────────────────────────────────────────────────
echo ""
warn "WARNING: ALL DATA on ${TARGET_DISK} will be ERASED"
echo "  Disk: ${TARGET_DISK}"
echo ""
printf "Type 'yes' to continue: "
read -r confirm
[ "$confirm" = "yes" ] || { echo "Cancelled."; exit 0; }

# ── Partition ─────────────────────────────────────────────────────────────────
log "Partitioning ${TARGET_DISK}..."
# GPT: 512 MB EFI + rest for root
printf 'label: gpt\n,512M,U\n,,L\n' | sfdisk "$TARGET_DISK" --quiet

# Detect partition names (nvme uses p1/p2, others use 1/2)
case "$TARGET_DISK" in
    *nvme*|*mmcblk*) EFI="${TARGET_DISK}p1"; ROOT="${TARGET_DISK}p2" ;;
    *)                EFI="${TARGET_DISK}1";  ROOT="${TARGET_DISK}2"  ;;
esac

# Format
mkfs.fat -F32 -n EFI "$EFI"
mkfs.ext4 -L CLAUDEOS -q "$ROOT"
ok "Disk partitioned and formatted"

# ── Mount and copy ────────────────────────────────────────────────────────────
log "Mounting target..."
mkdir -p /mnt/agenticos /mnt/agenticos/boot/efi
mount "$ROOT" /mnt/agenticos
mount "$EFI" /mnt/agenticos/boot/efi

log "Copying live filesystem to disk..."
# If running from squashfs live, unsquash it
SQUASH="/run/live/medium/live/filesystem.squashfs"
if [ -f "$SQUASH" ]; then
    unsquashfs -d /mnt/agenticos/ "$SQUASH"
    ok "Filesystem copied from live squashfs"
else
    # Fallback: rsync running OS
    rsync -aAX --progress \
        --exclude={"/proc/*","/sys/*","/dev/*","/run/*","/tmp/*","/mnt/*"} \
        / /mnt/agenticos/
    ok "Filesystem copied"
fi

# Copy kernel + initrd
cp /boot/vmlinuz* /mnt/agenticos/boot/ 2>/dev/null || true
cp /boot/initrd* /mnt/agenticos/boot/ 2>/dev/null || true

# ── fstab ─────────────────────────────────────────────────────────────────────
ROOT_UUID=$(blkid -s UUID -o value "$ROOT")
EFI_UUID=$(blkid -s UUID -o value "$EFI")
cat > /mnt/agenticos/etc/fstab <<FSTAB
UUID=${ROOT_UUID}  /          ext4  defaults,noatime  0 1
UUID=${EFI_UUID}   /boot/efi  vfat  defaults          0 2
tmpfs              /tmp       tmpfs defaults           0 0
FSTAB
ok "fstab written"

# ── GRUB ──────────────────────────────────────────────────────────────────────
log "Installing GRUB bootloader..."
for bind in dev proc sys; do
    mount --bind "/$bind" "/mnt/agenticos/$bind" 2>/dev/null || true
done

# Install GRUB into the chroot
chroot /mnt/agenticos grub-install \
    --target=x86_64-efi \
    --efi-directory=/boot/efi \
    --bootloader-id=AgenticOS \
    --recheck 2>/dev/null || \
chroot /mnt/agenticos grub-install \
    --target=i386-pc "$TARGET_DISK" 2>/dev/null || \
warn "GRUB install had warnings — boot may need manual fix"

chroot /mnt/agenticos grub-mkconfig -o /boot/grub/grub.cfg 2>/dev/null || true

for bind in dev proc sys; do
    umount "/mnt/agenticos/$bind" 2>/dev/null || true
done

# ── Hostname + user ───────────────────────────────────────────────────────────
log "Configuring system..."
echo "$HOSTNAME" > /mnt/agenticos/etc/hostname
cat > /mnt/agenticos/etc/hosts <<HOSTS
127.0.0.1   localhost
127.0.1.1   ${HOSTNAME}
HOSTS

# Create user if not exists
if ! grep -q "^${USERNAME}:" /mnt/agenticos/etc/passwd 2>/dev/null; then
    chroot /mnt/agenticos adduser -s /bin/sh -D "$USERNAME" 2>/dev/null || \
    chroot /mnt/agenticos useradd -m -s /bin/bash "$USERNAME" 2>/dev/null || true
    printf "%s:claude\n" "$USERNAME" | chroot /mnt/agenticos chpasswd 2>/dev/null || true
fi

# ── Finish ────────────────────────────────────────────────────────────────────
sync
umount /mnt/agenticos/boot/efi 2>/dev/null || true
umount /mnt/agenticos 2>/dev/null || true

echo ""
printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
ok "Agentic OS installed to ${TARGET_DISK}"
echo "  Login: ${USERNAME} / password: claude"
echo "  Remove installation media and reboot."
printf "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}\n"
