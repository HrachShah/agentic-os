const express = require('express');
const { WebSocketServer } = require('ws');
const http = require('http');
const cors = require('cors');
const chokidar = require('chokidar');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { randomUUID } = require('crypto');
const readline = require('readline');

const app = express();
const server = http.createServer(app);
const wss = new WebSocketServer({ server });

app.use(cors());
app.use(express.json());

// Serve dashboard build in production
const dashboardBuild = path.join(__dirname, '../dashboard/dist');
if (fs.existsSync(dashboardBuild)) {
  app.use(express.static(dashboardBuild));
}

const CLAUDE_HOME = process.env.CLAUDE_HOME || path.join(os.homedir(), '.claude');
const WORKSPACE = process.env.WORKSPACE || os.homedir();
const SKILLS_DIR = path.join(CLAUDE_HOME, 'skills');
const SESSIONS_DIR = path.join(CLAUDE_HOME, 'sessions');
const PROJECTS_DIR = path.join(CLAUDE_HOME, 'projects');
const HISTORY_FILE = path.join(CLAUDE_HOME, 'history.jsonl');

function resolveWorkspacePath(candidate) {
  if (typeof candidate !== 'string') return null;
  const workspaceRoot = path.resolve(WORKSPACE);
  const requestedPath = path.resolve(candidate);
  if (requestedPath !== workspaceRoot && !requestedPath.startsWith(`${workspaceRoot}${path.sep}`)) {
    return null;
  }
  try {
    const resolvedPath = fs.realpathSync(requestedPath);
    if (resolvedPath !== workspaceRoot && !resolvedPath.startsWith(`${workspaceRoot}${path.sep}`)) {
      return null;
    }
    return resolvedPath;
  } catch {
    return null;
  }
}

function resolveChildPath(root, child) {
  if (typeof child !== 'string' || child.length === 0) return null;
  let rootPath;
  try {
    rootPath = fs.realpathSync(root);
  } catch {
    return null;
  }
  const requestedPath = path.resolve(rootPath, child);
  if (requestedPath === rootPath || !requestedPath.startsWith(`${rootPath}${path.sep}`)) {
    return null;
  }
  try {
    const resolvedPath = fs.realpathSync(requestedPath);
    if (!resolvedPath.startsWith(`${rootPath}${path.sep}`)) return null;
    return resolvedPath;
  } catch {
    return null;
  }
}

// Connected WebSocket clients
const clients = new Set();

function broadcast(type, data) {
  const msg = JSON.stringify({ type, data, ts: Date.now() });
  clients.forEach(ws => {
    if (ws.readyState === 1) ws.send(msg);
  });
}

// ─── WebSocket ────────────────────────────────────────────────────────────────
wss.on('connection', (ws) => {
  clients.add(ws);
  console.log(`[WS] Client connected (${clients.size} total)`);

  // Send initial state
  ws.send(JSON.stringify({ type: 'init', data: getInitialState() }));

  ws.on('close', () => {
    clients.delete(ws);
    console.log(`[WS] Client disconnected (${clients.size} total)`);
  });

  ws.on('message', (raw) => {
    try {
      const msg = JSON.parse(raw.toString());
      handleClientMessage(ws, msg);
    } catch {}
  });
});

function handleClientMessage(ws, msg) {
  switch (msg.type) {
    case 'ping':
      ws.send(JSON.stringify({ type: 'pong', ts: Date.now() }));
      break;
    case 'get_skills':
      ws.send(JSON.stringify({ type: 'skills', data: getSkills() }));
      break;
    case 'get_sessions':
      ws.send(JSON.stringify({ type: 'sessions', data: getSessions() }));
      break;
    case 'get_files': {
      const requestedPath = resolveWorkspacePath(msg.path || WORKSPACE);
      ws.send(JSON.stringify({
        type: 'files',
        data: requestedPath ? getFiles(requestedPath) : [],
        error: requestedPath ? undefined : 'Path must be inside the workspace',
      }));
      break;
    }
    case 'get_history':
      ws.send(JSON.stringify({ type: 'history', data: getRecentHistory(msg.limit || 100) }));
      break;
  }
}

// ─── Data Sources ─────────────────────────────────────────────────────────────
function getInitialState() {
  return {
    skills: getSkills(),
    sessions: getSessions(),
    history: getRecentHistory(50),
    systemInfo: getSystemInfo(),
    workspace: WORKSPACE,
    claudeHome: CLAUDE_HOME,
  };
}

