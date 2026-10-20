import React, { useState, useEffect, useCallback } from 'react';
import {
  RotateCcw,
  Volume2,
  VolumeX,
  Lightbulb,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  Shuffle,
  CheckCircle2,
  Clock,
  BookOpen,
  Plus,
  Search,
  Filter,
  Grid,
  Maximize2,
  HelpCircle,
  Brain,
  Award,
  Smartphone,
  Mic,
  MicOff,
  Radio,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyDeck, Flashcard, AppSettings } from '../types';
import { ConceptDeepDiveModal } from './ConceptDeepDiveModal';
import { SwipeTutorial } from './SwipeTutorial';
import { useVoiceToText } from '../hooks/useVoiceToText';

interface FlashcardViewProps {
  deck: StudyDeck;
  onUpdateDeck: (updatedDeck: StudyDeck) => void;
  onStartQuiz: () => void;
  settings?: AppSettings;
}

export const FlashcardView: React.FC<FlashcardViewProps> = ({
  deck,
  onUpdateDeck,
  onStartQuiz,
  settings,
}) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [viewMode, setViewMode] = useState<'study' | 'grid'>('study');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'unseen' | 'learning' | 'mastered'>('all');

  // Swipe tutorial for first-time users
  const [showSwipeTutorial, setShowSwipeTutorial] = useState(() => {
    try {
      return !localStorage.getItem('cognilearn_swipe_tutorial_seen');
    } catch {
      return false;
    }
  });

  // Deep dive AI explanation modal state
  const [deepDiveConcept, setDeepDiveConcept] = useState<string | null>(null);
  const [deepDiveContext, setDeepDiveContext] = useState<string | null>(null);

  // New card modal
  const [isAddCardOpen, setIsAddCardOpen] = useState(false);
  const [newQuestion, setNewQuestion] = useState('');
  const [newAnswer, setNewAnswer] = useState('');
  const [newConcept, setNewConcept] = useState('');
  const [newHint, setNewHint] = useState('');
  const [activeVoiceField, setActiveVoiceField] = useState<'question' | 'answer' | 'concept' | 'hint' | null>(null);

  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    error: voiceError,
  } = useVoiceToText({
    continuous: true,
    onTranscript: (spoken) => {
      if (activeVoiceField === 'question') {
        setNewQuestion(spoken);
      } else if (activeVoiceField === 'answer') {
        setNewAnswer(spoken);
      } else if (activeVoiceField === 'concept') {
        setNewConcept(spoken);
      } else if (activeVoiceField === 'hint') {
        setNewHint(spoken);
      }
    },
  });

  const handleToggleVoice = (field: 'question' | 'answer' | 'concept' | 'hint') => {
    if (isVoiceListening && activeVoiceField === field) {
      stopVoiceListening();
      setActiveVoiceField(null);
    } else {
      setActiveVoiceField(field);
      startVoiceListening((text) => {
        if (field === 'question') setNewQuestion(text);
        else if (field === 'answer') setNewAnswer(text);
        else if (field === 'concept') setNewConcept(text);
        else if (field === 'hint') setNewHint(text);
      });
    }
  };

  const flashcards = deck.flashcards;
  const currentCard: Flashcard | undefined = flashcards[currentIndex];

  const totalCards = flashcards.length;
  const masteredCount = flashcards.filter((c) => c.status === 'mastered').length;
  const learningCount = flashcards.filter((c) => c.status === 'learning').length;
  const unseenCount = totalCards - masteredCount - learningCount;
  const masteryPercentage = totalCards > 0 ? Math.round((masteredCount / totalCards) * 100) : 0;

  // Keyboard navigation
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (viewMode !== 'study' || isAddCardOpen || deepDiveConcept) return;

      if (e.code === 'Space') {
        e.preventDefault();
        setIsFlipped((prev) => !prev);
      } else if (e.code === 'ArrowRight') {
        e.preventDefault();
        handleNext();
      } else if (e.code === 'ArrowLeft') {
        e.preventDefault();
        handlePrevious();
      } else if (e.key === '1') {
        e.preventDefault();
        handleMarkStatus('learning');
      } else if (e.key === '2') {
        e.preventDefault();
        handleMarkStatus('mastered');
      }
    },
    [currentIndex, viewMode, isAddCardOpen, deepDiveConcept]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  const handleFlip = () => {
    const nextFlipped = !isFlipped;
    setIsFlipped(nextFlipped);
    if (nextFlipped && settings?.autoFlipTTS && currentCard) {
      speakText(currentCard.answer);
    }
    if (settings?.hapticFeedback && 'vibrate' in navigator) {
      try {
        navigator.vibrate(15);
      } catch {
        // ignore
      }
    }
  };

  const [touchStartX, setTouchStartX] = useState<number | null>(null);
  const [touchStartY, setTouchStartY] = useState<number | null>(null);
  const [swipeFeedback, setSwipeFeedback] = useState<'learning' | 'mastered' | null>(null);

  const handleNext = () => {
    if (currentIndex < totalCards - 1) {
      setCurrentIndex(currentIndex + 1);
      setIsFlipped(false);
      setShowHint(false);
      stopSpeech();
    }
  };

  const handlePrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex(currentIndex - 1);
      setIsFlipped(false);
      setShowHint(false);
      stopSpeech();
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStartX(e.touches[0].clientX);
    setTouchStartY(e.touches[0].clientY);
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX === null || touchStartY === null) return;
    const deltaX = e.changedTouches[0].clientX - touchStartX;
    const deltaY = e.changedTouches[0].clientY - touchStartY;

    // Detect horizontal swipe
    if (Math.abs(deltaX) > 65 && Math.abs(deltaX) > Math.abs(deltaY) * 1.4) {
      if (deltaX > 0) {
        // Swiped right -> Mark Mastered!
        setSwipeFeedback('mastered');
        handleMarkStatus('mastered');
        setTimeout(() => setSwipeFeedback(null), 600);
      } else {
        // Swiped left -> Mark Learning / Needs Review!
        setSwipeFeedback('learning');
        handleMarkStatus('learning');
        setTimeout(() => setSwipeFeedback(null), 600);
      }
    }
    setTouchStartX(null);
    setTouchStartY(null);
  };

  const handleShuffle = () => {
    const shuffled = [...flashcards].sort(() => Math.random() - 0.5);
    onUpdateDeck({ ...deck, flashcards: shuffled });
    setCurrentIndex(0);
    setIsFlipped(false);
    setShowHint(false);
  };

  const handleMarkStatus = (status: 'learning' | 'mastered') => {
    if (!currentCard) return;

    if (settings?.hapticFeedback && 'vibrate' in navigator) {
      try {
        navigator.vibrate(status === 'mastered' ? 25 : 15);
      } catch {
        // ignore
      }
    }

    const updated = flashcards.map((card, idx) =>
      idx === currentIndex ? { ...card, status } : card
    );

    const willBeAllMastered =
      status === 'mastered' &&
      updated.filter((c) => c.status === 'mastered').length === totalCards;

    if (willBeAllMastered && settings?.soundEffects !== false) {
      confetti({
        particleCount: 80,
        spread: 70,
        origin: { y: 0.6 },
      });
    }

    onUpdateDeck({ ...deck, flashcards: updated });

    // Auto-advance to next card after rating if enabled
    if (settings?.autoAdvanceOnRate !== false && currentIndex < totalCards - 1) {
      setTimeout(() => {
        handleNext();
      }, 250);
    }
  };

  const handleResetProgress = () => {
    if (confirm('Reset study progress for this deck? All cards will be marked as unseen.')) {
      const reset = flashcards.map((c) => ({ ...c, status: 'unseen' as const }));
      onUpdateDeck({ ...deck, flashcards: reset });
      setCurrentIndex(0);
      setIsFlipped(false);
    }
  };

  // Text to speech
  const speakText = (text: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    if (isSpeaking) {
      setIsSpeaking(false);
      return;
    }
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = settings?.speechRate || 1.0;
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => setIsSpeaking(false);
    setIsSpeaking(true);
    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const handleAddCard = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newQuestion.trim() || !newAnswer.trim()) return;

    const newCard: Flashcard = {
      id: `fc_custom_${Date.now()}`,
      question: newQuestion.trim(),
      answer: newAnswer.trim(),
      keyConcept: newConcept.trim() || 'Custom Note',
      hint: newHint.trim() || 'Review your core understanding.',
      topicTag: deck.keyTopics[0] || 'General',
      status: 'unseen',
    };

    onUpdateDeck({
      ...deck,
      flashcards: [...flashcards, newCard],
    });

    setNewQuestion('');
    setNewAnswer('');
    setNewConcept('');
    setNewHint('');
    setIsAddCardOpen(false);
  };

  // Filtered cards for Grid View
  const filteredCards = flashcards.filter((card) => {
    const matchesSearch =
      card.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.keyConcept.toLowerCase().includes(searchQuery.toLowerCase()) ||
      card.topicTag.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesStatus =
      filterStatus === 'all'
        ? true
        : filterStatus === 'unseen'
          ? !card.status || card.status === 'unseen'
          : card.status === filterStatus;

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 px-2.5 sm:px-6">
      {/* Swipe Tutorial for First-Time Users */}
      {showSwipeTutorial && (
        <SwipeTutorial
          onClose={() => {
            setShowSwipeTutorial(false);
            try {
              localStorage.setItem('cognilearn_swipe_tutorial_seen', 'true');
            } catch {
              // ignore
            }
          }}
        />
      )}

      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 sm:mb-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-indigo-600 mb-1">
            <span>Study Deck</span>
            <span>•</span>
            <span className="text-slate-500">{deck.sourceFileName || 'Document Deck'}</span>
          </div>
          <h2 className="text-lg sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            {deck.title}
          </h2>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-1 rounded-xl flex items-center border border-slate-200">
            <button
              onClick={() => setViewMode('study')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${viewMode === 'study' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              Study Mode
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${viewMode === 'grid' ? 'bg-white text-indigo-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
                }`}
            >
              <Grid className="w-3.5 h-3.5" />
              <span>Browse All ({totalCards})</span>
            </button>
          </div>

          <button
            onClick={onStartQuiz}
            className="px-3.5 py-1.5 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs font-bold shadow-xs flex items-center gap-1.5 transition-colors"
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Test Quiz</span>
          </button>
        </div>
      </div>

      {/* Progress Breakdown Banner */}
      <div className="bg-white rounded-2xl p-3.5 sm:p-5 shadow-xs border border-slate-200 mb-4 sm:mb-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 mb-2.5">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-extrabold text-sm">
              {masteryPercentage}%
            </div>
            <div>
              <p className="text-xs font-bold text-slate-800">Mastery Progress</p>
              <p className="text-[11px] text-slate-500">
                {masteredCount} of {totalCards} cards mastered
              </p>
            </div>
          </div>

          {/* Quick Stats Tags */}
          <div className="flex items-center gap-2 text-xs font-medium">
            <span className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{masteredCount} Mastered</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-amber-50 text-amber-700 border border-amber-200 flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{learningCount} Learning</span>
            </span>
            <span className="px-2.5 py-1 rounded-lg bg-slate-50 text-slate-600 border border-slate-200">
              {unseenCount} Unseen
            </span>
          </div>
        </div>

        {/* Multi-segment Progress Bar */}
        <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden flex">
          <div
            className="bg-emerald-500 transition-all duration-300"
            style={{ width: `${(masteredCount / (totalCards || 1)) * 100}%` }}
          />
          <div
            className="bg-amber-400 transition-all duration-300"
            style={{ width: `${(learningCount / (totalCards || 1)) * 100}%` }}
          />
        </div>
      </div>

      {/* STUDY MODE: 3D FLIP CARD */}
      {viewMode === 'study' && (
        <div className="space-y-4 sm:space-y-6">
          {totalCards === 0 ? (
            <div className="bg-white rounded-2xl p-12 text-center border border-slate-200">
              <p className="text-slate-600 text-sm">No flashcards in this deck.</p>
              <button
                onClick={() => setIsAddCardOpen(true)}
                className="mt-3 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
              >
                Add Your First Flashcard
              </button>
            </div>
          ) : currentCard ? (
            <>
              {/* Card Container with 3D Flip & Mobile Touch Gestures */}
              <div className="perspective-1000 w-full min-h-[390px] sm:min-h-[430px] select-none relative">
                {/* Swipe Feedback Overlay on Mobile */}
                {swipeFeedback === 'mastered' && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-emerald-500/20 backdrop-blur-2xs rounded-3xl animate-in fade-in zoom-in-95 pointer-events-none">
                    <div className="px-5 py-3 rounded-2xl bg-emerald-600 text-white font-extrabold text-sm shadow-xl flex items-center gap-2">
                      <CheckCircle2 className="w-5 h-5" />
                      <span>Marked Mastered!</span>
                    </div>
                  </div>
                )}
                {swipeFeedback === 'learning' && (
                  <div className="absolute inset-0 z-30 flex items-center justify-center bg-amber-500/20 backdrop-blur-2xs rounded-3xl animate-in fade-in zoom-in-95 pointer-events-none">
                    <div className="px-5 py-3 rounded-2xl bg-amber-500 text-white font-extrabold text-sm shadow-xl flex items-center gap-2">
                      <Clock className="w-5 h-5" />
                      <span>Review Needed</span>
                    </div>
                  </div>
                )}

                <div
                  onClick={handleFlip}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={handleTouchEnd}
                  className={`relative w-full h-full min-h-[390px] sm:min-h-[430px] rounded-3xl transition-transform duration-500 transform-style-3d cursor-pointer shadow-xl ${isFlipped ? 'rotate-y-180' : ''
                    }`}
                >
                  {/* FRONT OF CARD */}
                  <div className="absolute inset-0 w-full h-full backface-hidden bg-white rounded-3xl border-2 border-indigo-100/90 p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-indigo-100/50">
                    {/* Top Card Bar */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-2.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 shrink-0">
                          {currentCard.topicTag}
                        </span>
                        <span className="text-xs font-semibold text-slate-500 truncate max-w-[130px] sm:max-w-xs">
                          {currentCard.keyConcept}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        {currentCard.status === 'mastered' && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
                            <CheckCircle2 className="w-3 h-3" /> Mastered
                          </span>
                        )}
                        {currentCard.status === 'learning' && (
                          <span className="flex items-center gap-1 text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">
                            <Clock className="w-3 h-3" /> Reviewing
                          </span>
                        )}
                        <span className="text-xs font-bold text-slate-400">
                          {currentIndex + 1} / {totalCards}
                        </span>
                      </div>
                    </div>

                    {/* Question Prompt - Scroll-safe so nothing is cut */}
                    <div className="my-auto py-3 overflow-y-auto max-h-[240px] pr-1">
                      <p className="text-[11px] font-bold uppercase tracking-wider text-indigo-500 mb-1.5">
                        Question / Active Recall Prompt
                      </p>
                      <h3 className="text-base sm:text-xl font-bold text-slate-800 leading-snug">
                        {currentCard.question}
                      </h3>

                      {/* Hint Reveal */}
                      {currentCard.hint && (
                        <div className="mt-3">
                          {!showHint ? (
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setShowHint(true);
                              }}
                              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100/80 px-2.5 py-1 rounded-lg border border-amber-200/80 transition-colors"
                            >
                              <Lightbulb className="w-3 h-3 text-amber-500" />
                              <span>Show Mnemonic Hint</span>
                            </button>
                          ) : (
                            <div
                              onClick={(e) => e.stopPropagation()}
                              className="p-2.5 rounded-xl bg-amber-50/80 border border-amber-200 text-xs text-amber-900 flex items-start gap-1.5 animate-fadeIn"
                            >
                              <Lightbulb className="w-3.5 h-3.5 text-amber-600 shrink-0 mt-0.5" />
                              <div>
                                <span className="font-bold">Mnemonic Clue: </span>
                                <span>{currentCard.hint}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Bottom Card Controls */}
                    <div className="flex items-center justify-between pt-2.5 border-t border-slate-100 text-xs text-slate-400">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          speakText(currentCard.question);
                        }}
                        className="flex items-center gap-1 text-slate-500 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Listen to question"
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                        <span className="text-[11px] font-medium">Listen</span>
                      </button>

                      <div className="flex items-center gap-1.5 font-medium text-slate-400 text-xs">
                        <RotateCcw className="w-3 h-3 text-indigo-500" />
                        <span>Tap to reveal answer</span>
                      </div>
                    </div>
                  </div>

                  {/* BACK OF CARD */}
                  <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-linear-to-b from-white via-indigo-50/20 to-white rounded-3xl border-2 border-indigo-300 p-4 sm:p-6 flex flex-col justify-between overflow-hidden shadow-indigo-200/60">
                    {/* Top Card Bar */}
                    <div className="flex items-center justify-between border-b border-indigo-100 pb-2.5">
                      <div className="flex items-center gap-1.5 overflow-hidden">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded-md bg-emerald-100 text-emerald-800 shrink-0">
                          Answer
                        </span>
                        <span className="text-xs font-semibold text-slate-500 truncate max-w-[120px] sm:max-w-xs">
                          {currentCard.keyConcept}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setDeepDiveConcept(currentCard.keyConcept);
                          setDeepDiveContext(`Question: ${currentCard.question}\nAnswer: ${currentCard.answer}`);
                        }}
                        className="flex items-center gap-1 text-[11px] font-bold text-indigo-700 bg-indigo-100 hover:bg-indigo-200 px-2.5 py-1 rounded-lg transition-colors shadow-2xs shrink-0"
                      >
                        <Sparkles className="w-3 h-3 text-indigo-600" />
                        <span>Feynman Deep Dive</span>
                      </button>
                    </div>

                    {/* Answer Content - Scroll-safe so nothing is cut */}
                    <div className="my-auto py-2.5 space-y-2 overflow-y-auto max-h-[240px] pr-1">
                      <p className="text-[10px] font-bold uppercase tracking-wider text-emerald-600">
                        Detailed Explanation
                      </p>
                      <p className="text-sm sm:text-base font-semibold text-slate-800 leading-relaxed">
                        {currentCard.answer}
                      </p>

                      <div className="p-2.5 rounded-xl bg-white border border-indigo-100 shadow-2xs text-xs text-slate-600 flex items-start gap-1.5">
                        <Brain className="w-3.5 h-3.5 text-indigo-600 shrink-0 mt-0.5" />
                        <div>
                          <span className="font-bold text-slate-800">Key takeaway: </span>
                          <span>{currentCard.keyConcept} directly anchors this concept.</span>
                        </div>
                      </div>
                    </div>

                    {/* Self-Rating Assessment Buttons */}
                    <div
                      className="pt-2.5 border-t border-indigo-100 flex items-center justify-between gap-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <button
                        type="button"
                        onClick={() => speakText(currentCard.answer)}
                        className="hidden sm:flex items-center gap-1 text-slate-500 hover:text-indigo-600 p-1 rounded-lg hover:bg-slate-100 transition-colors"
                        title="Listen to answer"
                      >
                        <Volume2 className="w-3.5 h-3.5" />
                        <span className="text-[11px]">Listen</span>
                      </button>

                      <div className="flex items-center gap-2 ml-auto w-full sm:w-auto">
                        <button
                          type="button"
                          onClick={() => handleMarkStatus('learning')}
                          className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-300 font-bold text-xs flex items-center justify-center gap-1 transition-colors shadow-2xs"
                          title="Shortcut: Press 1"
                        >
                          <Clock className="w-3.5 h-3.5 text-amber-600" />
                          <span>Still Learning (1)</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleMarkStatus('mastered')}
                          className="flex-1 sm:flex-initial px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1 shadow-sm shadow-emerald-500/20 transition-colors"
                          title="Shortcut: Press 2"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Mastered! (2)</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Bottom Navigational Bar */}
              <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleShuffle}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-slate-900 transition-colors"
                    title="Shuffle Cards"
                  >
                    <Shuffle className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleResetProgress}
                    className="p-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-600 hover:text-rose-600 transition-colors"
                    title="Reset Progress"
                  >
                    <RotateCcw className="w-4 h-4" />
                  </button>

                  <button
                    onClick={() => setIsAddCardOpen(true)}
                    className="px-3 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center gap-1 transition-colors"
                  >
                    <Plus className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Add Card</span>
                  </button>
                </div>

                {/* Arrow navigation */}
                <div className="flex items-center gap-3">
                  <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded-xl border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>Previous</span>
                  </button>

                  <span className="text-xs font-bold text-slate-700 px-2">
                    {currentIndex + 1} of {totalCards}
                  </span>

                  <button
                    onClick={handleNext}
                    disabled={currentIndex === totalCards - 1}
                    className="px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-1 shadow-xs transition-colors"
                  >
                    <span>Next</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Mobile Touch & Keyboard shortcuts tip */}
              <div className="text-center text-[11px] text-slate-400 py-1">
                <div className="sm:hidden font-medium text-slate-500 flex items-center justify-center gap-1.5">
                  <span className="flex items-center gap-1">
                    <Smartphone className="w-3.5 h-3.5 text-indigo-500" />
                    <span>Swipe right to <strong className="text-emerald-600">Master</strong></span>
                  </span>
                  <span>&bull;</span>
                  <span>Swipe left for <strong className="text-amber-600">Review</strong></span>
                  <span>&bull;</span>
                  <span>Tap to flip</span>
                </div>
                <div className="hidden sm:block">
                  Shortcuts: <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">Space</kbd> Flip &bull;{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">&larr;</kbd> Previous &bull;{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">&rarr;</kbd> Next &bull;{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">1</kbd> Learning &bull;{' '}
                  <kbd className="px-1.5 py-0.5 bg-slate-100 rounded text-slate-600 border border-slate-200">2</kbd> Mastered
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* GRID / LIST VIEW MODE */}
      {viewMode === 'grid' && (
        <div className="space-y-4">
          {/* Search & Filters */}
          <div className="bg-white p-4 rounded-2xl border border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-2xs">
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <input
                type="text"
                placeholder="Search flashcards by term or question..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 rounded-xl border border-slate-200 text-xs focus:border-indigo-500 focus:ring-1 focus:ring-indigo-100 outline-none"
              />
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 outline-none"
              >
                <option value="all">All Cards ({totalCards})</option>
                <option value="mastered">Mastered Only ({masteredCount})</option>
                <option value="learning">Needs Review ({learningCount})</option>
                <option value="unseen">Unseen ({unseenCount})</option>
              </select>

              <button
                onClick={() => setIsAddCardOpen(true)}
                className="ml-auto px-3 py-1.5 bg-indigo-600 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3 h-3" /> Add Card
              </button>
            </div>
          </div>

          {/* Cards Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredCards.map((card, idx) => {
              const originalIndex = flashcards.findIndex((c) => c.id === card.id);
              return (
                <div
                  key={card.id}
                  className="bg-white rounded-2xl p-5 border border-slate-200 hover:border-indigo-300 shadow-xs hover:shadow-md transition-all flex flex-col justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-700">
                        {card.topicTag}
                      </span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-xs font-bold text-slate-400">#{originalIndex + 1}</span>
                        {card.status === 'mastered' ? (
                          <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded-full">
                            Mastered
                          </span>
                        ) : card.status === 'learning' ? (
                          <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-2 py-0.5 rounded-full">
                            Reviewing
                          </span>
                        ) : (
                          <span className="text-[10px] font-medium text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                            Unseen
                          </span>
                        )}
                      </div>
                    </div>

                    <h4 className="text-base font-bold text-slate-900 mb-2">{card.question}</h4>
                    <p className="text-sm text-slate-700 leading-relaxed bg-slate-50 p-3.5 rounded-xl border border-slate-100">
                      {card.answer}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-slate-100">
                    <button
                      onClick={() => {
                        setDeepDiveConcept(card.keyConcept);
                        setDeepDiveContext(`Question: ${card.question}\nAnswer: ${card.answer}`);
                      }}
                      className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
                    >
                      <Sparkles className="w-3 h-3" />
                      <span>Feynman Breakdown</span>
                    </button>

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const updated: Flashcard[] = flashcards.map((c) =>
                            c.id === card.id
                              ? { ...c, status: (c.status === 'mastered' ? 'learning' : 'mastered') as 'learning' | 'mastered' }
                              : c
                          );
                          onUpdateDeck({ ...deck, flashcards: updated });
                        }}
                        className={`text-xs px-2.5 py-1 rounded-lg font-bold border transition-colors ${card.status === 'mastered'
                            ? 'bg-emerald-600 text-white border-emerald-600'
                            : 'bg-slate-50 hover:bg-emerald-50 text-slate-600 hover:text-emerald-700 border-slate-200'
                          }`}
                      >
                        {card.status === 'mastered' ? 'Mastered' : 'Mark Mastered'}
                      </button>

                      <button
                        onClick={() => {
                          setCurrentIndex(originalIndex);
                          setViewMode('study');
                          setIsFlipped(false);
                        }}
                        className="text-xs px-2.5 py-1 rounded-lg font-bold bg-indigo-50 text-indigo-700 hover:bg-indigo-100 transition-colors"
                      >
                        Study
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Add Custom Card Modal with Voice-to-Text Input */}
      {isAddCardOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
                  <span>Add Custom Flashcard</span>
                  {isVoiceSupported && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 border border-indigo-200/60 flex items-center gap-1">
                      <Mic className="w-2.5 h-2.5 text-indigo-600" />
                      <span>Voice-to-Text Ready</span>
                    </span>
                  )}
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Type or speak your prompt, answer, and memory cues directly.
                </p>
              </div>

              <button
                type="button"
                onClick={() => {
                  stopVoiceListening();
                  setIsAddCardOpen(false);
                }}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                &times;
              </button>
            </div>

            {/* Live Dictation Active Indicator */}
            {isVoiceListening && (
              <div className="mb-4 p-3 rounded-xl bg-indigo-50/80 border border-indigo-200/90 flex items-center justify-between gap-3 animate-pulse">
                <div className="flex items-center gap-2 min-w-0">
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                  </span>
                  <div className="text-xs text-indigo-950 truncate">
                    <span className="font-bold">Listening for {activeVoiceField}:</span> Speak clearly now...
                  </div>
                </div>

                <button
                  type="button"
                  onClick={stopVoiceListening}
                  className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shrink-0 transition-colors"
                >
                  Stop Recording
                </button>
              </div>
            )}

            {voiceError && (
              <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                {voiceError}
              </div>
            )}

            <form onSubmit={handleAddCard} className="space-y-4">
              {/* Question Front */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Question / Prompt Front
                  </label>
                  {isVoiceSupported && (
                    <button
                      type="button"
                      onClick={() => handleToggleVoice('question')}
                      className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${isVoiceListening && activeVoiceField === 'question'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700'
                        }`}
                      title="Speak Question into microphone"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isVoiceListening && activeVoiceField === 'question' ? 'Listening...' : 'Voice Input'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={2}
                  required
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  placeholder="e.g. What is the role of ATP Synthase?"
                  className={`w-full text-xs p-3 rounded-xl border outline-none transition-colors ${isVoiceListening && activeVoiceField === 'question'
                      ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/20'
                      : 'border-slate-200 focus:border-indigo-500'
                    }`}
                />
              </div>

              {/* Answer Back */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-slate-700">
                    Answer / Explanation Back
                  </label>
                  {isVoiceSupported && (
                    <button
                      type="button"
                      onClick={() => handleToggleVoice('answer')}
                      className={`text-[11px] font-semibold flex items-center gap-1 px-2 py-0.5 rounded-md transition-colors ${isVoiceListening && activeVoiceField === 'answer'
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-slate-100 hover:bg-indigo-50 text-slate-600 hover:text-indigo-700'
                        }`}
                      title="Speak Answer into microphone"
                    >
                      <Mic className="w-3 h-3" />
                      <span>{isVoiceListening && activeVoiceField === 'answer' ? 'Listening...' : 'Voice Input'}</span>
                    </button>
                  )}
                </div>
                <textarea
                  rows={3}
                  required
                  value={newAnswer}
                  onChange={(e) => setNewAnswer(e.target.value)}
                  placeholder="e.g. Catalyzes synthesis of ATP using the electrochemical proton gradient."
                  className={`w-full text-xs p-3 rounded-xl border outline-none transition-colors ${isVoiceListening && activeVoiceField === 'answer'
                      ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/20'
                      : 'border-slate-200 focus:border-indigo-500'
                    }`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                {/* Concept Tag */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Key Concept
                    </label>
                    {isVoiceSupported && (
                      <button
                        type="button"
                        onClick={() => handleToggleVoice('concept')}
                        className={`text-[10px] p-1 rounded-md transition-colors ${isVoiceListening && activeVoiceField === 'concept'
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                          }`}
                        title="Speak Key Concept"
                      >
                        <Mic className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newConcept}
                    onChange={(e) => setNewConcept(e.target.value)}
                    placeholder="e.g. Chemiosmosis"
                    className={`w-full text-xs p-2.5 rounded-xl border outline-none transition-colors ${isVoiceListening && activeVoiceField === 'concept'
                        ? 'border-indigo-500 ring-1 ring-indigo-200 bg-indigo-50/20'
                        : 'border-slate-200 focus:border-indigo-500'
                      }`}
                  />
                </div>

                {/* Hint */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">
                      Mnemonic Hint
                    </label>
                    {isVoiceSupported && (
                      <button
                        type="button"
                        onClick={() => handleToggleVoice('hint')}
                        className={`text-[10px] p-1 rounded-md transition-colors ${isVoiceListening && activeVoiceField === 'hint'
                            ? 'bg-rose-600 text-white'
                            : 'text-slate-400 hover:text-indigo-600 hover:bg-slate-100'
                          }`}
                        title="Speak Mnemonic Hint"
                      >
                        <Mic className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={newHint}
                    onChange={(e) => setNewHint(e.target.value)}
                    placeholder="e.g. Water wheel of the cell"
                    className={`w-full text-xs p-2.5 rounded-xl border outline-none transition-colors ${isVoiceListening && activeVoiceField === 'hint'
                        ? 'border-indigo-500 ring-1 ring-indigo-200 bg-indigo-50/20'
                        : 'border-slate-200 focus:border-indigo-500'
                      }`}
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => {
                    stopVoiceListening();
                    setIsAddCardOpen(false);
                  }}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:text-slate-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                >
                  Save Card
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* AI Concept Deep Dive Modal */}
      <ConceptDeepDiveModal
        isOpen={Boolean(deepDiveConcept)}
        onClose={() => {
          setDeepDiveConcept(null);
          setDeepDiveContext(null);
        }}
        concept={deepDiveConcept || ''}
        context={deepDiveContext || ''}
      />
    </div>
  );
};
