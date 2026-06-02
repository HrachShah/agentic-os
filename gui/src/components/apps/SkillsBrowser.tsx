import { useState } from 'react'
import { motion } from 'framer-motion'

interface Props { winId: string }

const SKILLS = [
  { id: 'auto-commit',   name: 'Auto Commit',    icon: '📝', cat: 'Git',     desc: 'Stage and commit changes with an AI-generated message' },
  { id: 'quick-review',  name: 'Quick Review',   icon: '👁️', cat: 'Code',    desc: 'Fast code review using Claude Haiku' },
  { id: 'debug-fast',    name: 'Debug Fast',     icon: '🐛', cat: 'Code',    desc: 'Rapid root-cause analysis with Hermes' },
  { id: 'scaffold',      name: 'Scaffold',       icon: '🏗️', cat: 'Code',    desc: 'Generate project boilerplate from a description' },
  { id: 'deploy-check',  name: 'Deploy Check',   icon: '🚀', cat: 'DevOps',  desc: 'Pre-deployment safety checklist' },
  { id: 'agentic-os-help',name: 'Agentic OS Help', icon: '❓', cat: 'System',  desc: 'Get help with Agentic OS commands and features' },
  { id: 'autoplan',      name: 'Autoplan',       icon: '📋', cat: 'Planning', desc: 'gstack autonomous planning before implementation' },
  { id: 'review',        name: 'Code Review',    icon: '🔍', cat: 'Code',    desc: 'gstack production-grade code review' },
  { id: 'investigate',   name: 'Investigate',    icon: '🕵️', cat: 'Debug',   desc: 'gstack root cause debugging' },
  { id: 'qa',            name: 'QA Pass',        icon: '✅', cat: 'Testing', desc: 'gstack full QA pass against a URL' },
  { id: 'cso',           name: 'Security Audit', icon: '🛡️', cat: 'Security', desc: 'gstack OWASP + STRIDE security audit' },
  { id: 'ship',          name: 'Ship',           icon: '📦', cat: 'DevOps',  desc: 'gstack prepare and open a PR' },
]

const CATS = ['All', ...Array.from(new Set(SKILLS.map(s => s.cat)))]

export default function SkillsBrowser({ winId }: Props) {
  const [cat, setCat] = useState('All')
  const [query, setQuery] = useState('')
  const [running, setRunning] = useState<string | null>(null)

  const filtered = SKILLS.filter(s => {
    if (cat !== 'All' && s.cat !== cat) return false
    if (query && !s.name.toLowerCase().includes(query.toLowerCase()) && !s.desc.toLowerCase().includes(query.toLowerCase())) return false
    return true
  })

  const runSkill = async (id: string) => {
    setRunning(id)
    await new Promise(r => setTimeout(r, 1200))
    setRunning(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-white/6">
        <div className="text-white/90 font-semibold text-[14px] mb-2">Skills Library</div>
        <input
          value={query}
          onChange={e => setQuery(e.target.value)}
          placeholder="Search skills…"
          className="w-full bg-white/6 border border-white/8 rounded-xl px-3 py-2 text-[13px] text-white/80 outline-none placeholder:text-white/25 focus:border-white/16"
        />
        <div className="flex gap-2 mt-2 flex-wrap">
          {CATS.map(c => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-3 py-1 rounded-full text-[11px] font-medium transition-colors ${
                cat === c ? 'bg-claude-500/60 text-white' : 'bg-white/6 text-white/50 hover:bg-white/10'
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      {/* Grid */}
      <div className="flex-1 overflow-y-auto p-3 grid grid-cols-2 gap-2 content-start">
        {filtered.map((skill, i) => (
          <motion.div
            key={skill.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.03 }}
            className="flex flex-col gap-1.5 p-3 rounded-xl bg-white/4 border border-white/6 hover:bg-white/8 hover:border-white/10 transition-colors cursor-pointer group"
            onClick={() => runSkill(skill.id)}
          >
            <div className="flex items-start justify-between">
              <span className="text-xl">{skill.icon}</span>
              <span className="text-[9px] text-white/25 bg-white/6 rounded px-1.5 py-0.5">{skill.cat}</span>
            </div>
            <div className="text-white/90 text-[12px] font-semibold">{skill.name}</div>
            <div className="text-white/40 text-[11px] leading-snug">{skill.desc}</div>
            {running === skill.id && (
              <div className="flex items-center gap-1 text-[10px] text-claude-400">
                <motion.span animate={{ opacity: [1,0.3,1] }} transition={{ repeat: Infinity, duration: 0.8 }}>●</motion.span>
                Running…
              </div>
            )}
          </motion.div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 border-t border-white/6 text-[11px] text-white/25 flex justify-between">
        <span>{filtered.length} skills</span>
        <span>claude/gstack/antigravity/builtin</span>
      </div>
    </div>
  )
}
