import React, { useState, useEffect } from 'react';
import {
  HelpCircle,
  CheckCircle2,
  XCircle,
  Sparkles,
  ArrowRight,
  RotateCcw,
  Trophy,
  Brain,
  AlertTriangle,
  Layers,
  ChevronRight,
  Loader2,
  Clock,
  Zap,
} from 'lucide-react';
import confetti from 'canvas-confetti';
import { StudyDeck, QuizQuestion, AppSettings } from '../types';
import { ConceptDeepDiveModal } from './ConceptDeepDiveModal';
import { safeApiFetch } from '../utils/api';
import { buildOfflineReinforcement } from '../utils/offlineGenerator';

interface QuizViewProps {
  deck: StudyDeck;
  onUpdateDeck: (updatedDeck: StudyDeck) => void;
  onGoToFlashcards: () => void;
  settings?: AppSettings;
}

interface UserAnswer {
  questionId: string;
  selectedIndex: number;
  isCorrect: boolean;
  question: QuizQuestion;
}

export const QuizView: React.FC<QuizViewProps> = ({
  deck,
  onUpdateDeck,
  onGoToFlashcards,
  settings,
}) => {
  const [questions, setQuestions] = useState<QuizQuestion[]>(deck.quiz || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [userAnswers, setUserAnswers] = useState<UserAnswer[]>([]);
  const [isCompleted, setIsCompleted] = useState(false);
  const [filterReview, setFilterReview] = useState<'all' | 'missed'>('all');

  // AI Weak Area Reinforcement
  const [isReinforcing, setIsReinforcing] = useState(false);
  const [reinforceError, setReinforceError] = useState<string | null>(null);
  const [reinforceNotice, setReinforceNotice] = useState<string | null>(null);

  // Concept modal
  const [deepDiveConcept, setDeepDiveConcept] = useState<string | null>(null);
  const [deepDiveContext, setDeepDiveContext] = useState<string | null>(null);

  // Quiz timer
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  useEffect(() => {
    let interval: any = null;
    if (!isCompleted) {
      interval = setInterval(() => {
        setSecondsElapsed((prev) => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isCompleted]);

  // Sync questions if deck changes
  useEffect(() => {
    setQuestions(deck.quiz || []);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setIsCompleted(false);
    setSecondsElapsed(0);
  }, [deck.id]);

  const currentQuestion: QuizQuestion | undefined = questions[currentIndex];
  const totalQuestions = questions.length;

  // Keyboard shortcuts for quiz navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept when typing in input fields
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        return;
      }

      if (isCompleted) return;

      // Number keys 1-4 to select options
      if (['1', '2', '3', '4'].includes(e.key) && !isAnswered) {
        const optionIndex = parseInt(e.key) - 1;
        if (optionIndex < (currentQuestion?.options.length || 0)) {
          handleSelectOption(optionIndex);
        }
      }

      // Enter to proceed to next question
      if (e.key === 'Enter' && isAnswered) {
        handleNextQuestion();
      }

      // Arrow keys for navigation (when answered)
      if (e.key === 'ArrowRight' && isAnswered) {
        handleNextQuestion();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, isCompleted, currentQuestion]);

  const handleSelectOption = (idx: number) => {
    if (isAnswered || !currentQuestion) return;

    setSelectedOption(idx);
    setIsAnswered(true);

    const isCorrect = idx === currentQuestion.correctIndex;
    const answerRecord: UserAnswer = {
      questionId: currentQuestion.id,
      selectedIndex: idx,
      isCorrect,
      question: currentQuestion,
    };

    setUserAnswers((prev) => [...prev, answerRecord]);
  };

  const handleNextQuestion = () => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex(currentIndex + 1);
      setSelectedOption(null);
      setIsAnswered(false);
    } else {
      finishQuiz();
    }
  };

  const finishQuiz = () => {
    setIsCompleted(true);

    // Calculate score
    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    // include current if not yet counted
    const finalAnswers =
      userAnswers.length === totalQuestions
        ? userAnswers
        : isAnswered && currentQuestion && selectedOption !== null
        ? [
            ...userAnswers,
            {
              questionId: currentQuestion.id,
              selectedIndex: selectedOption,
              isCorrect: selectedOption === currentQuestion.correctIndex,
              question: currentQuestion,
            },
          ]
        : userAnswers;

    const correctFinal = finalAnswers.filter((a) => a.isCorrect).length;
    const scorePct = Math.round((correctFinal / (totalQuestions || 1)) * 100);

    if (scorePct >= 80) {
      confetti({
        particleCount: 120,
        spread: 90,
        origin: { y: 0.6 },
      });
    }

    // Update stats on deck
    const currentBest = deck.stats?.bestQuizScore || 0;
    const updatedStats = {
      ...deck.stats,
      timesStudied: (deck.stats?.timesStudied || 0) + 1,
      quizzesTaken: (deck.stats?.quizzesTaken || 0) + 1,
      bestQuizScore: Math.max(currentBest, scorePct),
      lastStudiedAt: new Date().toISOString(),
    };

    onUpdateDeck({
      ...deck,
      stats: updatedStats,
    });
  };

  const handleRestartQuiz = () => {
    // Shuffle question order and reset
    const shuffled = [...(deck.quiz || [])].sort(() => Math.random() - 0.5);
    setQuestions(shuffled);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setUserAnswers([]);
    setIsCompleted(false);
    setSecondsElapsed(0);
  };

  const handleReinforceWeakPoints = async () => {
    const missed = userAnswers.filter((a) => !a.isCorrect);
    if (missed.length === 0) return;

    setIsReinforcing(true);
    setReinforceError(null);
    setReinforceNotice(null);

    try {
      const response = await safeApiFetch('/api/reinforce-weak-areas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: deck.title,
          missedQuestions: missed.map((m) => ({
            question: m.question.question,
            correctAnswer: m.question.options[m.question.correctIndex],
            explanation: m.question.explanation,
            topicTag: m.question.topicTag,
          })),
          count: Math.min(4, Math.max(2, missed.length + 1)),
        }),
      });

      if (!response.ok) throw new Error('Failed to generate reinforcement quiz.');

      const data = await response.json();
      if (!data.questions || data.questions.length === 0) {
        throw new Error('The server did not return any drill questions.');
      }
      if (data.questions && data.questions.length > 0) {
        // Append new diagnostic questions and start targeted quiz
        setQuestions(data.questions);
        setCurrentIndex(0);
        setSelectedOption(null);
        setIsAnswered(false);
        setUserAnswers([]);
        setIsCompleted(false);
        setSecondsElapsed(0);
      }
    } catch (err: any) {
      // Any failure (unreachable backend, AI error, timeout) falls back to a
      // drill built from the deck that is already on the phone.
      {
        const offlineQuestions = buildOfflineReinforcement(
          deck,
          missed.map((m) => ({
            question: m.question.question,
            correctAnswer: m.question.options[m.question.correctIndex],
            explanation: m.question.explanation,
            topicTag: m.question.topicTag,
          })),
          Math.min(4, Math.max(2, missed.length + 1))
        );

        if (offlineQuestions.length > 0) {
          setQuestions(offlineQuestions);
          setCurrentIndex(0);
          setSelectedOption(null);
          setIsAnswered(false);
          setUserAnswers([]);
          setIsCompleted(false);
          setSecondsElapsed(0);
          setReinforceNotice(
            'Built this drill on-device from your own deck (the AI tutor was not reachable).'
          );
        } else {
          setReinforceError('Not enough material in this deck to build an offline drill.');
        }
      }
    } finally {
      setIsReinforcing(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (!questions || questions.length === 0) {
    return (
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <div className="w-14 h-14 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center mx-auto mb-4">
          <AlertTriangle className="w-7 h-7" />
        </div>
        <h3 className="text-xl font-bold text-slate-800">No Quiz Questions Available</h3>
        <p className="text-sm text-slate-500 mt-2 max-w-md mx-auto">
          This deck does not currently have any quiz questions. You can upload a document to generate a complete diagnostic test.
        </p>
        <button
          onClick={onGoToFlashcards}
          className="mt-6 px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold shadow-xs hover:bg-indigo-700"
        >
          Study Flashcards Instead
        </button>
      </div>
    );
  }

  // --- QUIZ COMPLETION SCORECARD ---
  if (isCompleted) {
    const correctCount = userAnswers.filter((a) => a.isCorrect).length;
    const scorePct = Math.round((correctCount / totalQuestions) * 100);
    const missedAnswers = userAnswers.filter((a) => !a.isCorrect);

    let gradeTitle = 'Mastery Achieved!';
    let gradeSubtitle = 'Outstanding command of the core principles and concepts.';
    let gradeBadgeColor = 'bg-emerald-50 text-emerald-800 border-emerald-300';

    if (scorePct < 60) {
      gradeTitle = 'Needs Reinforcement';
      gradeSubtitle = 'Review key definitions and explanations before retesting.';
      gradeBadgeColor = 'bg-rose-50 text-rose-800 border-rose-300';
    } else if (scorePct < 80) {
      gradeTitle = 'Solid Competence';
      gradeSubtitle = 'Good grasp of material with a few specific conceptual gaps.';
      gradeBadgeColor = 'bg-amber-50 text-amber-800 border-amber-300';
    }

    const displayedAnswers = filterReview === 'missed' ? missedAnswers : userAnswers;

    return (
      <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
        <div className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
          {/* Header Banner */}
          <div className="p-6 sm:p-8 text-center bg-linear-to-b from-indigo-50/80 via-white to-white border-b border-slate-100">
            <div className="w-16 h-16 rounded-3xl bg-linear-to-tr from-indigo-600 to-violet-600 text-white flex items-center justify-center mx-auto mb-4 shadow-lg shadow-indigo-500/25">
              <Trophy className="w-8 h-8" />
            </div>

            <div className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold mb-2 ${gradeBadgeColor}`}>
              <Zap className="w-3.5 h-3.5" />
              <span>{gradeTitle}</span>
            </div>

            <h2 className="text-3xl sm:text-4xl font-extrabold text-slate-900 tracking-tight">
              {scorePct}% Score
            </h2>
            <p className="text-sm text-slate-600 mt-1 max-w-md mx-auto">{gradeSubtitle}</p>

            {/* Quick Metrics */}
            <div className="flex items-center justify-center gap-6 mt-6 text-xs text-slate-600 font-semibold">
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{correctCount} / {totalQuestions} Correct</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
                <Clock className="w-4 h-4 text-indigo-600" />
                <span>Time: {formatTimer(secondsElapsed)}</span>
              </div>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="p-6 bg-slate-50/50 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button
                onClick={handleRestartQuiz}
                className="px-4 py-2.5 rounded-xl border border-slate-300 hover:bg-white text-slate-700 text-xs font-bold flex items-center gap-2 transition-colors shadow-2xs"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Retake Quiz</span>
              </button>

              <button
                onClick={onGoToFlashcards}
                className="px-4 py-2.5 rounded-xl border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold flex items-center gap-2 transition-colors"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>Review Flashcards</span>
              </button>
            </div>

            {/* AI Reinforce Weak Points Button */}
            {missedAnswers.length > 0 && (
              <button
                onClick={handleReinforceWeakPoints}
                disabled={isReinforcing}
                className="px-5 py-2.5 rounded-xl bg-linear-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white text-xs font-bold shadow-md shadow-violet-500/25 flex items-center gap-2 transition-all disabled:opacity-60"
              >
                {isReinforcing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Generating Targeted Drill...</span>
                  </>
                ) : (
                  <>
                    <Brain className="w-4 h-4" />
                    <span>AI Drill on Missed Topics ({missedAnswers.length})</span>
                  </>
                )}
              </button>
            )}
          </div>

          {reinforceError && (
            <div className="p-3 mx-6 mt-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
              {reinforceError}
            </div>
          )}

          {reinforceNotice && (
            <div className="p-3 mx-6 mt-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs">
              {reinforceNotice}
            </div>
          )}

          {/* Answer Review Accordion */}
          <div className="p-6 sm:p-8 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-extrabold text-slate-900">Detailed Answer Review</h3>
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg text-xs font-semibold">
                <button
                  onClick={() => setFilterReview('all')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    filterReview === 'all' ? 'bg-white text-slate-900 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  All ({userAnswers.length})
                </button>
                <button
                  onClick={() => setFilterReview('missed')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    filterReview === 'missed' ? 'bg-white text-rose-700 shadow-2xs font-bold' : 'text-slate-500'
                  }`}
                >
                  Missed Only ({missedAnswers.length})
                </button>
              </div>
            </div>

            {displayedAnswers.length === 0 ? (
              <div className="p-8 text-center bg-slate-50 rounded-2xl border border-slate-200">
                <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
                <p className="text-sm font-bold text-slate-800">Flawless execution!</p>
                <p className="text-xs text-slate-500 mt-1">
                  You did not miss any questions in this category.
                </p>
              </div>
            ) : (
              <div className="space-y-4">
                {displayedAnswers.map((item, idx) => {
                  const q = item.question;
                  const isCorrect = item.isCorrect;

                  return (
                    <div
                      key={item.questionId || idx}
                      className={`p-5 rounded-2xl border transition-all ${
                        isCorrect
                          ? 'bg-white border-emerald-200/80 shadow-2xs'
                          : 'bg-rose-50/30 border-rose-200 shadow-2xs'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2 mb-2">
                        <span className="text-[10px] font-extrabold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-100 text-slate-600">
                          {q.topicTag}
                        </span>
                        <div className="flex items-center gap-1.5">
                          {isCorrect ? (
                            <span className="text-xs font-bold text-emerald-700 bg-emerald-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <CheckCircle2 className="w-3.5 h-3.5" /> Correct
                            </span>
                          ) : (
                            <span className="text-xs font-bold text-rose-700 bg-rose-100/80 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> Missed
                            </span>
                          )}
                        </div>
                      </div>

                      <h4 className="text-sm font-bold text-slate-900 mb-3">{q.question}</h4>

                      {/* Options breakdown */}
                      <div className="space-y-1.5 mb-3 text-xs">
                        {q.options.map((opt, optIdx) => {
                          const isTheCorrectOption = optIdx === q.correctIndex;
                          const wasSelectedByUser = optIdx === item.selectedIndex;

                          let optStyle = 'bg-slate-50 border-slate-200 text-slate-600';
                          if (isTheCorrectOption) {
                            optStyle = 'bg-emerald-50 border-emerald-300 text-emerald-900 font-semibold';
                          } else if (wasSelectedByUser && !isCorrect) {
                            optStyle = 'bg-rose-50 border-rose-300 text-rose-900 font-semibold line-through';
                          }

                          return (
                            <div
                              key={optIdx}
                              className={`p-2.5 rounded-xl border flex items-center justify-between ${optStyle}`}
                            >
                              <span>{opt}</span>
                              {isTheCorrectOption && (
                                <span className="text-[10px] font-bold text-emerald-700 uppercase">
                                  Correct Choice
                                </span>
                              )}
                              {wasSelectedByUser && !isCorrect && (
                                <span className="text-[10px] font-bold text-rose-600 uppercase">
                                  Your Choice
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>

                      {/* Explanation */}
                      <div className="p-3 bg-white rounded-xl border border-slate-200 text-xs text-slate-700 flex items-start justify-between gap-3">
                        <div>
                          <span className="font-bold text-slate-900">Explanation: </span>
                          <span>{q.explanation}</span>
                        </div>
                        <button
                          onClick={() => {
                            setDeepDiveConcept(q.topicTag);
                            setDeepDiveContext(`Question: ${q.question}\nCorrect Answer: ${q.options[q.correctIndex]}\nExplanation: ${q.explanation}`);
                          }}
                          className="shrink-0 text-indigo-600 hover:text-indigo-800 font-bold text-[11px] flex items-center gap-1"
                          title="Learn more with Feynman technique"
                        >
                          <Sparkles className="w-3 h-3 text-indigo-500" />
                          <span>Deep Dive</span>
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

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
  }

  // --- ACTIVE QUIZ QUESTION ---
  if (!currentQuestion) return null;

  const optionLetters = ['A', 'B', 'C', 'D'];

  return (
    <div className="max-w-3xl mx-auto py-3 sm:py-6 px-2.5 sm:px-6">
      {/* Top Status Bar */}
      <div className="flex items-center justify-between mb-4 text-xs font-semibold text-slate-500">
        <div className="flex items-center gap-2">
          <span className="text-xs font-bold text-indigo-600 uppercase tracking-wider bg-indigo-50 px-2.5 py-1 rounded-md">
            {currentQuestion.topicTag}
          </span>
          <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 capitalize">
            {currentQuestion.difficulty || 'medium'}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-slate-500 font-mono flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-slate-400" />
            {formatTimer(secondsElapsed)}
          </span>
          <span className="font-bold text-slate-800">
            Question {currentIndex + 1} of {totalQuestions}
          </span>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden mb-5 sm:mb-6">
        <div
          className="h-full bg-linear-to-r from-indigo-500 to-violet-600 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / totalQuestions) * 100}%` }}
        />
      </div>

      {/* Main Question Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200 space-y-5 sm:space-y-6">
        <div>
          <span className="text-xs sm:text-sm font-extrabold uppercase tracking-wider text-indigo-500 mb-1.5 block">
            Test Your Knowledge
          </span>
          <h3 className="text-xl sm:text-2xl font-extrabold text-slate-900 leading-snug">
            {currentQuestion.question}
          </h3>
          {!isAnswered && (
            <p className="text-xs text-slate-500 mt-2 flex items-center gap-1.5">
              <span>💡 Tip: Press</span>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">1</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">2</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">3</kbd>
              <kbd className="px-1.5 py-0.5 bg-slate-100 border border-slate-300 rounded text-[10px] font-mono">4</kbd>
              <span>to select</span>
            </p>
          )}
        </div>

        {/* Options List */}
        <div className="space-y-3">
          {currentQuestion.options.map((option, idx) => {
            const isSelected = selectedOption === idx;
            const isCorrectAnswer = idx === currentQuestion.correctIndex;

            let buttonStyle =
              'bg-slate-50/70 hover:bg-indigo-50/50 hover:border-indigo-300 border-slate-200 text-slate-800';

            if (isAnswered) {
              if (isCorrectAnswer) {
                buttonStyle = 'bg-emerald-50 border-emerald-400 text-emerald-950 font-bold shadow-xs';
              } else if (isSelected && !isCorrectAnswer) {
                buttonStyle = 'bg-rose-50 border-rose-400 text-rose-950 font-semibold';
              } else {
                buttonStyle = 'bg-slate-50/40 border-slate-100 text-slate-400 opacity-60';
              }
            }

            return (
              <button
                key={idx}
                type="button"
                disabled={isAnswered}
                onClick={() => handleSelectOption(idx)}
                aria-label={`Option ${optionLetters[idx]}: ${option}`}
                aria-pressed={isSelected}
                aria-disabled={isAnswered}
                className={`w-full p-4 rounded-2xl border-2 text-left transition-all flex items-start gap-3.5 ${buttonStyle}`}
              >
                <div
                  className={`w-7 h-7 rounded-xl flex items-center justify-center font-bold text-xs shrink-0 transition-colors ${
                    isAnswered && isCorrectAnswer
                      ? 'bg-emerald-600 text-white'
                      : isAnswered && isSelected && !isCorrectAnswer
                      ? 'bg-rose-600 text-white'
                      : 'bg-white border border-slate-300 text-slate-600'
                  }`}
                  aria-hidden="true"
                >
                  {isAnswered && isCorrectAnswer ? (
                    <CheckCircle2 className="w-4 h-4" />
                  ) : isAnswered && isSelected && !isCorrectAnswer ? (
                    <XCircle className="w-4 h-4" />
                  ) : (
                    optionLetters[idx]
                  )}
                </div>

                <div className="flex-1 text-xs sm:text-sm pt-0.5 leading-relaxed">{option}</div>
              </button>
            );
          })}
        </div>

        {/* Post-Answer Explanation Box */}
        {isAnswered && (
          <div className="pt-4 border-t border-slate-100 space-y-4 animate-in fade-in duration-200">
            <div
              className={`p-4 rounded-2xl border text-xs leading-relaxed flex flex-col sm:flex-row sm:items-start justify-between gap-3 ${
                selectedOption === currentQuestion.correctIndex
                  ? 'bg-emerald-50/60 border-emerald-200 text-emerald-950'
                  : 'bg-amber-50/70 border-amber-200 text-amber-950'
              }`}
            >
              <div>
                <p className="font-extrabold text-sm mb-1 flex items-center gap-1.5">
                  {selectedOption === currentQuestion.correctIndex ? (
                    <>
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span>Spot on! That is correct.</span>
                    </>
                  ) : (
                    <>
                      <AlertTriangle className="w-4 h-4 text-amber-600" />
                      <span>Not quite. Here is why:</span>
                    </>
                  )}
                </p>
                <p className="text-slate-700 leading-normal">{currentQuestion.explanation}</p>
              </div>

              <button
                type="button"
                onClick={() => {
                  setDeepDiveConcept(currentQuestion.topicTag);
                  setDeepDiveContext(`Question: ${currentQuestion.question}\nCorrect Option: ${currentQuestion.options[currentQuestion.correctIndex]}\nExplanation: ${currentQuestion.explanation}`);
                }}
                className="shrink-0 inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-white border border-slate-200 hover:border-indigo-300 text-indigo-700 font-bold text-xs shadow-2xs self-start"
              >
                <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                <span>Deep Dive Tutor</span>
              </button>
            </div>

            {/* Next Button */}
            <div className="flex items-center justify-end pt-2">
              <button
                type="button"
                onClick={handleNextQuestion}
                className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-indigo-500/25 flex items-center gap-2 transition-all hover:translate-x-0.5"
              >
                <span>{currentIndex < totalQuestions - 1 ? 'Next Question' : 'View Quiz Scorecard'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

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