function getSkills() {
  if (!fs.existsSync(SKILLS_DIR)) return [];
  return fs.readdirSync(SKILLS_DIR)
    .filter(name => !name.startsWith('.'))
    .map(name => {
      const skillPath = path.join(SKILLS_DIR, name);
      const stat = fs.statSync(skillPath);
      let description = '';
      let category = 'general';

      // Try to read skill description from index.md or README
      const descFiles = ['index.md', 'README.md', 'skill.md'];
      for (const f of descFiles) {
        const fp = path.join(skillPath, f);
        if (fs.existsSync(fp)) {
          try {
            const content = fs.readFileSync(fp, 'utf8');
            const firstLine = content.split('\n').find(l => l.trim() && !l.startsWith('#'));
            description = firstLine?.trim() || '';
            // Detect category from content
            if (/design|ui|ux|css|style/i.test(content)) category = 'design';
            else if (/test|qa|review|audit/i.test(content)) category = 'quality';
            else if (/deploy|ship|build|ci|cd/i.test(content)) category = 'devops';
            else if (/browse|web|scrape|fetch/i.test(content)) category = 'web';
            else if (/doc|generate|write/i.test(content)) category = 'docs';
            else if (/plan|arch|design/i.test(content)) category = 'planning';
            else category = 'tools';
          } catch {}
          break;
        }
      }

      return {
        name,
        description,
        category,
        path: skillPath,
        modified: stat.mtime,
      };
    });
}

function getSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) return [];
  try {
    return fs.readdirSync(SESSIONS_DIR)
      .filter(f => f.endsWith('.jsonl') || f.endsWith('.json'))
      .slice(-20)
      .map(f => {
        const fp = path.join(SESSIONS_DIR, f);
        const stat = fs.statSync(fp);
        return {
          id: f.replace(/\.(jsonl|json)$/, ''),
          file: f,
          size: stat.size,
          modified: stat.mtime,
          active: Date.now() - stat.mtime.getTime() < 1000 * 60 * 30,
        };
      })
      .sort((a, b) => new Date(b.modified) - new Date(a.modified));
  } catch { return []; }
}

function getRecentHistory(limit = 100) {
  // Read from the most recently active project transcript (tool use data)
  return getRecentActivity(limit);
}

function getRecentActivity(limit = 100) {
  if (!fs.existsSync(PROJECTS_DIR)) return [];
  try {
    // Find all project session JSONL files, sort by modified time
    const allFiles = [];
    const projectDirs = fs.readdirSync(PROJECTS_DIR);
    for (const projDir of projectDirs) {
      const projPath = path.join(PROJECTS_DIR, projDir);
      try {
        const stat = fs.statSync(projPath);
        if (!stat.isDirectory()) {
          // Could be a direct .jsonl file in projects dir
          if (projDir.endsWith('.jsonl')) {
            allFiles.push({ path: projPath, mtime: stat.mtime });
          }
          continue;
        }
        const files = fs.readdirSync(projPath).filter(f => f.endsWith('.jsonl'));
        for (const f of files) {
          const fp = path.join(projPath, f);
          const fstat = fs.statSync(fp);
          allFiles.push({ path: fp, mtime: fstat.mtime });
        }
      } catch {}
    }

    // Get the most recently modified files
    allFiles.sort((a, b) => new Date(b.mtime) - new Date(a.mtime));
    const targetFiles = allFiles.slice(0, 3);

    const entries = [];
    for (const { path: fp } of targetFiles) {
      try {
        const lines = fs.readFileSync(fp, 'utf8').trim().split('\n').filter(Boolean);
        for (const line of lines.slice(-200)) {
          try {
            const entry = JSON.parse(line);
            const activity = parseTranscriptEntry(entry);
            if (activity) entries.push(activity);
          } catch {}
        }
      } catch {}
    }

    return entries.sort((a, b) => b.ts - a.ts).slice(0, limit);
  } catch { return []; }
}

