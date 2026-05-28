import { useSystemStore } from '../store/system'
import { useDesktopStore } from '../store/desktop'

function ClaudeLogo() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" className="text-claude-400">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" fill="currentColor" opacity="0.3"/>
      <path d="M12 6l-4 8h3l1-2h4l1 2h3L16 6h-4zm0 3l1.5 3h-3L12 9z" fill="currentColor"/>
    </svg>
  )
}

function WifiIcon({ strength }: { strength: number }) {
  return (
    <svg width="14" height="12" viewBox="0 0 14 12" fill="none">
      {[3,2,1].map((level) => (
        <path
          key={level}
          d={level === 3 ? "M7 10.5l-.7-.7C4.1 7.6 2 8.3 2 8.3L.3 6.6C2.1 5.3 4.4 4.5 7 4.5s4.9.8 6.7 2.1L12 8.3S9.9 7.6 7.7 9.8L7 10.5z"
            : level === 2 ? "M7 10.5l-.7-.7C5.1 8.6 3.5 8 3.5 8L2 6.5C3.5 5.5 5.1 5 7 5s3.5.5 5 1.5L10.5 8S8.9 8.6 7.7 9.8L7 10.5z"
            : "M7 10.5l-.7-.7L7 9.1l.7.7-.7.7z"}
          fill={strength >= level ? 'white' : 'rgba(255,255,255,0.25)'}
        />
      ))}
    </svg>
  )
}

function BatteryIcon({ level, charging }: { level: number; charging: boolean }) {
  const w = Math.round((level / 100) * 18)
  const color = level < 20 ? '#ff5f57' : level < 40 ? '#febc2e' : 'white'
  return (
    <svg width="24" height="12" viewBox="0 0 24 12" fill="none">
      <rect x="0.5" y="0.5" width="20" height="11" rx="2.5" stroke="rgba(255,255,255,0.5)" strokeWidth="1"/>
      <rect x="21" y="3.5" width="2.5" height="5" rx="1" fill="rgba(255,255,255,0.5)"/>
      <rect x="2" y="2" width={w} height="8" rx="1.5" fill={color}/>
      {charging && <text x="6" y="10" fontSize="8" fill="white">⚡</text>}
    </svg>
  )
}

export default function MenuBar() {
  const { time, batteryLevel, batteryCharging, wifiConnected, wifiStrength } = useSystemStore()
  const { windows, activeWindowId, toggleSpotlight } = useDesktopStore()

  const activeWin = windows.find(w => w.id === activeWindowId)

  const fmt = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true })
  const dateFmt = time.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })

  return (
    <div
      className="absolute top-0 left-0 right-0 h-8 flex items-center px-3 z-[9999] no-select"
      style={{
        background: 'rgba(14,14,22,0.80)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        boxShadow: '0 1px 0 rgba(255,255,255,0.04)',
      }}
    >
      {/* Left: Logo + active app */}
      <div className="flex items-center gap-4 flex-1">
        <button
          onClick={toggleSpotlight}
          className="flex items-center gap-1.5 px-1.5 py-0.5 rounded-md hover:bg-white/8 transition-colors"
        >
          <ClaudeLogo />
          <span className="text-white/90 text-[13px] font-semibold">Claude OS</span>
        </button>

        {activeWin && (
          <>
            <span className="text-white/20 text-xs">|</span>
            <span className="text-white/70 text-[13px] font-medium">{activeWin.title}</span>
            <div className="flex items-center gap-3 ml-1">
              {['File', 'Edit', 'View', 'Window', 'Help'].map(m => (
                <button key={m} className="text-white/60 text-[13px] hover:text-white/90 transition-colors">
                  {m}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Right: system tray */}
      <div className="flex items-center gap-3">
        {wifiConnected && <WifiIcon strength={wifiStrength} />}
        <BatteryIcon level={batteryLevel} charging={batteryCharging} />
        <div className="flex flex-col items-end leading-none">
          <span className="text-white/90 text-[12px] font-medium tabular-nums">{fmt}</span>
          <span className="text-white/40 text-[10px]">{dateFmt}</span>
        </div>
      </div>
    </div>
  )
}
