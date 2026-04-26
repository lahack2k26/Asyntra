import { Activity } from 'lucide-react';

export default function Navbar() {
  return (
    <nav className="bg-slate-900/80 backdrop-blur border-b border-slate-700/60 px-6 py-3 flex items-center sticky top-0 z-30">
      <div className="flex items-center gap-2.5">
        <div className="p-1.5 bg-purple-600/30 rounded-lg">
          <Activity className="w-5 h-5 text-purple-400" />
        </div>
        <h1 className="text-lg font-bold text-white tracking-tight">Asyntra</h1>
      </div>
    </nav>
  );
}
