import { useStore, Skill } from '../store/useStore';
import { useState } from 'react';
import { Search, Layers, Star, Copy, Check, ChevronRight } from 'lucide-react';
import { clsx } from 'clsx';
import { motion } from 'framer-motion';

const CATEGORIES = ['all', 'design', 'quality', 'devops', 'web', 'docs', 'planning', 'tools'];
const CATEGORY_COLORS: Record<string, string> = {
  design: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
  quality: 'text-green-400 bg-green-500/10 border-green-500/20',
  devops: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  web: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  docs: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  planning: 'text-purple-400 bg-purple-500/10 border-purple-500/20',
  tools: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  general: 'text-gray-400 bg-gray-500/10 border-gray-500/20',
};

const PINNED = ['review', 'ship', 'qa', 'browse', 'investigate', 'autoplan', 'design-html', 'webapp-testing'];

function SkillCard({ skill, onSelect }: { skill: Skill; onSelect: () => void }) {
  const [copied, setCopied] = useState(false);
  const catColor = CATEGORY_COLORS[skill.category] || CATEGORY_COLORS.general;
  const isPinned = PINNED.includes(skill.name);

  const copySkill = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigator.clipboard?.writeText(`/${skill.name}`);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      onClick={onSelect}
      className="flex items-center justify-between p-3 rounded-lg bg-os-panel border border-os-border
                 hover:border-os-accent/40 hover:bg-os-hover cursor-pointer transition-all group"
    >
      <div className="flex items-start gap-2.5 min-w-0">
        <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center text-sm shrink-0 border', catColor)}>
          {skill.name[0].toUpperCase()}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium text-os-text font-mono">/{skill.name}</span>
            {isPinned && <Star size={9} className="text-os-yellow fill-os-yellow" />}
          </div>
          {skill.description && (
            <p className="text-xs text-os-text-faint truncate max-w-xs mt-0.5">{skill.description}</p>
          )}
        </div>
      </div>
      <div className="flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
        <button
          onClick={copySkill}
          className="p-1 rounded hover:bg-os-active text-os-text-faint hover:text-os-accent transition-colors"
          title="Copy command"
        >
          {copied ? <Check size={12} className="text-os-green" /> : <Copy size={12} />}
        </button>
        <ChevronRight size={12} className="text-os-text-faint" />
      </div>
    </motion.div>
  );
}

export function SkillBrowser() {
  const { skills, skillSearch, skillCategory, setSkillSearch, setSkillCategory, setSelectedSkill } = useStore();

  const filtered = skills.filter(s => {
    const matchSearch = !skillSearch ||
      s.name.includes(skillSearch.toLowerCase()) ||
      s.description.toLowerCase().includes(skillSearch.toLowerCase());
    const matchCat = skillCategory === 'all' || s.category === skillCategory;
    return matchSearch && matchCat;
  });

  const categoryCounts = CATEGORIES.reduce((acc, cat) => {
    acc[cat] = cat === 'all' ? skills.length : skills.filter(s => s.category === cat).length;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="flex flex-col h-full bg-os-bg">
      {/* Header */}
      <div className="px-4 py-3 border-b border-os-border bg-os-surface shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Layers size={15} className="text-os-accent" />
            <h2 className="text-sm font-semibold">Skills</h2>
            <span className="text-xs font-mono text-os-accent bg-os-accent/10 px-1.5 py-0.5 rounded">
              {skills.length}
            </span>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-os-text-faint" />
          <input
            type="text"
            placeholder="Search skills..."
            value={skillSearch}
            onChange={e => setSkillSearch(e.target.value)}
            className="w-full bg-os-active border border-os-border rounded-lg pl-8 pr-3 py-2 text-sm
                       text-os-text placeholder:text-os-text-faint focus:outline-none focus:border-os-accent
                       transition-colors font-mono"
          />
        </div>

        {/* Category tabs */}
        <div className="flex gap-1 overflow-x-auto pb-1 scrollbar-thin">
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSkillCategory(cat)}
              className={clsx(
                'shrink-0 px-2.5 py-1 rounded-full text-[11px] font-medium transition-all border',
                skillCategory === cat
                  ? 'bg-os-accent/20 text-os-accent border-os-accent/40'
                  : 'bg-os-active text-os-text-faint border-os-border hover:text-os-text hover:border-os-border/80'
              )}
            >
              {cat} {categoryCounts[cat] > 0 && <span className="opacity-60">({categoryCounts[cat]})</span>}
            </button>
          ))}
        </div>
      </div>

      {/* Pinned section */}
      {skillCategory === 'all' && !skillSearch && (
        <div className="px-4 pt-3 pb-1 shrink-0">
          <div className="text-[10px] uppercase tracking-widest text-os-text-faint mb-2 flex items-center gap-1.5">
            <Star size={9} className="text-os-yellow fill-os-yellow" />
            Pinned
          </div>
          <div className="flex flex-wrap gap-1.5 mb-3">
            {PINNED.map(name => {
              const skill = skills.find(s => s.name === name);
              if (!skill) return null;
              return (
                <button
                  key={name}
                  onClick={() => setSelectedSkill(skill)}
                  className="skill-chip"
                >
                  <span className="font-mono">/{name}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Skills grid */}
      <div className="flex-1 overflow-y-auto scrollbar-thin px-4 pb-4">
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-40 text-center">
            <p className="text-sm text-os-text-dim">No skills match</p>
            <p className="text-xs text-os-text-faint mt-1">Try a different search or category</p>
          </div>
        ) : (
          <div className="space-y-1.5">
            {!skillSearch && skillCategory === 'all' && (
              <div className="text-[10px] uppercase tracking-widest text-os-text-faint mb-2 pt-1">
                All Skills ({filtered.length})
              </div>
            )}
            {filtered.map(skill => (
              <SkillCard
                key={skill.name}
                skill={skill}
                onSelect={() => setSelectedSkill(skill)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
