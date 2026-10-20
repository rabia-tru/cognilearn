import React, { useState, useRef } from 'react';
import {
  Upload,
  FileText,
  FileCheck,
  Sparkles,
  Sliders,
  AlertCircle,
  Loader2,
  BookOpen,
  ArrowRight,
  Check,
  FileCode,
  Image as ImageIcon,
  Zap,
  Camera,
  Mic,
  MicOff,
} from 'lucide-react';
import { DEMO_PRESET_DOCUMENTS } from '../data/sampleDecks';
import { StudyDeck } from '../types';
import { useVoiceToText } from '../hooks/useVoiceToText';
import { safeApiFetch } from '../utils/api';

interface UploadViewProps {
  onDeckCreated: (newDeck: StudyDeck) => void;
  onCancel?: () => void;
}

export const UploadView: React.FC<UploadViewProps> = ({ onDeckCreated, onCancel }) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'demo'>('upload');
  
  // File upload state
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [fileBase64, setFileBase64] = useState<string | null>(null);
  const [fileMimeType, setFileMimeType] = useState<string | null>(null);
  const [fileTextContent, setFileTextContent] = useState<string>('');
  const [isDragging, setIsDragging] = useState(false);

  // Paste state
  const [pastedText, setPastedText] = useState('');
  const [documentTitle, setDocumentTitle] = useState('');

  // Generation options
  const [cardCount, setCardCount] = useState<number>(10);
  const [quizCount, setQuizCount] = useState<number>(6);
  const [difficulty, setDifficulty] = useState<'foundational' | 'intermediate' | 'advanced'>('intermediate');
  const [focusArea, setFocusArea] = useState<'comprehensive' | 'definitions' | 'mechanisms' | 'exam'>('comprehensive');

  // Loading & error states
  const [isGenerating, setIsGenerating] = useState(false);
  const [generationStep, setGenerationStep] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [detectedBackupDeck, setDetectedBackupDeck] = useState<StudyDeck | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  const {
    isSupported: isVoiceSupported,
    isListening: isVoiceListening,
    startListening: startVoiceListening,
    stopListening: stopVoiceListening,
    error: voiceError,
  } = useVoiceToText({
    continuous: true,
    onTranscript: (spoken) => {
      setPastedText(spoken);
      if (!documentTitle) {
        setDocumentTitle('Voice Dictated Notes');
      }
    },
  });

  const handleFileProcess = (file: File) => {
    setSelectedFile(file);
    setErrorMessage(null);
    setDetectedBackupDeck(null);

    if (!documentTitle) {
      const cleanTitle = file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
      setDocumentTitle(cleanTitle.charAt(0).toUpperCase() + cleanTitle.slice(1));
    }

    const isTextFile =
      file.type.startsWith('text/') ||
      file.name.endsWith('.txt') ||
      file.name.endsWith('.md') ||
      file.name.endsWith('.csv') ||
      file.name.endsWith('.json');

    if (isTextFile) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        setFileTextContent(text);
        setFileBase64(null);
        setFileMimeType(file.type || 'text/plain');

        // Check if this is a CogniLearn JSON backup file
        if (file.name.endsWith('.json')) {
          try {
            const parsed = JSON.parse(text);
            const rawDeck = parsed.deck || parsed;
            if (rawDeck.title && Array.isArray(rawDeck.flashcards)) {
              setDetectedBackupDeck(rawDeck as StudyDeck);
            }
          } catch {
            // Not a JSON backup, handle as normal text
          }
        }
      };
      reader.readAsText(file);
    } else {
      // For PDF, DOC, Images
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        const base64Data = result.split(',')[1];
        setFileBase64(base64Data);
        setFileMimeType(file.type || (file.name.endsWith('.pdf') ? 'application/pdf' : 'application/octet-stream'));
        setFileTextContent('');
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRestoreBackup = () => {
    if (!detectedBackupDeck) return;
    const restoredDeck: StudyDeck = {
      ...detectedBackupDeck,
      id: `deck_restored_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      stats: detectedBackupDeck.stats || {
        timesStudied: 0,
        bestQuizScore: 0,
        quizzesTaken: 0,
        lastStudiedAt: new Date().toISOString(),
      },
    };
    onDeckCreated(restoredDeck);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleSelectDemo = (preset: typeof DEMO_PRESET_DOCUMENTS[0]) => {
    setPastedText(preset.sampleText);
    setDocumentTitle(preset.title);
    setActiveTab('paste');
  };

  const handleSubmit = async () => {
    setErrorMessage(null);

    const hasFile = Boolean(selectedFile && (fileBase64 || fileTextContent));
    const hasPasted = Boolean(pastedText.trim().length > 30);

    if (!hasFile && !hasPasted) {
      setErrorMessage('Please upload a document (PDF, Text, Image) or paste study notes (minimum 30 characters).');
      return;
    }

    setIsGenerating(true);
    setGenerationStep('Analyzing document structure and key pedagogical concepts...');

    try {
      // Progress animation simulation
      const stepTimer1 = setTimeout(() => {
        setGenerationStep('Synthesizing active recall flashcards & memory cues...');
      }, 1800);

      const stepTimer2 = setTimeout(() => {
        setGenerationStep('Formulating diagnostic multiple-choice quiz questions...');
      }, 3600);

      const payload: any = {
        titleHint: documentTitle.trim(),
        cardCount,
        quizCount,
        difficulty,
        focusArea,
      };

      if (hasFile && fileBase64) {
        payload.fileData = {
          mimeType: fileMimeType,
          base64: fileBase64,
        };
      } else if (hasFile && fileTextContent) {
        payload.text = fileTextContent;
      } else {
        payload.text = pastedText;
      }

      const response = await safeApiFetch('/api/generate-deck', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      clearTimeout(stepTimer1);
      clearTimeout(stepTimer2);

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}));
        throw new Error(errData.error || `Server responded with status ${response.status}`);
      }

      const data = await response.json();
      if (!data.success || !data.deck) {
        throw new Error('Invalid response structure from server.');
      }

      // Supplement deck with metadata
      const newDeck: StudyDeck = {
        ...data.deck,
        sourceFileName: selectedFile?.name || (documentTitle ? `${documentTitle}.txt` : 'Uploaded Notes.txt'),
        sourceFileSize: selectedFile ? `${(selectedFile.size / 1024).toFixed(1)} KB` : `${pastedText.length} chars`,
        stats: {
          timesStudied: 0,
          bestQuizScore: 0,
          quizzesTaken: 0,
          lastStudiedAt: new Date().toISOString(),
        },
      };

      onDeckCreated(newDeck);
    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'An error occurred while generating the study deck. Please try again.');
    } finally {
      setIsGenerating(false);
      setGenerationStep('');
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8 px-4 sm:px-6">
      {/* Title Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold mb-3">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Multimodal Document Learning</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
          Create AI Flashcards & Quiz from Your Documents
        </h1>
        <p className="mt-2 text-sm sm:text-base text-slate-600 max-w-2xl mx-auto">
          Upload any PDF, lecture slides, research paper, or notes. CogniLearn extracts key principles, synthesizes active-recall flashcards, and generates diagnostic quizzes.
        </p>
      </div>

      {/* Main Form Container */}
      <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
        {/* Input Mode Selector Tabs */}
        <div className="flex border-b border-slate-200 bg-slate-50/70 p-1.5 gap-1.5">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'upload'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Upload className="w-4 h-4" />
            <span>Upload Document</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'paste'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Paste Notes / Text</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('demo')}
            className={`flex-1 py-2.5 px-4 rounded-xl text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all ${
              activeTab === 'demo'
                ? 'bg-white text-indigo-700 shadow-xs font-bold'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Zap className="w-4 h-4 text-amber-500" />
            <span>Try Sample Presets</span>
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* Deck Title Input */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-700 mb-1.5">
              Study Deck Title (Optional)
            </label>
            <input
              type="text"
              value={documentTitle}
              onChange={(e) => setDocumentTitle(e.target.value)}
              placeholder="e.g. Neuroscience Chapter 4, Corporate Finance Exam Prep"
              className="w-full px-4 py-2.5 rounded-xl border border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100 text-sm outline-none transition-all placeholder:text-slate-400"
            />
          </div>

          {/* TAB 1: FILE UPLOAD */}
          {activeTab === 'upload' && (
            <div>
              <div
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
                  isDragging
                    ? 'border-indigo-500 bg-indigo-50/50 scale-[1.01]'
                    : selectedFile
                    ? 'border-emerald-400 bg-emerald-50/20'
                    : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/50'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,.txt,.md,.markdown,.csv,.json,.png,.jpg,.jpeg,.webp"
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      handleFileProcess(e.target.files[0]);
                    }
                  }}
                />

                {selectedFile ? (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3 shadow-xs">
                      <FileCheck className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-900">{selectedFile.name}</p>
                    <p className="text-xs text-slate-500 mt-1">
                      {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB • {selectedFile.type || 'Document'}
                    </p>
                    <div className="mt-3 flex items-center gap-2">
                      <span className="text-xs px-2.5 py-1 bg-emerald-100 text-emerald-800 font-semibold rounded-md">
                        Ready to process
                      </span>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedFile(null);
                          setFileBase64(null);
                          setFileTextContent('');
                          setDetectedBackupDeck(null);
                        }}
                        className="text-xs text-slate-400 hover:text-rose-600 underline font-medium"
                      >
                        Change file
                      </button>
                    </div>

                    {detectedBackupDeck && (
                      <div
                        onClick={(e) => e.stopPropagation()}
                        className="mt-4 p-4 rounded-xl bg-indigo-50 border border-indigo-200 text-left max-w-md w-full animate-fade-in"
                      >
                        <div className="flex items-center gap-2 text-indigo-950 font-bold text-xs mb-1">
                          <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                          <span>CogniLearn Study Deck Backup Detected!</span>
                        </div>
                        <p className="text-xs text-indigo-800 mb-3 leading-relaxed">
                          &ldquo;{detectedBackupDeck.title}&rdquo; contains {detectedBackupDeck.flashcards?.length || 0} flashcards and {detectedBackupDeck.quiz?.length || 0} quiz questions.
                        </p>
                        <button
                          type="button"
                          onClick={handleRestoreBackup}
                          className="w-full py-2.5 px-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-md shadow-indigo-500/20 transition-all hover:scale-[1.01]"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Restore & Open Deck Instantly</span>
                        </button>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                      <Upload className="w-6 h-6" />
                    </div>
                    <p className="text-sm font-bold text-slate-800">
                      Drag & drop your document here, or <span className="text-indigo-600 underline">browse</span>
                    </p>
                    <p className="text-xs text-slate-400 mt-1.5 max-w-sm">
                      Supports PDF, TXT, Markdown, CSV, JSON, and lecture slide images (PNG, JPG)
                    </p>
                    <div className="flex items-center gap-3 mt-4 text-[11px] text-slate-600 font-medium">
                      <span className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-indigo-500" /> PDF & Docs
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <FileCode className="w-3.5 h-3.5 text-indigo-500" /> Text & Markdown
                      </span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <ImageIcon className="w-3.5 h-3.5 text-indigo-500" /> Slide Screenshots
                      </span>
                    </div>

                    {/* Mobile Camera Quick Action */}
                    <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-center">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          cameraInputRef.current?.click();
                        }}
                        className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200 transition-colors shadow-2xs"
                      >
                        <Camera className="w-3.5 h-3.5" />
                        <span>Take Photo / Scan Notes</span>
                      </button>
                      <input
                        ref={cameraInputRef}
                        type="file"
                        accept="image/*"
                        capture="environment"
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files && e.target.files[0]) {
                            handleFileProcess(e.target.files[0]);
                          }
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: PASTE NOTES WITH VOICE DICTATION */}
          {activeTab === 'paste' && (
            <div>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-700">
                  Study Notes / Textbook Excerpt
                </label>

                <div className="flex items-center gap-2">
                  {isVoiceSupported && (
                    <button
                      type="button"
                      onClick={() => {
                        if (isVoiceListening) {
                          stopVoiceListening();
                        } else {
                          startVoiceListening((text) => setPastedText(text));
                        }
                      }}
                      className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all shadow-2xs ${
                        isVoiceListening
                          ? 'bg-rose-600 text-white animate-pulse'
                          : 'bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200/80'
                      }`}
                      title="Speak your study notes directly with microphone"
                    >
                      <Mic className="w-3.5 h-3.5" />
                      <span>{isVoiceListening ? 'Stop Listening' : 'Dictate with Voice'}</span>
                    </button>
                  )}

                  <span className="text-xs text-slate-500 font-medium">
                    {pastedText.length} chars &bull; {pastedText.split(/\s+/).filter(Boolean).length} words
                  </span>
                </div>
              </div>

              {/* Active Voice Dictation Banner */}
              {isVoiceListening && (
                <div className="mb-3 p-3 rounded-xl bg-indigo-50/90 border border-indigo-200/90 flex items-center justify-between gap-3 animate-pulse">
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="relative flex h-2.5 w-2.5 shrink-0">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75" />
                      <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-rose-500" />
                    </span>
                    <p className="text-xs text-indigo-950 font-medium truncate">
                      <span className="font-bold">Listening:</span> Speak your lecture notes, summaries, or questions clearly into your microphone...
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={stopVoiceListening}
                    className="px-2.5 py-1 rounded-lg bg-rose-600 hover:bg-rose-700 text-white text-[11px] font-bold shrink-0 transition-colors"
                  >
                    Done Speaking
                  </button>
                </div>
              )}

              {voiceError && (
                <div className="mb-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs">
                  {voiceError}
                </div>
              )}

              <textarea
                rows={8}
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Paste or speak your lecture notes, syllabus content, article excerpts, definitions, or study guides here..."
                className={`w-full p-4 rounded-xl border text-sm outline-none transition-all font-mono leading-relaxed placeholder:text-slate-400 ${
                  isVoiceListening
                    ? 'border-indigo-500 ring-2 ring-indigo-100 bg-indigo-50/15'
                    : 'border-slate-200 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100'
                }`}
              />
            </div>
          )}

          {/* TAB 3: DEMO PRESETS */}
          {activeTab === 'demo' && (
            <div className="space-y-3">
              <p className="text-xs text-slate-500">
                Pick a pre-configured topic to test the flashcards and quiz generator instantly:
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {DEMO_PRESET_DOCUMENTS.map((preset, idx) => (
                  <div
                    key={idx}
                    onClick={() => handleSelectDemo(preset)}
                    className="p-4 rounded-xl border border-slate-200 hover:border-indigo-400 hover:bg-indigo-50/30 cursor-pointer transition-all flex flex-col justify-between group shadow-2xs"
                  >
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 group-hover:bg-indigo-100 group-hover:text-indigo-700 transition-colors">
                        {preset.category}
                      </span>
                      <h4 className="text-sm font-bold text-slate-900 mt-2 line-clamp-1 group-hover:text-indigo-600">
                        {preset.title}
                      </h4>
                      <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                        {preset.description}
                      </p>
                    </div>
                    <div className="mt-3 flex items-center text-xs font-semibold text-indigo-600 gap-1">
                      <span>Use this preset</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Configuration Options Accordion */}
          <div className="pt-4 border-t border-slate-100 space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-600">
              <Sliders className="w-4 h-4 text-indigo-600" />
              <span>Generation Settings & Customization</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Flashcard Count */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Flashcards</span>
                  <span className="text-indigo-600 font-extrabold">{cardCount}</span>
                </div>
                <input
                  type="range"
                  min="5"
                  max="20"
                  step="1"
                  value={cardCount}
                  onChange={(e) => setCardCount(Number(e.target.value))}
                  className="w-full accent-indigo-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Target active-recall cards</span>
              </div>

              {/* Quiz Questions Count */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <div className="flex justify-between items-center text-xs font-bold text-slate-700 mb-1">
                  <span>Quiz Questions</span>
                  <span className="text-violet-600 font-extrabold">{quizCount}</span>
                </div>
                <input
                  type="range"
                  min="4"
                  max="12"
                  step="1"
                  value={quizCount}
                  onChange={(e) => setQuizCount(Number(e.target.value))}
                  className="w-full accent-violet-600 cursor-pointer"
                />
                <span className="text-[10px] text-slate-400">Target multiple-choice questions</span>
              </div>

              {/* Difficulty Level */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Difficulty
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-1.5 focus:border-indigo-500 outline-none"
                >
                  <option value="foundational">Foundational (High School / Intro)</option>
                  <option value="intermediate">Intermediate (College / Standard)</option>
                  <option value="advanced">Advanced (Deep Rigor / Professional)</option>
                </select>
              </div>

              {/* Focus Area */}
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200/80">
                <label className="block text-xs font-bold text-slate-700 mb-1.5">
                  Pedagogical Focus
                </label>
                <select
                  value={focusArea}
                  onChange={(e) => setFocusArea(e.target.value as any)}
                  className="w-full text-xs font-semibold bg-white border border-slate-200 rounded-lg p-1.5 focus:border-indigo-500 outline-none"
                >
                  <option value="comprehensive">Comprehensive Balance</option>
                  <option value="definitions">Key Terms & Core Definitions</option>
                  <option value="mechanisms">Mechanisms & Causality</option>
                  <option value="exam">Scenario & Problem Solving</option>
                </select>
              </div>
            </div>
          </div>

          {/* Error Banner */}
          {errorMessage && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-3 text-xs sm:text-sm">
              <AlertCircle className="w-5 h-5 shrink-0 text-rose-600 mt-0.5" />
              <div>
                <p className="font-bold">Generation failed</p>
                <p className="mt-0.5 text-rose-700">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Action Button & Loading Indicator */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-xs text-slate-400">
              Powered by <span className="font-semibold text-slate-600">Gemini 3.8 Flash</span> with multimodal document parsing.
            </div>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              {onCancel && (
                <button
                  type="button"
                  onClick={onCancel}
                  className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Cancel
                </button>
              )}

              <button
                type="button"
                disabled={isGenerating}
                onClick={handleSubmit}
                className="w-full sm:w-auto px-6 py-3 rounded-xl bg-linear-to-r from-indigo-600 via-indigo-700 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white font-bold text-sm shadow-md shadow-indigo-500/25 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Analyzing & Synthesizing...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Flashcards & Quiz</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Enhanced Loading Status with Progress Bar */}
          {isGenerating && (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in duration-200">
              <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 duration-300">
                <Loader2 className="w-16 h-16 text-indigo-600 animate-spin mx-auto mb-4" />
                
                <h3 className="text-xl font-extrabold text-slate-900 text-center mb-2">
                  Generating Your Study Deck
                </h3>
                
                <p className="text-sm text-slate-600 text-center mb-4">
                  {generationStep}
                </p>

                {/* Progress Bar */}
                <div className="w-full h-2.5 bg-slate-100 rounded-full overflow-hidden mb-3">
                  <div 
                    className="h-full bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 rounded-full transition-all duration-500 ease-out"
                    style={{ 
                      width: generationStep.includes('Analyzing') ? '25%' :
                             generationStep.includes('Synthesizing') ? '50%' :
                             generationStep.includes('Formulating') ? '75%' : '90%'
                    }}
                  />
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${generationStep.includes('Analyzing') ? 'bg-indigo-600 animate-pulse' : 'bg-emerald-500'}`} />
                    <span className={generationStep.includes('Analyzing') ? 'text-slate-900 font-semibold' : 'text-slate-500'}>
                      Analyzing document structure
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${generationStep.includes('Synthesizing') ? 'bg-indigo-600 animate-pulse' : generationStep.includes('Formulating') ? 'bg-emerald-500' : 'bg-slate-300'}`} />
                    <span className={generationStep.includes('Synthesizing') ? 'text-slate-900 font-semibold' : generationStep.includes('Formulating') ? 'text-slate-500' : 'text-slate-400'}>
                      Creating flashcards
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-xs">
                    <div className={`w-2 h-2 rounded-full ${generationStep.includes('Formulating') ? 'bg-indigo-600 animate-pulse' : generationStep.includes('Analyzing') || generationStep.includes('Synthesizing') ? 'bg-slate-300' : 'bg-emerald-500'}`} />
                    <span className={generationStep.includes('Formulating') ? 'text-slate-900 font-semibold' : 'text-slate-400'}>
                      Generating quiz questions
                    </span>
                  </div>
                </div>

                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-100">
                  <p className="text-[11px] text-indigo-800 text-center">
                    ⚡ This usually takes 10-20 seconds
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
