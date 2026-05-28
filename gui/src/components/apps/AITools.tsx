import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props { winId: string }

const TOOLS = [
  { id: 'hermes',    name: 'Hermes',      icon: '🚀', model: 'claude-haiku-4-5',  status: 'active',   desc: 'Fast AI task delegation via CLI' },
  { id: 'blackbox',  name: 'Blackbox',    icon: '⬛', model: 'claude-sonnet-4-6', status: 'active',   desc: 'Advanced coding intelligence terminal' },
  { id: 'opencode',  name: 'OpenCode',    icon: '💻', model: 'multi-model',        status: 'optional', desc: 'Open-source coding assistant' },
  { id: 'codex',     name: 'Codex CLI',   icon: '🔷', model: 'gpt-4o',            status: 'optional', desc: 'OpenAI Codex command-line interface' },
  { id: 'aider',     name: 'Aider',       icon: '🤝', model: 'claude/gpt',         status: 'optional', desc: 'AI pair programming in git repos' },
  { id: 'kilocode',  name: 'Kilocode',    icon: '📐', model: 'multi-model',        status: 'optional', desc: 'VS Code AI extension' },
  { id: 'openclaw',  name: 'OpenClaw',    icon: '🦀', model: 'orchestrator',       status: 'optional', desc: 'Multi-agent orchestration framework' },
  { id: 'openhands', name: 'OpenHands',   icon: '🙌', model: 'multi-model',        status: 'optional', desc: 'Open-source software development agent' },
  { id: 'goose',     name: 'Goose',       icon: '🪿', model: 'multi-model',        status: 'optional', desc: 'Block Inc. autonomous coding agent' },
  { id: 'swe-agent', name: 'SWE-Agent',   icon: '🔬', model: 'multi-model',        status: 'optional', desc: 'Stanford autonomous bug fixing agent' },
]

export default function AITools({ winId }: Props) {
  const [installing, setInstalling] = useState<string | null>(null)

  const install = async (id: string) => {
    setInstalling(id)
    await new Promise(r => setTimeout(r, 1500))
    setInstalling(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/6">
        <div className="text-white/90 font-semibold text-[14px]">AI Tools</div>
        <div className="text-white/35 text-[12px] mt-0.5">Manage AI coding assistants installed on Claude OS</div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {TOOLS.map((tool, i) => (
          <motion.div
            key={tool.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.04 }}
            className="flex items-center gap-3 p-3 rounded-xl bg-white/4 border border-white/6 hover:bg-white/6 transition-colors"
          >
            <div className="text-2xl w-10 flex-shrink-0">{tool.icon}</div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-white/90 text-[13px] font-semibold">{tool.name}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium ${
                  tool.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-white/8 text-white/30'
                }`}>
                  {tool.status === 'active' ? '● active' : 'optional'}
                </span>
              </div>
              <div className="text-white/40 text-[11px] truncate">{tool.desc}</div>
              <div className="text-white/20 text-[10px] font-mono">{tool.model}</div>
            </div>
            {tool.status !== 'active' && (
              <button
                onClick={() => install(tool.id)}
                disabled={installing === tool.id}
                className="px-3 py-1.5 rounded-lg bg-claude-500/20 text-claude-400 text-[11px] font-medium hover:bg-claude-500/30 transition-colors disabled:opacity-50 flex-shrink-0"
              >
                {installing === tool.id ? '…' : 'Install'}
              </button>
            )}
            {tool.status === 'active' && (
              <button className="px-3 py-1.5 rounded-lg bg-white/6 text-white/40 text-[11px] font-medium hover:bg-white/10 transition-colors flex-shrink-0">
                Launch
              </button>
            )}
          </motion.div>
        ))}
      </div>

      <div className="px-4 py-2 border-t border-white/6 text-[11px] text-white/25">
        Run <span className="font-mono text-white/40">claude-os-setup</span> in terminal to manage tools
      </div>
    </div>
  )
}
