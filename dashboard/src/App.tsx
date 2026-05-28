import { useWebSocket } from './hooks/useWebSocket';
import { useStore } from './store/useStore';
import { StatusBar } from './components/StatusBar';
import { Sidebar } from './components/Sidebar';
import { ActivityFeed } from './components/ActivityFeed';
import { SkillBrowser } from './components/SkillBrowser';
import { SessionViewer } from './components/SessionViewer';
import { FileExplorer } from './components/FileExplorer';
import { TerminalPanel } from './components/Terminal';
import { SkillDetail } from './components/SkillDetail';
import { WelcomeBanner } from './components/WelcomeBanner';

export default function App() {
  useWebSocket();

  const { activePanel, terminalOpen, sidebarCollapsed, selectedSkill, skills } = useStore();

  return (
    <div className="flex flex-col h-screen bg-os-bg text-os-text select-none overflow-hidden">
      {/* Top Status Bar */}
      <StatusBar />

      {/* Main Layout */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Sidebar */}
        <Sidebar />

        {/* Main Content */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Panel Router */}
          <div className="flex-1 overflow-hidden">
            {activePanel === 'activity' && <ActivityFeed />}
            {activePanel === 'skills' && <SkillBrowser />}
            {activePanel === 'sessions' && <SessionViewer />}
            {activePanel === 'files' && <FileExplorer />}
          </div>

          {/* Terminal Drawer */}
          {terminalOpen && <TerminalPanel />}
        </div>

        {/* Right Detail Panel */}
        {selectedSkill && (
          <div className="w-80 border-l border-os-border overflow-hidden">
            <SkillDetail skill={selectedSkill} />
          </div>
        )}
      </div>

      {/* Welcome Banner (when no skills loaded) */}
      {skills.length === 0 && <WelcomeBanner />}
    </div>
  );
}
