import React, { useState, useEffect } from 'react';
import {
  Brain,
  Upload,
  Layers,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Zap,
  Volume2,
  Smartphone,
  ShieldCheck,
  Share2,
} from 'lucide-react';

interface OnboardingScreenProps {
  onComplete: () => void;
}

export const OnboardingScreen: React.FC<OnboardingScreenProps> = ({ onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  const steps = [
    {
      badge: 'Step 1 of 4 • Instant Ingestion',
      title: 'Turn Any Document into a Study Deck',
      description:
        'Upload lecture slides, PDFs, research papers, notes, or textbooks. Multimodal AI extracts core mechanisms and key definitions in seconds.',
      icon: (
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/15 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-indigo-500 via-indigo-600 to-violet-600 p-0.5 shadow-xl shadow-indigo-500/25 flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-indigo-600 shadow-inner">
              <Upload className="w-12 h-12 text-indigo-600" />
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2 px-3 py-1 rounded-full bg-emerald-600 text-white text-xs font-black shadow-lg flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            <span>PDF, Docs & Notes</span>
          </div>
        </div>
      ),
      highlights: [
        'Supports PDF, Word, Markdown, Text & Images',
        'Customizable card counts and difficulty tiers',
        'Automatic synthesis of high-yield exam concepts',
      ],
    },
    {
      badge: 'Step 2 of 4 • Active Recall',
      title: '3D Flip Flashcards & Mobile Swipes',
      description:
        'Strengthen long-term memory with active recall. Flip cards with smooth 3D physics, listen aloud with voice narration, and swipe to track mastery.',
      icon: (
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-violet-500/15 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-22 h-28 rounded-2xl bg-gradient-to-tr from-violet-600 to-indigo-600 p-0.5 shadow-xl shadow-violet-500/25 flex flex-col justify-between p-3 rotate-6 transform transition-transform">
            <span className="w-7 h-1.5 rounded-full bg-white/70" />
            <div className="text-center">
              <span className="text-xs font-black text-white block">3D Flip</span>
              <span className="text-[9px] text-violet-100">Tap to Reveal</span>
            </div>
            <span className="w-10 h-1 rounded-full bg-white/50" />
          </div>
          <div className="absolute -top-1 -left-2 w-20 h-26 rounded-2xl bg-white border-2 border-indigo-200 p-3 text-indigo-600 flex flex-col justify-between shadow-xl -rotate-6">
            <Layers className="w-8 h-8 text-indigo-600" />
            <span className="text-[10px] font-bold text-slate-700">Swipe to Master</span>
          </div>
        </div>
      ),
      highlights: [
        'Swipe Right to Master &bull; Swipe Left to Review',
        'Text-to-Speech audio speech synthesis read-aloud',
        'Mnemonic hints and confidence rating',
      ],
    },
    {
      badge: 'Step 3 of 4 • Diagnostic Testing',
      title: 'Adaptive Quizzes & Weak Area Drills',
      description:
        'Test your comprehension with 4-choice diagnostic quizzes. Get deep pedagogical explanations and targeted follow-up drills on questions you miss.',
      icon: (
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-amber-500/15 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-amber-500 via-orange-500 to-violet-600 p-0.5 shadow-xl shadow-amber-500/25 flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-amber-600 shadow-inner">
              <HelpCircle className="w-12 h-12 text-amber-500" />
            </div>
          </div>
          <div className="absolute -top-2 -right-2 px-3 py-1 rounded-full bg-amber-500 text-white text-xs font-black shadow-lg flex items-center gap-1.5">
            <Zap className="w-3.5 h-3.5 fill-white" />
            <span>Target 100%</span>
          </div>
        </div>
      ),
      highlights: [
        'Instant answers with detailed reasoning for every option',
        'AI Weak Point Drill: re-targets misconceptions',
        'Letter grades, score history, and confetti celebrations',
      ],
    },
    {
      badge: 'Step 4 of 4 • Complete Mastery',
      title: 'Feynman Tutor & Offline Mobile Study',
      description:
        'Get plain-English analogies for difficult concepts with the Feynman Breakdown tutor. Export to Anki or CSV, and study anywhere offline.',
      icon: (
        <div className="relative w-32 h-32 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-emerald-500/15 rounded-full blur-2xl animate-pulse" />
          <div className="relative w-24 h-24 rounded-3xl bg-gradient-to-tr from-emerald-500 via-teal-500 to-indigo-600 p-0.5 shadow-xl shadow-emerald-500/25 flex items-center justify-center">
            <div className="w-full h-full rounded-[22px] bg-white flex items-center justify-center text-emerald-600 shadow-inner">
              <Brain className="w-12 h-12 text-emerald-600" />
            </div>
          </div>
          <div className="absolute -bottom-2 -left-2 px-3 py-1 rounded-full bg-indigo-600 text-white text-xs font-black shadow-lg flex items-center gap-1.5">
            <Smartphone className="w-3.5 h-3.5" />
            <span>Offline Ready</span>
          </div>
        </div>
      ),
      highlights: [
        'Feynman Explanations: Intuitive analogies and metaphors',
        '1-Click Export to Anki, Quizlet, CSV & JSON backup',
        'Fully responsive mobile interface with gesture navigation',
      ],
    },
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Keyboard & Android Back button navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        handleNext();
      } else if (e.key === 'ArrowLeft' || e.key === 'Escape') {
        if (currentStep > 0) {
          handlePrev();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentStep]);

  // Touch swipe support for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    if (deltaX < -50) {
      handleNext();
    } else if (deltaX > 50) {
      handlePrev();
    }
    setTouchStartX(null);
  };

  return (
    <div
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      className="fixed inset-0 z-50 flex flex-col justify-between bg-gradient-to-b from-indigo-50/90 via-white to-slate-50 text-slate-800 select-none overflow-y-auto animate-fade-in"
    >
      {/* Top Bar with Brand & Skip */}
      <div className="w-full max-w-lg mx-auto flex items-center justify-between px-6 pt-8 pb-4">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-md shadow-indigo-500/25">
            <Brain className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-sm font-black tracking-tight text-slate-900">CogniLearn</h1>
            <p className="text-[10px] text-slate-500 font-medium">Interactive AI Study Deck</p>
          </div>
        </div>

        <button
          onClick={onComplete}
          className="text-xs font-bold text-slate-600 hover:text-slate-900 px-3.5 py-1.5 rounded-full bg-slate-100 hover:bg-slate-200 border border-slate-200 transition-colors"
        >
          Skip Intro
        </button>
      </div>

      {/* Center Dynamic Content Area */}
      <div className="w-full max-w-lg mx-auto px-6 py-4 flex-1 flex flex-col justify-center items-center text-center">
        {/* Step Visual Graphic */}
        <div className="mb-6">{step.icon}</div>

        {/* Step Badge */}
        <span className="inline-block px-3.5 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-bold uppercase tracking-wider mb-3">
          {step.badge}
        </span>

        {/* Step Title */}
        <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight leading-snug mb-3 max-w-md">
          {step.title}
        </h2>

        {/* Step Description */}
        <p className="text-xs sm:text-sm text-slate-600 leading-relaxed max-w-sm mb-6">
          {step.description}
        </p>

        {/* Step Highlights */}
        <div className="w-full max-w-sm space-y-2.5 bg-white border border-slate-200/90 shadow-sm rounded-2xl p-4 text-left">
          {step.highlights.map((item, idx) => (
            <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span dangerouslySetInnerHTML={{ __html: item }} />
            </div>
          ))}
        </div>
      </div>

      {/* Bottom Controls Bar */}
      <div className="w-full max-w-lg mx-auto px-6 pb-8 pt-4 flex flex-col gap-4">
        {/* Step Indicator Dots */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentStep(i)}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === currentStep
                  ? 'w-8 bg-indigo-600 shadow-md shadow-indigo-500/30'
                  : 'w-2 bg-slate-200 hover:bg-slate-300'
              }`}
              aria-label={`Go to step ${i + 1}`}
            />
          ))}
        </div>

        {/* Navigation Buttons */}
        <div className="flex items-center gap-3">
          {currentStep > 0 && (
            <button
              type="button"
              onClick={handlePrev}
              className="px-4 py-3.5 rounded-2xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-bold text-xs flex items-center justify-center transition-colors"
              title="Previous"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
          )}

          {currentStep < steps.length - 1 ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm flex items-center justify-center gap-2 shadow-lg shadow-indigo-500/25 transition-all active:scale-[0.98]"
            >
              <span>Next</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={onComplete}
              className="flex-1 py-3.5 rounded-2xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-black text-sm flex items-center justify-center gap-2 shadow-xl shadow-indigo-500/30 transition-all active:scale-[0.98]"
            >
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>Get Started & Open Home Screen</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
