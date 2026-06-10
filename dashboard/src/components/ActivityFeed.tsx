import { useStore, ActivityItem } from '../store/useStore';
import { useEffect, useRef, useState } from 'react';
import { clsx } from 'clsx';

function safeRelativeTime(ts: number): string {
  try {
    const d = new Date(ts);
    if (isNaN(d.getTime())) return 'just now';
    const diff = Date.now() - d.getTime();
    if (diff < 5000) return 'just now';
    if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
    if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
    if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
    return `${Math.floor(diff / 86400000)}d ago`;
  } catch { return ''; }
}
import { Circle, CheckCircle2, XCircle, Filter, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

const TOOL_COLORS: Record<string, string> = {
  Read: 'border-l-blue-500 bg-blue-500/5',
  Edit: 'border-l-yellow-500 bg-yellow-500/5',
  Write: 'border-l-green-500 bg-green-500/5',
  Bash: 'border-l-orange-500 bg-orange-500/5',
  Grep: 'border-l-purple-500 bg-purple-500/5',
  Glob: 'border-l-cyan-500 bg-cyan-500/5',
  WebFetch: 'border-l-teal-500 bg-teal-500/5',
  WebSearch: 'border-l-indigo-500 bg-indigo-500/5',
  Agent: 'border-l-pink-500 bg-pink-500/5',
  TodoRead: 'border-l-gray-500 bg-gray-500/5',
  TodoWrite: 'border-l-gray-500 bg-gray-500/5',
};

const TOOL_TEXT: Record<string, string> = {
  Read: 'text-blue-400',
  Edit: 'text-yellow-400',
  Write: 'text-green-400',
  Bash: 'text-orange-400',
  Grep: 'text-purple-400',
  Glob: 'text-cyan-400',
  WebFetch: 'text-teal-400',
  WebSearch: 'text-indigo-400',
  Agent: 'text-pink-400',
};

function ActivityCard({ item, isNew }: { item: ActivityItem; isNew: boolean }) {
  const colorClass = TOOL_COLORS[item.tool] || 'border-l-gray-600 bg-gray-500/5';
  const textClass = TOOL_TEXT[item.tool] || 'text-gray-400';

  return (
    <motion.div
      initial={isNew ? { opacity: 0, y: -12 } : false}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={clsx(
        'border-l-2 px-3 py-2.5 rounded-r-lg mb-1.5 hover:bg-os-hover transition-colors cursor-default',
        colorClass
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          <span className="text-base leading-none mt-0.5 shrink-0">{item.icon}</span>
          <div className="min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className={clsx('text-[11px] font-mono font-semibold uppercase tracking-wider', textClass)}>
                {item.tool}
              </span>
              {item.duration && (
                <span className="text-[10px] text-os-text-faint font-mono">{item.duration}ms</span>
              )}
            </div>
            <p className="text-xs text-os-text-dim font-mono truncate max-w-md" title={item.summary}>
              {item.summary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {item.success
            ? <CheckCircle2 size={12} className="text-os-green opacity-70" />
            : <XCircle size={12} className="text-os-red opacity-70" />
          }
          <span className="text-[10px] text-os-text-faint whitespace-nowrap">
            {safeRelativeTime(item.ts)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

function LiveIndicator({ active }: { active: boolean }) {
  return (
    <div className="flex items-center gap-1.5">
      <div className={clsx(
        'w-1.5 h-1.5 rounded-full',
        active ? 'bg-os-green animate-pulse' : 'bg-os-text-faint'
      )} />
      <span className="text-[10px] uppercase tracking-widest text-os-text-faint">
        {active ? 'Live' : 'Idle'}
      </span>
    </div>
  );
}

export function ActivityFeed() {
  const { activity, setActivity, connected } = useStore();
  const prevIdsRef = useRef<Set<string>>(new Set());
  const [newestId, setNewestId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const isLive = connected && activity.length > 0 &&
    Date.now() - activity[0]?.ts < 30000;

  // Track which item id is the newest, so only that card animates in
  useEffect(() => {
    if (activity.length === 0) {
      prevIdsRef.current = new Set();
      setNewestId(null);
      return;
    }
    const head = activity[0];
    if (!prevIdsRef.current.has(head.id)) {
      // New head — this is the only card that should animate
      setNewestId(head.id);
      scrollRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    }
    prevIdsRef.current = new Set(activity.map(a => a.id));
  }, [activity]);

  const recent = activity.slice(0, 200);

  return (
    <div className="flex flex-col h-full bg-os-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-os-border bg-os-surface shrink-0">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-os-text">Activity Feed</h2>
          <LiveIndicator active={isLive} />
          <span className="text-xs text-os-text-faint">{activity.length} events</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActivity([])}
            className="p-1.5 rounded hover:bg-os-hover text-os-text-faint hover:text-os-red transition-colors"
            title="Clear feed"
          >
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      {/* Feed */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin px-3 py-3">
        {recent.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
            <div className="w-16 h-16 rounded-2xl bg-os-panel border border-os-border flex items-center justify-center">
              <Circle size={24} className="text-os-accent opacity-40" />
            </div>
            <div>
              <p className="text-sm text-os-text-dim">No activity yet</p>
              <p className="text-xs text-os-text-faint mt-1">
                Start a Claude Code session to see real-time activity here
              </p>
            </div>
            <div className="font-mono text-xs text-os-accent opacity-60 animate-blink">
              waiting for claude...
            </div>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {recent.map((item, i) => (
              <ActivityCard key={item.id} item={item} isNew={item.id === newestId} />
            ))}
          </AnimatePresence>
        )}
      </div>

      {/* Footer stats */}
      <div className="flex items-center gap-4 px-4 py-1.5 border-t border-os-border bg-os-surface shrink-0">
        {['Read', 'Edit', 'Write', 'Bash', 'Grep'].map(tool => {
          const count = activity.filter(a => a.tool === tool).length;
          const textClass = TOOL_TEXT[tool] || 'text-os-text-faint';
          return (
            <div key={tool} className="flex items-center gap-1">
              <span className={clsx('text-[10px] font-mono font-medium', textClass)}>{tool}</span>
              <span className="text-[10px] font-mono text-os-text-faint">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
