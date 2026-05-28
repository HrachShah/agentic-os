import { useRef, useState } from 'react'
import { motion, useSpring, useTransform, MotionValue } from 'framer-motion'
import { useDesktopStore, APP_REGISTRY, AppId } from '../store/desktop'

const DOCK_APPS: AppId[] = ['terminal', 'claude-chat', 'skills', 'ai-tools', 'finder', 'settings']
const ICON_SIZE = 52
const MAGNIFY_MAX = 76
const MAGNIFY_RANGE = 100

function DockIcon({ appId, mouseX }: { appId: AppId; mouseX: MotionValue<number> }) {
  const ref = useRef<HTMLDivElement>(null)
  const { openApp, windows } = useDesktopStore()
  const app = APP_REGISTRY[appId]
  const isOpen = windows.some(w => w.appId === appId)

  const distance = useTransform(mouseX, (x: number) => {
    const rect = ref.current?.getBoundingClientRect()
    if (!rect) return MAGNIFY_RANGE + 1
    const center = rect.left + rect.width / 2
    return Math.abs(x - center)
  })

  const size = useSpring(
    useTransform(distance, [0, MAGNIFY_RANGE], [MAGNIFY_MAX, ICON_SIZE]),
    { stiffness: 400, damping: 30 }
  )

  const translateY = useSpring(
    useTransform(distance, [0, MAGNIFY_RANGE], [-12, 0]),
    { stiffness: 400, damping: 30 }
  )

  return (
    <div ref={ref} className="relative flex flex-col items-center" style={{ width: ICON_SIZE + 16 }}>
      <motion.div
        style={{ width: size, height: size, y: translateY }}
        whileTap={{ scale: 0.88 }}
        onClick={() => openApp(appId)}
        className="rounded-2xl flex items-center justify-center cursor-pointer shadow-lg"
        title={app.label}
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30, delay: DOCK_APPS.indexOf(appId) * 0.04 }}
        style={{
          background: `linear-gradient(145deg, ${app.color}dd, ${app.color}88)`,
          border: '1px solid rgba(255,255,255,0.15)',
          boxShadow: `0 8px 24px ${app.color}44`,
        } as any}
      >
        <span style={{ fontSize: size.get() * 0.46 }}>{app.icon}</span>
      </motion.div>

      {/* Active dot */}
      {isOpen && (
        <motion.div
          layoutId={`dot-${appId}`}
          className="absolute -bottom-1.5 w-1 h-1 rounded-full bg-white/60"
        />
      )}
    </div>
  )
}

export default function Dock() {
  const mouseX = useSpring(-999, { stiffness: 500, damping: 40 })
  const [hovered, setHovered] = useState(false)

  return (
    <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[9000]">
      <motion.div
        className="flex items-end px-3 py-2 rounded-3xl gap-1"
        style={{
          background: 'rgba(40,40,55,0.62)',
          backdropFilter: 'blur(32px) saturate(200%)',
          WebkitBackdropFilter: 'blur(32px) saturate(200%)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,255,255,0.08)',
        }}
        onMouseMove={(e) => mouseX.set(e.clientX)}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => { mouseX.set(-999); setHovered(false) }}
      >
        {DOCK_APPS.map(id => (
          <DockIcon key={id} appId={id} mouseX={mouseX} />
        ))}
      </motion.div>
    </div>
  )
}
