import React, { useState, useEffect } from 'react';
import { Brain, Sparkles } from 'lucide-react';

interface SplashScreenProps {
  onFinish: () => void;
  durationMs?: number;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({
  onFinish,
  durationMs = 1800,
}) => {
  const [phase, setPhase] = useState<'entering' | 'loading' | 'exiting'>('entering');
  const [progress, setProgress] = useState(15);
  const [statusText, setStatusText] = useState('Initializing study engine...');

  useEffect(() => {
    // Stage 1: loading progression
    const timer1 = setTimeout(() => {
      setPhase('loading');
      setProgress(55);
      setStatusText('Syncing local study decks & flashcards...');
    }, 450);

    const timer2 = setTimeout(() => {
      setProgress(95);
      setStatusText('Ready to learn!');
    }, 1100);

    // Stage 2: start fade-out exit transition
    const exitTimer = setTimeout(() => {
      setPhase('exiting');
      setProgress(100);
    }, durationMs - 400);

    // Stage 3: finish and unmount
    const finishTimer = setTimeout(() => {
      onFinish();
    }, durationMs);

    return () => {
      clearTimeout(timer1);
      clearTimeout(timer2);
      clearTimeout(exitTimer);
      clearTimeout(finishTimer);
    };
  }, [durationMs, onFinish]);

  return (
    <div
      onClick={onFinish}
      className={`fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-gradient-to-b from-slate-50 via-white to-indigo-50/70 text-slate-800 select-none transition-all duration-400 ease-out cursor-pointer ${
        phase === 'exiting' ? 'opacity-0 scale-102 pointer-events-none' : 'opacity-100 scale-100'
      }`}
    >
      {/* Top subtle badge */}
      <div className="w-full flex justify-between items-center text-xs text-slate-500 font-medium">
        <span className="flex items-center gap-1.5 text-indigo-600 font-bold uppercase tracking-wider text-[10px]">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          <span>AI Active Recall</span>
        </span>
        <span className="text-[10px] text-slate-400">Tap to skip</span>
      </div>

      {/* Center Brand Identity with Glow Animation */}
      <div className="flex flex-col items-center text-center my-auto">
        <div className="relative mb-6">
          {/* Ambient Glow */}
          <div className="absolute -inset-4 bg-gradient-to-r from-indigo-500/20 via-purple-500/20 to-violet-600/20 rounded-3xl blur-xl opacity-70 animate-pulse" />

          {/* App Logo Squircle */}
          <div className="relative w-24 h-24 sm:w-28 sm:h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 p-0.5 shadow-xl shadow-indigo-500/25 flex items-center justify-center transform hover:scale-105 transition-transform">
            <div className="w-full h-full rounded-[22px] bg-gradient-to-tr from-indigo-600 via-indigo-700 to-violet-600 flex items-center justify-center text-white">
              <Brain className="w-12 h-12 sm:w-14 sm:h-14 animate-bounce" />
            </div>
          </div>
        </div>

        {/* Brand Name */}
        <h1 className="text-3xl sm:text-4xl font-black tracking-tight text-slate-900 mb-2">
          CogniLearn
        </h1>

        {/* Subtitle */}
        <p className="text-xs sm:text-sm text-slate-500 font-medium max-w-xs sm:max-w-sm mx-auto leading-relaxed">
          Document to 3D Flashcards & Adaptive Diagnostic Quizzes
        </p>

        {/* Dynamic Progress Bar */}
        <div className="w-56 sm:w-64 mt-8 space-y-2">
          <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden p-0.5 border border-slate-200">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-full transition-all duration-400 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-slate-500 animate-pulse">
            {statusText}
          </p>
        </div>
      </div>

      {/* Footer Info */}
      <div className="flex flex-col items-center gap-1 text-[11px] text-slate-400">
        <span>Powered by Gemini 3.8 Flash &bull; PWA Offline Ready</span>
      </div>
    </div>
  );
};
