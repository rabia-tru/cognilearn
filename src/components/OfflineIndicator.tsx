import React from 'react';
import { WifiOff } from 'lucide-react';
import { useOnlineStatus } from '../hooks/useOnlineStatus';

export const OfflineIndicator: React.FC = () => {
  const isOnline = useOnlineStatus();

  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 z-50 flex items-center justify-center gap-2 rounded-xl bg-slate-900/90 backdrop-blur-md px-4 py-2.5 text-xs font-semibold text-white shadow-xl border border-slate-700 animate-in fade-in slide-in-from-bottom-2">
      <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
      <span>Offline Mode — Studying from cached decks in local storage.</span>
    </div>
  );
};
