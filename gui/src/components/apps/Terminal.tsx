import { useEffect, useRef, useState } from 'react'

interface Props { winId: string }

const MOTD = `\x1b[35m   ______\x1b[0m
\x1b[35m  / ____/\x1b[0m\x1b[1m\x1b[37m  Agentic OS\x1b[0m  \x1b[2mv1.0\x1b[0m
\x1b[35m / /   \x1b[0m   Type \x1b[33mhermes "task"\x1b[0m  for AI assistance
\x1b[35m/ /___  \x1b[0m  Type \x1b[33mblackbox\x1b[0m      for coding AI
\x1b[35m\\____/  \x1b[0m  Type \x1b[33mskills list\x1b[0m   for skill library
\r\n`

export default function Terminal({ winId }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const termRef = useRef<any>(null)
  const fitRef = useRef<any>(null)
  const wsRef = useRef<WebSocket | null>(null)
  const [connected, setConnected] = useState(false)
  const [fallback, setFallback] = useState(false)

  // Fallback simple terminal state
  const [lines, setLines] = useState<string[]>([])
  const [input, setInput] = useState('')
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    let mounted = true

    const tryXterm = async () => {
      try {
        const { Terminal: XTerm } = await import('@xterm/xterm')
        const { FitAddon } = await import('@xterm/addon-fit')
        await import('@xterm/xterm/css/xterm.css')

        if (!mounted || !containerRef.current) return

        const term = new XTerm({
          theme: {
            background: 'transparent',
            foreground: '#e0e0e8',
            cursor: '#6c5ef2',
            cursorAccent: '#0d0d14',
            selectionBackground: 'rgba(108,94,242,0.3)',
            black: '#1a1a28',
            red: '#ff5f57',
            green: '#28c840',
            yellow: '#febc2e',
            blue: '#6c5ef2',
            magenta: '#bf5af2',
            cyan: '#32ade6',
            white: '#e0e0e8',
            brightBlack: '#3a3a50',
            brightRed: '#ff7b72',
            brightGreen: '#3fb950',
            brightYellow: '#ffd700',
            brightBlue: '#8b9eff',
            brightMagenta: '#d2a8ff',
            brightCyan: '#76e3ea',
            brightWhite: '#ffffff',
          },
          fontFamily: '"JetBrains Mono", "SF Mono", "Fira Code", monospace',
          fontSize: 13,
          lineHeight: 1.45,
          cursorBlink: true,
          cursorStyle: 'block',
          allowProposedApi: true,
        })

        const fit = new FitAddon()
        term.loadAddon(fit)
        term.open(containerRef.current)
        fit.fit()
        termRef.current = term
        fitRef.current = fit

        term.write(MOTD)
        term.write('\x1b[32mclaude\x1b[0m@\x1b[35magenticos\x1b[0m:\x1b[34m~\x1b[0m$ ')

        // Try WebSocket
        try {
          const ws = new WebSocket('ws://localhost:4000')
          ws.onopen = () => { setConnected(true); wsRef.current = ws }
          ws.onmessage = (e) => term.write(e.data)
          ws.onclose = () => setConnected(false)
          ws.onerror = (err) => {
            // No backend — use simple echo mode
            console.warn('[terminal] WebSocket unavailable, falling back to local echo:', err)
            term.onData((data) => {
              const code = data.charCodeAt(0)
              if (code === 13) {
                term.write('\r\n\x1b[32mclaude\x1b[0m@\x1b[35magenticos\x1b[0m:\x1b[34m~\x1b[0m$ ')
              } else if (code === 127) {
                term.write('\b \b')
              } else {
                term.write(data)
              }
            })
          }
          // Only forward to the socket while it's actually open; the
          // previous implementation forwarded on every keystroke and
          // relied on the ws.readyState guard to no-op when the socket
          // was already CLOSING / CLOSED, which still allocated a
          // closure for every keystroke and dispatched the no-op into
          // the websocket loop until the socket finished tearing down.
          // The early-return version drops the call entirely once the
          // socket is no longer OPEN.
          term.onData((data) => {
            const sock = wsRef.current
            if (sock && sock.readyState === WebSocket.OPEN) sock.send(data)
          })
        } catch (err) {
          // No WS support at all (e.g. running inside a sandboxed iframe
          // that blocks the WebSocket constructor). Log so the developer
          // can see why the terminal fell back to local echo.
          console.warn('[terminal] WebSocket constructor threw, using local echo:', err)
        }

        const ro = new ResizeObserver(() => fit.fit())
        ro.observe(containerRef.current)
        return () => ro.disconnect()
      } catch {
        if (mounted) setFallback(true)
      }
    }

    tryXterm()
    return () => { mounted = false; termRef.current?.dispose() }
  }, [])

  // Fallback plain terminal
  if (fallback) {
    const handleKey = (e: React.KeyboardEvent) => {
      if (e.key === 'Enter') {
        const cmd = input.trim()
        const out = cmd === '' ? '' : cmd === 'clear' ? null :
          cmd.startsWith('hermes') ? '[hermes] Backend not connected — run `hermes` in a real terminal' :
          cmd.startsWith('blackbox') ? '[blackbox] Backend not connected' :
          cmd.startsWith('skills') ? 'skills: list | search | run | install' :
          `${cmd}: command not found (GUI mode — backend offline)`
        if (out === null) { setLines([]); } else {
          setLines(l => [...l, `$ ${cmd}`, ...(out ? [out] : [])])
        }
        setInput('')
      }
    }

    return (
      <div
        className="h-full flex flex-col font-mono text-[13px] bg-transparent text-green-400 p-3 overflow-hidden cursor-text"
        onClick={() => inputRef.current?.focus()}
      >
        <div className="text-purple-400 mb-2 text-[11px] whitespace-pre">{`  Agentic OS Terminal\n  hermes | blackbox | skills`}</div>
        <div className="flex-1 overflow-y-auto space-y-0.5">
          {lines.map((l, i) => (
            <div key={i} className={l.startsWith('$') ? 'text-white/70' : 'text-green-300/80'}>{l}</div>
          ))}
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-green-400">claude@agenticos:~$</span>
          <input
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKey}
            className="flex-1 bg-transparent outline-none text-white caret-purple-400"
            autoFocus
          />
        </div>
      </div>
    )
  }

  return (
    <div className="relative h-full">
      <div ref={containerRef} className="h-full" style={{ padding: '8px 4px 4px 8px' }} />
      {!connected && (
        <div className="absolute top-2 right-2 text-[10px] text-white/20 bg-black/30 px-2 py-0.5 rounded">
          offline
        </div>
      )}
    </div>
  )
}
