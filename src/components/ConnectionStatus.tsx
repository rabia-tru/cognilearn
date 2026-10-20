import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw, Settings } from 'lucide-react';
import { HARDCODED_BACKEND_URL, detectWorkingHost } from '../utils/api';

export const ConnectionStatus: React.FC = () => {
  const [status, setStatus] = useState<'connected' | 'disconnected' | 'testing'>('testing');
  const [showDetails, setShowDetails] = useState(false);
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const testConnection = async () => {
    setStatus('testing');
    try {
      const result = await detectWorkingHost();
      setStatus(result ? 'connected' : 'disconnected');
      setLastChecked(new Date());
    } catch {
      setStatus('disconnected');
      setLastChecked(new Date());
    }
  };

  useEffect(() => {
    testConnection();
    const interval = setInterval(testConnection, 30000); // Check every 30s
    return () => clearInterval(interval);
  }, []);

  if (status === 'connected') return null;

  if (status === 'testing') {
    return (
      <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 px-3 sm:px-6">
        <div className="max-w-7xl mx-auto">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-2 sm:p-3 flex items-center gap-2 shadow-sm">
            <RefreshCw className="w-4 h-4 text-amber-600 animate-spin shrink-0" />
            <span className="text-xs font-semibold text-amber-800">Testing backend connection...</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed top-14 sm:top-16 left-0 right-0 z-40 px-3 sm:px-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-rose-50 border border-rose-200 rounded-xl p-2 sm:p-3 shadow-lg">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2 min-w-0 flex-1">
              <WifiOff className="w-4 h-4 text-rose-600 shrink-0" />
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-rose-900">Cannot connect to backend server</p>
                <p className="text-[10px] text-rose-700 truncate">
                  Server: {HARDCODED_BACKEND_URL}
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={testConnection}
                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors"
                title="Retry connection"
              >
                <RefreshCw className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="p-1.5 rounded-lg bg-rose-100 hover:bg-rose-200 text-rose-700 transition-colors"
                title="Show details"
              >
                <Settings className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {showDetails && (
            <div className="mt-2 pt-2 border-t border-rose-200 text-[10px] text-rose-800 space-y-1">
              <p className="font-semibold">Troubleshooting steps:</p>
              <ol className="list-decimal list-inside space-y-0.5 text-[10px]">
                <li>Make sure server is running: <code className="bg-rose-100 px-1 rounded">npm run dev</code></li>
                <li>Phone connected via USB with debugging enabled</li>
                <li>Run: <code className="bg-rose-100 px-1 rounded">adb reverse tcp:3000 tcp:3000</code></li>
                <li>Or connect to same Wi-Fi network as your PC</li>
              </ol>
              {lastChecked && (
                <p className="text-[9px] text-rose-600 mt-1">
                  Last checked: {lastChecked.toLocaleTimeString()}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
