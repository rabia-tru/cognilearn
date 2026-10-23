
import React, { useState } from 'react';
import { X, Sparkles, Lightbulb, BookOpen, AlertTriangle, Brain, Loader2 } from 'lucide-react';
import { safeApiFetch } from '../utils/api';
import { buildOfflineExplanation } from '../utils/offlineGenerator';

interface ConceptDeepDiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  concept: string;
  context?: string;
  initialExplanation?: string;
}

export const ConceptDeepDiveModal: React.FC<ConceptDeepDiveModalProps> = ({
  isOpen,
  onClose,
  concept,
  context,
  initialExplanation,
}) => {
  const [loading, setLoading] = useState<boolean>(!initialExplanation);
  const [explanation, setExplanation] = useState<string>(initialExplanation || '');
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (!isOpen) return;

    if (initialExplanation) {
      setExplanation(initialExplanation);
      setLoading(false);
      return;
    }

    let isMounted = true;
    setLoading(true);
    setError(null);

    safeApiFetch('/api/explain-concept', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ concept, context }),
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to generate AI concept explanation.');
        return res.json();
      })
      .then((data) => {
        if (isMounted) {
          setExplanation(data.explanation || 'No explanation available.');
          setLoading(false);
        }
      })

      .catch((err) => {
        if (isMounted) {
          // Any failure (unreachable backend, AI error, timeout) falls back to the
          // on-device study guide so the tutor is never a dead end.
          console.warn('Deep dive fell back to the on-device tutor:', err);
          setExplanation(buildOfflineExplanation(concept, context || ''));
          setError(null);
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [isOpen, concept, context, initialExplanation]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl max-h-[85vh] bg-white rounded-2xl shadow-2xl flex flex-col overflow-hidden border border-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-linear-to-r from-indigo-50 via-purple-50 to-white">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-indigo-600 text-white shadow-sm">
              <Sparkles className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold uppercase tracking-wider text-indigo-700 bg-indigo-100/80 px-2 py-0.5 rounded-full">
                  Feynman Tutor
                </span>
                <span className="text-xs text-slate-500">Gemini 3.8 Flash</span>
              </div>
              <h3 className="text-lg font-bold text-slate-900 line-clamp-1">{concept}</h3>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100 transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {loading && (
            <div className="py-16 flex flex-col items-center justify-center text-center space-y-3">
              <Loader2 className="w-8 h-8 text-indigo-600 animate-spin" />
              <p className="text-sm font-medium text-slate-700">Synthesizing intuitive explanation...</p>
              <p className="text-xs text-slate-400 max-w-sm">
                Breaking down &quot;{concept}&quot; into intuitive analogies, core mechanisms, and memory mnemonics.
              </p>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-semibold text-sm">Explanation unavailable</p>
                <p className="text-xs text-rose-700 mt-1">{error}</p>
              </div>
            </div>
          )}

          {!loading && !error && explanation && (
            <div className="space-y-4">
              <div className="p-3.5 rounded-xl bg-indigo-50/60 border border-indigo-100 text-xs text-indigo-900 flex items-center gap-2">
                <Brain className="w-4 h-4 text-indigo-600 shrink-0" />
                <span>
                  The Feynman Technique explains concepts so simply that anyone can grasp the core idea in seconds.
                </span>
              </div>

              <div className="prose prose-slate prose-sm max-w-none text-slate-700 leading-relaxed whitespace-pre-wrap">
                {explanation}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
          <span className="text-xs text-slate-500 flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5 text-amber-500" />
            Active recall + deep comprehension accelerates long-term retention.
          </span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold rounded-lg shadow-sm shadow-indigo-500/20 transition-colors"
          >
            Got it, back to study
          </button>
        </div>
      </div>
    </div>
  );
};
