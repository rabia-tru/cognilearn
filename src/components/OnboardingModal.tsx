import React, { useState, useEffect } from 'react';
import {
  Brain,
  Upload,
  Layers,
  HelpCircle,
  Sparkles,
  ArrowRight,
  ArrowLeft,
  Check,
  CheckCircle2,
  X,
  FileText,
  Share2,
  Smartphone,
  ChevronRight,
  Zap,
} from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartUpload: () => void;
  onExploreDemo: () => void;
}

export const OnboardingModal: React.FC<OnboardingModalProps> = ({
  isOpen,
  onClose,
  onStartUpload,
  onExploreDemo,
}) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'ArrowRight' || e.key === 'Enter') {
        if (currentStep < steps.length - 1) {
          setCurrentStep((prev) => prev + 1);
        } else {
          onClose();
        }
      } else if (e.key === 'ArrowLeft') {
        if (currentStep > 0) {
          setCurrentStep((prev) => prev - 1);
        }
      } else if (e.key === 'Escape') {
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, currentStep]);

  if (!isOpen) return null;

  const steps = [
    {
      badge: 'Step 1 of 4 • Document Ingestion',
      title: 'Turn Any Document into a Study Deck',
      description:
        'Upload lecture slides, textbooks, PDFs, research papers, or snap photos of your handwritten notes with your camera. Gemini 3.8 Flash extracts key concepts and mechanisms in seconds.',
      icon: (
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="absolute inset-0 bg-indigo-500/10 rounded-3xl animate-pulse" />
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-indigo-600 to-indigo-700 text-white flex items-center justify-center shadow-xl shadow-indigo-500/25">
            <Upload className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-1 -right-1 px-2.5 py-1 rounded-full bg-emerald-500 text-white text-[10px] font-extrabold shadow-md flex items-center gap-1">
            <Check className="w-3 h-3" />
            <span>PDF & Docs</span>
          </div>
        </div>
      ),
      highlights: [
        'Supports PDF, Word, Markdown, Text, and photos of books',
        'Customizable card count (5–20) & difficulty levels',
        'Auto-synthesizes core principles and topic taxonomy',
      ],
    },
    {
      badge: 'Step 2 of 4 • Active Recall',
      title: 'Master with 3D Flip Flashcards & Mobile Swipes',
      description:
        'Strengthen memory retention with active recall. Flip cards in 3D, listen aloud with audio speech synthesis, reveal mnemonic hints, and swipe left or right on mobile to track mastery.',
      icon: (
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="w-20 h-24 rounded-2xl bg-white border-2 border-indigo-200 shadow-xl flex flex-col justify-between p-3 rotate-6 transform transition-transform">
            <span className="w-7 h-1.5 rounded-full bg-indigo-200" />
            <div className="text-center">
              <span className="text-[10px] font-extrabold text-indigo-600 block">3D Flip</span>
              <span className="text-[8px] text-slate-400">Tap or Space</span>
            </div>
            <span className="w-10 h-1 rounded-full bg-slate-200" />
          </div>
          <div className="absolute -top-1 -left-2 w-18 h-22 rounded-2xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center shadow-lg -rotate-6">
            <Layers className="w-8 h-8" />
          </div>
        </div>
      ),
      highlights: [
        'Swipe Right to Master &bull; Swipe Left to Review (Touch or Arrows)',
        'Mnemonic clues and Text-to-Speech audio read-aloud',
        'Browse all cards with search & mastery filter tags',
      ],
    },
    {
      badge: 'Step 3 of 4 • Diagnostic Testing',
      title: 'Test Your Knowledge with Adaptive Quizzes',
      description:
        'Put your comprehension to the test with multiple-choice questions. Get instant visual feedback, comprehensive explanations, and diagnostic drills tailored to any questions you miss.',
      icon: (
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="w-22 h-22 rounded-3xl bg-gradient-to-tr from-violet-600 to-indigo-600 text-white flex items-center justify-center shadow-xl shadow-violet-500/25">
            <HelpCircle className="w-11 h-11" />
          </div>
          <div className="absolute -top-1 -right-1 px-2.5 py-1 rounded-full bg-amber-400 text-amber-950 text-[10px] font-black shadow-md flex items-center gap-1">
            <Zap className="w-3 h-3 fill-amber-950" />
            <span>Score 100%</span>
          </div>
        </div>
      ),
      highlights: [
        'Four-choice questions with detailed pedagogical answer keys',
        'AI Weak Point Drill: generates follow-up questions for missed areas',
        'Confetti milestones, letter grades, and time tracking',
      ],
    },
    {
      badge: 'Step 4 of 4 • Feynman Tutor & Export',
      title: 'Feynman Deep-Dive & Portable Exports',
      description:
        'Stuck on a tricky concept? Use the built-in Feynman technique tutor for intuitive everyday analogies and mnemonics. Export your decks to Anki, Quizlet, CSV, or take it offline on your phone!',
      icon: (
        <div className="relative w-28 h-28 mx-auto flex items-center justify-center">
          <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-600 text-white flex items-center justify-center shadow-xl shadow-emerald-500/25">
            <Brain className="w-10 h-10" />
          </div>
          <div className="absolute -bottom-2 -left-2 px-2.5 py-1 rounded-full bg-indigo-600 text-white text-[10px] font-extrabold shadow-md flex items-center gap-1">
            <Share2 className="w-3 h-3" />
            <span>Anki / CSV</span>
          </div>
        </div>
      ),
      highlights: [
        'Feynman Explanations: Analogies, mechanisms & memory tricks',
        '1-Click Export to CSV (Anki, Quizlet, Excel) & full JSON backup',
        'Install on your mobile phone for offline study anytime',
      ],
    },
  ];

  const step = steps[currentStep];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  // Touch swipe support for mobile onboarding
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/65 backdrop-blur-md animate-fade-in">
      <div
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 flex flex-col select-none"
      >
        {/* Header bar with Skip button */}
        <div className="flex items-center justify-between px-6 pt-5 pb-2">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-indigo-600 text-white flex items-center justify-center font-black text-xs shadow-xs">
              <Brain className="w-4 h-4" />
            </div>
            <span className="text-xs font-extrabold tracking-tight text-slate-800">
              Welcome to CogniLearn
            </span>
          </div>

          <button
            onClick={onClose}
            className="text-xs font-bold text-slate-400 hover:text-slate-600 px-2.5 py-1 rounded-lg hover:bg-slate-100 transition-colors"
          >
            Skip Intro
          </button>
        </div>

        {/* Step Graphic Illustration */}
        <div className="px-6 py-6 text-center bg-gradient-to-b from-slate-50 via-white to-white border-b border-slate-100">
          {step.icon}

          <div className="mt-5">
            <span className="inline-block px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-700 text-[11px] font-bold uppercase tracking-wider mb-2">
              {step.badge}
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight leading-snug">
              {step.title}
            </h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-md mx-auto">
              {step.description}
            </p>
          </div>
        </div>

        {/* Feature Highlights List */}
        <div className="px-6 py-4 bg-slate-50/70 border-b border-slate-100">
          <div className="space-y-2">
            {step.highlights.map((highlight, idx) => (
              <div key={idx} className="flex items-center gap-2.5 text-xs text-slate-700 font-medium">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span dangerouslySetInnerHTML={{ __html: highlight }} />
              </div>
            ))}
          </div>
        </div>

        {/* Footer Navigation & Controls */}
        <div className="px-6 py-4 bg-white flex items-center justify-between gap-3">
          {/* Progress Indicator Dots */}
          <div className="flex items-center gap-1.5">
            {steps.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrentStep(i)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  i === currentStep
                    ? 'w-7 bg-indigo-600'
                    : 'w-2 bg-slate-200 hover:bg-slate-300'
                }`}
                aria-label={`Go to step ${i + 1}`}
              />
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            {currentStep > 0 && (
              <button
                type="button"
                onClick={handlePrev}
                className="p-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition-colors"
                title="Previous step"
              >
                <ArrowLeft className="w-4 h-4" />
              </button>
            )}

            {currentStep < steps.length - 1 ? (
              <button
                type="button"
                onClick={handleNext}
                className="px-5 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all hover:translate-x-0.5"
              >
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onExploreDemo();
                  }}
                  className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-bold text-xs transition-colors"
                >
                  Explore Demo Deck
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onStartUpload();
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-indigo-500/25 transition-all"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Get Started</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
