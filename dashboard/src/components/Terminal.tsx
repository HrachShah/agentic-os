import { useEffect, useRef } from 'react';
import { useStore } from '../store/useStore';
import { X, Minus, Maximize2 } from 'lucide-react';

export function TerminalPanel() {
  const { toggleTerminal } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const termRef = useRef<unknown>(null);

  useEffect(() => {
    let term: unknown = null;
    let fitAddon: unknown = null;

    async function initTerm() {
      const { Terminal } = await import('@xterm/xterm');
      const { FitAddon } = await import('@xterm/addon-fit');
      const { WebLinksAddon } = await import('@xterm/addon-web-links');

      term = new Terminal({
        theme: {
          background: '#080a0f',
          foreground: '#e2e8f0',
          cursor: '#7c3aed',
          cursorAccent: '#080a0f',
          black: '#1e2030',
          red: '#ef4444',
          green: '#10b981',
          yellow: '#f59e0b',
          blue: '#3b82f6',
          magenta: '#a855f7',
          cyan: '#06b6d4',
          white: '#e2e8f0',
          brightBlack: '#3d4562',
          brightRed: '#f87171',
          brightGreen: '#34d399',
          brightYellow: '#fbbf24',
          brightBlue: '#60a5fa',
          brightMagenta: '#c084fc',
          brightCyan: '#22d3ee',
          brightWhite: '#f8fafc',
        },
        fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
        fontSize: 13,
        lineHeight: 1.4,
        cursorBlink: true,
        cursorStyle: 'block',
        scrollback: 5000,
        convertEol: true,
      });

      fitAddon = new FitAddon();
      (term as { loadAddon: (a: unknown) => void }).loadAddon(fitAddon);
      (term as { loadAddon: (a: unknown) => void }).loadAddon(new WebLinksAddon());

      if (containerRef.current) {
        (term as { open: (el: HTMLElement) => void }).open(containerRef.current);
        (fitAddon as { fit: () => void }).fit();
      }

      termRef.current = term;

      // Welcome message
      const t = term as { writeln: (s: string) => void; write: (s: string) => void; onKey: (cb: (arg: { key: string; domEvent: KeyboardEvent }) => void) => void };
      t.writeln('\x1b[38;5;135m   _____ _                 _        ____  _____ \x1b[0m');
      t.writeln('\x1b[38;5;135m  / ____| |               | |      / __ \\/ ____|\x1b[0m');
      t.writeln('\x1b[38;5;135m | |    | | __ _ _   _  __| | ___ | |  | (___  \x1b[0m');
      t.writeln('\x1b[38;5;135m | |    | |/ _` | | | |/ _` |/ _ \\| |  | |\\___ \\ \x1b[0m');
      t.writeln('\x1b[38;5;135m | |____| | (_| | |_| | (_| |  __/| |__| |____) |\x1b[0m');
      t.writeln('\x1b[38;5;135m  \\_____|_|\\__,_|\\__,_|\\__,_|\\___| \\____/|_____/ \x1b[0m');
      t.writeln('');
      t.writeln('\x1b[90m  Claude OS Terminal — ready\x1b[0m');
      t.writeln('\x1b[90m  Type "claude" to start a session\x1b[0m');
      t.writeln('');
      t.write('\x1b[38;5;135m❯\x1b[0m ');

      // Simple local echo (real PTY needs backend support)
      let lineBuffer = '';
      t.onKey(({ key, domEvent }) => {
        const code = domEvent.keyCode;
        if (code === 13) {
          t.writeln('');
          if (lineBuffer.trim()) {
            t.writeln(`\x1b[90m[Note: Connect backend PTY for real shell execution]\x1b[0m`);
          }
          lineBuffer = '';
          t.write('\x1b[38;5;135m❯\x1b[0m ');
        } else if (code === 8) {
          if (lineBuffer.length > 0) {
            lineBuffer = lineBuffer.slice(0, -1);
            t.write('\b \b');
          }
        } else if (!domEvent.ctrlKey && !domEvent.altKey) {
          lineBuffer += key;
          t.write(key);
        }
      });
    }

    initTerm();

    const handleResize = () => {
      if (fitAddon) (fitAddon as { fit: () => void }).fit();
    };
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
      if (term) (term as { dispose: () => void }).dispose();
    };
  }, []);

  return (
    <div className="h-64 bg-os-bg border-t border-os-border flex flex-col shrink-0">
      {/* Terminal title bar */}
      <div className="flex items-center justify-between px-3 py-1.5 bg-os-surface border-b border-os-border shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/70 hover:bg-red-500 cursor-pointer transition-colors" onClick={toggleTerminal} />
            <div className="w-3 h-3 rounded-full bg-yellow-500/70 hover:bg-yellow-500 cursor-pointer transition-colors" />
            <div className="w-3 h-3 rounded-full bg-green-500/70 hover:bg-green-500 cursor-pointer transition-colors" />
          </div>
          <span className="text-xs text-os-text-faint font-mono">terminal</span>
        </div>
        <button onClick={toggleTerminal} className="text-os-text-faint hover:text-os-text transition-colors">
          <X size={13} />
        </button>
      </div>

      {/* Terminal container */}
      <div ref={containerRef} className="flex-1 overflow-hidden" />
    </div>
  );
}
