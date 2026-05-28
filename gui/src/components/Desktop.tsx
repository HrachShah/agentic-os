import { motion } from 'framer-motion'
import { useDesktopStore, APP_REGISTRY, AppId } from '../store/desktop'

const DESKTOP_ICONS: AppId[] = ['terminal', 'claude-chat', 'skills', 'ai-tools', 'finder', 'settings']

export default function Desktop() {
  const openApp = useDesktopStore(s => s.openApp)

  return (
    <div className="absolute inset-0">
      {/* Gradient wallpaper */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse 80% 60% at 20% 30%, rgba(108,94,242,0.18) 0%, transparent 60%),
            radial-gradient(ellipse 60% 50% at 80% 70%, rgba(52,152,219,0.12) 0%, transparent 60%),
            radial-gradient(ellipse 50% 40% at 60% 10%, rgba(46,204,113,0.08) 0%, transparent 50%),
            linear-gradient(160deg, #0d0d18 0%, #0a0a15 50%, #0d0d20 100%)
          `,
        }}
      />

      {/* Subtle noise texture */}
      <div
        className="absolute inset-0 opacity-[0.03]"
        style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=\'0 0 256 256\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cfilter id=\'noise\'%3E%3CfeTurbulence type=\'fractalNoise\' baseFrequency=\'0.9\' numOctaves=\'4\'/%3E%3C/filter%3E%3Crect width=\'100%25\' height=\'100%25\' filter=\'url(%23noise)\'/%3E%3C/svg%3E")' }}
      />

      {/* Desktop icons — top-right column */}
      <div className="absolute top-16 right-4 flex flex-col gap-3 items-center">
        {DESKTOP_ICONS.map((id, i) => {
          const app = APP_REGISTRY[id]
          return (
            <motion.div
              key={id}
              initial={{ opacity: 0, scale: 0.6, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ delay: i * 0.05, type: 'spring', stiffness: 400, damping: 28 }}
              onDoubleClick={() => openApp(id)}
              className="flex flex-col items-center gap-1 cursor-pointer group w-16"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-lg transition-transform duration-150 group-hover:scale-110 group-active:scale-95"
                style={{ background: `${app.color}22`, border: `1px solid ${app.color}44` }}
              >
                {app.icon}
              </div>
              <span className="text-[10px] text-white/70 group-hover:text-white/90 transition-colors text-center leading-tight drop-shadow">
                {app.label}
              </span>
            </motion.div>
          )
        })}
      </div>
    </div>
  )
}
