import { useState } from 'react'
import { useSystemStore } from '../../store/system'

interface Props { winId: string }

function Slider({ label, value, onChange, unit = '' }: { label: string; value: number; onChange: (v: number) => void; unit?: string }) {
  return (
    <div className="flex items-center gap-3">
      <span className="text-white/60 text-[12px] w-24 flex-shrink-0">{label}</span>
      <input
        type="range" min={0} max={100} value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="flex-1 accent-purple-500"
      />
      <span className="text-white/40 text-[12px] w-12 text-right font-mono">{value}{unit}</span>
    </div>
  )
}

function Toggle({ label, value, onChange, desc }: { label: string; value: boolean; onChange: (v: boolean) => void; desc?: string }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div>
        <div className="text-white/80 text-[13px]">{label}</div>
        {desc && <div className="text-white/30 text-[11px]">{desc}</div>}
      </div>
      <button
        onClick={() => onChange(!value)}
        className={`w-11 h-6 rounded-full transition-colors ${value ? 'bg-claude-500' : 'bg-white/15'} relative`}
      >
        <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${value ? 'translate-x-5.5' : 'translate-x-0.5'}`} />
      </button>
    </div>
  )
}

const SECTIONS = ['System', 'Display', 'AI Models', 'Network', 'About']

export default function Settings({ winId }: Props) {
  const { volume, brightness, setVolume, setBrightness } = useSystemStore()
  const [section, setSection] = useState('System')
  const [notifications, setNotifications] = useState(true)
  const [animations, setAnimations] = useState(true)
  const [darkMode, setDarkMode] = useState(true)
  const [apiKey, setApiKey] = useState('')
  const [showKey, setShowKey] = useState(false)

  return (
    <div className="flex h-full">
      {/* Sidebar */}
      <div className="w-40 flex-shrink-0 border-r border-white/6 py-3 px-2">
        {SECTIONS.map(s => (
          <button
            key={s}
            onClick={() => setSection(s)}
            className={`w-full text-left px-3 py-2 rounded-xl text-[13px] transition-colors mb-0.5 ${
              section === s ? 'bg-white/10 text-white/90 font-medium' : 'text-white/45 hover:text-white/70 hover:bg-white/5'
            }`}
          >
            {s}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {section === 'System' && (
          <div className="space-y-4">
            <div>
              <div className="text-white/90 font-semibold text-[14px] mb-3">System</div>
              <div className="space-y-0 bg-white/4 rounded-xl p-3 divide-y divide-white/6">
                <Toggle label="Notifications" value={notifications} onChange={setNotifications} desc="Show system and app notifications" />
                <Toggle label="Animations" value={animations} onChange={setAnimations} desc="Enable window and dock animations" />
                <Toggle label="Dark Mode" value={darkMode} onChange={setDarkMode} desc="Dark interface (default)" />
              </div>
            </div>
            <div>
              <div className="text-white/60 text-[12px] font-medium mb-2 uppercase tracking-wide">Sound</div>
              <div className="bg-white/4 rounded-xl p-3 space-y-3">
                <Slider label="Volume" value={volume} onChange={setVolume} unit="%" />
              </div>
            </div>
          </div>
        )}

        {section === 'Display' && (
          <div className="space-y-4">
            <div className="text-white/90 font-semibold text-[14px] mb-3">Display</div>
            <div className="bg-white/4 rounded-xl p-3 space-y-3">
              <Slider label="Brightness" value={brightness} onChange={setBrightness} unit="%" />
            </div>
            <div className="bg-white/4 rounded-xl p-3 space-y-2">
              <div className="text-white/60 text-[12px] font-medium">Resolution</div>
              {['1920×1080', '2560×1440', '3840×2160'].map(r => (
                <label key={r} className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" name="res" defaultChecked={r === '1920×1080'} className="accent-purple-500" />
                  <span className="text-white/70 text-[13px]">{r}</span>
                </label>
              ))}
            </div>
          </div>
        )}

        {section === 'AI Models' && (
          <div className="space-y-4">
            <div className="text-white/90 font-semibold text-[14px] mb-3">AI Models</div>
            <div className="bg-white/4 rounded-xl p-3 space-y-3">
              <div>
                <label className="text-white/60 text-[12px]">Anthropic API Key</label>
                <div className="flex gap-2 mt-1.5">
                  <input
                    type={showKey ? 'text' : 'password'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                    placeholder="sk-ant-…"
                    className="flex-1 bg-white/6 border border-white/10 rounded-xl px-3 py-2 text-[13px] text-white/80 outline-none font-mono placeholder:text-white/20 focus:border-white/20"
                  />
                  <button onClick={() => setShowKey(v => !v)} className="px-3 py-2 bg-white/6 rounded-xl text-white/40 text-[12px] hover:bg-white/10">
                    {showKey ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              {[
                { label: 'Hermes Model', val: 'claude-haiku-4-5 (fast)' },
                { label: 'Blackbox Model', val: 'claude-sonnet-4-6 (coding)' },
                { label: 'Chat Model', val: 'claude-sonnet-4-6' },
              ].map(({ label, val }) => (
                <div key={label} className="flex items-center justify-between">
                  <span className="text-white/60 text-[12px]">{label}</span>
                  <span className="text-white/50 text-[12px] font-mono">{val}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {section === 'Network' && (
          <div className="space-y-4">
            <div className="text-white/90 font-semibold text-[14px] mb-3">Network</div>
            <div className="bg-white/4 rounded-xl p-3 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-white/70 text-[13px]">Wi-Fi</span>
                <span className="text-green-400 text-[12px]">Connected</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-[12px]">SSID</span>
                <span className="text-white/40 text-[12px] font-mono">ClaudeNet</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-white/50 text-[12px]">IP Address</span>
                <span className="text-white/40 text-[12px] font-mono">192.168.1.42</span>
              </div>
            </div>
          </div>
        )}

        {section === 'About' && (
          <div className="space-y-4">
            <div className="text-white/90 font-semibold text-[14px] mb-3">About Agentic OS</div>
            <div className="bg-white/4 rounded-xl p-4 space-y-2">
              {[
                ['Version', 'Agentic OS 1.0.0'],
                ['Kernel', 'Linux 6.6.30 LTS'],
                ['Userspace', 'Alpine 3.20'],
                ['Node', 'Bun 1.3'],
                ['Python', '3.12'],
                ['Claude Code', 'latest'],
                ['GUI', 'React + Vite + Framer Motion'],
              ].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between">
                  <span className="text-white/50 text-[12px]">{k}</span>
                  <span className="text-white/70 text-[12px] font-mono">{v}</span>
                </div>
              ))}
            </div>
            <div className="text-white/25 text-[11px] text-center">
              Built with ❤️ for Claude Code developers
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
