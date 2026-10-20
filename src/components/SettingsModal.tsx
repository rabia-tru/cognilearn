import React, { useState } from 'react';
import {
  Settings,
  X,
  Volume2,
  Clock,
  Sparkles,
  Smartphone,
  RotateCcw,
  Download,
  BookOpen,
  Check,
  Vibrate,
  Sliders,
  ShieldCheck,
  Flame,
  HelpCircle,
  FileCode,
} from 'lucide-react';
import { AppSettings, StudyDeck } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onResetSettings: () => void;
  onOpenOnboarding?: () => void;
  decks: StudyDeck[];
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSetting,
  onResetSettings,
  onOpenOnboarding,
  decks,
}) => {
  const [activeTab, setActiveTab] = useState<'study' | 'audio' | 'data'>('study');
  const [testSpeechPlaying, setTestSpeechPlaying] = useState(false);

  if (!isOpen) return null;

  const testTTSVoice = (rate: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('CogniLearn audio ready! Practice with active recall.');
    utterance.rate = rate;
    utterance.onend = () => setTestSpeechPlaying(false);
    utterance.onerror = () => setTestSpeechPlaying(false);
    setTestSpeechPlaying(true);
    window.speechSynthesis.speak(utterance);
  };

  const handleExportAllDecks = () => {
    const data = {
      app: 'CogniLearn',
      version: '2.4',
      exportedAt: new Date().toISOString(),
      decksCount: decks.length,
      decks,
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `CogniLearn_Full_Backup_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-200/90 overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-slate-50/80">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
                <span>App Settings</span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                  Preferences
                </span>
              </h2>
              <p className="text-[11px] text-slate-500 font-medium -mt-0.5">
                Customize flashcard mechanics, speech audio, and study goals
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-200/60 rounded-xl transition-colors"
            title="Close Settings"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-100 px-6 bg-white gap-4">
          <button
            type="button"
            onClick={() => setActiveTab('study')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'study'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Study & Quiz</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('audio')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'audio'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>Audio & Speech</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('data')}
            className={`py-3 text-xs font-bold border-b-2 transition-all flex items-center gap-1.5 ${
              activeTab === 'data'
                ? 'border-indigo-600 text-indigo-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <FileCode className="w-3.5 h-3.5" />
            <span>Backup & Storage</span>
          </button>
        </div>

        {/* Content Area */}
        <div className="p-6 overflow-y-auto space-y-6 flex-1">
          {/* ================= TAB: STUDY & QUIZ ================= */}
          {activeTab === 'study' && (
            <div className="space-y-5">
              {/* Daily Target Goal */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-bold text-slate-800">Daily Study Target</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600">
                    {settings.dailyGoalCards} cards / day
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[10, 20, 30, 50].map((goal) => (
                    <button
                      key={goal}
                      type="button"
                      onClick={() => onUpdateSetting('dailyGoalCards', goal)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                        settings.dailyGoalCards === goal
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {goal} cards
                    </button>
                  ))}
                </div>
              </div>

              {/* Quiz Timer Setting */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">Quiz Timer Speed</span>
                  </div>
                  <span className="text-xs font-extrabold text-indigo-600">
                    {settings.quizTimerSeconds === 0 ? 'Untimed (Relaxed)' : `${settings.quizTimerSeconds}s per question`}
                  </span>
                </div>
                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: 'Off', val: 0 },
                    { label: '30s', val: 30 },
                    { label: '45s', val: 45 },
                    { label: '60s', val: 60 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => onUpdateSetting('quizTimerSeconds', item.val)}
                      className={`py-1.5 px-2 rounded-xl text-xs font-bold transition-all ${
                        settings.quizTimerSeconds === item.val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Toggles */}
              <div className="space-y-3 divide-y divide-slate-100">
                {/* Auto-advance on card rating */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Auto-Advance on Rating</p>
                    <p className="text-[11px] text-slate-500">
                      Instantly glide to next card when marked as Mastered or Learning
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSetting('autoAdvanceOnRate', !settings.autoAdvanceOnRate)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                      settings.autoAdvanceOnRate ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.autoAdvanceOnRate ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Auto-expand Mnemonic Hints */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Auto-Reveal Mnemonic Hints</p>
                    <p className="text-[11px] text-slate-500">
                      Display memory hooks and clues without having to click lightbulb
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      onUpdateSetting('showMnemonicsByDefault', !settings.showMnemonicsByDefault)
                    }
                    className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                      settings.showMnemonicsByDefault ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.showMnemonicsByDefault ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Mobile Haptic feedback */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <span>Vibration & Haptics</span>
                      <Smartphone className="w-3 h-3 text-slate-400" />
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Subtle phone vibration when swiping or answering cards
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSetting('hapticFeedback', !settings.hapticFeedback)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                      settings.hapticFeedback ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: AUDIO & SPEECH ================= */}
          {activeTab === 'audio' && (
            <div className="space-y-5">
              {/* Speech Voice Speed */}
              <div className="p-4 rounded-2xl bg-slate-50/80 border border-slate-200/80 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Volume2 className="w-4 h-4 text-indigo-600" />
                    <span className="text-xs font-bold text-slate-800">TTS Speech Speed</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => testTTSVoice(settings.speechRate)}
                    className="text-[11px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-lg transition-colors"
                  >
                    <Volume2 className="w-3 h-3" />
                    <span>{testSpeechPlaying ? 'Playing...' : 'Test Voice'}</span>
                  </button>
                </div>

                <div className="grid grid-cols-4 gap-2">
                  {[
                    { label: '0.8x (Slow)', val: 0.8 },
                    { label: '1.0x (Normal)', val: 1.0 },
                    { label: '1.25x (Brisk)', val: 1.25 },
                    { label: '1.5x (Fast)', val: 1.5 },
                  ].map((item) => (
                    <button
                      key={item.val}
                      type="button"
                      onClick={() => {
                        onUpdateSetting('speechRate', item.val);
                        testTTSVoice(item.val);
                      }}
                      className={`py-2 px-1 rounded-xl text-xs font-bold transition-all text-center ${
                        settings.speechRate === item.val
                          ? 'bg-indigo-600 text-white shadow-xs'
                          : 'bg-white hover:bg-slate-100 text-slate-700 border border-slate-200'
                      }`}
                    >
                      {item.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Audio Toggles */}
              <div className="space-y-3 divide-y divide-slate-100">
                {/* Auto read on flip */}
                <div className="flex items-center justify-between pt-1">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Auto-Read Answer on Card Flip</p>
                    <p className="text-[11px] text-slate-500">
                      Automatically pronounce the definition aloud with speech synthesis
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSetting('autoFlipTTS', !settings.autoFlipTTS)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                      settings.autoFlipTTS ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.autoFlipTTS ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>

                {/* Celebratory Sound & Confetti */}
                <div className="flex items-center justify-between pt-3">
                  <div>
                    <p className="text-xs font-bold text-slate-800">Celebration Confetti Effects</p>
                    <p className="text-[11px] text-slate-500">
                      Blast confetti particles when mastering 100% or completing quizzes
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onUpdateSetting('soundEffects', !settings.soundEffects)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors relative shrink-0 ${
                      settings.soundEffects ? 'bg-indigo-600' : 'bg-slate-200'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ================= TAB: DATA & STORAGE ================= */}
          {activeTab === 'data' && (
            <div className="space-y-4">
              {/* Full Library Backup */}
              <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 flex items-center justify-between gap-3">
                <div>
                  <h4 className="text-xs font-bold text-indigo-950">Export Complete Library Backup</h4>
                  <p className="text-[11px] text-indigo-700/80">
                    Download all {decks.length} study decks and test history as a single JSON file.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAllDecks}
                  className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download Backup</span>
                </button>
              </div>

              {/* Relaunch Onboarding Tour */}
              {onOpenOnboarding && (
                <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900">App Onboarding Walkthrough</h4>
                    <p className="text-[11px] text-slate-500">
                      Review the 4-step guide on document ingestion, 3D cards, and Feynman tutor.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onOpenOnboarding();
                    }}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Guide</span>
                  </button>
                </div>
              )}

              {/* Reset Preferences */}
              <div className="pt-2">
                <button
                  type="button"
                  onClick={() => {
                    if (confirm('Reset all app preferences to standard defaults?')) {
                      onResetSettings();
                    }
                  }}
                  className="text-xs font-bold text-rose-600 hover:text-rose-700 flex items-center gap-1.5 py-1.5 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Reset All Settings to Factory Defaults</span>
                </button>
              </div>

              {/* App Specs Pill */}
              <div className="p-3 rounded-xl bg-slate-100 text-[11px] text-slate-500 flex items-center justify-between">
                <span>CogniLearn v2.4 (PWA Offline)</span>
                <span>Gemini 3.8 Flash Engine</span>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
          <span className="text-[11px] text-slate-400 font-medium">
            Settings auto-saved to local browser storage
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs shadow-md shadow-indigo-500/20 transition-all"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
