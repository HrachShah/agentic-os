import { Skill, useStore } from '../store/useStore';
import { useState, useEffect } from 'react';
import { X, Copy, Check, ExternalLink } from 'lucide-react';

export function SkillDetail({ skill }: { skill: Skill }) {
  const { setSelectedSkill } = useStore();
  const [content, setContent] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/skill/${skill.name}`)
      .then(r => r.json())
      .then(data => {
        setContent(data.content || `Skill: /${skill.name}\n\nFiles: ${(data.files || []).map((f: { name: string }) => f.name).join(', ')}`);
        setLoading(false);
      })
      .catch(() => {
        setContent(`/${skill.name}\n\n${skill.description || 'No description available'}`);
        setLoading(false);
      });
  }, [skill.name]);

  const copyCommand = () => {
    navigator.clipboard?.writeText(`/${skill.name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full bg-os-panel">
      {/* Header */}
      <div className="flex items-center justify-between px-3 py-2.5 border-b border-os-border shrink-0">
        <div className="min-w-0">
          <span className="text-sm font-mono font-semibold text-os-accent">/{skill.name}</span>
          {skill.category && (
            <span className="ml-2 text-[10px] uppercase tracking-wider text-os-text-faint">
              {skill.category}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <button onClick={copyCommand} className="p-1.5 rounded hover:bg-os-hover text-os-text-faint hover:text-os-accent transition-colors" title="Copy command">
            {copied ? <Check size={13} className="text-os-green" /> : <Copy size={13} />}
          </button>
          <button onClick={() => setSelectedSkill(null)} className="p-1.5 rounded hover:bg-os-hover text-os-text-faint hover:text-os-text transition-colors">
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto scrollbar-thin p-3">
        {loading ? (
          // Stable widths via deterministic index-based formula instead of
          // Math.random(), so the skeleton doesn't jitter between two
          // different random patterns on every re-render of the parent
          // (which would happen because SkillDetail re-renders when
          // the store updates and Math.random() runs again on every
          // call). The pattern is a 6-step cycle: 70, 85, 60, 90, 75, 80.
          <div className="space-y-2" aria-hidden="true">
            {Array.from({ length: 8 }).map((_, i) => {
              const widths = [70, 85, 60, 90, 75, 80, 65, 88];
              return (
                <div
                  key={i}
                  className="h-3 bg-os-active rounded animate-pulse"
                  style={{ width: `${widths[i % widths.length]}%` }}
                />
              );
            })}
          </div>
        ) : (
          <pre className="text-xs font-mono text-os-text-dim whitespace-pre-wrap leading-relaxed">
            {content}
          </pre>
        )}
      </div>

      {/* Footer */}
      <div className="px-3 py-2 border-t border-os-border shrink-0">
        <button
          onClick={copyCommand}
          className="w-full py-1.5 rounded-lg bg-os-accent/15 border border-os-accent/30
                     text-os-accent text-xs font-mono font-medium hover:bg-os-accent/25 transition-colors"
        >
          {copied ? '✓ Copied!' : `Copy /${skill.name}`}
        </button>
      </div>
    </div>
  );
}
