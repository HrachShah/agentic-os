# Claude OS — Build System
# Builds a standalone bootable ISO using Docker as the build environment.
# No host Linux distro required — just Docker Desktop.
#
# Usage:
#   make iso          Build the bootable ISO (requires Docker)
#   make docker-run   Run Claude OS interactively in Docker
#   make install      Install tools on this machine

SHELL       := /bin/bash
VERSION     := 1.0.0
ARCH        := amd64
ISO_NAME    := claude-os-$(VERSION)-$(ARCH).iso
OUTPUT_DIR  := build/output
BUILDER_IMG := claude-os-builder:$(VERSION)
RUNTIME_IMG := claude-os:$(VERSION)

BOLD  := \033[1m
GREEN := \033[0;32m
CYAN  := \033[0;36m
RESET := \033[0m

.PHONY: all iso docker docker-run install flash test-vm clean help

all: help

# ── ISO (fully standalone, built in Docker from kernel source) ────────────────
iso:
	@echo -e "$(BOLD)Building Claude OS $(VERSION) bootable ISO...$(RESET)"
	@echo -e "$(CYAN)  All build steps run inside Docker — no host Linux needed$(RESET)"
	@echo -e "$(CYAN)  First build downloads Linux 6.6 source and compiles it (~30 min)$(RESET)"
	@echo ""
	@mkdir -p $(OUTPUT_DIR)
	docker build \
		--file build/builder/Dockerfile \
		--target artifacts \
		--output type=local,dest=$(OUTPUT_DIR) \
		.
	@echo ""
	@echo -e "$(GREEN)✓ ISO built: $(OUTPUT_DIR)/$(ISO_NAME)$(RESET)"
	@du -sh "$(OUTPUT_DIR)/$(ISO_NAME)" 2>/dev/null || true

# ── Docker runtime image (for running Claude OS now, without a VM) ────────────
docker:
	@echo -e "$(BOLD)Building Claude OS Docker runtime image...$(RESET)"
	docker build --file docker/Dockerfile --tag $(RUNTIME_IMG) .
	@echo -e "$(GREEN)✓ Image: $(RUNTIME_IMG)$(RESET)"

docker-run: docker
	@echo -e "$(BOLD)Starting Claude OS...$(RESET)"
	docker run -it --rm \
		-e ANTHROPIC_API_KEY=$${ANTHROPIC_API_KEY:-} \
		-v claude-os-workspace:/workspace \
		--hostname claudeos \
		$(RUNTIME_IMG)

docker-compose:
	docker compose -f docker/docker-compose.yml up -d claude-os
	docker compose -f docker/docker-compose.yml exec claude-os bash

# ── Local install (Linux / WSL2 only) ─────────────────────────────────────────
install:
	@bash packages/setup-all.sh

# ── Test in QEMU VM (after building ISO) ──────────────────────────────────────
test-vm:
	@if [[ ! -f "$(OUTPUT_DIR)/$(ISO_NAME)" ]]; then \
		echo "Run 'make iso' first."; exit 1; fi
	qemu-system-x86_64 \
		-cdrom $(OUTPUT_DIR)/$(ISO_NAME) \
		-m 4G \
		-smp 4 \
		-enable-kvm \
		-cpu host \
		-vga virtio \
		-boot d

# ── Flash to USB ──────────────────────────────────────────────────────────────
flash:
	@if [[ -z "$(DEVICE)" ]]; then echo "Usage: make flash DEVICE=/dev/sdX"; exit 1; fi
	@if [[ ! -f "$(OUTPUT_DIR)/$(ISO_NAME)" ]]; then echo "Run 'make iso' first."; exit 1; fi
	sudo dd if=$(OUTPUT_DIR)/$(ISO_NAME) of=$(DEVICE) bs=4M status=progress oflag=sync

# ── Clean ─────────────────────────────────────────────────────────────────────
clean:
	rm -rf $(OUTPUT_DIR)
	docker rmi $(BUILDER_IMG) $(RUNTIME_IMG) 2>/dev/null || true

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo -e "$(BOLD)Claude OS $(VERSION) — Build System$(RESET)"
	@echo ""
	@echo -e "$(CYAN)Targets:$(RESET)"
	@echo "  make iso            Build standalone bootable ISO"
	@echo "                        → Downloads Linux 6.6 source, compiles kernel,"
	@echo "                          builds Alpine-based rootfs, packs into .iso"
	@echo "                        → Needs: Docker Desktop (~30 min first build)"
	@echo ""
	@echo "  make docker         Build Claude OS Docker runtime image"
	@echo "  make docker-run     Run Claude OS interactively in Docker NOW"
	@echo "  make install        Install tools on this Linux/WSL2 machine"
	@echo "  make test-vm        Boot ISO in QEMU (needs QEMU + make iso first)"
	@echo "  make flash DEVICE=  Flash ISO to USB drive"
	@echo "  make clean          Remove build artifacts"
	@echo ""
	@echo -e "$(CYAN)Quick start on Windows (no build, just run):$(RESET)"
	@echo "  ANTHROPIC_API_KEY=sk-ant-... make docker-run"
	@echo ""
	@echo -e "$(CYAN)Build full OS ISO on Windows:$(RESET)"
	@echo "  make iso   (or: .\\build.ps1 -Target iso)"
	@echo ""
