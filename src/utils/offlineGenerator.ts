import { Flashcard, QuizQuestion, StudyDeck } from '../types';

/* ------------------------------------------------------------------ *
 * ON-DEVICE (OFFLINE) DECK BUILDER
 *
 * When the phone cannot reach the PC backend, the app still has to be
 * able to turn a document into a usable study deck. This module builds
 * flashcards and diagnostic questions straight from the document text
 * using deterministic extraction - no AI, no network.
 * ------------------------------------------------------------------ */

/** Verbs that introduce a definition ("X is ...", "X occurs ..."). */
const DEFINITION_CUES = [
  'is defined as',
  'is known as',
  'is called',
  'is characterized by',
  'is responsible for',
  'refers to',
  'consists of',
  'plays a key role',
  'takes place',
  'leads to',
  'results in',
  'depends on',
  'works by',
  'is used to',
  'helps to',
  'involves',
  'occurs',
  'produces',
  'requires',
  'describes',
  'happens',
  'converts',
  'contains',
  'forms',
  'means',
  'uses',
  'is',
  'are',
];

/** Words that show the text before the cue is a clause, not a subject. */
const CLAUSE_NOISE =
  /\b(that|which|who|whom|whose|where|when|were|been|being|have|has|had|and|or|but|if|then|than|because|while|after|before|during|through|into|onto|upon|about|also|however|therefore|thus|these|those|this|it|they|we|you|its|their|our|your)\b/i;

/** Lowercase words that must never be absorbed into a concept phrase. */
const ABSORB_STOP_WORDS = new Set([
  'is', 'are', 'was', 'were', 'be', 'the', 'a', 'an', 'and', 'or', 'of', 'in',
  'on', 'at', 'to', 'for', 'with', 'by', 'from', 'as', 'that', 'which', 'who',
  'it', 'its', 'this', 'these', 'those', 'there', 'here', 'then', 'than', 'but',
  'occurs', 'produces', 'requires', 'contains', 'involves', 'uses', 'means',
  'refers', 'called', 'known', 'defined', 'forms', 'happens', 'takes', 'place',
  'plays', 'role', 'leads', 'results', 'depends', 'helps', 'works', 'used',
  'describes', 'characterized', 'responsible', 'converts', 'makes', 'gives',
  'carries', 'pumps', 'builds', 'splits', 'releases', 'absorbs', 'transfers',
  'creates', 'allows', 'keeps', 'holds', 'brings', 'sends', 'moves', 'turns',
  'generates', 'reacts', 'combines', 'binds', 'emits', 'stores', 'maintains',
  'controls', 'regulates', 'acts', 'serves', 'represents', 'consists',
  'directly', 'primarily', 'usually', 'often', 'typically', 'when', 'while',
  'where', 'which', 'into', 'onto', 'over', 'under', 'after', 'before', 'during',
  'through', 'between', 'within', 'without', 'about', 'against', 'towards',
]);

const TITLE_CASE_WORD = /^[A-Z][A-Za-z0-9'’\-]*$/;
const ACRONYM_WORD = /^[A-Z0-9]{2,}$/;

const stripListMarker = (value: string): string =>
  value.replace(/^\d+[\.\)]\s*/, '').replace(/^[-*\u2022]\s*/, '').trim();

/** Splits text into sentences without relying on lookbehind regexes. */
const splitSentences = (text: string): string[] => {
  const normalized = text.replace(/\r/g, '');
  const sentences: string[] = [];
  let buffer = '';

  for (let i = 0; i < normalized.length; i++) {
    const char = normalized[i];
    buffer += char;

    if (char === '.' || char === '!' || char === '?') {
      const rest = normalized.slice(i + 1);
      const match = rest.match(/^\s*/);
      const spacing = match ? match[0].length : 0;
      const next = rest.slice(spacing);
      const endsSentence =
        next === '' || next[0] === '\n' || /[A-Z0-9"'(\[]/.test(next[0]);
      if (endsSentence) {
        const sentence = buffer.trim();
        if (sentence) sentences.push(sentence);
        buffer = '';
      }
    }
  }

  const tail = buffer.trim();
  if (tail) sentences.push(tail);

  return sentences;
};

interface DocSentence {
  text: string;
  section: string;
}

/** Splits the document into sentences and tracks the current section heading. */
const parseDocument = (text: string): { sentences: DocSentence[]; sections: string[] } => {
  const sentences: DocSentence[] = [];
  const sections: string[] = [];
  let currentSection = 'General';

  const lines = text.replace(/\r/g, '').split('\n');

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    const looksLikeHeading =
      trimmed.length <= 70 &&
      trimmed.split(/\s+/).length <= 8 &&
      !/[.!?]$/.test(trimmed) &&
      !/^\d+[\.\)]/.test(trimmed) &&
      /[A-Za-z]/.test(trimmed);

    if (looksLikeHeading) {
      currentSection = trimmed.replace(/:$/, '').trim() || currentSection;
      if (!sections.includes(currentSection)) sections.push(currentSection);
      continue;
    }

    for (const sentence of splitSentences(trimmed)) {
      const cleaned = stripListMarker(sentence);
      if (cleaned.length < 25) continue;
      sentences.push({ text: cleaned, section: currentSection });
    }
  }

  if (sections.length === 0) sections.push('General');

  return { sentences, sections };
};

