#!/usr/bin/env python3
"""Download all LFS 12.4 source packages using working mirrors."""

import os
import subprocess
import sys
import time

SOURCES_DIR = "/mnt/lfs/sources"

# Package list from LFS 12.4 wget-list with ftp.gnu.org replaced by mirrors.kernel.org
PACKAGES = [
    # Already downloaded (will be skipped)
    "https://download.savannah.gnu.org/releases/acl/acl-2.3.2.tar.xz",
    "https://download.savannah.gnu.org/releases/attr/attr-2.5.2.tar.gz",
    "https://mirrors.kernel.org/gnu/autoconf/autoconf-2.72.tar.xz",
    "https://mirrors.kernel.org/gnu/automake/automake-1.18.1.tar.xz",
    "https://mirrors.kernel.org/gnu/bash/bash-5.3.tar.gz",
    "https://github.com/gavinhoward/bc/releases/download/7.0.3/bc-7.0.3.tar.xz",
    "https://sourceware.org/pub/binutils/releases/binutils-2.45.tar.xz",
    "https://mirrors.kernel.org/gnu/bison/bison-3.8.2.tar.xz",
    "https://www.sourceware.org/pub/bzip2/bzip2-1.0.8.tar.gz",
    "https://mirrors.kernel.org/gnu/coreutils/coreutils-9.7.tar.xz",
    "https://dbus.freedesktop.org/releases/dbus/dbus-1.16.2.tar.xz",
    "https://mirrors.kernel.org/gnu/dejagnu/dejagnu-1.6.3.tar.gz",
    "https://mirrors.kernel.org/gnu/diffutils/diffutils-3.12.tar.xz",
    "https://downloads.sourceforge.net/project/e2fsprogs/e2fsprogs/v1.47.3/e2fsprogs-1.47.3.tar.gz",
    "https://sourceware.org/ftp/elfutils/0.193/elfutils-0.193.tar.bz2",
    "https://github.com/libexpat/libexpat/releases/download/R_2_7_1/expat-2.7.1.tar.xz",
    "https://downloads.sourceforge.net/project/expect/expect5.45.4.tar.gz",
    "https://astron.com/pub/file/file-5.46.tar.gz",
    "https://mirrors.kernel.org/gnu/findutils/findutils-4.10.0.tar.xz",
    "https://github.com/westes/flex/releases/download/v2.6.4/flex-2.6.4.tar.gz",
    "https://pypi.org/packages/source/f/flit-core/flit_core-3.12.0.tar.gz",
    "https://mirrors.kernel.org/gnu/gawk/gawk-5.3.2.tar.xz",
    # New packages to download
    "https://mirrors.kernel.org/gnu/gcc/gcc-15.2.0/gcc-15.2.0.tar.xz",
    "https://mirrors.kernel.org/gnu/gdbm/gdbm-1.26.tar.gz",
    "https://mirrors.kernel.org/gnu/gettext/gettext-0.26.tar.xz",
    "https://mirrors.kernel.org/gnu/glibc/glibc-2.42.tar.xz",
    "https://mirrors.kernel.org/gnu/gmp/gmp-6.3.0.tar.xz",
    "https://mirrors.kernel.org/gnu/gperf/gperf-3.3.tar.gz",
    "https://mirrors.kernel.org/gnu/grep/grep-3.12.tar.xz",
    "https://mirrors.kernel.org/gnu/groff/groff-1.23.0.tar.gz",
    "https://mirrors.kernel.org/gnu/grub/grub-2.12.tar.xz",
    "https://mirrors.kernel.org/gnu/gzip/gzip-1.14.tar.xz",
    "https://github.com/Mic92/iana-etc/releases/download/20250807/iana-etc-20250807.tar.gz",
    "https://mirrors.kernel.org/gnu/inetutils/inetutils-2.6.tar.xz",
    "https://launchpad.net/intltool/trunk/0.51.0/+download/intltool-0.51.0.tar.gz",
    "https://www.kernel.org/pub/linux/utils/net/iproute2/iproute2-6.16.0.tar.xz",
    "https://pypi.org/packages/source/J/Jinja2/jinja2-3.1.6.tar.gz",
    "https://www.kernel.org/pub/linux/utils/kbd/kbd-2.8.0.tar.xz",
    "https://www.kernel.org/pub/linux/utils/kernel/kmod/kmod-34.2.tar.xz",
    "https://www.greenwoodsoftware.com/less/less-679.tar.gz",
    "https://www.linuxfromscratch.org/lfs/downloads/12.4/lfs-bootscripts-20250827.tar.xz",
    "https://www.kernel.org/pub/linux/libs/security/linux-privs/libcap2/libcap-2.76.tar.xz",
    "https://github.com/libffi/libffi/releases/download/v3.5.2/libffi-3.5.2.tar.gz",
    "https://download.savannah.gnu.org/releases/libpipeline/libpipeline-1.5.8.tar.gz",
    "https://mirrors.kernel.org/gnu/libtool/libtool-2.5.4.tar.xz",
    "https://github.com/besser82/libxcrypt/releases/download/v4.4.38/libxcrypt-4.4.38.tar.xz",
    "https://www.kernel.org/pub/linux/kernel/v6.x/linux-6.16.1.tar.xz",
    "https://github.com/lz4/lz4/releases/download/v1.10.0/lz4-1.10.0.tar.gz",
    "https://mirrors.kernel.org/gnu/m4/m4-1.4.20.tar.xz",
    "https://mirrors.kernel.org/gnu/make/make-4.4.1.tar.gz",
    "https://download.savannah.gnu.org/releases/man-db/man-db-2.13.1.tar.xz",
    "https://www.kernel.org/pub/linux/docs/man-pages/man-pages-6.15.tar.xz",
    "https://pypi.org/packages/source/M/MarkupSafe/markupsafe-3.0.2.tar.gz",
    "https://github.com/mesonbuild/meson/releases/download/1.8.3/meson-1.8.3.tar.gz",
    "https://mirrors.kernel.org/gnu/mpc/mpc-1.3.1.tar.gz",
    "https://mirrors.kernel.org/gnu/mpfr/mpfr-4.2.2.tar.xz",
    "https://invisible-mirror.net/archives/ncurses/current/ncurses-6.5-20250809.tgz",
    "https://github.com/ninja-build/ninja/archive/v1.13.1/ninja-1.13.1.tar.gz",
    "https://github.com/openssl/openssl/releases/download/openssl-3.5.2/openssl-3.5.2.tar.gz",
    "https://files.pythonhosted.org/packages/source/p/packaging/packaging-25.0.tar.gz",
    "https://mirrors.kernel.org/gnu/patch/patch-2.8.tar.xz",
    "https://www.cpan.org/src/5.0/perl-5.42.0.tar.xz",
    "https://distfiles.ariadne.space/pkgconf/pkgconf-2.5.1.tar.xz",
    "https://sourceforge.net/projects/procps-ng/files/Production/procps-ng-4.0.5.tar.xz",
    "https://sourceforge.net/projects/psmisc/files/psmisc/psmisc-23.7.tar.xz",
    "https://www.python.org/ftp/python/3.13.7/Python-3.13.7.tar.xz",
    "https://www.python.org/ftp/python/doc/3.13.7/python-3.13.7-docs-html.tar.bz2",
    "https://mirrors.kernel.org/gnu/readline/readline-8.3.tar.gz",
    "https://mirrors.kernel.org/gnu/sed/sed-4.9.tar.xz",
    "https://pypi.org/packages/source/s/setuptools/setuptools-80.9.0.tar.gz",
    "https://github.com/shadow-maint/shadow/releases/download/4.18.0/shadow-4.18.0.tar.xz",
    "https://github.com/troglobit/sysklogd/releases/download/v2.7.2/sysklogd-2.7.2.tar.gz",
    "https://github.com/systemd/systemd/archive/v257.8/systemd-257.8.tar.gz",
    "https://anduin.linuxfromscratch.org/LFS/systemd-man-pages-257.8.tar.xz",
    "https://github.com/slicer69/sysvinit/releases/download/3.14/sysvinit-3.14.tar.xz",
    "https://mirrors.kernel.org/gnu/tar/tar-1.35.tar.xz",
    "https://downloads.sourceforge.net/tcl/tcl8.6.16-src.tar.gz",
    "https://downloads.sourceforge.net/tcl/tcl8.6.16-html.tar.gz",
    "https://mirrors.kernel.org/gnu/texinfo/texinfo-7.2.tar.xz",
    "https://www.iana.org/time-zones/releases/tzdata2025b.tar.gz",
    "https://anduin.linuxfromscratch.org/LFS/udev-lfs-20230818.tar.xz",
    "https://www.kernel.org/pub/linux/utils/util-linux/v2.41/util-linux-2.41.1.tar.xz",
    "https://github.com/vim/vim/archive/v9.1.1629/vim-9.1.1629.tar.gz",
    "https://pypi.org/packages/source/w/wheel/wheel-0.46.1.tar.gz",
    "https://cpan.metacpan.org/authors/id/T/TO/TODDR/XML-Parser-2.47.tar.gz",
    "https://github.com/tukaani-project/xz/releases/download/v5.8.1/xz-5.8.1.tar.xz",
    "https://zlib.net/fossils/zlib-1.3.1.tar.gz",
    "https://github.com/facebook/zstd/releases/download/v1.5.7/zstd-1.5.7.tar.gz",
    # Patches
    "https://www.linuxfromscratch.org/patches/lfs/12.4/bzip2-1.0.8-install_docs-1.patch",
    "https://www.linuxfromscratch.org/patches/lfs/12.4/coreutils-9.7-upstream_fix-1.patch",
    "https://www.linuxfromscratch.org/patches/lfs/12.4/coreutils-9.7-i18n-1.patch",
    "https://www.linuxfromscratch.org/patches/lfs/12.4/expect-5.45.4-gcc15-1.patch",
    "https://www.linuxfromscratch.org/patches/lfs/12.4/glibc-2.42-fhs-1.patch",
    "https://www.linuxfromscratch.org/patches/lfs/12.4/kbd-2.8.0-backspace-1.patch",
    "https://www.linuxfromscratch.org/patches/lfs/12.4/sysvinit-3.14-consolidated-1.patch",
]