function parseTranscriptEntry(entry) {
  // Claude Code project transcript format:
  // { type: 'assistant'|'user', timestamp: '...', message: { role, content: [{ type: 'tool_use'|'tool_result', name, input }] } }
  if (!entry.message || !entry.message.content) return null;

  const contents = Array.isArray(entry.message.content)
    ? entry.message.content
    : [entry.message.content];

  for (const block of contents) {
    if (block.type === 'tool_use' && block.name) {
      const toolName = block.name;
      const input = block.input || {};
      const icons = {
        Read: '📖', Edit: '✏️', Write: '💾', Bash: '⚡', Grep: '🔍',
        Glob: '📁', WebFetch: '🌐', WebSearch: '🔎', Agent: '🤖',
        PowerShell: '🖥️', TodoRead: '📋', TodoWrite: '📝', default: '🔧'
      };
      const colors = {
        Read: 'blue', Edit: 'yellow', Write: 'green', Bash: 'orange', PowerShell: 'orange',
        Grep: 'purple', Glob: 'cyan', WebFetch: 'teal', WebSearch: 'indigo',
        Agent: 'pink', default: 'gray'
      };

      let ts = Date.now();
      if (entry.timestamp) {
        const parsed = new Date(entry.timestamp).getTime();
        if (!isNaN(parsed)) ts = parsed;
      }

      return {
        id: block.id || randomUUID(),
        tool: toolName,
        icon: icons[toolName] || icons.default,
        color: colors[toolName] || colors.default,
        summary: formatToolSummary(toolName, input),
        input,
        ts,
        success: true,
      };
    }
  }
  return null;
}

function getFiles(dirPath, depth = 2) {
  if (!fs.existsSync(dirPath)) return [];
  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    return entries
      .filter(e => !e.name.startsWith('.') || e.name === '.claude')
      .slice(0, 100)
      .map(e => ({
        name: e.name,
        path: path.join(dirPath, e.name),
        isDir: e.isDirectory(),
        children: (e.isDirectory() && depth > 0)
          ? getFiles(path.join(dirPath, e.name), depth - 1)
          : [],
      }));
  } catch { return []; }
}

function getSystemInfo() {
  return {
    platform: os.platform(),
    arch: os.arch(),
    hostname: os.hostname(),
    uptime: os.uptime(),
    totalMem: os.totalmem(),
    freeMem: os.freemem(),
    cpus: os.cpus().length,
    nodeVersion: process.version,
    claudeHome: CLAUDE_HOME,
  };
}

// ─── File Watchers ────────────────────────────────────────────────────────────
const filePositions = new Map();

function watchHistory() {
  if (!fs.existsSync(PROJECTS_DIR)) return;

  const watcher = chokidar.watch(PROJECTS_DIR, {
    usePolling: true, interval: 800,
    ignored: [/node_modules/, /\.git/],
    followSymlinks: false, depth: 2, ignoreInitial: true,
  });

  watcher.on('change', (filePath) => {
    if (!filePath.endsWith('.jsonl')) return;
    try {
      const stat = fs.statSync(filePath);
      const lastPos = filePositions.get(filePath) || stat.size;
      if (stat.size <= lastPos) { filePositions.set(filePath, stat.size); return; }

      const fd = fs.openSync(filePath, 'r');
      const buf = Buffer.alloc(stat.size - lastPos);
      fs.readSync(fd, buf, 0, buf.length, lastPos);
      fs.closeSync(fd);
      filePositions.set(filePath, stat.size);

      const newLines = buf.toString().trim().split('\n').filter(Boolean);
      for (const line of newLines) {
        try {
          const entry = JSON.parse(line);
          const activity = parseTranscriptEntry(entry);
          if (activity) broadcast('activity', activity);
        } catch {}
      }
    } catch {}
  });

  watcher.on('add', (fp) => {
    if (fp.endsWith('.jsonl')) try { filePositions.set(fp, fs.statSync(fp).size); } catch {}
  });

  watcher.on('error', (err) => {
    if (err.code !== 'EPERM' && err.code !== 'EACCES') console.warn('[watcher]', err.message);
  });
}

function formatToolSummary(tool, input) {
  switch (tool) {
    case 'Read': return `Reading ${path.basename(input.file_path || input.path || '?')}`;
    case 'Edit': return `Editing ${path.basename(input.file_path || '?')}`;
    case 'Write': return `Writing ${path.basename(input.file_path || '?')}`;
    case 'Bash': return `$ ${(input.command || '').substring(0, 60)}`;
    case 'PowerShell': return `PS> ${(input.command || '').substring(0, 60)}`;
    case 'Grep': return `Search: ${input.pattern || '?'}`;
    case 'Glob': return `Glob: ${input.pattern || '?'}`;
    case 'WebFetch': return `Fetch: ${(input.url || '?').substring(0, 50)}`;
    case 'Agent': return `Spawning agent: ${input.description || '?'}`;
    default: return JSON.stringify(input).substring(0, 60);
  }
}

