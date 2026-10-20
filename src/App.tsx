/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { SAMPLE_DECKS } from './data/sampleDecks';
import { StudyDeck, ViewMode } from './types';
import { Navbar } from './components/Navbar';
import { MobileBottomNav } from './components/MobileBottomNav';
import { OfflineIndicator } from './components/OfflineIndicator';
import { UploadView } from './components/UploadView';
import { FlashcardView } from './components/FlashcardView';
import { QuizView } from './components/QuizView';
import { DeckOverview } from './components/DeckOverview';
import { SplashScreen } from './components/SplashScreen';
import { OnboardingScreen } from './components/OnboardingScreen';
import { SettingsView } from './components/SettingsView';
import { useAppSettings } from './hooks/useAppSettings';
import { Upload, Brain } from 'lucide-react';

const STORAGE_KEY = 'cognilearn_decks_v1';
const ACTIVE_DECK_KEY = 'cognilearn_active_deck_id';
const ONBOARDING_KEY = 'cognilearn_onboarding_completed_v3';

export default function App() {
  const { settings, updateSetting, resetToDefaults } = useAppSettings();

  const [decks, setDecks] = useState<StudyDeck[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          return parsed;
        }
      }
    } catch (e) {
      console.error('Failed to load decks from localStorage:', e);
    }
    return SAMPLE_DECKS;
  });

  const [activeDeckId, setActiveDeckId] = useState<string>(() => {
    try {
      const savedActive = localStorage.getItem(ACTIVE_DECK_KEY);
      if (savedActive && decks.some((d) => d.id === savedActive)) {
        return savedActive;
      }
    } catch (e) {
      // ignore
    }
    return decks[0]?.id || '';
  });

  const [currentView, setCurrentView] = useState<ViewMode>('flashcards');

  // Mobile Splash Screen on app launch
  const [showSplash, setShowSplash] = useState<boolean>(true);

  // Show onboarding for first-time visitors automatically
  const [isOnboardingOpen, setIsOnboardingOpen] = useState<boolean>(() => {
    try {
      return localStorage.getItem(ONBOARDING_KEY) !== 'true';
    } catch {
      return false;
    }
  });

  // Persist decks
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(decks));
    } catch (e) {
      console.error('Failed to save decks to localStorage:', e);
    }
  }, [decks]);

  // Persist active deck ID
  useEffect(() => {
    try {
      localStorage.setItem(ACTIVE_DECK_KEY, activeDeckId);
    } catch (e) {
      // ignore
    }
  }, [activeDeckId]);

  const activeDeck = decks.find((d) => d.id === activeDeckId) || decks[0];

  const handleDeckCreated = (newDeck: StudyDeck) => {
    setDecks((prev) => [newDeck, ...prev]);
    setActiveDeckId(newDeck.id);
    setCurrentView('flashcards');
  };

  const handleUpdateDeck = (updatedDeck: StudyDeck) => {
    setDecks((prev) =>
      prev.map((d) => (d.id === updatedDeck.id ? updatedDeck : d))
    );
  };

  const handleDeleteDeck = (deckId: string) => {
    const updated = decks.filter((d) => d.id !== deckId);
    setDecks(updated);
    if (activeDeckId === deckId) {
      setActiveDeckId(updated[0]?.id || '');
    }
  };

  const handleSelectDeck = (deckId: string) => {
    setActiveDeckId(deckId);
  };

  const handleCloseOnboarding = () => {
    setIsOnboardingOpen(false);
    try {
      localStorage.setItem(ONBOARDING_KEY, 'true');
    } catch {
      // ignore
    }
  };

  const handleOpenOnboarding = () => {
    setIsOnboardingOpen(true);
  };

  // 1. Mobile App Splash Screen
  if (showSplash) {
    return <SplashScreen onFinish={() => setShowSplash(false)} />;
  }

  // 2. Full-Screen Onboarding on First Install / Launch
  if (isOnboardingOpen) {
    return <OnboardingScreen onComplete={handleCloseOnboarding} />;
  }

  // 3. Main Home Screen
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col text-slate-800 antialiased selection:bg-indigo-500 selection:text-white pb-20 md:pb-0">
      {/* Top App Header */}
      <Navbar
        currentView={currentView}
        onSelectView={setCurrentView}
        decks={decks}
        activeDeckId={activeDeckId}
        onSelectDeck={handleSelectDeck}
        onDeleteDeck={handleDeleteDeck}
        onOpenOnboarding={handleOpenOnboarding}
        onDeckCreated={handleDeckCreated}
        settings={settings}
        onUpdateSetting={updateSetting}
        onResetSettings={resetToDefaults}
      />

      {/* Main Content Area */}
      <main className="flex-1 pb-12 sm:pb-16">
        {currentView === 'upload' && (
          <UploadView
            onDeckCreated={handleDeckCreated}
            onCancel={decks.length > 0 ? () => setCurrentView('flashcards') : undefined}
          />
        )}

        {currentView === 'flashcards' && activeDeck && (
          <FlashcardView
            deck={activeDeck}
            onUpdateDeck={handleUpdateDeck}
            onStartQuiz={() => setCurrentView('quiz')}
            settings={settings}
          />
        )}

        {currentView === 'quiz' && activeDeck && (
          <QuizView
            deck={activeDeck}
            onUpdateDeck={handleUpdateDeck}
            onGoToFlashcards={() => setCurrentView('flashcards')}
            settings={settings}
          />
        )}

        {currentView === 'deck-overview' && activeDeck && (
          <DeckOverview
            deck={activeDeck}
            onUpdateDeck={handleUpdateDeck}
            onGoToFlashcards={() => setCurrentView('flashcards')}
            onGoToQuiz={() => setCurrentView('quiz')}
            onDeleteDeck={handleDeleteDeck}
          />
        )}

        {currentView === 'settings' && (
          <SettingsView
            settings={settings}
            onUpdateSetting={updateSetting}
            onResetSettings={resetToDefaults}
            onOpenOnboarding={handleOpenOnboarding}
            decks={decks}
            onGoToFlashcards={() => setCurrentView('flashcards')}
          />
        )}

        {decks.length === 0 && currentView !== 'upload' && (
          <div className="max-w-md mx-auto my-20 p-8 bg-white rounded-3xl text-center shadow-xl border border-slate-200">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto mb-4">
              <Upload className="w-7 h-7" />
            </div>
            <h3 className="text-xl font-bold text-slate-900">No Study Decks Yet</h3>
            <p className="text-sm text-slate-500 mt-2">
              Upload a document, lecture notes, or syllabus to generate your first interactive flashcard deck and quiz.
            </p>
            <button
              onClick={() => setCurrentView('upload')}
              className="mt-6 px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-500/20"
            >
              Upload Document Now
            </button>
          </div>
        )}
      </main>

      {/* Native-style Mobile Bottom Tab Bar */}
      <MobileBottomNav
        currentView={currentView}
        onSelectView={setCurrentView}
        activeDeck={activeDeck}
      />

      {/* Offline Status Toast */}
      <OfflineIndicator />

      {/* Desktop Footer (Hidden on mobile devices) */}
      <footer className="hidden md:block border-t border-slate-200 bg-white/70 py-6 text-center text-xs text-slate-600">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Brain className="w-4 h-4 text-indigo-600" />
            <span className="font-bold text-slate-800">CogniLearn</span>
            <span className="text-slate-500">&bull; Multimodal Active Recall Learning</span>
          </div>
          <div className="flex items-center gap-4 text-slate-600">
            <span>Spaced Repetition &bull; Diagnostic Quizzes &bull; Feynman Breakdowns</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