def download_file(url):
    filename = os.path.basename(url.split("?")[0])
    filepath = os.path.join(SOURCES_DIR, filename)
    
    if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
        print(f"  SKIP: {filename} (exists, {os.path.getsize(filepath)} bytes)")
        return True
    
    print(f"  GET:  {filename}")
    result = subprocess.run(
        ["wget", "-q", "--show-progress", "-c", url],
        cwd=SOURCES_DIR,
        timeout=180,
        capture_output=True,
        text=True
    )
    
    if result.returncode != 0:
        print(f"  FAIL: {filename} (exit {result.returncode})")
        print(f"       {result.stderr[:200] if result.stderr else 'no stderr'}")
        return False
    
    size = os.path.getsize(filepath) if os.path.exists(filepath) else 0
    print(f"  OK:   {filename} ({size} bytes)")
    return True

def main():
    os.makedirs(SOURCES_DIR, exist_ok=True)
    
    total = len(PACKAGES)
    success = 0
    failed = 0
    skipped = 0
    
    print(f"Downloading {total} packages to {SOURCES_DIR}")
    print("=" * 60)
    
    for i, url in enumerate(PACKAGES, 1):
        filename = os.path.basename(url.split("?")[0])
        filepath = os.path.join(SOURCES_DIR, filename)
        
        if os.path.exists(filepath) and os.path.getsize(filepath) > 1000:
            skipped += 1
            continue
        
        print(f"[{i}/{total}] ", end="")
        ok = download_file(url)
        if ok:
            success += 1
        else:
            failed += 1
            print(f"  Will retry {filename} later...")
    
    print()
    print("=" * 60)
    print(f"Results: {success} downloaded, {skipped} skipped (already had), {failed} failed")
    print(f"Total on disk: {len(os.listdir(SOURCES_DIR))} files")
    
    # Retry failed
    if failed > 0:
        print(f"\nRetrying {failed} failed downloads...")
        # Re-check which are still missing
        for url in PACKAGES:
            filename = os.path.basename(url.split("?")[0])
            filepath = os.path.join(SOURCES_DIR, filename)
            if not os.path.exists(filepath) or os.path.getsize(filepath) < 1000:
                print(f"  RETRY: {filename}")
                subprocess.run(["wget", "-q", "--show-progress", url], cwd=SOURCES_DIR, timeout=180)
    
    # Final count
    print(f"\nFinal count: {len(os.listdir(SOURCES_DIR))} files in {SOURCES_DIR}")

if __name__ == "__main__":
    main()
