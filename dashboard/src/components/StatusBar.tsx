import { useStore } from '../store/useStore';
import { Activity, Cpu, MemoryStick, Wifi, WifiOff, Terminal, ChevronLeft, ChevronRight } from 'lucide-react';
import { useEffect, useState } from 'react';

function formatMem(bytes: number) {
  return `${(bytes / 1024 / 1024 / 1024).toFixed(1)}GB`;
}

function Clock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return (
    <span className="font-mono text-xs text-os-text-dim tabular-nums">
      {time.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
    </span>
  );
}

export function StatusBar() {
  const { connected, skills, sessions, activity, freeMem, totalMem, toggleTerminal, terminalOpen, toggleSidebar, sidebarCollapsed } = useStore();

  const memUsed = totalMem - freeMem;
  const memPct = totalMem ? Math.round((memUsed / totalMem) * 100) : 0;
  const activeSessions = sessions.filter(s => s.active).length;

  return (
    <div className="flex items-center justify-between h-9 px-3 bg-os-surface border-b border-os-border shrink-0 z-50">
      {/* Left: Logo + nav */}
      <div className="flex items-center gap-3">
        <button
          onClick={toggleSidebar}
          className="text-os-text-dim hover:text-os-text transition-colors p-0.5 rounded"
        >
          {sidebarCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>

        <div className="flex items-center gap-2">
          <div className="w-5 h-5 rounded-full bg-gradient-to-br from-os-accent to-os-pink flex items-center justify-center shadow-accent">
            <span className="text-white text-[9px] font-bold">C</span>
          </div>
          <span className="text-sm font-semibold text-os-text tracking-tight">Agentic OS</span>
        </div>

        <div className="w-px h-4 bg-os-border" />

        {/* Stats */}
        <div className="flex items-center gap-3 text-xs text-os-text-faint">
          <span className="flex items-center gap-1">
            <span className="text-os-accent font-mono font-semibold">{skills.length}</span>
            <span>skills</span>
          </span>
          <span className="flex items-center gap-1">
            <span className={`font-mono font-semibold ${activeSessions > 0 ? 'text-os-green' : 'text-os-text-faint'}`}>
              {activeSessions}
            </span>
            <span>active</span>
          </span>
          <span className="flex items-center gap-1">
            <Activity size={10} className="text-os-yellow" />
            <span className="font-mono">{activity.length}</span>
          </span>
        </div>
      </div>

      {/* Center: Connection + model */}
      <div className="flex items-center gap-2">
        <div className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium
          ${connected
            ? 'bg-os-green/10 text-os-green border border-os-green/20'
            : 'bg-os-red/10 text-os-red border border-os-red/20'
          }`}>
          {connected
            ? <><Wifi size={10} /> <span>Connected</span></>
            : <><WifiOff size={10} /> <span>Offline</span></>
          }
        </div>

        <div className="px-2 py-0.5 rounded bg-os-active border border-os-border text-xs font-mono text-os-accent">
          claude-sonnet-4-6
        </div>
      </div>

      {/* Right: Metrics + time */}
      <div className="flex items-center gap-3">
        {/* Memory */}
        {totalMem > 0 && (
          <div className="flex items-center gap-1.5">
            <MemoryStick size={11} className="text-os-text-faint" />
            <div className="flex items-center gap-1">
              <div className="w-16 h-1.5 bg-os-border rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-1000 ${
                    memPct > 80 ? 'bg-os-red' : memPct > 60 ? 'bg-os-yellow' : 'bg-os-green'
                  }`}
                  style={{ width: `${memPct}%` }}
                />
              </div>
              <span className="text-[10px] font-mono text-os-text-faint">{memPct}%</span>
            </div>
          </div>
        )}

        {/* Terminal toggle */}
        <button
          onClick={toggleTerminal}
          className={`p-1 rounded transition-colors ${
            terminalOpen
              ? 'text-os-accent bg-os-accent/10'
              : 'text-os-text-dim hover:text-os-text'
          }`}
          title="Toggle terminal"
        >
          <Terminal size={13} />
        </button>

        <div className="w-px h-4 bg-os-border" />
        <Clock />
      </div>
    </div>
  );
}
