export interface Flashcard {
  id: string;
  question: string;
  answer: string;
  hint: string;
  keyConcept: string;
  topicTag: string;
  status?: 'unseen' | 'learning' | 'mastered';
  notes?: string;
}

export interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctIndex: number;
  explanation: string;
  topicTag: string;
  difficulty: 'easy' | 'medium' | 'hard';
}

export interface DeckStats {
  timesStudied: number;
  bestQuizScore: number; // percentage
  quizzesTaken: number;
  lastStudiedAt?: string;
}

export interface StudyDeck {
  id: string;
  title: string;
  summary: string;
  keyTopics: string[];
  estimatedStudyTimeMinutes: number;
  flashcards: Flashcard[];
  quiz: QuizQuestion[];
  createdAt: string;
  sourceFileName?: string;
  sourceFileSize?: string;
  stats: DeckStats;
  /** True when the deck was built on-device because the backend was unreachable. */
  generatedOffline?: boolean;
}

export type ViewMode = 'upload' | 'flashcards' | 'quiz' | 'deck-overview' | 'settings';

export interface AppSettings {
  speechRate: number; // 0.8, 1.0, 1.25, 1.5
  autoFlipTTS: boolean; // Auto speak answer on flip
  autoAdvanceOnRate: boolean; // Auto advance to next card after marking
  showMnemonicsByDefault: boolean; // Auto expand mnemonic clues
  soundEffects: boolean; // Confetti & sound celebrations
  hapticFeedback: boolean; // Mobile vibration
  quizTimerSeconds: number; // 0 for no timer, or 30, 45, 60
  dailyGoalCards: number; // Target cards per day (e.g. 15, 25, 50)
}
