import { useStore } from '../store/useStore';
import { Wifi, WifiOff } from 'lucide-react';

export function WelcomeBanner() {
  const { connected } = useStore();

  if (connected) return null;

  return (
    <div className="fixed inset-0 bg-os-bg/90 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="text-center max-w-sm px-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-os-accent to-os-pink mx-auto mb-4
                        flex items-center justify-center shadow-glow animate-pulse-slow">
          <span className="text-white text-2xl font-bold">C</span>
        </div>
        <h1 className="text-xl font-bold text-os-text mb-2">Claude OS</h1>
        <p className="text-sm text-os-text-dim mb-4">
          Connecting to backend server...
        </p>
        <div className="flex items-center justify-center gap-2 text-xs text-os-text-faint">
          <WifiOff size={12} className="text-os-yellow animate-pulse" />
          <span className="font-mono">ws://localhost:3000</span>
        </div>
        <p className="text-xs text-os-text-faint mt-4">
          Make sure the backend is running:
        </p>
        <code className="text-xs font-mono text-os-accent bg-os-panel border border-os-border rounded px-2 py-1 mt-1 block">
          cd backend && node server.js
        </code>
      </div>
    </div>
  );
}
