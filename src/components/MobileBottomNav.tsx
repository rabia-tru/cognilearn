import React from 'react';
import { Layers, HelpCircle, FileText, Plus, Settings } from 'lucide-react';
import { StudyDeck, ViewMode } from '../types';

interface MobileBottomNavProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  activeDeck?: StudyDeck;
}

export const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
  currentView,
  onSelectView,
  activeDeck,
}) => {
  const cardCount = activeDeck ? activeDeck.flashcards.length : 0;
  const quizCount = activeDeck ? activeDeck.quiz.length : 0;

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 px-3 pb-[calc(0.5rem+env(safe-area-inset-bottom))] pt-1 pointer-events-none">
      <div className="max-w-md mx-auto pointer-events-auto bg-white/92 backdrop-blur-xl border border-slate-200/90 shadow-[0_8px_30px_rgb(0,0,0,0.10)] rounded-3xl px-2 py-1.5 flex items-center justify-around">
        {/* Flashcards Tab */}
        <button
          type="button"
          onClick={() => onSelectView('flashcards')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all relative group ${
            currentView === 'flashcards'
              ? 'text-indigo-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <Layers
              className={`w-5 h-5 transition-transform ${
                currentView === 'flashcards' ? 'scale-110 text-indigo-600' : 'text-slate-500'
              }`}
            />
            {cardCount > 0 && (
              <span
                className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[9px] font-black rounded-full shadow-2xs transition-colors ${
                  currentView === 'flashcards'
                    ? 'bg-indigo-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {cardCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Cards</span>
          {currentView === 'flashcards' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Quiz Tab */}
        <button
          type="button"
          onClick={() => onSelectView('quiz')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all relative group ${
            currentView === 'quiz'
              ? 'text-violet-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <div className="relative">
            <HelpCircle
              className={`w-5 h-5 transition-transform ${
                currentView === 'quiz' ? 'scale-110 text-violet-600' : 'text-slate-500'
              }`}
            />
            {quizCount > 0 && (
              <span
                className={`absolute -top-1.5 -right-2.5 px-1.5 py-0.2 text-[9px] font-black rounded-full shadow-2xs transition-colors ${
                  currentView === 'quiz'
                    ? 'bg-violet-600 text-white'
                    : 'bg-slate-200 text-slate-700'
                }`}
              >
                {quizCount}
              </span>
            )}
          </div>
          <span className="text-[10px] mt-1 tracking-tight">Quiz</span>
          {currentView === 'quiz' && (
            <span className="w-1.5 h-1.5 rounded-full bg-violet-600 mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Center Floating Action Tab: Upload / New Deck */}
        <button
          type="button"
          onClick={() => onSelectView('upload')}
          className="flex flex-col items-center justify-center -mt-5 group"
        >
          <div className="relative">
            <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-600 to-violet-600 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition-opacity" />
            <div
              className={`relative w-11 h-11 rounded-2xl flex items-center justify-center shadow-lg transition-transform active:scale-95 ${
                currentView === 'upload'
                  ? 'bg-gradient-to-tr from-indigo-700 to-violet-700 text-white ring-2 ring-white shadow-indigo-500/40'
                  : 'bg-gradient-to-tr from-indigo-600 to-violet-600 text-white shadow-indigo-500/30'
              }`}
            >
              <Plus className="w-5 h-5 transition-transform group-hover:rotate-90 duration-200" />
            </div>
          </div>
          <span
            className={`text-[10px] mt-1 font-extrabold tracking-tight ${
              currentView === 'upload' ? 'text-indigo-600' : 'text-slate-500'
            }`}
          >
            New
          </span>
        </button>

        {/* Deck Notes / Overview */}
        <button
          type="button"
          onClick={() => onSelectView('deck-overview')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all relative ${
            currentView === 'deck-overview'
              ? 'text-slate-900 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <FileText
            className={`w-5 h-5 transition-transform ${
              currentView === 'deck-overview' ? 'scale-110 text-slate-900' : 'text-slate-500'
            }`}
          />
          <span className="text-[10px] mt-1 tracking-tight">Notes</span>
          {currentView === 'deck-overview' && (
            <span className="w-1.5 h-1.5 rounded-full bg-slate-900 mt-0.5 animate-pulse" />
          )}
        </button>

        {/* Settings Tab */}
        <button
          type="button"
          onClick={() => onSelectView('settings')}
          className={`flex flex-col items-center justify-center flex-1 py-1 px-1 rounded-2xl transition-all relative ${
            currentView === 'settings'
              ? 'text-indigo-600 font-extrabold'
              : 'text-slate-500 hover:text-slate-800 font-medium'
          }`}
        >
          <Settings
            className={`w-5 h-5 transition-transform ${
              currentView === 'settings' ? 'scale-110 text-indigo-600' : 'text-slate-500'
            }`}
          />
          <span className="text-[10px] mt-1 tracking-tight">Settings</span>
          {currentView === 'settings' && (
            <span className="w-1.5 h-1.5 rounded-full bg-indigo-600 mt-0.5 animate-pulse" />
          )}
        </button>
      </div>
    </nav>
  );
};
