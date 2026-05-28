import { useRef, useCallback, useEffect } from 'react'
import { motion } from 'framer-motion'
import { useDesktopStore, WindowState } from '../store/desktop'
import Terminal from './apps/Terminal'
import ClaudeChat from './apps/ClaudeChat'
import SkillsBrowser from './apps/SkillsBrowser'
import AITools from './apps/AITools'
import Settings from './apps/Settings'

const APP_CONTENT: Record<string, React.FC<{ winId: string }>> = {
  terminal: Terminal,
  'claude-chat': ClaudeChat,
  skills: SkillsBrowser,
  'ai-tools': AITools,
  settings: Settings,
  finder: () => (
    <div className="flex items-center justify-center h-full text-white/30 text-sm">
      Files — coming soon
    </div>
  ),
}

const MENUBAR_H = 32
const MIN_W = 320
const MIN_H = 200

interface Props { win: WindowState }

export default function Window({ win }: Props) {
  const { focusWindow, closeWindow, minimizeWindow, maximizeWindow, updateWindowBounds, activeWindowId } = useDesktopStore()
  const dragOrigin = useRef<{ mx: number; my: number; wx: number; wy: number } | null>(null)
  const resizeOrigin = useRef<{ mx: number; my: number; ww: number; wh: number } | null>(null)
  const isActive = activeWindowId === win.id

  const Content = APP_CONTENT[win.appId]

  const onTitleMouseDown = useCallback((e: React.MouseEvent) => {
    if (win.isMaximized) return
    focusWindow(win.id)
    dragOrigin.current = { mx: e.clientX, my: e.clientY, wx: win.x, wy: win.y }
    e.preventDefault()
  }, [win, focusWindow])

  const onResizeMouseDown = useCallback((e: React.MouseEvent) => {
    e.stopPropagation()
    resizeOrigin.current = { mx: e.clientX, my: e.clientY, ww: win.w, wh: win.h }
    e.preventDefault()
  }, [win])

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (dragOrigin.current) {
        const dx = e.clientX - dragOrigin.current.mx
        const dy = e.clientY - dragOrigin.current.my
        const nx = dragOrigin.current.wx + dx
        const ny = Math.max(MENUBAR_H, dragOrigin.current.wy + dy)
        updateWindowBounds(win.id, nx, ny, win.w, win.h)
      }
      if (resizeOrigin.current) {
        const dw = e.clientX - resizeOrigin.current.mx
        const dh = e.clientY - resizeOrigin.current.my
        const nw = Math.max(MIN_W, resizeOrigin.current.ww + dw)
        const nh = Math.max(MIN_H, resizeOrigin.current.wh + dh)
        updateWindowBounds(win.id, win.x, win.y, nw, nh)
      }
    }
    const onUp = () => { dragOrigin.current = null; resizeOrigin.current = null }
    window.addEventListener('mousemove', onMove)
    window.addEventListener('mouseup', onUp)
    return () => { window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp) }
  }, [win, updateWindowBounds])

  const style = win.isMaximized
    ? { left: 0, top: MENUBAR_H, width: '100vw', height: `calc(100vh - ${MENUBAR_H}px)` }
    : { left: win.x, top: win.y, width: win.w, height: win.h }

  if (win.isMinimized) return null

  return (
    <motion.div
      key={win.id}
      initial={{ scale: 0.88, opacity: 0, y: 20 }}
      animate={{ scale: 1, opacity: 1, y: 0 }}
      exit={{ scale: 0.88, opacity: 0, y: 20, transition: { duration: 0.18 } }}
      transition={{ type: 'spring', stiffness: 420, damping: 32 }}
      className="absolute flex flex-col overflow-hidden rounded-2xl window-chrome"
      style={{
        ...style,
        zIndex: win.zIndex,
        background: 'rgba(18, 18, 28, 0.88)',
        backdropFilter: 'blur(40px) saturate(200%)',
        WebkitBackdropFilter: 'blur(40px) saturate(200%)',
        border: isActive
          ? '1px solid rgba(255,255,255,0.14)'
          : '1px solid rgba(255,255,255,0.06)',
      }}
      onMouseDown={() => focusWindow(win.id)}
    >
      {/* Title bar */}
      <div
        className="flex items-center gap-0 h-10 px-3 flex-shrink-0 no-select"
        style={{
          background: isActive ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.02)',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
        }}
        onMouseDown={onTitleMouseDown}
        onDoubleClick={() => maximizeWindow(win.id)}
      >
        {/* Traffic lights */}
        <div className="flex items-center gap-2 mr-3">
          <button
            className="w-3 h-3 rounded-full traffic-red flex items-center justify-center group"
            onMouseDown={e => e.stopPropagation()}
            onClick={() => closeWindow(win.id)}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[7px] text-black/70 font-bold leading-none">✕</span>
          </button>
          <button
            className="w-3 h-3 rounded-full traffic-yellow flex items-center justify-center group"
            onMouseDown={e => e.stopPropagation()}
            onClick={() => minimizeWindow(win.id)}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[7px] text-black/70 font-bold leading-none">−</span>
          </button>
          <button
            className="w-3 h-3 rounded-full traffic-green flex items-center justify-center group"
            onMouseDown={e => e.stopPropagation()}
            onClick={() => maximizeWindow(win.id)}
          >
            <span className="opacity-0 group-hover:opacity-100 text-[7px] text-black/70 font-bold leading-none">+</span>
          </button>
        </div>

        {/* Title */}
        <div className="flex-1 flex items-center justify-center">
          <span className="text-[13px] text-white/60 font-medium truncate">{win.title}</span>
        </div>

        <div className="w-16" />
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden relative">
        {Content ? <Content winId={win.id} /> : (
          <div className="flex items-center justify-center h-full text-white/30">No content</div>
        )}
      </div>

      {/* Resize handle */}
      {!win.isMaximized && (
        <div
          className="absolute bottom-0 right-0 w-4 h-4 cursor-se-resize"
          onMouseDown={onResizeMouseDown}
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="absolute bottom-1 right-1">
            <path d="M14 8L8 14M14 3L3 14" stroke="rgba(255,255,255,0.18)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
        </div>
      )}
    </motion.div>
  )
}
