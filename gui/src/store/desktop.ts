import { create } from 'zustand'

export type AppId = 'terminal' | 'claude-chat' | 'skills' | 'ai-tools' | 'settings' | 'finder'

export interface AppDef {
  id: AppId
  label: string
  icon: string      // emoji or path
  color: string     // accent color
  defaultSize: { w: number; h: number }
}

export const APP_REGISTRY: Record<AppId, AppDef> = {
  terminal:    { id: 'terminal',    label: 'Terminal',      icon: '⌨️',  color: '#1a1a2e', defaultSize: { w: 780, h: 520 } },
  'claude-chat':{ id: 'claude-chat', label: 'Claude',        icon: '🤖',  color: '#6c5ef2', defaultSize: { w: 860, h: 620 } },
  skills:      { id: 'skills',      label: 'Skills',        icon: '⚡',  color: '#f5a623', defaultSize: { w: 720, h: 560 } },
  'ai-tools':  { id: 'ai-tools',   label: 'AI Tools',      icon: '🛠️',  color: '#2ecc71', defaultSize: { w: 660, h: 500 } },
  settings:    { id: 'settings',   label: 'Settings',      icon: '⚙️',  color: '#95a5a6', defaultSize: { w: 680, h: 520 } },
  finder:      { id: 'finder',     label: 'Files',         icon: '📁',  color: '#3498db', defaultSize: { w: 740, h: 500 } },
}

export interface WindowState {
  id: string
  appId: AppId
  title: string
  x: number
  y: number
  w: number
  h: number
  zIndex: number
  isMinimized: boolean
  isMaximized: boolean
  prevBounds?: { x: number; y: number; w: number; h: number }
}

interface DesktopStore {
  windows: WindowState[]
  topZ: number
  activeWindowId: string | null
  spotlightOpen: boolean
  // actions
  openApp: (appId: AppId) => void
  closeWindow: (id: string) => void
  focusWindow: (id: string) => void
  minimizeWindow: (id: string) => void
  maximizeWindow: (id: string) => void
  updateWindowBounds: (id: string, x: number, y: number, w: number, h: number) => void
  toggleSpotlight: () => void
  setSpotlight: (open: boolean) => void
}

let winIdCounter = 0

export const useDesktopStore = create<DesktopStore>((set, get) => ({
  windows: [],
  topZ: 100,
  activeWindowId: null,
  spotlightOpen: false,

  openApp(appId) {
    const def = APP_REGISTRY[appId]
    if (!def) return
    // Bring existing window to front if already open
    const existing = get().windows.find(w => w.appId === appId && !w.isMinimized)
    if (existing) { get().focusWindow(existing.id); return }
    // Un-minimize if minimized
    const minimized = get().windows.find(w => w.appId === appId && w.isMinimized)
    if (minimized) {
      set(s => ({
        windows: s.windows.map(w => w.id === minimized.id ? { ...w, isMinimized: false } : w),
      }))
      get().focusWindow(minimized.id)
      return
    }
    const id = `win-${++winIdCounter}`
    const { topZ } = get()
    // Cascade offset
    const offset = (get().windows.length % 8) * 24
    set(s => ({
      topZ: topZ + 1,
      activeWindowId: id,
      windows: [...s.windows, {
        id,
        appId,
        title: def.label,
        x: 80 + offset,
        y: 56 + offset,
        w: def.defaultSize.w,
        h: def.defaultSize.h,
        zIndex: topZ + 1,
        isMinimized: false,
        isMaximized: false,
      }],
    }))
  },

  closeWindow(id) {
    set(s => ({ windows: s.windows.filter(w => w.id !== id) }))
  },

  focusWindow(id) {
    const { topZ } = get()
    set(s => ({
      topZ: topZ + 1,
      activeWindowId: id,
      windows: s.windows.map(w => w.id === id ? { ...w, zIndex: topZ + 1 } : w),
    }))
  },

  minimizeWindow(id) {
    set(s => ({
      activeWindowId: null,
      windows: s.windows.map(w => w.id === id ? { ...w, isMinimized: true } : w),
    }))
  },

  maximizeWindow(id) {
    set(s => ({
      windows: s.windows.map(w => {
        if (w.id !== id) return w
        if (w.isMaximized) {
          // restore
          const prev = w.prevBounds ?? { x: 80, y: 56, w: 780, h: 520 }
          return { ...w, isMaximized: false, x: prev.x, y: prev.y, w: prev.w, h: prev.h, prevBounds: undefined }
        }
        return { ...w, isMaximized: true, prevBounds: { x: w.x, y: w.y, w: w.w, h: w.h } }
      }),
    }))
  },

  updateWindowBounds(id, x, y, w, h) {
    set(s => ({ windows: s.windows.map(win => win.id === id ? { ...win, x, y, w, h } : win) }))
  },

  toggleSpotlight() { set(s => ({ spotlightOpen: !s.spotlightOpen })) },
  setSpotlight(open) { set({ spotlightOpen: open }) },
}))
