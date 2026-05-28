import { create } from 'zustand';

export interface Skill {
  name: string;
  description: string;
  category: string;
  path: string;
  modified: string;
}

export interface Session {
  id: string;
  file: string;
  size: number;
  modified: string;
  active: boolean;
}

export interface ActivityItem {
  id: string;
  tool: string;
  icon: string;
  color: string;
  summary: string;
  input?: unknown;
  output?: unknown;
  ts: number;
  duration?: number;
  success: boolean;
}

export interface FileNode {
  name: string;
  path: string;
  isDir: boolean;
  children: FileNode[];
}

export interface SystemInfo {
  platform: string;
  arch: string;
  hostname: string;
  uptime: number;
  totalMem: number;
  freeMem: number;
  cpus: number;
  nodeVersion: string;
  claudeHome: string;
}

export type ActivePanel = 'activity' | 'skills' | 'sessions' | 'files' | 'config';

interface OSState {
  // Connection
  connected: boolean;
  ws: WebSocket | null;

  // Data
  skills: Skill[];
  sessions: Session[];
  activity: ActivityItem[];
  files: FileNode[];
  systemInfo: SystemInfo | null;
  workspace: string;

  // UI
  activePanel: ActivePanel;
  selectedSkill: Skill | null;
  selectedSession: Session | null;
  skillSearch: string;
  skillCategory: string;
  terminalOpen: boolean;
  sidebarCollapsed: boolean;

  // Metrics
  freeMem: number;
  totalMem: number;

  // Actions
  setConnected: (v: boolean) => void;
  setWs: (ws: WebSocket | null) => void;
  setSkills: (s: Skill[]) => void;
  setSessions: (s: Session[]) => void;
  addActivity: (a: ActivityItem) => void;
  setActivity: (a: ActivityItem[]) => void;
  setFiles: (f: FileNode[]) => void;
  setSystemInfo: (s: SystemInfo) => void;
  setWorkspace: (w: string) => void;
  setActivePanel: (p: ActivePanel) => void;
  setSelectedSkill: (s: Skill | null) => void;
  setSelectedSession: (s: Session | null) => void;
  setSkillSearch: (v: string) => void;
  setSkillCategory: (v: string) => void;
  toggleTerminal: () => void;
  toggleSidebar: () => void;
  updateMetrics: (freeMem: number, totalMem: number) => void;
}

export const useStore = create<OSState>((set) => ({
  connected: false,
  ws: null,
  skills: [],
  sessions: [],
  activity: [],
  files: [],
  systemInfo: null,
  workspace: '~',
  activePanel: 'activity',
  selectedSkill: null,
  selectedSession: null,
  skillSearch: '',
  skillCategory: 'all',
  terminalOpen: false,
  sidebarCollapsed: false,
  freeMem: 0,
  totalMem: 0,

  setConnected: (v) => set({ connected: v }),
  setWs: (ws) => set({ ws }),
  setSkills: (skills) => set({ skills }),
  setSessions: (sessions) => set({ sessions }),
  addActivity: (a) => set((s) => ({
    activity: [a, ...s.activity].slice(0, 500),
  })),
  setActivity: (activity) => set({ activity }),
  setFiles: (files) => set({ files }),
  setSystemInfo: (systemInfo) => set({ systemInfo, freeMem: systemInfo.freeMem, totalMem: systemInfo.totalMem }),
  setWorkspace: (workspace) => set({ workspace }),
  setActivePanel: (activePanel) => set({ activePanel }),
  setSelectedSkill: (selectedSkill) => set({ selectedSkill }),
  setSelectedSession: (selectedSession) => set({ selectedSession }),
  setSkillSearch: (skillSearch) => set({ skillSearch }),
  setSkillCategory: (skillCategory) => set({ skillCategory }),
  toggleTerminal: () => set((s) => ({ terminalOpen: !s.terminalOpen })),
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  updateMetrics: (freeMem, totalMem) => set({ freeMem, totalMem }),
}));
