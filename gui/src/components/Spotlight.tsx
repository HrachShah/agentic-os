import { useState, useRef, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDesktopStore, APP_REGISTRY, AppId } from '../store/desktop'

const ALL_APPS = Object.values(APP_REGISTRY)

const COMMANDS = [
  { id: 'hermes', label: 'Hermes AI', icon: '🚀', desc: 'Claude Haiku fast tasks' },
  { id: 'blackbox', label: 'Blackbox', icon: '⬛', desc: 'Claude Sonnet coding' },
  { id: 'skills', label: 'Skills Browser', icon: '⚡', desc: 'Browse & run skills' },
]

export default function Spotlight() {
  const [query, setQuery] = useState('')
  const { openApp, setSpotlight } = useDesktopStore()
  const inputRef = useRef<HTMLInputElement>(null)

  useEffect(() => { inputRef.current?.focus() }, [])

  const q = query.toLowerCase().trim()
  const appResults = ALL_APPS.filter(a =>
    q === '' || a.label.toLowerCase().includes(q) || a.id.includes(q)
  )
  const cmdResults = COMMANDS.filter(c =>
    q === '' || c.label.toLowerCase().includes(q) || c.desc.toLowerCase().includes(q)
  )

  const handleSelect = (type: 'app' | 'cmd', id: string) => {
    if (type === 'app') openApp(id as AppId)
    setSpotlight(false)
  }

  return (
    <motion.div
      className="absolute inset-0 z-[99999] flex items-start justify-center pt-[18vh]"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      onClick={() => setSpotlight(false)}
    >
      {/* Backdrop */}
      <div className="absolute inset-0" style={{ background: 'rgba(0,0,0,0.35)', backdropFilter: 'blur(4px)' }} />

      <motion.div
        className="relative w-[620px] rounded-2xl overflow-hidden"
        initial={{ scale: 0.95, y: -16, opacity: 0 }}
        animate={{ scale: 1, y: 0, opacity: 1 }}
        exit={{ scale: 0.95, y: -8, opacity: 0 }}
        transition={{ type: 'spring', stiffness: 500, damping: 38 }}
        onClick={e => e.stopPropagation()}
        style={{
          background: 'rgba(28,28,40,0.92)',
          backdropFilter: 'blur(48px) saturate(200%)',
          WebkitBackdropFilter: 'blur(48px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.12)',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7)',
        }}
      >
        {/* Input */}
        <div className="flex items-center gap-3 px-5 py-4 border-b border-white/8">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-white/40 flex-shrink-0">
            <circle cx="6.5" cy="6.5" r="5" stroke="currentColor" strokeWidth="1.5"/>
            <path d="M10.5 10.5L14 14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            placeholder="Search apps, commands, files…"
            className="flex-1 bg-transparent text-white/90 text-[17px] outline-none placeholder:text-white/25"
          />
          <kbd className="text-[10px] text-white/25 border border-white/10 rounded px-1.5 py-0.5">ESC</kbd>
        </div>

        {/* Results */}
        {(appResults.length > 0 || cmdResults.length > 0) && (
          <div className="max-h-[360px] overflow-y-auto py-2">
            {appResults.length > 0 && (
              <div>
                <div className="px-4 py-1.5 text-[11px] text-white/30 font-semibold uppercase tracking-wider">
                  Applications
                </div>
                {appResults.map(app => (
                  <button
                    key={app.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 transition-colors text-left group"
                    onClick={() => handleSelect('app', app.id)}
                  >
                    <div
                      className="w-8 h-8 rounded-xl flex items-center justify-center text-lg flex-shrink-0"
                      style={{ background: `${app.color}33` }}
                    >
                      {app.icon}
                    </div>
                    <div>
                      <div className="text-white/90 text-[14px] font-medium">{app.label}</div>
                      <div className="text-white/35 text-[12px]">Claude OS App</div>
                    </div>
                    <kbd className="ml-auto text-[10px] text-white/20 border border-white/10 rounded px-1.5 py-0.5 opacity-0 group-hover:opacity-100">
                      ↵
                    </kbd>
                  </button>
                ))}
              </div>
            )}
            {cmdResults.length > 0 && (
              <div>
                <div className="px-4 py-1.5 text-[11px] text-white/30 font-semibold uppercase tracking-wider mt-1">
                  Commands
                </div>
                {cmdResults.map(cmd => (
                  <button
                    key={cmd.id}
                    className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-white/8 transition-colors text-left group"
                    onClick={() => handleSelect('cmd', cmd.id)}
                  >
                    <div className="w-8 h-8 rounded-xl flex items-center justify-center text-lg bg-white/8 flex-shrink-0">
                      {cmd.icon}
                    </div>
                    <div>
                      <div className="text-white/90 text-[14px] font-medium">{cmd.label}</div>
                      <div className="text-white/35 text-[12px]">{cmd.desc}</div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Hint bar */}
        <div className="flex items-center justify-between px-5 py-2 border-t border-white/6 text-[11px] text-white/20">
          <span>⌘Space to toggle</span>
          <span>↑↓ navigate · ↵ open</span>
        </div>
      </motion.div>
    </motion.div>
  )
}
