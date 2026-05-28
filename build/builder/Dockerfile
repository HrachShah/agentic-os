# Claude OS — Build Container
# This runs on Windows/Mac/Linux via Docker Desktop.
# It compiles everything from source and outputs a standalone bootable ISO.
# Nothing here is Debian-specific — base image is Alpine.

FROM alpine:3.20 AS builder

# Build tools: kernel compilation + ISO creation + squashfs
RUN apk add --no-cache \
    # Kernel build deps
    bash gcc g++ make perl python3 bison flex \
    bc elfutils-dev openssl-dev linux-headers \
    ncurses-dev xz gzip bzip2 cpio \
    # Binutils / cross-compile
    binutils musl-dev \
    # ISO / filesystem tools
    xorriso squashfs-tools grub grub-efi grub-bios \
    mtools dosfstools e2fsprogs syslinux \
    # Misc build utils
    git curl wget patch tar rsync \
    findutils file patchelf

WORKDIR /build

# ── Download Linux kernel source ─────────────────────────────────────────────
ARG KERNEL_VERSION=6.6.30
RUN wget -q "https://cdn.kernel.org/pub/linux/kernel/v6.x/linux-${KERNEL_VERSION}.tar.xz" \
    && tar -xf "linux-${KERNEL_VERSION}.tar.xz" \
    && rm "linux-${KERNEL_VERSION}.tar.xz"

# ── Copy our kernel config ────────────────────────────────────────────────────
COPY kernel/claude-os.config /build/linux-${KERNEL_VERSION}/.config

# ── Build the kernel ──────────────────────────────────────────────────────────
RUN cd /build/linux-${KERNEL_VERSION} \
    && make ARCH=x86_64 olddefconfig \
    && make ARCH=x86_64 -j$(nproc) bzImage modules \
    && make ARCH=x86_64 INSTALL_MOD_PATH=/build/modules-staging modules_install

# ── Download and extract Alpine minirootfs as our userspace ──────────────────
FROM alpine:3.20 AS rootfs-stage

# Install everything Claude OS needs into a clean Alpine base
RUN apk add --no-cache \
    # Core OS
    alpine-base bash shadow sudo \
    # Dev tools
    git curl wget python3 py3-pip \
    nodejs npm \
    # Utilities
    nano vim jq htop tree procps \
    ca-certificates openssl \
    # Network
    networkmanager \
    # Python build deps (for anthropic SDK)
    gcc musl-dev python3-dev libffi-dev openssl-dev

# Install uv
RUN curl -LsSf https://astral.sh/uv/install.sh | sh 2>/dev/null || pip3 install uv --quiet

# Install Bun
RUN curl -fsSL https://bun.sh/install | bash 2>/dev/null; exit 0
RUN ln -sf /root/.bun/bin/bun /usr/local/bin/bun 2>/dev/null; exit 0

# Install anthropic Python SDK
RUN pip3 install anthropic --quiet --break-system-packages 2>/dev/null || \
    pip3 install anthropic --quiet

# Install Claude Code CLI
RUN npm install -g @anthropic-ai/claude-code --quiet 2>/dev/null; exit 0

# ── Overlay Claude OS files ───────────────────────────────────────────────────
COPY rootfs/etc/claude-os-release /etc/claude-os-release
COPY rootfs/etc/motd /etc/motd
COPY rootfs/etc/profile.d/ /etc/profile.d/
COPY rootfs/usr/local/bin/ /usr/local/bin/
COPY rootfs/home/claude/ /root/
COPY tools/hermes/hermes.py /usr/local/share/claude-os/tools/hermes/hermes.py
COPY tools/blackbox/blackbox.py /usr/local/share/claude-os/tools/blackbox/blackbox.py
COPY skills/ /usr/local/share/claude-os/skills/
COPY init/claude-os-init.sh /usr/local/share/claude-os/
COPY init/claude-os.service /etc/init.d/claude-os

RUN cat > /usr/local/bin/hermes <<'EOF'
#!/usr/bin/env sh
exec python3 /usr/local/share/claude-os/tools/hermes/hermes.py "$@"
EOF
RUN cat > /usr/local/bin/blackbox <<'EOF'
#!/usr/bin/env sh
exec python3 /usr/local/share/claude-os/tools/blackbox/blackbox.py "$@"
EOF
RUN chmod +x /usr/local/bin/hermes /usr/local/bin/blackbox \
              /usr/local/bin/skills /usr/local/bin/claude-doctor

# Hostname
RUN echo "claudeos" > /etc/hostname
RUN echo 'source /etc/profile.d/claude-env.sh 2>/dev/null || true' >> /root/.bashrc
RUN echo 'source /etc/profile.d/aliases.sh 2>/dev/null || true' >> /root/.bashrc

# ── Final ISO builder stage ───────────────────────────────────────────────────
FROM builder AS iso-builder

# Copy the built rootfs
COPY --from=rootfs-stage / /build/rootfs/

# Copy kernel artifacts
RUN cp /build/linux-6.6.30/arch/x86/boot/bzImage /build/vmlinuz-claudeos
RUN cp -r /build/modules-staging/lib/modules /build/rootfs/lib/ 2>/dev/null; exit 0

# Generate initramfs from rootfs
RUN mkdir -p /build/iso/boot/grub /build/iso/live
RUN cp /build/vmlinuz-claudeos /build/iso/boot/vmlinuz
RUN (cd /build/rootfs && find . | cpio -H newc -o | gzip -9) > /build/iso/boot/initrd.img

# Squash rootfs for live boot
RUN mksquashfs /build/rootfs /build/iso/live/filesystem.squashfs \
    -comp xz -Xdict-size 100% -noappend 2>/dev/null || \
    mksquashfs /build/rootfs /build/iso/live/filesystem.squashfs -comp gzip -noappend

# Write filesystem size
RUN du -sx --block-size=1 /build/rootfs | cut -f1 > /build/iso/live/filesystem.size

# Copy bootloader config
COPY bootloader/grub.cfg /build/iso/boot/grub/grub.cfg

# Build the ISO with GRUB (EFI + BIOS hybrid)
RUN grub-mkrescue \
    --output=/build/output/claude-os-1.0.0-amd64.iso \
    /build/iso \
    -- -volid "CLAUDEOS" \
    2>/dev/null || \
    xorriso -as mkisofs \
        -iso-level 3 \
        -volid "CLAUDEOS" \
        -full-iso9660-filenames \
        -eltorito-boot boot/grub/i386-pc/eltorito.img \
        -no-emul-boot -boot-load-size 4 -boot-info-table \
        --grub2-boot-info \
        --grub2-mbr /usr/lib/grub/i386-pc/boot_hybrid.img \
        --efi-boot EFI/efi.img \
        -efi-boot-part --efi-boot-image \
        --protective-msdos-label \
        -output /build/output/claude-os-1.0.0-amd64.iso \
        /build/iso

FROM scratch AS artifacts
COPY --from=iso-builder /build/output/claude-os-1.0.0-amd64.iso /
