# Claude OS — Build System
# Usage: make <target>

SHELL := /bin/bash
.PHONY: all kernel iso docker install clean help

VERSION     := 1.0.0
ARCH        := amd64
BUILD_DIR   := build
ISO_OUTPUT  := $(BUILD_DIR)/claude-os-$(VERSION)-$(ARCH).iso
DOCKER_TAG  := claude-os:$(VERSION)

# ── Colors ────────────────────────────────────────────────────────────────────
BOLD  := \033[1m
GREEN := \033[0;32m
CYAN  := \033[0;36m
RESET := \033[0m

# ── Default target ────────────────────────────────────────────────────────────
all: help

# ── Kernel ────────────────────────────────────────────────────────────────────
kernel:
	@echo -e "$(BOLD)Building Claude OS kernel...$(RESET)"
	@mkdir -p $(BUILD_DIR)
	@bash kernel/build-kernel.sh
	@echo -e "$(GREEN)✓ Kernel built$(RESET)"

# ── ISO ───────────────────────────────────────────────────────────────────────
iso: kernel
	@echo -e "$(BOLD)Building Claude OS ISO...$(RESET)"
	@bash iso/build-iso.sh $(ISO_OUTPUT)
	@echo -e "$(GREEN)✓ ISO: $(ISO_OUTPUT)$(RESET)"

iso-only:
	@echo -e "$(BOLD)Building ISO (using host kernel)...$(RESET)"
	@bash iso/build-iso.sh $(ISO_OUTPUT)

# ── Docker ────────────────────────────────────────────────────────────────────
docker:
	@echo -e "$(BOLD)Building Claude OS Docker image...$(RESET)"
	docker build -t $(DOCKER_TAG) -f docker/Dockerfile .
	@echo -e "$(GREEN)✓ Docker image: $(DOCKER_TAG)$(RESET)"

docker-run: docker
	@echo -e "$(BOLD)Starting Claude OS container...$(RESET)"
	docker run -it --rm \
		-e ANTHROPIC_API_KEY=$${ANTHROPIC_API_KEY} \
		-v claude-os-workspace:/workspace \
		--hostname claudeos \
		$(DOCKER_TAG)

docker-compose-up: docker
	docker compose -f docker/docker-compose.yml up -d claude-os
	docker compose -f docker/docker-compose.yml exec claude-os bash

# ── Local install (Linux/WSL) ─────────────────────────────────────────────────
install:
	@echo -e "$(BOLD)Installing Claude OS tools locally...$(RESET)"
	@bash packages/setup-all.sh
	@echo -e "$(GREEN)✓ Installation complete$(RESET)"

# ── Verify install ────────────────────────────────────────────────────────────
check:
	@claude-doctor

# ── Lint tools ────────────────────────────────────────────────────────────────
lint:
	@echo "Linting Python tools..."
	@command -v ruff >/dev/null && ruff check tools/ || true
	@echo "Linting shell scripts..."
	@command -v shellcheck >/dev/null && \
		shellcheck rootfs/usr/local/bin/skills \
		           rootfs/usr/local/bin/claude-doctor \
		           packages/setup-all.sh \
		           iso/build-iso.sh \
		           installer/install.sh || true

# ── Flash to USB ──────────────────────────────────────────────────────────────
flash: iso
	@if [[ -z "$(DEVICE)" ]]; then \
		echo "Usage: make flash DEVICE=/dev/sdX"; \
		exit 1; \
	fi
	@echo -e "$(BOLD)Flashing $(ISO_OUTPUT) to $(DEVICE)...$(RESET)"
	sudo dd if=$(ISO_OUTPUT) of=$(DEVICE) bs=4M status=progress oflag=sync
	@echo -e "$(GREEN)✓ Flashed$(RESET)"

# ── QEMU test ─────────────────────────────────────────────────────────────────
test-vm: iso
	@echo -e "$(BOLD)Starting Claude OS in QEMU...$(RESET)"
	qemu-system-x86_64 \
		-cdrom $(ISO_OUTPUT) \
		-m 4G \
		-enable-kvm \
		-cpu host \
		-smp 4 \
		-vga virtio \
		-device virtio-net-pci \
		-boot d

# ── Clean ─────────────────────────────────────────────────────────────────────
clean:
	@echo "Cleaning build artifacts..."
	rm -rf $(BUILD_DIR)/iso-work
	rm -f $(ISO_OUTPUT)
	@echo "Build artifacts cleaned (kernel source preserved)"

clean-all: clean
	rm -rf $(BUILD_DIR)

# ── Help ──────────────────────────────────────────────────────────────────────
help:
	@echo ""
	@echo -e "$(BOLD)Claude OS Build System$(RESET) — v$(VERSION)"
	@echo ""
	@echo -e "$(CYAN)Targets:$(RESET)"
	@echo "  make kernel         Build the Linux kernel with claude-os.config"
	@echo "  make iso            Build kernel + bootable ISO"
	@echo "  make iso-only       Build ISO using host kernel (faster)"
	@echo "  make docker         Build Claude OS Docker image"
	@echo "  make docker-run     Build and run interactive Docker session"
	@echo "  make install        Install Claude OS tools on current system"
	@echo "  make check          Run claude-doctor health check"
	@echo "  make lint           Lint all scripts and tools"
	@echo "  make test-vm        Boot ISO in QEMU VM"
	@echo "  make flash DEVICE=/dev/sdX   Flash ISO to USB"
	@echo "  make clean          Clean build artifacts"
	@echo ""
	@echo -e "$(CYAN)Quick start (Docker):$(RESET)"
	@echo "  ANTHROPIC_API_KEY=sk-ant-... make docker-run"
	@echo ""
	@echo -e "$(CYAN)Quick start (local install):$(RESET)"
	@echo "  make install && source ~/.bashrc"
	@echo ""
