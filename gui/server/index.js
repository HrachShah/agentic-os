// Agentic OS GUI backend — WebSocket terminal + Claude API proxy
// Run: bun run server
import { serve } from 'bun'
import { spawn } from 'child_process'
import { WebSocketServer } from 'ws'
import * as http from 'http'

const PORT = 4000
const API_PORT = 5001

// ─── WebSocket terminal server ─────────────────────────────────────────────
const wss = new WebSocketServer({ port: PORT })

wss.on('connection', (ws) => {
  const shell = process.platform === 'win32' ? 'powershell.exe' : '/bin/sh'
  const proc = spawn(shell, [], {
    env: { ...process.env, TERM: 'xterm-256color', COLORTERM: 'truecolor' },
    cwd: process.env.HOME || process.env.USERPROFILE || '/',
  })

  proc.stdout.on('data', (d) => ws.send(d))
  proc.stderr.on('data', (d) => ws.send(d))
  proc.on('close', () => ws.close())
  ws.on('message', (data) => proc.stdin.write(data))
  ws.on('close', () => proc.kill())
})

console.log(`[agentic-os] Terminal WebSocket on ws://localhost:${PORT}`)

// ─── HTTP Claude API proxy ─────────────────────────────────────────────────
const server = http.createServer(async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') { res.writeHead(204); res.end(); return }
  if (req.method !== 'POST' || req.url !== '/api/chat') {
    res.writeHead(404); res.end('Not found'); return
  }

  let body = ''
  req.on('data', (c) => body += c)
  req.on('end', async () => {
    try {
      const { messages } = JSON.parse(body)
      const apiKey = process.env.ANTHROPIC_API_KEY
      if (!apiKey) {
        res.writeHead(503, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ content: 'ANTHROPIC_API_KEY not set. Add it to ~/.claude/.env or export it.' }))
        return
      }

      const apiRes = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: { 'x-api-key': apiKey, 'anthropic-version': '2023-06-01', 'content-type': 'application/json' },
        body: JSON.stringify({
          model: 'claude-sonnet-4-6',
          max_tokens: 2048,
          messages,
          system: 'You are Claude, running inside Agentic OS — a Linux-based operating system dedicated to Claude Code. Be helpful, concise, and developer-focused.',
        }),
      })

      if (!apiRes.ok) {
        const err = await apiRes.text()
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ content: `API error: ${apiRes.status} — ${err}` }))
        return
      }

      const data = await apiRes.json()
      res.writeHead(200, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ content: data.content?.[0]?.text ?? '(no response)' }))
    } catch (err) {
      res.writeHead(500, { 'Content-Type': 'application/json' })
      res.end(JSON.stringify({ content: `Server error: ${err.message}` }))
    }
  })
})

server.listen(API_PORT, () => console.log(`[agentic-os] API proxy on http://localhost:${API_PORT}`))
