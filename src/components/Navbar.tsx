import React, { useState, useRef, useEffect } from 'react';
import {
  Brain,
  Layers,
  HelpCircle,
  FileText,
  Upload,
  ChevronDown,
  Plus,
  Trophy,
  CheckCircle2,
  Trash2,
  Sparkles,
  Smartphone,
  Search,
  BookOpen,
  X,
  FileCode,
  ArrowUpRight,
  Zap,
  Settings,
} from 'lucide-react';
import { StudyDeck, ViewMode, AppSettings } from '../types';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { PWAInstallModal } from './PWAInstallModal';
import { SettingsModal } from './SettingsModal';
import { ConnectionStatus } from './ConnectionStatus';

interface NavbarProps {
  currentView: ViewMode;
  onSelectView: (view: ViewMode) => void;
  decks: StudyDeck[];
  activeDeckId: string;
  onSelectDeck: (deckId: string) => void;
  onDeleteDeck?: (deckId: string) => void;
  onOpenOnboarding?: () => void;
  onDeckCreated?: (newDeck: StudyDeck) => void;
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onResetSettings: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onSelectView,
  decks,
  activeDeckId,
  onSelectDeck,
  onDeleteDeck,
  onOpenOnboarding,
  onDeckCreated,
  settings,
  onUpdateSetting,
  onResetSettings,
}) => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [deckSearchQuery, setDeckSearchQuery] = useState('');
  const [isInstallModalOpen, setIsInstallModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const importFileInputRef = useRef<HTMLInputElement>(null);

  const { isInstalled, isInstallable } = usePWAInstall();

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];

  const totalMastered = activeDeck
    ? activeDeck.flashcards.filter((c) => c.status === 'mastered').length
    : 0;
  const totalCards = activeDeck ? activeDeck.flashcards.length : 0;
  const masteryPct = totalCards > 0 ? Math.round((totalMastered / totalCards) * 100) : 0;

  // Handle outside click to close dropdown
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setDeleteConfirmId(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Keyboard navigation for view tabs (1, 2, 3, U)
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      // Don't intercept when user is typing in an input
      if (
        ['INPUT', 'TEXTAREA', 'SELECT'].includes(
          (document.activeElement?.tagName || '')
        )
      ) {
        return;
      }
      if (e.key === '1') {
        onSelectView('flashcards');
      } else if (e.key === '2') {
        onSelectView('quiz');
      } else if (e.key === '3') {
        onSelectView('deck-overview');
      } else if (e.key === '4') {
        onSelectView('settings');
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onSelectView]);

  const filteredDecks = decks.filter((deck) =>
    deck.title.toLowerCase().includes(deckSearchQuery.toLowerCase())
  );

  // Quick JSON backup import from dropdown
  const handleImportJsonFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        const deckToImport: StudyDeck = parsed.deck || (parsed.flashcards ? parsed : null);

        if (deckToImport && Array.isArray(deckToImport.flashcards)) {
          const freshDeck: StudyDeck = {
            ...deckToImport,
            id: `deck_imported_${Date.now()}`,
            title: deckToImport.title || file.name.replace(/\.[^/.]+$/, ''),
            createdAt: new Date().toISOString(),
          };
          if (onDeckCreated) {
            onDeckCreated(freshDeck);
            setDropdownOpen(false);
          }
        } else {
          alert('Invalid deck format. Please provide a CogniLearn JSON backup file.');
        }
      } catch (err) {
        alert('Could not parse JSON file. Please check the file formatting.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <>
      <ConnectionStatus />
      <header className="sticky top-0 z-40 bg-white/85 backdrop-blur-xl border-b border-slate-200/80 shadow-[0_4px_20px_-4px_rgba(0,0,0,0.03)] pt-[env(safe-area-inset-top)] transition-all">
        {/* Subtle Top Gradient Accent Strip */}
        <div className="h-[2.5px] w-full bg-gradient-to-r from-indigo-500 via-purple-500 to-violet-600 opacity-90 shadow-xs" />

        <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 sm:h-16 gap-2 sm:gap-4">

            {/* ================= LEFT: BRAND & DECK SELECTOR ================= */}
            <div className="flex items-center gap-2 sm:gap-3 shrink-0 min-w-0">

              {/* Brand Logo & Name */}
              <button
                type="button"
                onClick={() => onSelectView('deck-overview')}
                className="flex items-center gap-2.5 text-left group transition-transform active:scale-98 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 rounded-xl"
                title="CogniLearn Overview"
              >
                {/* Glowing Logo Icon */}
                <div className="relative">
                  <div className="absolute -inset-1 bg-gradient-to-tr from-indigo-600 via-purple-600 to-violet-600 rounded-2xl blur-xs opacity-60 group-hover:opacity-100 transition-opacity" />
                  <div className="relative w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white shadow-md shadow-indigo-500/30 group-hover:shadow-indigo-500/50 transition-shadow">
                    <Brain className="w-5 h-5 sm:w-5.5 sm:h-5.5 transition-transform duration-300 group-hover:scale-110" />
                  </div>
                </div>

                {/* Brand Typography */}
                <div className="hidden xs:block">
                  <div className="flex items-center gap-1.5">
                    <span className="font-black text-base sm:text-lg tracking-tight bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 bg-clip-text text-transparent">
                      CogniLearn
                    </span>
                    <span className="inline-flex items-center px-1.5 py-0.5 text-[9px] font-black tracking-wider uppercase bg-gradient-to-r from-indigo-50 to-purple-50 text-indigo-700 rounded-md border border-indigo-200/80 shadow-2xs">
                      AI Studio
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 font-medium hidden lg:block -mt-0.5 tracking-tight">
                    Smart Flashcards & Adaptive Quizzes
                  </p>
                </div>
              </button>

              {/* Vertical Divider */}
              <div className="hidden sm:block h-6 w-px bg-slate-200/80" />

              {/* ================= ACTIVE DECK SELECTOR DROPDOWN ================= */}
              {decks.length > 0 && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    onClick={() => {
                      setDropdownOpen(!dropdownOpen);
                      setDeckSearchQuery('');
                      setDeleteConfirmId(null);
                    }}
                    className={`flex items-center gap-2 px-2.5 py-1.5 rounded-xl border text-xs font-semibold max-w-[130px] xs:max-w-[160px] sm:max-w-[210px] md:max-w-[240px] transition-all shadow-2xs group focus:outline-none focus:ring-2 focus:ring-indigo-400 ${dropdownOpen
                        ? 'border-indigo-400 bg-white ring-2 ring-indigo-100 text-indigo-950'
                        : 'border-slate-200/90 hover:border-indigo-300 bg-slate-50/80 hover:bg-white text-slate-800'
                      }`}
                    title={activeDeck?.title || 'Switch Study Deck'}
                  >
                    {/* Live status dot */}
                    <span className="relative flex h-2 w-2 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500" />
                    </span>

                    <span className="truncate">{activeDeck?.title || 'Select Deck'}</span>

                    {/* Mastery Mini Pill */}
                    {totalCards > 0 && (
                      <span className="hidden sm:inline-flex text-[9px] px-1 py-0.2 rounded-md font-bold bg-indigo-50 text-indigo-700 border border-indigo-200/60 shrink-0">
                        {masteryPct}%
                      </span>
                    )}

                    <ChevronDown
                      className={`w-3.5 h-3.5 text-slate-400 shrink-0 ml-auto transition-transform duration-200 ${dropdownOpen ? 'rotate-180 text-indigo-600' : 'group-hover:text-slate-600'
                        }`}
                    />
                  </button>

                  {/* Dropdown Menu Modal Card */}
                  {dropdownOpen && (
                    <div className="absolute left-0 mt-2 w-80 sm:w-96 bg-white/95 backdrop-blur-2xl rounded-2xl shadow-2xl border border-slate-200/90 p-2.5 z-50 animate-in fade-in slide-in-from-top-2 duration-150">

                      {/* Search Header */}
                      <div className="pb-2.5 mb-1.5 border-b border-slate-100 flex items-center justify-between gap-2 px-0.5">
                        <div className="relative flex-1">
                          <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
                          <input
                            type="text"
                            placeholder="Search decks..."
                            value={deckSearchQuery}
                            onChange={(e) => setDeckSearchQuery(e.target.value)}
                            className="w-full pl-8 pr-7 py-1.5 rounded-xl bg-slate-50 border border-slate-200 text-xs focus:bg-white focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 outline-none transition-all placeholder:text-slate-400"
                            autoFocus
                          />
                          {deckSearchQuery && (
                            <button
                              onClick={() => setDeckSearchQuery('')}
                              className="absolute right-2 top-2 p-0.5 text-slate-400 hover:text-slate-600 rounded-md"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => {
                            setDropdownOpen(false);
                            onSelectView('upload');
                          }}
                          className="px-2.5 py-1.5 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs transition-colors shrink-0"
                          title="Create or Upload New Deck"
                        >
                          <Plus className="w-3 h-3" />
                          <span>New</span>
                        </button>
                      </div>

                      {/* Decks List Header */}
                      <div className="px-2 py-1 flex items-center justify-between text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                        <span>Study Decks ({filteredDecks.length})</span>
                        <span>Cards &bull; Mastery</span>
                      </div>

                      {/* Decks Scroll Area */}
                      <div className="max-h-64 overflow-y-auto py-1 space-y-1.5 pr-1">
                        {filteredDecks.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-400">
                            No study decks match &quot;{deckSearchQuery}&quot;.
                          </div>
                        ) : (
                          filteredDecks.map((deck) => {
                            const isSelected = deck.id === activeDeckId;
                            const mastered = deck.flashcards.filter((c) => c.status === 'mastered').length;
                            const total = deck.flashcards.length;
                            const pct = total > 0 ? Math.round((mastered / total) * 100) : 0;
                            const isConfirmingDelete = deleteConfirmId === deck.id;

                            return (
                              <div
                                key={deck.id}
                                className={`p-2.5 rounded-xl flex items-start justify-between gap-2.5 cursor-pointer transition-all ${isSelected
                                    ? 'bg-gradient-to-r from-indigo-50/90 via-indigo-50/50 to-white border border-indigo-200 text-indigo-950 font-bold shadow-2xs'
                                    : 'hover:bg-slate-50 text-slate-700 border border-transparent'
                                  }`}
                                onClick={() => {
                                  onSelectDeck(deck.id);
                                  setDropdownOpen(false);
                                  setDeleteConfirmId(null);
                                }}
                              >
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1.5">
                                    <span
                                      className={`w-2 h-2 rounded-full shrink-0 ${isSelected
                                          ? 'bg-indigo-600 ring-2 ring-indigo-200'
                                          : 'bg-slate-300'
                                        }`}
                                    />
                                    <p className="text-xs font-bold truncate leading-tight">
                                      {deck.title}
                                    </p>
                                  </div>

                                  <div className="flex items-center gap-2 mt-1.5 text-[11px] text-slate-500 pl-3.5">
                                    <span>{total} cards</span>
                                    <span>&bull;</span>
                                    <span>{deck.quiz.length} Qs</span>
                                    {pct > 0 && (
                                      <>
                                        <span>&bull;</span>
                                        <span className="text-emerald-600 font-bold">
                                          {pct}% mastered
                                        </span>
                                      </>
                                    )}
                                    {deck.stats?.bestQuizScore && deck.stats.bestQuizScore > 0 ? (
                                      <>
                                        <span>&bull;</span>
                                        <span className="text-amber-600 font-bold flex items-center gap-0.5">
                                          <Trophy className="w-2.5 h-2.5" />
                                          {deck.stats.bestQuizScore}%
                                        </span>
                                      </>
                                    ) : null}
                                  </div>

                                  {/* Mini Mastery Bar */}
                                  {total > 0 && (
                                    <div className="mt-1.5 ml-3.5 h-1 w-28 bg-slate-100 rounded-full overflow-hidden">
                                      <div
                                        className="h-full bg-gradient-to-r from-indigo-500 to-emerald-500 rounded-full transition-all duration-300"
                                        style={{ width: `${pct}%` }}
                                      />
                                    </div>
                                  )}
                                </div>

                                {/* Delete Deck Action */}
                                {decks.length > 1 && onDeleteDeck && (
                                  <div className="shrink-0 pt-0.5" onClick={(e) => e.stopPropagation()}>
                                    {isConfirmingDelete ? (
                                      <div className="flex items-center gap-1">
                                        <button
                                          type="button"
                                          onClick={() => {
                                            onDeleteDeck(deck.id);
                                            setDeleteConfirmId(null);
                                          }}
                                          className="px-2 py-0.5 bg-rose-600 hover:bg-rose-700 text-white rounded text-[10px] font-bold"
                                        >
                                          Delete
                                        </button>
                                        <button
                                          type="button"
                                          onClick={() => setDeleteConfirmId(null)}
                                          className="p-1 text-slate-400 hover:text-slate-600"
                                        >
                                          <X className="w-3 h-3" />
                                        </button>
                                      </div>
                                    ) : (
                                      <button
                                        type="button"
                                        onClick={() => setDeleteConfirmId(deck.id)}
                                        className="opacity-40 hover:opacity-100 text-slate-400 hover:text-rose-600 p-1 rounded-md transition-all"
                                        title="Delete study deck"
                                      >
                                        <Trash2 className="w-3.5 h-3.5" />
                                      </button>
                                    )}
                                  </div>
                                )}
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown Quick Import Actions */}
                      <div className="mt-2 pt-2 border-t border-slate-100 flex items-center justify-between text-xs px-1">
                        <button
                          type="button"
                          onClick={() => importFileInputRef.current?.click()}
                          className="flex items-center gap-1.5 text-[11px] font-bold text-slate-500 hover:text-indigo-600 py-1 transition-colors"
                        >
                          <FileCode className="w-3.5 h-3.5 text-indigo-500" />
                          <span>Import JSON</span>
                        </button>

                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => {
                              setDropdownOpen(false);
                              onSelectView('settings');
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-slate-500 hover:text-indigo-600 py-1 transition-colors"
                          >
                            <Settings className="w-3 h-3 text-slate-400" />
                            <span>Settings</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => {
                              setDropdownOpen(false);
                              onSelectView('deck-overview');
                            }}
                            className="flex items-center gap-1 text-[11px] font-bold text-indigo-600 hover:text-indigo-800 py-1"
                          >
                            <span>Manage All</span>
                            <ArrowUpRight className="w-3 h-3" />
                          </button>
                        </div>
                      </div>

                      <input
                        type="file"
                        ref={importFileInputRef}
                        onChange={handleImportJsonFile}
                        accept=".json,application/json"
                        className="hidden"
                      />
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* ================= CENTER: MODERN SEGMENTED CAPSULE DOCK (DESKTOP) ================= */}
            <nav className="hidden md:flex items-center bg-slate-100/80 backdrop-blur-md p-1 rounded-2xl border border-slate-200/80 shadow-inner">

              {/* Flashcards View Tab */}
              <button
                type="button"
                onClick={() => onSelectView('flashcards')}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${currentView === 'flashcards'
                    ? 'bg-white text-indigo-700 shadow-sm shadow-indigo-500/10 ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                title="Practice Flashcards (Shortcut: 1)"
              >
                <Layers
                  className={`w-4 h-4 transition-colors ${currentView === 'flashcards' ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                />
                <span>Flashcards</span>
                {activeDeck && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold transition-colors ${currentView === 'flashcards'
                        ? 'bg-indigo-100 text-indigo-700'
                        : 'bg-slate-200/80 text-slate-600'
                      }`}
                  >
                    {activeDeck.flashcards.length}
                  </span>
                )}
                <span className="hidden xl:inline text-[9px] text-slate-300 font-normal">1</span>
              </button>

              {/* Take Quiz View Tab */}
              <button
                type="button"
                onClick={() => onSelectView('quiz')}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${currentView === 'quiz'
                    ? 'bg-white text-violet-700 shadow-sm shadow-violet-500/10 ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                title="Take Diagnostic Quiz (Shortcut: 2)"
              >
                <HelpCircle
                  className={`w-4 h-4 transition-colors ${currentView === 'quiz' ? 'text-violet-600' : 'text-slate-400'
                    }`}
                />
                <span>Take Quiz</span>
                {activeDeck && (
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-md font-bold transition-colors ${currentView === 'quiz'
                        ? 'bg-violet-100 text-violet-700'
                        : 'bg-slate-200/80 text-slate-600'
                      }`}
                  >
                    {activeDeck.quiz.length} Qs
                  </span>
                )}
                <span className="hidden xl:inline text-[9px] text-slate-300 font-normal">2</span>
              </button>

              {/* Overview & Notes View Tab */}
              <button
                type="button"
                onClick={() => onSelectView('deck-overview')}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${currentView === 'deck-overview'
                    ? 'bg-white text-slate-900 shadow-sm ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                title="Deck Overview & Notes (Shortcut: 3)"
              >
                <FileText
                  className={`w-4 h-4 transition-colors ${currentView === 'deck-overview' ? 'text-slate-800' : 'text-slate-400'
                    }`}
                />
                <span>Overview & Notes</span>
                <span className="hidden xl:inline text-[9px] text-slate-300 font-normal">3</span>
              </button>

              {/* Settings View Tab in Nav Bar */}
              <button
                type="button"
                onClick={() => onSelectView('settings')}
                className={`relative flex items-center gap-2 px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all duration-200 ${currentView === 'settings'
                    ? 'bg-white text-indigo-700 shadow-sm ring-1 ring-slate-900/5'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/50'
                  }`}
                title="Settings & Study Preferences (Shortcut: 4)"
              >
                <Settings
                  className={`w-4 h-4 transition-colors ${currentView === 'settings' ? 'text-indigo-600' : 'text-slate-400'
                    }`}
                />
                <span>Settings</span>
                <span className="hidden xl:inline text-[9px] text-slate-300 font-normal">4</span>
              </button>
            </nav>

            {/* ================= RIGHT: STATS, TOUR, PWA & UPLOAD CTA ================= */}
            <div className="flex items-center gap-1.5 sm:gap-2.5">

              {/* Quick Mastery Badge (Desktop) */}
              {activeDeck && totalCards > 0 && (
                <div
                  className="hidden xl:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-gradient-to-r from-emerald-50 to-teal-50/60 border border-emerald-200/80 text-emerald-900 text-xs font-bold shadow-2xs"
                  title={`${totalMastered} of ${totalCards} flashcards mastered`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                  <span>{masteryPct}% Mastered</span>
                  <div className="w-12 h-1.5 bg-emerald-200/70 rounded-full overflow-hidden ml-0.5">
                    <div
                      className="h-full bg-emerald-600 rounded-full"
                      style={{ width: `${masteryPct}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Primary CTA: Upload Document */}
              <button
                type="button"
                onClick={() => onSelectView('upload')}
                className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-xl text-xs font-extrabold shadow-md transition-all active:scale-95 ${currentView === 'upload'
                    ? 'bg-indigo-800 text-white ring-2 ring-indigo-400/40 shadow-indigo-600/30'
                    : 'bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:-translate-y-0.5'
                  }`}
                title="Upload Document to Create Flashcards & Quiz"
              >
                <Upload className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Upload Doc</span>
                <span className="sm:hidden font-bold">Upload</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* PWA Install Guide Modal */}
      <PWAInstallModal
        isOpen={isInstallModalOpen}
        onClose={() => setIsInstallModalOpen(false)}
      />

      {/* Settings & Preferences Modal */}
      <SettingsModal
        isOpen={isSettingsModalOpen}
        onClose={() => setIsSettingsModalOpen(false)}
        settings={settings}
        onUpdateSetting={onUpdateSetting}
        onResetSettings={onResetSettings}
        onOpenOnboarding={onOpenOnboarding}
        decks={decks}
      />
    </>
  );
};
