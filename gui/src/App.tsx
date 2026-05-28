import { useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import Desktop from './components/Desktop'
import MenuBar from './components/MenuBar'
import Dock from './components/Dock'
import Window from './components/Window'
import Spotlight from './components/Spotlight'
import { useDesktopStore } from './store/desktop'

export default function App() {
  const { windows, spotlightOpen, toggleSpotlight, setSpotlight } = useDesktopStore()

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === ' ') {
        e.preventDefault()
        toggleSpotlight()
      }
      if (e.key === 'Escape' && spotlightOpen) {
        setSpotlight(false)
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [spotlightOpen, toggleSpotlight, setSpotlight])

  return (
    <div className="relative w-full h-full overflow-hidden select-none" style={{ background: 'var(--surface-0)' }}>
      {/* Wallpaper */}
      <Desktop />

      {/* MenuBar */}
      <MenuBar />

      {/* Windows */}
      <AnimatePresence>
        {windows.map(win => (
          <Window key={win.id} win={win} />
        ))}
      </AnimatePresence>

      {/* Spotlight */}
      <AnimatePresence>
        {spotlightOpen && <Spotlight />}
      </AnimatePresence>

      {/* Dock */}
      <Dock />
    </div>
  )
}
