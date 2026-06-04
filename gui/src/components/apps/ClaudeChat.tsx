import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

interface Message { role: 'user' | 'assistant'; content: string; ts: Date }
interface Props { winId: string }

function MessageBubble({ msg }: { msg: Message }) {
  const isUser = msg.role === 'user'
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-3`}
    >
      {!isUser && (
        <div className="w-7 h-7 rounded-full bg-claude-500/30 border border-claude-500/40 flex items-center justify-center text-sm mr-2 flex-shrink-0 mt-0.5">
          🤖
        </div>
      )}
      <div
        className={`max-w-[78%] px-4 py-2.5 rounded-2xl text-[13.5px] leading-relaxed ${
          isUser
            ? 'bg-claude-600/80 text-white rounded-br-md'
            : 'bg-white/8 text-white/90 rounded-bl-md'
        }`}
      >
        {msg.content}
      </div>
    </motion.div>
  )
}

export default function ClaudeChat({ winId }: Props) {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: 'Hi! I\'m Claude. I\'m running via the Claude API. Set your ANTHROPIC_API_KEY to enable full responses.', ts: new Date() }
  ])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }) }, [messages])

  const send = async () => {
    if (!input.trim() || loading) return
    const userMsg: Message = { role: 'user', content: input.trim(), ts: new Date() }
    setMessages(m => [...m, userMsg])
    setInput('')
    setLoading(true)

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMsg].map(m => ({ role: m.role, content: m.content })) }),
      })
      if (res.ok) {
        const data = await res.json()
        setMessages(m => [...m, { role: 'assistant', content: data.content, ts: new Date() }])
      } else {
        setMessages(m => [...m, { role: 'assistant', content: 'API not available. Start the backend server with `bun run server`.', ts: new Date() }])
      }
    } catch (e: unknown) {
      console.error('ClaudeChat send error:', e)
      setMessages(m => [...m, {
        role: 'assistant',
        content: 'Cannot reach backend. In the terminal, run:\n`cd ~/agentic-os/gui && bun run server`',
        ts: new Date()
      }])
    }
    setLoading(false)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-white/6">
        <div className="w-8 h-8 rounded-full bg-claude-500/25 flex items-center justify-center text-lg">🤖</div>
        <div>
          <div className="text-white/90 text-[13px] font-semibold">Claude Sonnet</div>
          <div className="text-white/35 text-[11px]">claude-sonnet-4-6</div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-3">
        <AnimatePresence>
          {messages.map((msg, i) => <MessageBubble key={i} msg={msg} />)}
        </AnimatePresence>
        {loading && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 mb-3">
            <div className="w-7 h-7 rounded-full bg-claude-500/30 border border-claude-500/40 flex items-center justify-center text-sm">🤖</div>
            <div className="flex gap-1 px-4 py-2.5 bg-white/8 rounded-2xl rounded-bl-md">
              {[0,1,2].map(i => (
                <motion.div key={i} className="w-1.5 h-1.5 rounded-full bg-white/40"
                  animate={{ y: [0,-4,0] }} transition={{ repeat: Infinity, delay: i*0.15, duration: 0.6 }} />
              ))}
            </div>
          </motion.div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="px-3 py-3 border-t border-white/6">
        <div className="flex items-end gap-2 bg-white/6 rounded-2xl px-4 py-2.5 border border-white/8">
          <textarea
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send() } }}
            placeholder="Message Claude…"
            rows={1}
            className="flex-1 bg-transparent text-white/90 text-[13.5px] outline-none resize-none placeholder:text-white/25 leading-relaxed"
            style={{ maxHeight: 120 }}
          />
          <button
            onClick={send}
            disabled={!input.trim() || loading}
            className="w-8 h-8 rounded-xl bg-claude-500 flex items-center justify-center flex-shrink-0 disabled:opacity-30 disabled:cursor-not-allowed hover:bg-claude-400 transition-colors"
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M1 7h12M7 1l6 6-6 6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
        <div className="text-[10px] text-white/20 text-center mt-1.5">Enter to send · Shift+Enter for newline</div>
      </div>
    </div>
  )
}
