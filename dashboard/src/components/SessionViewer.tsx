import { useStore, Session } from '../store/useStore';
import { History, Circle, Clock, HardDrive, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';

function safeRelativeTime(dateStr: string): string {
  try {
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return 'unknown';
    const diff = Date.now() - d.getTime();
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  } catch (e: unknown) { return 'unknown'; }
}
import { motion } from 'framer-motion';

function SessionCard({ session, onSelect }: { session: Session; onSelect: () => void }) {
  return (
    <motion.div
      whileHover={{ scale: 1.005 }}
      onClick={onSelect}
      className={clsx(
        'flex items-center justify-between p-3 rounded-lg border cursor-pointer transition-all group',
        session.active
          ? 'bg-os-green/5 border-os-green/20 hover:border-os-green/40'
          : 'bg-os-panel border-os-border hover:border-os-accent/30 hover:bg-os-hover'
      )}
    >
      <div className="flex items-start gap-3">
        <div className={clsx(
          'w-2 h-2 rounded-full mt-1.5 shrink-0',
          session.active ? 'bg-os-green animate-pulse' : 'bg-os-text-faint'
        )} />
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono text-os-text">
              {session.id.substring(0, 24)}...
            </span>
            {session.active && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-os-green/10 text-os-green border border-os-green/20">
                active
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 mt-1">
            <span className="flex items-center gap-1 text-[10px] text-os-text-faint">
              <Clock size={9} />
              {safeRelativeTime(session.modified)}
            </span>
            <span className="flex items-center gap-1 text-[10px] text-os-text-faint">
              <HardDrive size={9} />
              {(session.size / 1024).toFixed(1)}KB
            </span>
          </div>
        </div>
      </div>
      <ChevronRight size={12} className="text-os-text-faint opacity-0 group-hover:opacity-100 transition-opacity" />
    </motion.div>
  );
}

export function SessionViewer() {
  const { sessions, setSelectedSession } = useStore();

  const active = sessions.filter(s => s.active);
  const recent = sessions.filter(s => !s.active);

  return (
    <div className="flex flex-col h-full bg-os-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-os-border bg-os-surface shrink-0">
        <div className="flex items-center gap-2">
          <History size={15} className="text-os-blue" />
          <h2 className="text-sm font-semibold">Sessions</h2>
          <span className="text-xs font-mono text-os-blue bg-os-blue/10 px-1.5 py-0.5 rounded">
            {sessions.length}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5">
            <Circle size={8} className="text-os-green fill-os-green" />
            <span className="text-xs text-os-text-faint">{active.length} active</span>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 py-3 space-y-4">
        {/* Active sessions */}
        {active.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-os-green mb-2 flex items-center gap-1.5">
              <Circle size={6} className="fill-os-green text-os-green animate-pulse" />
              Active
            </div>
            <div className="space-y-1.5">
              {active.map(s => (
                <SessionCard key={s.id} session={s} onSelect={() => setSelectedSession(s)} />
              ))}
            </div>
          </div>
        )}

        {/* Recent sessions */}
        {recent.length > 0 && (
          <div>
            <div className="text-[10px] uppercase tracking-widest text-os-text-faint mb-2">
              Recent ({recent.length})
            </div>
            <div className="space-y-1.5">
              {recent.map(s => (
                <SessionCard key={s.id} session={s} onSelect={() => setSelectedSession(s)} />
              ))}
            </div>
          </div>
        )}

        {sessions.length === 0 && (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <History size={32} className="text-os-text-faint opacity-20 mb-3" />
            <p className="text-sm text-os-text-dim">No sessions found</p>
            <p className="text-xs text-os-text-faint mt-1">Start Claude Code to create sessions</p>
          </div>
        )}
      </div>
    </div>
  );
}
