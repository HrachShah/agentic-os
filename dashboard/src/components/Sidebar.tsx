import { useStore, ActivePanel } from '../store/useStore';
import { Activity, Layers, History, FolderOpen, Settings, Zap } from 'lucide-react';
import { clsx } from 'clsx';

const NAV = [
  { id: 'activity' as ActivePanel, icon: Activity, label: 'Activity', color: 'text-os-green' },
  { id: 'skills' as ActivePanel, icon: Layers, label: 'Skills', color: 'text-os-accent' },
  { id: 'sessions' as ActivePanel, icon: History, label: 'Sessions', color: 'text-os-blue' },
  { id: 'files' as ActivePanel, icon: FolderOpen, label: 'Files', color: 'text-os-yellow' },
];

export function Sidebar() {
  const { activePanel, setActivePanel, sidebarCollapsed, activity, skills, sessions } = useStore();

  const badges: Partial<Record<ActivePanel, number>> = {
    activity: activity.filter(a => Date.now() - a.ts < 60000).length || 0,
    sessions: sessions.filter(s => s.active).length || 0,
    skills: skills.length,
  };

  if (sidebarCollapsed) {
    return (
      <div className="w-12 flex flex-col items-center py-3 gap-1 border-r border-os-border bg-os-surface shrink-0">
        {NAV.map(({ id, icon: Icon, color }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={clsx(
              'w-9 h-9 flex items-center justify-center rounded-lg transition-all',
              activePanel === id
                ? 'bg-os-accent/15 border border-os-accent/30 shadow-accent'
                : 'hover:bg-os-hover text-os-text-faint hover:text-os-text'
            )}
            title={id}
          >
            <Icon size={16} className={activePanel === id ? color : ''} />
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="w-48 flex flex-col border-r border-os-border bg-os-surface shrink-0">
      {/* Nav items */}
      <div className="flex-1 py-2 space-y-0.5 px-2">
        {NAV.map(({ id, icon: Icon, label, color }) => (
          <button
            key={id}
            onClick={() => setActivePanel(id)}
            className={clsx(
              'w-full flex items-center justify-between px-2.5 py-2 rounded-lg transition-all text-left',
              activePanel === id
                ? 'bg-os-accent/15 border border-os-accent/30 text-os-text shadow-accent'
                : 'hover:bg-os-hover text-os-text-faint hover:text-os-text border border-transparent'
            )}
          >
            <div className="flex items-center gap-2.5">
              <Icon size={14} className={activePanel === id ? color : 'opacity-60'} />
              <span className="text-sm font-medium">{label}</span>
            </div>
            {badges[id] !== undefined && badges[id]! > 0 && (
              <span className={clsx(
                'text-[10px] font-mono px-1.5 py-0.5 rounded-full min-w-[18px] text-center',
                id === 'activity' ? 'bg-os-green/15 text-os-green' :
                id === 'sessions' ? 'bg-os-blue/15 text-os-blue' :
                'bg-os-accent/15 text-os-accent'
              )}>
                {badges[id]}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* Bottom: Quick skill launcher */}
      <div className="border-t border-os-border p-2">
        <div className="text-[10px] uppercase tracking-widest text-os-text-faint px-1 mb-1.5">Quick Skills</div>
        {['review', 'ship', 'qa', 'browse'].map(s => (
          <button
            key={s}
            className="w-full flex items-center gap-2 px-2 py-1.5 rounded hover:bg-os-hover text-xs text-os-text-dim hover:text-os-accent transition-colors"
            onClick={() => navigator.clipboard?.writeText(`/${s}`)}
            title={`Copy /${s} to clipboard`}
          >
            <Zap size={10} className="text-os-accent opacity-60" />
            <span className="font-mono">/{s}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