/** Finds the first definition cue ("X is ...", "X occurs ..."). */
const findDefinitionCue = (sentence: string): { index: number; cue: string } | null => {
  let best: { index: number; cue: string } | null = null;

  for (const cue of DEFINITION_CUES) {
    // Word boundaries matter: "is" inside "Photosynthesis" is not a cue.
    const pattern = new RegExp(`\\b${cue.replace(/ /g, '\\s+')}\\b`);
    const match = pattern.exec(sentence);
    if (!match) continue;
    if (!best || match.index < best.index) best = { index: match.index, cue };
  }

  return best;
};

/**
 * Pulls the subject out of a definition sentence.
 * Only clean, capitalised subject phrases are accepted so the generated
 * cards never contain fragments such as "electrons that".
 */
const extractDefinitionTerm = (sentence: string): string | null => {
  const cleaned = stripListMarker(sentence);
  const cue = findDefinitionCue(cleaned);
  if (!cue || cue.index <= 0) return null;

  const head = cleaned.slice(0, cue.index).replace(/[\s,:;(\[]+$/, '').trim();
  if (!head) return null;

  const words = head.split(/\s+/).filter(Boolean);
  if (words.length > 5) return null;
  if (CLAUSE_NOISE.test(head)) return null;

  const withoutDeterminer = head.replace(/^(The|A|An)\s+/, '').trim();
  if (!withoutDeterminer) return null;
  if (!/^[A-Z0-9]/.test(withoutDeterminer)) return null;

  const term = withoutDeterminer.trim();
  if (term.length < 3 || term.length > 60) return null;
  if (!term.split(/\s+/).every((word) => word.length <= 24)) return null;

  return term;
};

/**
 * Finds a concept phrase anywhere in a sentence, e.g. "Photosystem I",
 * "ATP Synthase", "Cytochrome b6f Complex". Returns the phrase plus the
 * character range so the caller can blank it out for cloze cards.
 */
const findConceptPhrase = (
  sentence: string
): { term: string; start: number; end: number } | null => {
  const wordPattern = /[A-Za-z0-9][A-Za-z0-9'’\-]*/g;
  const words: { text: string; start: number; end: number; inParens: boolean }[] = [];
  let match: RegExpExecArray | null;

  let depth = 0;
  while ((match = wordPattern.exec(sentence)) !== null) {
    const before = sentence.slice(0, match.index);
    const opens = (before.match(/\(/g) || []).length;
    const closes = (before.match(/\)/g) || []).length;
    depth = opens - closes;
    words.push({
      text: match[0],
      start: match.index,
      end: match.index + match[0].length,
      inParens: depth > 0,
    });
  }

  for (let i = 0; i < words.length; i++) {
    const first = words[i];
    if (first.inParens) continue;
    // A concept name starts with letters - not with a formula such as "6CO2".
    if (!/^[A-Z][A-Za-z]/.test(first.text)) continue;

    // Skip a leading article: "The Calvin Cycle" -> "Calvin Cycle".
    let start = i;
    if (ABSORB_STOP_WORDS.has(first.text.toLowerCase())) {
      const next = words[i + 1];
      if (
        !next ||
        next.inParens ||
        !/^[A-Z][A-Za-z]/.test(next.text)
      ) {
        continue;
      }
      start = i + 1;
    }

    // Extend the capitalised run ("ATP Synthase", "Photosystem I").
    let last = start;
    while (last + 1 < words.length) {
      const next = words[last + 1];
      if (next.inParens) break;
      if (ABSORB_STOP_WORDS.has(next.text.toLowerCase())) break;
      if (!TITLE_CASE_WORD.test(next.text) && !ACRONYM_WORD.test(next.text)) break;
      last++;
    }

    // Absorb one lowercase word that belongs to the phrase ("b6f", "photolysis").
    if (last + 1 < words.length) {
      const next = words[last + 1];
      if (
        !next.inParens &&
        /^[a-z0-9][A-Za-z0-9'’\-]*$/.test(next.text) &&
        !ABSORB_STOP_WORDS.has(next.text.toLowerCase())
      ) {
        last++;
        if (last + 1 < words.length) {
          const after = words[last + 1];
          if (
            !after.inParens &&
            (TITLE_CASE_WORD.test(after.text) || ACRONYM_WORD.test(after.text)) &&
            !ABSORB_STOP_WORDS.has(after.text.toLowerCase())
          ) {
            last++;
          }
        }
      }
    }

    const phrase = sentence.slice(words[start].start, words[last].end).trim();
    if (phrase.length < 4 || phrase.length > 60) continue;

    return {
      term: phrase,
      start: words[start].start,
      end: words[last].end,
    };
  }

  return null;
};

const shorten = (value: string, max = 170): string =>
  value.length > max ? `${value.slice(0, max - 1).trimEnd()}…` : value;

const shuffle = <T,>(items: T[]): T[] => {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
};

const titleCase = (value: string): string =>
  value.charAt(0).toUpperCase() + value.slice(1);

export interface OfflineDeckInput {
  text: string;
  titleHint?: string;
  cardCount: number;
  quizCount: number;
  difficulty?: string;
  focusArea?: string;
  sourceFileName?: string;
  sourceFileSize?: string;
}

/**
 * Builds a complete deck (flashcards + quiz) from raw document text using
 * on-device extraction only. The result is marked `generatedOffline` so the
 * UI can be transparent about where the content came from.
 */
export const generateOfflineDeck = (input: OfflineDeckInput): StudyDeck => {
  const { text, titleHint, cardCount, quizCount, sourceFileName, sourceFileSize } = input;

  const { sentences, sections } = parseDocument(text || '');

  /* ------------------------- definition cards ------------------------- */

  const definitions: { term: string; sentence: string; section: string }[] = [];
  const seenTerms = new Set<string>();

  for (const item of sentences) {
    const term = extractDefinitionTerm(item.text);
    if (!term) continue;
    const key = term.toLowerCase();
    if (seenTerms.has(key)) continue;
    seenTerms.add(key);
    definitions.push({ term, sentence: item.text, section: item.section });
  }

  /* --------------------------- cloze cards ---------------------------- */

  const clozes: { term: string; sentence: string; section: string }[] = [];
  for (const item of sentences) {
    if (definitions.some((d) => d.sentence === item.text)) continue;
    const phrase = findConceptPhrase(item.text);
    if (!phrase) continue;
    const key = phrase.term.toLowerCase();
    if (seenTerms.has(key)) continue;
    if (phrase.term.length < 5) continue;
    seenTerms.add(key);
    clozes.push({ term: phrase.term, sentence: item.text, section: item.section });
  }

  const flashcards: Flashcard[] = [];
  const targetCards = Math.max(3, Math.min(cardCount, 20));

  const definitionCards: Flashcard[] = definitions.map((item, index) => ({
    id: `fc_off_${index + 1}`,
    question: `What is ${item.term}?`,
    answer: item.sentence,
    hint: `Your notes: "${shorten(item.sentence, 58)}"`,
    keyConcept: item.term,
    topicTag: item.section,
    status: 'unseen',
  }));

  const clozeCards: Flashcard[] = clozes.map((item, index) => {
    const blanked = item.sentence.replace(item.term, '______');
    return {
      id: `fc_off_c${index + 1}`,
      question: `Complete the statement: ${blanked}`,
      answer: item.term,
      hint: 'Fill in the missing key term from your study material.',
      keyConcept: item.term,
      topicTag: item.section,
      status: 'unseen',
    };
  });

  // Interleave definition and cloze cards so the deck is not monotonous.
  let d = 0;
  let c = 0;
  while (flashcards.length < targetCards && (d < definitionCards.length || c < clozeCards.length)) {
    if (d < definitionCards.length) {
      flashcards.push(definitionCards[d]);
      d++;
    }
    if (flashcards.length < targetCards && c < clozeCards.length) {
      flashcards.push(clozeCards[c]);
      c++;
    }
  }

  // Nothing extractable - fall back to raw sentence cards.
  if (flashcards.length === 0) {
    const usable = sentences.filter((s) => s.text.length >= 40).slice(0, targetCards);
    usable.forEach((item, index) => {
      flashcards.push({
        id: `fc_off_r${index + 1}`,
        question: `What does your material state about "${shorten(item.text, 90)}"?`,
        answer: item.text,
        hint: 'Reconstruct the statement from memory before revealing it.',
        keyConcept: item.section,
        topicTag: item.section,
        status: 'unseen',
      });
    });
  }

  // The document could not be read at all (e.g. a binary PDF in offline mode).
  if (flashcards.length === 0) {
    flashcards.push({
      id: 'fc_off_empty',
      question: 'This document could not be parsed in offline mode',
      answer:
        'Offline mode can only read plain text. Start the CogniLearn server on your PC ' +
        '("npm run dev"), keep the phone on the same Wi-Fi, and generate the deck again for AI-written material.',
      hint: 'Reconnect to the backend and retry.',
      keyConcept: 'Offline Mode',
      topicTag: 'General',
      status: 'unseen',
    });
  }

  /* ------------------------------ quiz ------------------------------ */

  const quizPool = [...definitions, ...clozes];
  const targetQuiz = Math.max(2, Math.min(quizCount, 12));
  const quiz: QuizQuestion[] = [];

  const usedQuizTerms = new Set<string>();
  for (const item of quizPool) {
    if (quiz.length >= targetQuiz) break;
    const key = item.term.toLowerCase();
    if (usedQuizTerms.has(key)) continue;

    const distractors = sentences
      .filter((s) => s.text !== item.sentence && !s.text.includes(item.term))
      .map((s) => s.text);

    if (distractors.length >= 3) {
      const picked = shuffle(distractors).slice(0, 3);
      const options = shuffle([item.sentence, ...picked]);
      usedQuizTerms.add(key);
      quiz.push({
        id: `qz_off_${quiz.length + 1}`,
        question: `Which statement best describes ${item.term}?`,
        options: options.map((option) => shorten(option, 220)),
        correctIndex: options.findIndex((option) => option === item.sentence),
        explanation: `Your study material states: "${shorten(item.sentence, 240)}" The other options come from different parts of the document.`,
        topicTag: item.section,
        difficulty: 'medium',
      });
      continue;
    }

    // Not enough sentences for distractors - ask a term-recognition question.
    const otherTerms = quizPool
      .map((other) => other.term)
      .filter((term, index, arr) => arr.indexOf(term) === index && term !== item.term);

    if (otherTerms.length >= 3) {
      const picked = shuffle(otherTerms).slice(0, 3);
      const options = shuffle([item.term, ...picked]);
      usedQuizTerms.add(key);
      quiz.push({
        id: `qz_off_${quiz.length + 1}`,
        question: `Which term matches this idea: "${shorten(item.sentence, 150)}"?`,
        options,
        correctIndex: options.findIndex((option) => option === item.term),
        explanation: `The material links this idea to ${item.term}.`,
        topicTag: item.section,
        difficulty: 'medium',
      });
    }
  }

  const termTopics = Array.from(new Set(definitions.map((d) => d.term)));
  const keyTopics = [...termTopics, ...sections.filter((s) => s !== 'General')]
    .filter((topic, index, arr) => arr.indexOf(topic) === index)
    .slice(0, 6);

  const title = (titleHint && titleHint.trim()) || `Study Deck: ${sections[0] || 'Document Notes'}`;

  return {
    id: `deck_offline_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    title: titleCase(title),
    summary:
      `Generated on-device from your document (${sentences.length} statements analysed, ` +
      `${definitions.length} key concepts detected). Flashcards and quiz were built locally ` +
      'without the AI backend, so reconnect to the server for AI-written material.',
    keyTopics: keyTopics.length ? keyTopics : ['General'],
    estimatedStudyTimeMinutes: Math.max(3, Math.round(flashcards.length * 1.5)),
    flashcards,
    quiz,
    createdAt: new Date().toISOString(),
    sourceFileName,
    sourceFileSize,
    generatedOffline: true,
    stats: {
      timesStudied: 0,
      bestQuizScore: 0,
      quizzesTaken: 0,
      lastStudiedAt: new Date().toISOString(),
    },
  };
};

/* ------------------------------------------------------------------ *
 * OFFLINE CONCEPT DEEP DIVE
 * ------------------------------------------------------------------ */

/**
 * Builds a study-guide style breakdown from the question/answer context the
 * app already has on device. It never invents facts - it organises what the
 * deck already states.
 */
export const buildOfflineExplanation = (concept: string, context: string): string => {
  const cleanContext = (context || '').trim();
  const sentences = splitSentences(cleanContext)
    .map((s) => s.trim())
    .filter((s) => s.length > 20 && !/^Question:/i.test(s));

  const keyWords = concept
    .split(/[^A-Za-z0-9]+/)
    .filter((word) => word.length > 2 && !ABSORB_STOP_WORDS.has(word.toLowerCase()))
    .slice(0, 4);
  const initialism = keyWords.map((word) => word.charAt(0).toUpperCase()).join('');

  const lines: string[] = [];

  lines.push('**1. What is being asked**');
  lines.push(
    `- **${concept}** - the card is testing whether you can recall and apply this idea, ` +
      'not just recognise the wording.'
  );

  lines.push('');
  lines.push('**2. Core definition (from your study material)**');
  if (sentences.length) {
    sentences.forEach((sentence) => lines.push(`- ${sentence}`));
  } else {
    lines.push('- No notes were captured for this concept yet.');
  }

  lines.push('');
  lines.push('**3. Common pitfall**');
  lines.push(
    `- The usual mistake with **${concept}** is answering with a closely related idea that ` +
      'sounds right but fails the specific wording of the question.'
  );
  if (sentences.length > 1) {
    lines.push(`- Anchor on this exact wording: "${shorten(sentences[0], 160)}"`);
  }

  lines.push('');
  lines.push('**4. Memory anchor**');
  lines.push(
    initialism
      ? `- Use the initials **${initialism}** (${keyWords.join(' / ')}) as your retrieval cue.`
      : `- Say the concept out loud three times, then write it from memory.`
  );

  lines.push('');
  lines.push('**5. 60-second self check**');
  lines.push(
    `- Explain ${concept} out loud in your own words, then compare it against the definition above.`
  );
  lines.push(
    '- _Offline note: built on-device from your deck. Reconnect to the backend for the full AI Feynman breakdown._'
  );

  return lines.join('\n');
};

/* ------------------------------------------------------------------ *
 * OFFLINE REINFORCEMENT DRILL
 * ------------------------------------------------------------------ */

export interface MissedRef {
  question: string;
  correctAnswer: string;
  explanation: string;
  topicTag: string;
}

/**
 * Builds a targeted drill from the flashcards the user actually missed,
 * so the phone can drill weak areas even without the AI backend.
 */
export const buildOfflineReinforcement = (
  deck: StudyDeck,
  missed: MissedRef[],
  count: number
): QuizQuestion[] => {
  const target = Math.max(2, Math.min(count, 8));
  const missedTags = new Set(missed.map((item) => item.topicTag).filter(Boolean));
  const allCards = deck.flashcards || [];

  const strongPool = allCards.filter((card) => missedTags.has(card.topicTag));
  const restPool = allCards.filter((card) => !missedTags.has(card.topicTag));
  const pool = [...strongPool, ...restPool].slice(0, target);

  const questions: QuizQuestion[] = [];

  pool.forEach((card, index) => {
    const distractors = allCards
      .filter((other) => other.id !== card.id && other.answer !== card.answer)
      .map((other) => shorten(other.answer, 150));

    if (distractors.length < 3) return;

    const picked = shuffle(distractors).slice(0, 3);
    const correct = shorten(card.answer, 150);
    const options = shuffle([correct, ...picked]);

    questions.push({
      id: `qz_off_r${index + 1}`,
      question: `Which answer correctly explains "${card.keyConcept}"?`,
      options,
      correctIndex: options.findIndex((option) => option === correct),
      explanation:
        `${card.hint ? `Hint: ${card.hint} ` : ''}Correct answer: ${card.answer}` +
        ' The other options describe different cards from this deck.',
      topicTag: card.topicTag,
      difficulty: 'medium',
    });
  });

  return questions;
};
