import React, { useState } from 'react';
import {
  FileText,
  Clock,
  Layers,
  HelpCircle,
  Trophy,
  Download,
  Share2,
  Trash2,
  Edit2,
  Check,
  CheckCircle2,
  Brain,
  Tag,
  ArrowRight,
  Sparkles,
  FileSpreadsheet,
  FileCode,
  Copy,
  ExternalLink,
  ShieldCheck,
  Info,
} from 'lucide-react';
import { StudyDeck } from '../types';

interface DeckOverviewProps {
  deck: StudyDeck;
  onUpdateDeck: (updated: StudyDeck) => void;
  onGoToFlashcards: () => void;
  onGoToQuiz: () => void;
  onDeleteDeck?: (id: string) => void;
}

export const DeckOverview: React.FC<DeckOverviewProps> = ({
  deck,
  onUpdateDeck,
  onGoToFlashcards,
  onGoToQuiz,
  onDeleteDeck,
}) => {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [editedTitle, setEditedTitle] = useState(deck.title);
  const [copiedType, setCopiedType] = useState<string | null>(null);
  const [activeExportPreview, setActiveExportPreview] = useState<'csv' | 'json' | null>(null);

  const totalCards = deck.flashcards.length;
  const masteredCards = deck.flashcards.filter((c) => c.status === 'mastered').length;
  const learningCards = deck.flashcards.filter((c) => c.status === 'learning').length;
  const masteryPct = totalCards > 0 ? Math.round((masteredCards / totalCards) * 100) : 0;

  const handleSaveTitle = () => {
    if (editedTitle.trim()) {
      onUpdateDeck({ ...deck, title: editedTitle.trim() });
    }
    setIsEditingTitle(false);
  };

  const getCleanSlug = (title: string) => {
    return title.replace(/[^a-z0-9]/gi, '_').toLowerCase();
  };

  // Helper to escape CSV strings according to RFC 4180
  const escapeCsv = (val: string | number | undefined | null): string => {
    if (val === null || val === undefined) return '""';
    const str = String(val).replace(/"/g, '""');
    return `"${str}"`;
  };

  // Generate Flashcards CSV (Anki, Quizlet, Brainscape, Excel compatible)
  const generateFlashcardsCsv = (): string => {
    const headers = [
      'Front (Question)',
      'Back (Answer)',
      'Key Concept',
      'Mnemonic Hint',
      'Topic Tag',
      'Mastery Status',
    ];

    const rows = deck.flashcards.map((card) => [
      escapeCsv(card.question),
      escapeCsv(card.answer),
      escapeCsv(card.keyConcept),
      escapeCsv(card.hint || ''),
      escapeCsv(card.topicTag || ''),
      escapeCsv(card.status || 'unseen'),
    ]);

    // Prepend UTF-8 BOM (\uFEFF) for seamless Excel / Google Sheets character encoding
    return '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  };

  // Generate Quiz CSV
  const generateQuizCsv = (): string => {
    const headers = [
      'Question',
      'Option A',
      'Option B',
      'Option C',
      'Option D',
      'Correct Choice',
      'Correct Answer Text',
      'Pedagogical Explanation',
      'Topic Tag',
      'Difficulty',
    ];

    const optionLabels = ['A', 'B', 'C', 'D'];

    const rows = deck.quiz.map((q) => [
      escapeCsv(q.question),
      escapeCsv(q.options[0] || ''),
      escapeCsv(q.options[1] || ''),
      escapeCsv(q.options[2] || ''),
      escapeCsv(q.options[3] || ''),
      escapeCsv(optionLabels[q.correctIndex] || `Option ${q.correctIndex + 1}`),
      escapeCsv(q.options[q.correctIndex] || ''),
      escapeCsv(q.explanation),
      escapeCsv(q.topicTag || ''),
      escapeCsv(q.difficulty || 'medium'),
    ]);

    return '\uFEFF' + [headers.map(escapeCsv).join(','), ...rows.map((r) => r.join(','))].join('\r\n');
  };

  // Generate complete JSON Backup
  const generateDeckJson = (): string => {
    const exportPayload = {
      schemaVersion: '1.0',
      exportedAt: new Date().toISOString(),
      app: 'CogniLearn',
      deck: {
        id: deck.id,
        title: deck.title,
        summary: deck.summary,
        keyTopics: deck.keyTopics,
        estimatedStudyTimeMinutes: deck.estimatedStudyTimeMinutes,
        createdAt: deck.createdAt,
        sourceFileName: deck.sourceFileName,
        sourceFileSize: deck.sourceFileSize,
        stats: deck.stats,
        flashcards: deck.flashcards,
        quiz: deck.quiz,
      },
    };
    return JSON.stringify(exportPayload, null, 2);
  };

  const handleExportFlashcardsCsv = () => {
    const csvContent = generateFlashcardsCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getCleanSlug(deck.title)}_flashcards_anki.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerCopied('csv-download');
  };

  const handleExportQuizCsv = () => {
    const csvContent = generateQuizCsv();
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getCleanSlug(deck.title)}_quiz_questions.csv`;
    link.click();
    URL.revokeObjectURL(url);
    triggerCopied('quiz-csv-download');
  };

  const handleExportJson = () => {
    const jsonStr = generateDeckJson();
    const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getCleanSlug(deck.title)}_deck_backup.json`;
    link.click();
    URL.revokeObjectURL(url);
    triggerCopied('json-download');
  };

  const handleExportMarkdown = () => {
    let md = `# ${deck.title}\n\n`;
    md += `**Document Source:** ${deck.sourceFileName || 'Uploaded Notes'}\n`;
    md += `**Estimated Study Time:** ${deck.estimatedStudyTimeMinutes} minutes\n\n`;
    md += `## Overview & Summary\n${deck.summary}\n\n`;
    md += `## Key Topics\n${deck.keyTopics.map((t) => `- ${t}`).join('\n')}\n\n`;

    md += `## Flashcards (${deck.flashcards.length})\n\n`;
    deck.flashcards.forEach((card, i) => {
      md += `### ${i + 1}. ${card.question}\n`;
      md += `**Answer:** ${card.answer}\n`;
      if (card.hint) md += `*Hint:* ${card.hint}\n`;
      md += `*Concept:* ${card.keyConcept} | *Topic:* ${card.topicTag}\n\n`;
    });

    md += `## Quiz Questions (${deck.quiz.length})\n\n`;
    deck.quiz.forEach((q, i) => {
      md += `### Q${i + 1}: ${q.question}\n`;
      q.options.forEach((opt, optIdx) => {
        md += `- [${optIdx === q.correctIndex ? 'x' : ' '}] ${opt}\n`;
      });
      md += `\n**Explanation:** ${q.explanation}\n\n`;
    });

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${getCleanSlug(deck.title)}_study_guide.md`;
    link.click();
    URL.revokeObjectURL(url);
    triggerCopied('md-download');
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      triggerCopied(type);
    } catch (err) {
      console.error('Failed to copy to clipboard', err);
    }
  };

  const triggerCopied = (type: string) => {
    setCopiedType(type);
    setTimeout(() => setCopiedType(null), 2500);
  };

  return (
    <div className="max-w-5xl mx-auto py-3 sm:py-6 px-2.5 sm:px-6 space-y-6 sm:space-y-8">
      {/* Deck Hero Card */}
      <div className="bg-white rounded-3xl p-5 sm:p-8 shadow-xl border border-slate-200">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-6">
          <div className="space-y-3 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider px-2.5 py-1 rounded-md bg-indigo-50 text-indigo-700">
                Study Set
              </span>
              <span className="text-xs text-slate-500 font-medium">
                {deck.sourceFileName || 'Document'}
              </span>
              {deck.sourceFileSize && (
                <span className="text-xs text-slate-400">({deck.sourceFileSize})</span>
              )}
            </div>

            {/* Editable Title */}
            {isEditingTitle ? (
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl sm:text-2xl font-extrabold text-slate-900 border-b-2 border-indigo-600 outline-none w-full"
                />
                <button
                  onClick={handleSaveTitle}
                  className="p-1.5 rounded-lg bg-indigo-600 text-white"
                >
                  <Check className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2 group">
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {deck.title}
                </h1>
                <button
                  onClick={() => setIsEditingTitle(true)}
                  className="opacity-0 group-hover:opacity-100 text-slate-400 hover:text-slate-600 p-1 transition-opacity"
                  title="Rename Title"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
              </div>
            )}

            {/* Summary */}
            <p className="text-sm sm:text-base text-slate-600 leading-relaxed max-w-3xl">
              {deck.summary}
            </p>

            {/* Key Topics Tag Clouds */}
            <div className="pt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-xs font-semibold text-slate-400 mr-1 flex items-center gap-1">
                <Tag className="w-3 h-3" /> Topics:
              </span>
              {deck.keyTopics.map((topic, i) => (
                <span
                  key={i}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  {topic}
                </span>
              ))}
            </div>
          </div>

          {/* Quick Study Launch Box */}
          <div className="bg-slate-50/80 p-5 rounded-2xl border border-slate-200/80 lg:w-72 shrink-0 space-y-3">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Ready to Learn?
            </p>

            <button
              onClick={onGoToFlashcards}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-indigo-500/20 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <Layers className="w-4 h-4" />
                <span>Study Flashcards</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <button
              onClick={onGoToQuiz}
              className="w-full py-3 px-4 rounded-xl bg-violet-600 hover:bg-violet-700 text-white text-xs sm:text-sm font-bold shadow-md shadow-violet-500/20 flex items-center justify-between transition-all"
            >
              <div className="flex items-center gap-2">
                <HelpCircle className="w-4 h-4" />
                <span>Test Knowledge Quiz</span>
              </div>
              <ArrowRight className="w-4 h-4" />
            </button>

            <div className="pt-2 border-t border-slate-200/60 flex items-center justify-between text-[11px] text-slate-500">
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-slate-400" />
                ~{deck.estimatedStudyTimeMinutes} min study
              </span>
              <span>{totalCards} cards &bull; {deck.quiz.length} Qs</span>
            </div>
          </div>
        </div>

        {/* Study Stats Strip */}
        <div className="mt-8 pt-6 border-t border-slate-100 grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Cards Mastered
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-slate-900">{masteredCards}</span>
              <span className="text-xs text-slate-400">/ {totalCards}</span>
            </div>
            <div className="w-full h-1.5 bg-slate-200 rounded-full mt-2 overflow-hidden">
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${masteryPct}%` }}
              />
            </div>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Best Quiz Score
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <Trophy className="w-4 h-4 text-amber-500" />
              <span className="text-xl font-extrabold text-slate-900">
                {deck.stats?.bestQuizScore > 0 ? `${deck.stats.bestQuizScore}%` : 'Not Taken'}
              </span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">
              {deck.stats?.quizzesTaken || 0} quizzes completed
            </span>
          </div>

          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Study Sessions
            </span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-xl font-extrabold text-slate-900">
                {deck.stats?.timesStudied || 0}
              </span>
              <span className="text-xs text-slate-400">sessions</span>
            </div>
            <span className="text-[10px] text-slate-400 mt-1 block">Spaced recall tracking</span>
          </div>

          {/* Quick 1-Click Export Actions */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-100 flex flex-col justify-between">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider block">
              Quick Export
            </span>
            <div className="flex items-center gap-1.5 mt-1">
              <button
                onClick={handleExportFlashcardsCsv}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-emerald-500 hover:bg-emerald-50 text-[11px] font-bold text-slate-700 hover:text-emerald-800 flex items-center justify-center gap-1 transition-all shadow-2xs"
                title="Export Flashcards as CSV (Anki & Quizlet)"
              >
                <FileSpreadsheet className="w-3 h-3 text-emerald-600" />
                <span>CSV</span>
              </button>
              <button
                onClick={handleExportJson}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-indigo-500 hover:bg-indigo-50 text-[11px] font-bold text-slate-700 hover:text-indigo-800 flex items-center justify-center gap-1 transition-all shadow-2xs"
                title="Export Full Deck as JSON Backup"
              >
                <FileCode className="w-3 h-3 text-indigo-600" />
                <span>JSON</span>
              </button>
              <button
                onClick={handleExportMarkdown}
                className="flex-1 py-1.5 px-2 rounded-lg bg-white border border-slate-200 hover:border-slate-400 text-[11px] font-bold text-slate-700 flex items-center justify-center gap-1 transition-all shadow-2xs"
                title="Export Study Notes as Markdown"
              >
                <Download className="w-3 h-3 text-slate-500" />
                <span>.MD</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* DEDICATED EXPORT & BACKUP SECTION */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-100 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-emerald-50 text-emerald-700">
                <Share2 className="w-4 h-4" />
              </div>
              <h2 className="text-lg font-extrabold text-slate-900 tracking-tight">
                Export & External App Backup
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Download your study deck in portable formats for Anki, Quizlet, Brainscape, spreadsheets, or secure off-site JSON backup.
            </p>
          </div>

          {copiedType && (
            <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold rounded-lg animate-fade-in self-start sm:self-auto">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                {copiedType.includes('download')
                  ? 'File downloaded successfully!'
                  : 'Copied to clipboard!'}
              </span>
            </div>
          )}
        </div>

        {/* 3 Main Export Format Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* 1. CSV Flashcards (Anki & Quizlet) */}
          <div className="p-5 rounded-2xl border-2 border-slate-100 hover:border-emerald-300 bg-slate-50/50 hover:bg-emerald-50/20 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-emerald-100 text-emerald-700 group-hover:scale-105 transition-transform">
                  <FileSpreadsheet className="w-5 h-5" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                  Anki & Quizlet
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Flashcards CSV</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Standard format with Front, Back, Hint, Concept, and Topic. Ready for 1-click import into Anki, Quizlet, RemNote, or Excel.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportFlashcardsCsv}
                className="flex-1 py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-emerald-500/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(generateFlashcardsCsv(), 'csv-copy')}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:border-emerald-300 text-slate-600 hover:text-emerald-700 transition-colors"
                title="Copy CSV Content to Clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 2. Full JSON Backup */}
          <div className="p-5 rounded-2xl border-2 border-slate-100 hover:border-indigo-300 bg-slate-50/50 hover:bg-indigo-50/20 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-indigo-100 text-indigo-700 group-hover:scale-105 transition-transform">
                  <FileCode className="w-5 h-5" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-800">
                  Complete Backup
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Full Deck JSON</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Complete lossless archive containing all {totalCards} flashcards, all {deck.quiz.length} quiz questions, options, explanations, and learning stats.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="flex-1 py-2 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-indigo-500/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download JSON</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(generateDeckJson(), 'json-copy')}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:border-indigo-300 text-slate-600 hover:text-indigo-700 transition-colors"
                title="Copy JSON to Clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 3. Quiz Questions CSV */}
          <div className="p-5 rounded-2xl border-2 border-slate-100 hover:border-violet-300 bg-slate-50/50 hover:bg-violet-50/20 transition-all flex flex-col justify-between group">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="p-2 rounded-xl bg-violet-100 text-violet-700 group-hover:scale-105 transition-transform">
                  <HelpCircle className="w-5 h-5" />
                </span>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-violet-100 text-violet-800">
                  Assessments
                </span>
              </div>
              <h3 className="text-sm font-bold text-slate-900">Quiz Questions CSV</h3>
              <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                Export all multiple-choice questions, options A-D, correct keys, and pedagogical explanations for exams or Google Forms.
              </p>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-200/60 flex items-center gap-2">
              <button
                type="button"
                onClick={handleExportQuizCsv}
                className="flex-1 py-2 px-3 rounded-xl bg-violet-600 hover:bg-violet-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-sm shadow-violet-500/20 transition-colors"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Quiz CSV</span>
              </button>
              <button
                type="button"
                onClick={() => copyToClipboard(generateQuizCsv(), 'quiz-csv-copy')}
                className="p-2 rounded-xl bg-white border border-slate-200 hover:border-violet-300 text-slate-600 hover:text-violet-700 transition-colors"
                title="Copy Quiz CSV to Clipboard"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Format Compatibility Tips */}
        <div className="p-4 rounded-2xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Info className="w-4 h-4 text-indigo-600 shrink-0" />
            <span>
              <strong>Anki / Quizlet tip:</strong> When importing the Flashcards CSV, select comma (<kbd className="px-1 py-0.5 bg-white border rounded text-[10px]">,&lrm;</kbd>) as the field delimiter and enable HTML/UTF-8.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => setActiveExportPreview(activeExportPreview === 'csv' ? null : 'csv')}
              className="text-xs font-bold text-emerald-700 hover:text-emerald-900 underline"
            >
              {activeExportPreview === 'csv' ? 'Hide CSV Preview' : 'Preview CSV Sample'}
            </button>
            <span>&bull;</span>
            <button
              onClick={() => setActiveExportPreview(activeExportPreview === 'json' ? null : 'json')}
              className="text-xs font-bold text-indigo-700 hover:text-indigo-900 underline"
            >
              {activeExportPreview === 'json' ? 'Hide JSON Preview' : 'Preview JSON Sample'}
            </button>
          </div>
        </div>

        {/* Live Export Preview Box */}
        {activeExportPreview && (
          <div className="p-4 rounded-2xl bg-slate-900 text-slate-200 font-mono text-[11px] overflow-x-auto border border-slate-800 animate-in fade-in duration-200">
            <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800 text-slate-400 text-xs font-sans">
              <span className="font-bold uppercase tracking-wider">
                {activeExportPreview === 'csv' ? 'Flashcards CSV Raw Preview' : 'Full JSON Backup Raw Preview'}
              </span>
              <button
                onClick={() =>
                  copyToClipboard(
                    activeExportPreview === 'csv' ? generateFlashcardsCsv() : generateDeckJson(),
                    'preview-copy'
                  )
                }
                className="hover:text-white flex items-center gap-1 font-semibold"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Raw</span>
              </button>
            </div>
            <pre className="whitespace-pre overflow-x-auto max-h-56">
              {activeExportPreview === 'csv'
                ? generateFlashcardsCsv().slice(0, 1500) + (generateFlashcardsCsv().length > 1500 ? '\n... (truncated)' : '')
                : generateDeckJson().slice(0, 1500) + (generateDeckJson().length > 1500 ? '\n... (truncated)' : '')}
            </pre>
          </div>
        )}
      </div>

      {/* Flashcards Preview List */}
      <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-slate-200 space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Flashcards in this Deck</h3>
            <p className="text-xs text-slate-500">
              Active-recall questions and comprehensive answers synthesized from your document.
            </p>
          </div>
          <button
            onClick={onGoToFlashcards}
            className="text-xs font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
          >
            <span>Launch Flip Card Mode</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
          {deck.flashcards.map((card, i) => (
            <div
              key={card.id || i}
              className="p-4 rounded-2xl border border-slate-200/80 bg-slate-50/50 hover:bg-slate-50 transition-colors"
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded">
                  {card.keyConcept}
                </span>
                {card.status === 'mastered' ? (
                  <span className="text-[10px] font-bold text-emerald-600 flex items-center gap-0.5">
                    <CheckCircle2 className="w-3 h-3" /> Mastered
                  </span>
                ) : (
                  <span className="text-[10px] text-slate-400 font-medium">#{i + 1}</span>
                )}
              </div>
              <p className="text-xs font-bold text-slate-800">{card.question}</p>
              <p className="text-[11px] text-slate-600 mt-1 line-clamp-2">{card.answer}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