// Watch sessions directory for new/updated sessions
function watchSessions() {
  if (!fs.existsSync(SESSIONS_DIR)) return;
  chokidar.watch(SESSIONS_DIR, { ignoreInitial: true }).on('all', () => {
    broadcast('sessions_update', getSessions());
  });
}

// Watch workspace for file changes
function watchWorkspace() {
  const watchPath = WORKSPACE;
  const watcher = chokidar.watch(watchPath, {
    ignoreInitial: true,
    followSymlinks: false,
    ignored: [
      /node_modules/,
      /\.git/,
      /\.claude[\/\\]cache/,
      /AppData/,
      /Application Data/,
      /Local Settings/,
      /My Documents/,
      /NetHood/,
      /PrintHood/,
      /Recent/,
      /SendTo/,
      /Templates/,
    ],
    depth: 3,
    usePolling: false,
  });
  watcher.on('all', (event, filePath) => {
    broadcast('file_change', { event, path: filePath, ts: Date.now() });
  });
  watcher.on('error', (err) => {
    // Silently ignore permission errors on Windows symlinks
    if (err.code !== 'EPERM' && err.code !== 'EACCES') {
      console.warn('[watcher]', err.message);
    }
  });
}

// ─── REST API ─────────────────────────────────────────────────────────────────
app.get('/api/health', (_, res) => {
  res.json({ status: 'ok', ts: Date.now(), clients: clients.size });
});

app.get('/api/skills', (_, res) => res.json(getSkills()));
app.get('/api/sessions', (_, res) => res.json(getSessions()));
app.get('/api/history', (req, res) => res.json(getRecentHistory(req.query.limit)));
app.get('/api/system', (_, res) => res.json(getSystemInfo()));

app.get('/api/files', (req, res) => {
  const dirPath = resolveWorkspacePath(req.query.path || WORKSPACE);
  if (!dirPath) return res.status(403).json({ error: 'Path must be inside the workspace' });
  res.json(getFiles(dirPath));
});

app.get('/api/session/:id', (req, res) => {
  const fp = resolveChildPath(SESSIONS_DIR, `${req.params.id}.jsonl`);
  if (!fp || !fs.existsSync(fp)) return res.status(404).json({ error: 'Not found' });
  try {
    const lines = fs.readFileSync(fp, 'utf8').trim().split('\n')
      .slice(-200)
      .map(l => { try { return JSON.parse(l); } catch { return null; } })
      .filter(Boolean);
    res.json(lines);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/skill/:name', (req, res) => {
  const skillPath = resolveChildPath(SKILLS_DIR, req.params.name);
  if (!skillPath || !fs.existsSync(skillPath)) return res.status(404).json({ error: 'Not found' });
  const files = ['index.md', 'README.md', 'skill.md', 'prompt.md'];
  for (const f of files) {
    const fp = path.join(skillPath, f);
    if (fs.existsSync(fp)) {
      return res.json({ name: req.params.name, content: fs.readFileSync(fp, 'utf8') });
    }
  }
  // List files in skill dir
  const contents = fs.readdirSync(skillPath).map(f => ({
    name: f, path: path.join(skillPath, f)
  }));
  res.json({ name: req.params.name, files: contents });
});

// Serve dashboard SPA catch-all
app.get('*', (_, res) => {
  const indexPath = path.join(dashboardBuild, 'index.html');
  if (fs.existsSync(indexPath)) res.sendFile(indexPath);
  else res.json({ error: 'Dashboard not built yet. Run: cd dashboard && npm run build' });
});

// ─── Start ────────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`\n🤖 Agentic OS Backend running on http://localhost:${PORT}`);
  console.log(`   Claude Home: ${CLAUDE_HOME}`);
  console.log(`   Workspace:   ${WORKSPACE}`);
  console.log(`   Skills:      ${getSkills().length} loaded`);
  console.log(`   Sessions:    ${getSessions().length} found\n`);

  watchHistory();
  watchSessions();
  watchWorkspace();
});

// Periodic system metrics broadcast
setInterval(() => {
  broadcast('system_metrics', {
    freeMem: os.freemem(),
    totalMem: os.totalmem(),
    uptime: os.uptime(),
    ts: Date.now(),
  });
}, 5000);
