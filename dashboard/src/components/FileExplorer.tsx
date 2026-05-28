import { useStore, FileNode } from '../store/useStore';
import { useState } from 'react';
import { Folder, FolderOpen, FileText, ChevronRight, ChevronDown, FolderOpen as FolderIcon } from 'lucide-react';
import { clsx } from 'clsx';

function FileItem({ node, depth = 0 }: { node: FileNode; depth?: number }) {
  const [open, setOpen] = useState(depth < 2);

  const ext = node.name.split('.').pop()?.toLowerCase();
  const iconColor = !node.isDir ? {
    ts: 'text-blue-400', tsx: 'text-blue-300', js: 'text-yellow-400',
    jsx: 'text-yellow-300', py: 'text-green-400', md: 'text-purple-300',
    json: 'text-orange-300', css: 'text-pink-300', html: 'text-red-300',
  }[ext || ''] || 'text-os-text-faint' : 'text-os-text-faint';

  return (
    <div>
      <div
        onClick={() => node.isDir && setOpen(!open)}
        className={clsx(
          'flex items-center gap-1.5 px-2 py-1 rounded text-xs cursor-pointer hover:bg-os-hover transition-colors',
          'text-os-text-dim hover:text-os-text'
        )}
        style={{ paddingLeft: `${8 + depth * 14}px` }}
      >
        {node.isDir ? (
          <>
            {open ? (
              <ChevronDown size={10} className="text-os-text-faint shrink-0" />
            ) : (
              <ChevronRight size={10} className="text-os-text-faint shrink-0" />
            )}
            {open
              ? <FolderOpen size={12} className="text-os-yellow shrink-0" />
              : <Folder size={12} className="text-os-yellow shrink-0" />
            }
          </>
        ) : (
          <>
            <span className="w-2.5 shrink-0" />
            <FileText size={12} className={clsx(iconColor, 'shrink-0')} />
          </>
        )}
        <span className="truncate font-mono">{node.name}</span>
      </div>
      {node.isDir && open && node.children.length > 0 && (
        <div>
          {node.children.map(child => (
            <FileItem key={child.path} node={child} depth={depth + 1} />
          ))}
        </div>
      )}
    </div>
  );
}

export function FileExplorer() {
  const { files, workspace } = useStore();

  return (
    <div className="flex flex-col h-full bg-os-bg">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-os-border bg-os-surface shrink-0">
        <div className="flex items-center gap-2">
          <FolderIcon size={15} className="text-os-yellow" />
          <h2 className="text-sm font-semibold">Files</h2>
        </div>
        <span className="text-xs text-os-text-faint font-mono truncate max-w-xs">{workspace}</span>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin py-2">
        {files.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-center">
            <FolderIcon size={32} className="text-os-text-faint opacity-20 mb-3" />
            <p className="text-sm text-os-text-dim">No files loaded</p>
          </div>
        ) : (
          files.map(node => <FileItem key={node.path} node={node} />)
        )}
      </div>
    </div>
  );
}
