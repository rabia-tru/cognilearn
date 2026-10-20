import React from 'react';
import { CheckCircle2, Clock, Smartphone, X } from 'lucide-react';

interface SwipeTutorialProps {
  onClose: () => void;
}

export const SwipeTutorial: React.FC<SwipeTutorialProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl p-6 max-w-sm w-full text-center shadow-2xl animate-in zoom-in-95 duration-300">
        <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto mb-4">
          <Smartphone className="w-7 h-7" />
        </div>

        <h3 className="text-xl font-extrabold text-slate-900 mb-2">
          📱 Mobile Gestures
        </h3>
        
        <p className="text-sm text-slate-600 mb-5">
          Track your progress with quick swipe actions:
        </p>

        <div className="space-y-3 mb-6">
          <div className="flex items-center gap-3 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-left">
            <div className="text-3xl">👉</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-emerald-900">Swipe Right</p>
              <p className="text-xs text-emerald-700">Mark as Mastered</p>
            </div>
            <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-amber-50 border border-amber-200 text-left">
            <div className="text-3xl">👈</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-amber-900">Swipe Left</p>
              <p className="text-xs text-amber-700">Needs More Review</p>
            </div>
            <Clock className="w-5 h-5 text-amber-600 shrink-0" />
          </div>

          <div className="flex items-center gap-3 p-3 rounded-xl bg-indigo-50 border border-indigo-200 text-left">
            <div className="text-3xl">👆</div>
            <div className="flex-1">
              <p className="text-sm font-bold text-indigo-900">Tap to Flip</p>
              <p className="text-xs text-indigo-700">Reveal answer & explanation</p>
            </div>
          </div>
        </div>

        <div className="p-3 rounded-xl bg-slate-50 border border-slate-200 mb-4">
          <p className="text-[11px] text-slate-600 leading-relaxed">
            💡 <strong>Pro Tip:</strong> You can also use keyboard shortcuts: 
            <code className="bg-white px-1.5 py-0.5 rounded mx-1 font-mono text-[10px]">Space</code> 
            to flip, 
            <code className="bg-white px-1.5 py-0.5 rounded mx-1 font-mono text-[10px]">1</code> 
            for learning, 
            <code className="bg-white px-1.5 py-0.5 rounded mx-1 font-mono text-[10px]">2</code> 
            for mastered.
          </p>
        </div>

        <button
          onClick={onClose}
          className="w-full px-6 py-3 bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white rounded-xl font-bold text-sm shadow-lg shadow-indigo-500/25 transition-all active:scale-98"
        >
          Got it! Let's Study
        </button>

        <button
          onClick={onClose}
          className="absolute top-3 right-3 p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
          aria-label="Close tutorial"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};
