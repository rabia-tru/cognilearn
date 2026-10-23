import React, { useState } from 'react';
import {
  Settings,
  Sliders,
  Volume2,
  Clock,
  Sparkles,
  Smartphone,
  Download,
  RotateCcw,
  Flame,
  CheckCircle2,
  ShieldCheck,
  FileCode,
  BookOpen,
  ArrowRight,
  HardDrive,
  Check,
  Wifi,
  WifiOff,
  RefreshCw,
  Globe,
} from 'lucide-react';
import { AppSettings, StudyDeck } from '../types';
import {
  detectWorkingHost,
  DEFAULT_LAN_IP,
  getActiveBackendUrl,
  getCandidateHosts,
  setManualBackendUrl,
  clearManualBackendUrl,
} from '../utils/api';

interface SettingsViewProps {
  settings: AppSettings;
  onUpdateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => void;
  onResetSettings: () => void;
  onOpenOnboarding?: () => void;
  decks: StudyDeck[];
  onGoToFlashcards: () => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  settings,
  onUpdateSetting,
  onResetSettings,
  onOpenOnboarding,
  decks,
  onGoToFlashcards,
}) => {
  const [testSpeechPlaying, setTestSpeechPlaying] = useState(false);
  const [copiedBackup, setCopiedBackup] = useState(false);
  const [serverUrl, setServerUrl] = useState<string>(
    localStorage.getItem('cognilearn_backend_url') || ''
  );
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'testing' | 'ok' | 'fail'>('idle');
  const [detectedHost, setDetectedHost] = useState<string>('');

  const handleTestConnection = async () => {
    setConnectionStatus('testing');
    setDetectedHost('');
    const host = await detectWorkingHost();
    if (host) {
      setConnectionStatus('ok');
      setDetectedHost(host);
    } else {
      setConnectionStatus('fail');
    }
  };

  const handleSaveServerUrl = () => {
    const trimmed = serverUrl.trim();
    if (!trimmed) {
      clearManualBackendUrl();
      setServerUrl('');
      return;
    }
    const normalized = setManualBackendUrl(trimmed);
    setServerUrl(normalized || trimmed);
  };

  const testTTSVoice = (rate: number) => {
    if (!('speechSynthesis' in window)) {
      alert('Speech synthesis is not supported on this device/browser.');
      return;
    }
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance('CogniLearn audio test. Active recall enabled.');
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
    <div className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-10 animate-in fade-in duration-200">
      {/* Header section */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-6 border-b border-slate-200/80">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center shadow-xs">
            <Settings className="w-5 h-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight">
              Settings & Preferences
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 font-normal mt-0.5">
              Customize your active recall mechanics, voice synthesis, and study goals
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={onGoToFlashcards}
          className="self-start sm:self-auto px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-colors"
        >
          <span>Return to Cards</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* ================= 1. STUDY MECHANICS ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Study & Recall Mechanics
              </h2>
            </div>

            {/* Daily Card Goal */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700 flex items-center gap-1.5">
                  <Flame className="w-3.5 h-3.5 text-amber-500" />
                  <span>Daily Study Target</span>
                </span>
                <span className="font-bold text-indigo-600">
                  {settings.dailyGoalCards} cards / day
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[10, 20, 30, 50].map((goal) => (
                  <button
                    key={goal}
                    type="button"
                    onClick={() => onUpdateSetting('dailyGoalCards', goal)}
                    className={`py-2 px-1 text-xs font-semibold rounded-xl transition-all ${
                      settings.dailyGoalCards === goal
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-600 border border-slate-200/70'
                    }`}
                  >
                    {goal} cards
                  </button>
                ))}
              </div>
            </div>

            {/* Switches */}
            <div className="space-y-4 pt-1">
              {/* Auto advance on rate */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Auto-Advance on Card Rating</p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Instantly move to next flashcard when marked Mastered or Learning
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
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                      settings.autoAdvanceOnRate ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Auto reveal mnemonics */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Auto-Reveal Mnemonic Hints</p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Display memory clues without needing to click the hint button
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
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                      settings.showMnemonicsByDefault ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Haptic feedback */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-800 flex items-center gap-1.5">
                    <span>Mobile Haptic Feedback</span>
                    <Smartphone className="w-3.5 h-3.5 text-slate-400" />
                  </p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Subtle vibration feedback when swiping cards on mobile
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
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                      settings.hapticFeedback ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 2. AUDIO & SPEECH SYNTHESIS ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Audio & Speech Synthesis
              </h2>
            </div>

            {/* Speech rate */}
            <div className="mb-5">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">Speech Rate</span>
                <button
                  type="button"
                  onClick={() => testTTSVoice(settings.speechRate)}
                  className="text-[11px] font-semibold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 px-2 py-0.5 rounded-lg bg-indigo-50 transition-colors"
                >
                  <Volume2 className="w-3 h-3" />
                  <span>{testSpeechPlaying ? 'Playing...' : 'Test Voice'}</span>
                </button>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: '0.8x', sub: 'Slow', val: 0.8 },
                  { label: '1.0x', sub: 'Normal', val: 1.0 },
                  { label: '1.25x', sub: 'Brisk', val: 1.25 },
                  { label: '1.5x', sub: 'Fast', val: 1.5 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => {
                      onUpdateSetting('speechRate', item.val);
                      testTTSVoice(item.val);
                    }}
                    className={`py-2 px-1 rounded-xl text-center transition-all ${
                      settings.speechRate === item.val
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-70">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Audio Toggles */}
            <div className="space-y-4 pt-1">
              {/* Auto speak answer */}
              <div className="flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Auto-Read on Card Flip</p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Pronounce the answer aloud automatically using speech synthesis
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
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                      settings.autoFlipTTS ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>

              {/* Sound & Confetti celebration */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-100">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Celebration Milestones</p>
                  <p className="text-[11px] text-slate-500 leading-normal">
                    Visual confetti particles upon scoring 100% or completing all cards
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
                    className={`w-4 h-4 rounded-full bg-white shadow-xs transition-transform ${
                      settings.soundEffects ? 'translate-x-5' : 'translate-x-0'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* ================= 3. QUIZ SPEED & TIMER ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <Clock className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Quiz Timing & Challenge
              </h2>
            </div>

            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-2">
                <span className="font-semibold text-slate-700">Question Countdown Timer</span>
                <span className="font-bold text-indigo-600">
                  {settings.quizTimerSeconds === 0 ? 'Untimed (Relaxed)' : `${settings.quizTimerSeconds}s per question`}
                </span>
              </div>
              <div className="grid grid-cols-4 gap-2">
                {[
                  { label: 'Off', sub: 'Untimed', val: 0 },
                  { label: '30s', sub: 'Rapid', val: 30 },
                  { label: '45s', sub: 'Standard', val: 45 },
                  { label: '60s', sub: 'Exam', val: 60 },
                ].map((item) => (
                  <button
                    key={item.val}
                    type="button"
                    onClick={() => onUpdateSetting('quizTimerSeconds', item.val)}
                    className={`py-2 px-1 rounded-xl text-center transition-all ${
                      settings.quizTimerSeconds === item.val
                        ? 'bg-indigo-600 text-white shadow-xs'
                        : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200/70'
                    }`}
                  >
                    <div className="text-xs font-bold">{item.label}</div>
                    <div className="text-[10px] opacity-70">{item.sub}</div>
                  </button>
                ))}
              </div>
            </div>

            <p className="text-[11px] text-slate-500 leading-normal bg-slate-50 rounded-xl p-3 border border-slate-200/60">
              Enabling the question timer simulates realistic exam pressure and builds quick active retrieval skills.
            </p>
          </div>
        </div>

        {/* ================= 4. SERVER CONNECTION ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col gap-4 md:col-span-2">
          <div className="flex items-center gap-2 pb-3 border-b border-slate-100">
            <Globe className="w-4 h-4 text-indigo-600" />
            <h2 className="text-sm font-bold text-slate-900 tracking-tight">Backend Server Connection</h2>
            <span className="ml-auto text-[10px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
              Mobile Setup
            </span>
          </div>

          <p className="text-[11px] text-slate-500 leading-relaxed">
            The app talks to your PC backend server to generate flashcards, quizzes, and Feynman explanations.
            The address is <strong>hardcoded</strong> ({DEFAULT_LAN_IP}) and the app probes it automatically - keep the phone on the
            <strong> same Wi-Fi</strong> as your PC, or connect via <strong>USB</strong> with <code>adb reverse tcp:3000 tcp:3000</code>.
            If the PC IP changes, set it below once and it is remembered.
          </p>

          <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/70 text-[10px] text-slate-600 space-y-1">
            <p>
              <span className="font-bold text-slate-700">Currently using:</span>{' '}
              <span className="font-mono text-indigo-700">{getActiveBackendUrl()}</span>
            </p>
            <p>
              <span className="font-bold text-slate-700">Auto-probed in order:</span>{' '}
              <span className="font-mono">{getCandidateHosts().join('  →  ')}</span>
            </p>
          </div>

          {/* Auto Detect */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              disabled={connectionStatus === 'testing'}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-xs font-semibold shadow-xs shadow-indigo-500/20 transition-colors"
            >
              {connectionStatus === 'testing'
                ? <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                : <Wifi className="w-3.5 h-3.5" />
              }
              {connectionStatus === 'testing' ? 'Detecting...' : 'Auto-Detect Server'}
            </button>

            {connectionStatus === 'ok' && (
              <div className="flex items-center gap-1.5 text-emerald-700 text-xs font-semibold">
                <CheckCircle2 className="w-4 h-4" />
                Connected via <span className="font-mono bg-emerald-50 px-1.5 py-0.5 rounded-md border border-emerald-200">{detectedHost}</span>
              </div>
            )}
            {connectionStatus === 'fail' && (
              <div className="flex items-center gap-1.5 text-rose-600 text-xs font-semibold">
                <WifiOff className="w-4 h-4" />
                Could not reach server. Is it running? Try USB cable.
              </div>
            )}
          </div>

          {/* Manual URL Override */}
          <div>
            <p className="text-[11px] font-semibold text-slate-700 mb-1.5">Manual Server URL (override)</p>
            <div className="flex gap-2">
              <input
                type="text"
                value={serverUrl}
                onChange={(e) => setServerUrl(e.target.value)}
                placeholder={`e.g. http://${DEFAULT_LAN_IP}`}
                className="flex-1 text-xs px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-slate-800 placeholder-slate-400 font-mono"
              />
              <button
                type="button"
                onClick={handleSaveServerUrl}
                className="px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold shadow-xs shadow-indigo-500/20 transition-colors shrink-0"
              >
                Save
              </button>
              {serverUrl && (
                <button
                  type="button"
                  onClick={() => { clearManualBackendUrl(); setServerUrl(''); }}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 text-xs font-semibold transition-colors shrink-0"
                >
                  Clear
                </button>
              )}
            </div>
            <p className="text-[10px] text-slate-400 mt-1">
              Leave blank to auto-detect. Set to your PC's Wi-Fi IP if auto-detect fails.
            </p>
          </div>
        </div>

        {/* ================= 5. DATA & SYSTEM BACKUP ================= */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-100">
              <HardDrive className="w-4 h-4 text-indigo-600" />
              <h2 className="text-sm font-bold text-slate-900 tracking-tight">
                Storage & Data Management
              </h2>
            </div>

            <div className="space-y-3">
              <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
                <div>
                  <p className="text-xs font-semibold text-slate-900">Export All Decks Backup</p>
                  <p className="text-[11px] text-slate-500">
                    {decks.length} study decks saved locally
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleExportAllDecks}
                  className="px-3 py-1.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs shadow-indigo-500/20 transition-colors shrink-0"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download JSON</span>
                </button>
              </div>

              {onOpenOnboarding && (
                <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-xs font-semibold text-slate-900">App Onboarding Guide</p>
                    <p className="text-[11px] text-slate-500">
                      Revisit the 4-step walkthrough
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={onOpenOnboarding}
                    className="px-3 py-1.5 rounded-xl border border-slate-200 hover:bg-white text-slate-700 text-xs font-semibold flex items-center gap-1.5 transition-colors shrink-0"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View Guide</span>
                  </button>
                </div>
              )}
            </div>

            <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all app settings to default?')) {
                    onResetSettings();
                  }
                }}
                className="text-xs font-semibold text-rose-600 hover:text-rose-700 flex items-center gap-1 transition-colors"
              >
                <RotateCcw className="w-3 h-3" />
                <span>Reset Settings to Defaults</span>
              </button>

              <span className="text-[11px] text-slate-400 font-medium">
                CogniLearn v2.4
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
