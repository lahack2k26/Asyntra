import { useEffect, useState } from 'react';
import { Activity } from 'lucide-react';
import { checkHealth } from '../api';

export default function Navbar() {
  const [isHealthy, setIsHealthy] = useState(null);

  useEffect(() => {
    const check = async () => {
      try {
        await checkHealth();
        setIsHealthy(true);
      } catch {
        setIsHealthy(false);
      }
    };
    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <nav className="bg-slate-900 border-b border-slate-700 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-3">
        <Activity className="w-6 h-6 text-purple-400" />
        <h1 className="text-xl font-bold text-white">FreeLanceOS</h1>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-sm text-slate-400">Backend Status</span>
        <div
          className={`w-3 h-3 rounded-full ${
            isHealthy === null
              ? 'bg-yellow-400 animate-pulse'
              : isHealthy
              ? 'bg-green-400'
              : 'bg-red-500'
          }`}
          title={isHealthy === null ? 'Checking...' : isHealthy ? 'Connected' : 'Disconnected'}
        />
      </div>
    </nav>
  );
}
