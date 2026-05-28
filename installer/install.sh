#!/usr/bin/env bash
# Claude OS Disk Installer
# Installs Claude OS from live environment to a physical/virtual disk
# Run from the Claude OS live session as root

set -euo pipefail

RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'
BOLD='\033[1m'; CYAN='\033[0;36m'; RESET='\033[0m'

log()  { echo -e "${BOLD}[installer]${RESET} $*"; }
ok()   { echo -e "${GREEN}✓${RESET} $*"; }
err()  { echo -e "${RED}✗${RESET} $*" >&2; }
warn() { echo -e "${YELLOW}⚠${RESET} $*"; }

TARGET_DISK="${1:-}"
HOSTNAME="${2:-claudeos}"
USERNAME="${3:-claude}"

banner() {
cat <<'EOF'

  Claude OS Installer
  ════════════════════════════════════════════════

EOF
}

check_root() {
    if [[ $EUID -ne 0 ]]; then
        err "This installer must be run as root."
        echo "  sudo $0 [disk] [hostname] [username]"
        exit 1
    fi
}

select_disk() {
    if [[ -z "$TARGET_DISK" ]]; then
        echo ""
        echo "${BOLD}Available disks:${RESET}"
        lsblk -d -o NAME,SIZE,MODEL --noheadings | grep -v "loop\|sr" | \
            while read -r name size model; do
                echo "  /dev/${name}  (${size})  ${model}"
            done
        echo ""
        read -rp "Enter target disk (e.g., sda): " disk_input
        TARGET_DISK="/dev/${disk_input}"
    fi

    if [[ ! -b "$TARGET_DISK" ]]; then
        err "Not a valid block device: $TARGET_DISK"
        exit 1
    fi
}

confirm_install() {
    echo ""
    warn "WARNING: This will ERASE ALL DATA on ${TARGET_DISK}"
    echo ""
    echo "  Target disk: ${TARGET_DISK}"
    echo "  Hostname:    ${HOSTNAME}"
    echo "  Username:    ${USERNAME}"
    echo ""
    read -rp "Type 'yes' to continue: " confirm
    if [[ "$confirm" != "yes" ]]; then
        echo "Installation cancelled."
        exit 0
    fi
}

partition_disk() {
    log "Partitioning ${TARGET_DISK}..."
    # GPT partition table
    # 1: EFI (512MB)
    # 2: root (remaining)
    parted -s "${TARGET_DISK}" \
        mklabel gpt \
        mkpart ESP fat32 1MiB 513MiB \
        set 1 esp on \
        mkpart primary ext4 513MiB 100%
    partprobe "${TARGET_DISK}"
    sleep 2

    # Determine partition names (handle nvme0n1p1 vs sda1)
    if [[ "$TARGET_DISK" =~ nvme|mmcblk ]]; then
        EFI_PART="${TARGET_DISK}p1"
        ROOT_PART="${TARGET_DISK}p2"
    else
        EFI_PART="${TARGET_DISK}1"
        ROOT_PART="${TARGET_DISK}2"
    fi

    log "Formatting partitions..."
    mkfs.fat -F32 -n EFI "${EFI_PART}"
    mkfs.ext4 -L "CLAUDEOS" -q "${ROOT_PART}"
    ok "Disk partitioned and formatted"
}

mount_target() {
    log "Mounting target..."
    mkdir -p /mnt/claudeos
    mount "${ROOT_PART}" /mnt/claudeos
    mkdir -p /mnt/claudeos/boot/efi
    mount "${EFI_PART}" /mnt/claudeos/boot/efi
    ok "Target mounted at /mnt/claudeos"
}

copy_system() {
    log "Copying system files (this takes a few minutes)..."
    # If running from live, unsquash the live filesystem
    if [[ -f /run/live/medium/live/filesystem.squashfs ]]; then
        unsquashfs -d /mnt/claudeos/ /run/live/medium/live/filesystem.squashfs
    else
        rsync -aAX --exclude={"/dev/*","/proc/*","/sys/*","/tmp/*","/run/*","/mnt/*","/media/*"} \
            / /mnt/claudeos/
    fi
    ok "System copied"
}

install_bootloader() {
    log "Installing GRUB bootloader..."
    mount --bind /dev  /mnt/claudeos/dev
    mount --bind /proc /mnt/claudeos/proc
    mount --bind /sys  /mnt/claudeos/sys

    # Generate fstab
    ROOT_UUID=$(blkid -s UUID -o value "${ROOT_PART}")
    EFI_UUID=$(blkid -s UUID -o value "${EFI_PART}")
    cat > /mnt/claudeos/etc/fstab <<FSTAB
# Claude OS /etc/fstab
UUID=${ROOT_UUID}  /          ext4  defaults,noatime  0 1
UUID=${EFI_UUID}   /boot/efi  vfat  defaults          0 2
tmpfs              /tmp       tmpfs defaults           0 0
FSTAB

    # Install GRUB
    chroot /mnt/claudeos grub-install \
        --target=x86_64-efi \
        --efi-directory=/boot/efi \
        --bootloader-id=ClaudeOS \
        --recheck 2>/dev/null || \
    chroot /mnt/claudeos grub-install \
        --target=i386-pc \
        "${TARGET_DISK}" 2>/dev/null || true

    # GRUB config
    cp "$(dirname "$0")/../bootloader/grub.cfg" /mnt/claudeos/boot/grub/grub.cfg
    chroot /mnt/claudeos update-grub 2>/dev/null || true

    # Cleanup bind mounts
    umount /mnt/claudeos/{dev,proc,sys} 2>/dev/null || true
    ok "Bootloader installed"
}

configure_system() {
    log "Configuring installed system..."

    # Hostname
    echo "$HOSTNAME" > /mnt/claudeos/etc/hostname

    # hosts
    cat > /mnt/claudeos/etc/hosts <<HOSTS
127.0.0.1   localhost
127.0.1.1   ${HOSTNAME}
::1         localhost ip6-localhost ip6-loopback
HOSTS

    # Create user if needed
    if ! grep -q "^${USERNAME}:" /mnt/claudeos/etc/passwd; then
        chroot /mnt/claudeos useradd -m -s /bin/bash -G sudo,audio,video "${USERNAME}"
        echo "${USERNAME}:claude" | chroot /mnt/claudeos chpasswd
    fi

    ok "System configured: hostname=${HOSTNAME}, user=${USERNAME}"
}

finalize() {
    log "Finalizing..."
    sync
    umount /mnt/claudeos/boot/efi 2>/dev/null || true
    umount /mnt/claudeos 2>/dev/null || true
    ok "Unmounted cleanly"

    echo ""
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
    echo "  ${GREEN}Claude OS installed successfully!${RESET}"
    echo ""
    echo "  Disk:     ${TARGET_DISK}"
    echo "  User:     ${USERNAME} / password: claude"
    echo "  Hostname: ${HOSTNAME}"
    echo ""
    echo "  Remove the installation media and reboot."
    echo "  First boot will complete setup automatically."
    echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
}

# ── Main ──────────────────────────────────────────────────────────────────────
banner
check_root
select_disk
confirm_install
partition_disk
mount_target
copy_system
install_bootloader
configure_system
finalize
