import express, { Request, Response } from 'express';
import http from 'http';
import os from 'os';
import { GoogleGenAI, Type } from '@google/genai';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

import {
  generateOfflineDeck,
  buildOfflineExplanation,
  buildOfflineReinforcement,
} from './src/utils/offlineGenerator';
import { extractTextFromPdf, base64ToBytes } from './src/utils/pdfText';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Allow CORS from any origin (including Capacitor mobile app)
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

// Allow large payloads for PDF / image uploads
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

/* ------------------------------------------------------------------ *
 * AI AVAILABILITY
 *
 * The phone talks to this server over the LAN. If the AI provider is
 * down, misconfigured or rate limited, the endpoints must fail fast
 * (never hang for minutes) and fall back to the on-device generator so
 * the mobile app keeps working.
 * ------------------------------------------------------------------ */

const AI_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash', 'gemini-flash-latest'];
const AI_TIMEOUT_MS = 45000;
const AI_COOLDOWN_MS = 5 * 60 * 1000;

let aiUnavailableUntil = 0;
let aiUnavailableReason = '';

const markAiUnavailable = (reason: string) => {
  aiUnavailableUntil = Date.now() + AI_COOLDOWN_MS;
  aiUnavailableReason = reason;
  console.warn(`[AI] Marked unavailable for ${AI_COOLDOWN_MS / 1000}s: ${reason}`);
};

const isAiUnavailable = () => Date.now() < aiUnavailableUntil;

const looksLikeAuthFailure = (message: string): boolean =>
  /API[_ ]key not valid|API_KEY_INVALID|invalid_api_key|401|403|PERMISSION_DENIED|UNAUTHENTICATED/i.test(
    message || ''
  );

// Server-side API key resolution
const getGeminiKey = () => (process.env.GEMINI_API_KEY || '').trim();
const getOpenAIKey = () => (process.env.OPENAI_API_KEY || '').trim();

const getAI = () =>
  new GoogleGenAI({
    apiKey: getGeminiKey(),
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });

/** Runs a Gemini call with a hard timeout so the mobile app never waits forever. */
const generateWithTimeout = async (
  model: string,
  contents: any,
  config?: any
): Promise<string> => {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const response: any = await getAI().models.generateContent({
      model,
      contents,
      config: { ...(config || {}), abortSignal: controller.signal },
    });
    return response?.text || '';
  } finally {
    clearTimeout(timer);
  }
};

async function callOpenAIText(prompt: string): Promise<string> {
  const apiKey = getOpenAIKey();
  if (!apiKey) throw new Error('No OpenAI API key');
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), AI_TIMEOUT_MS);
  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
      }),
      signal: controller.signal,
    });
    const data: any = await res.json();
    if (data?.error) {
      throw new Error(`OpenAI: ${data.error.message || 'Error'}`);
    }
    return data?.choices?.[0]?.message?.content || '';
  } finally {
    clearTimeout(timer);
  }
}

// LAN addresses the phone can use to reach this server.
const getLanAddresses = (): string[] => {
  const addresses: string[] = [];
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const entry of interfaces[name] || []) {
      if (entry.family === 'IPv4' && !entry.internal) {
        addresses.push(entry.address);
      }
    }
  }
  return addresses;
};

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    hasApiKey: Boolean(getGeminiKey()),
    aiAvailable: !isAiUnavailable(),
    aiReason: aiUnavailableReason || null,
    port: PORT,
    lanAddresses: getLanAddresses(),
    time: new Date().toISOString(),
  });
});

/* ------------------------------------------------------------------ *
 * Local (no-AI) helpers
 * ------------------------------------------------------------------ */

/** Pulls usable text out of a base64 upload, extracting PDF text when needed. */
const extractTextFromUpload = async (
  fileData: { mimeType?: string; base64?: string } | undefined,
  fallbackText?: string
): Promise<string> => {
  if (fileData?.base64) {
    const bytes = base64ToBytes(fileData.base64);
    const mime = (fileData.mimeType || '').toLowerCase();
    if (mime.includes('pdf') || bytes.length > 4 && bytes[0] === 0x25 && bytes[1] === 0x50) {
      const text = await extractTextFromPdf(bytes);
      if (text.trim()) return text;
    }
  }
  return (fallbackText || '').trim();
};

const buildLocalDeck = async (body: any) => {
  const {
    text,
    fileData,
    titleHint,
    cardCount = 10,
    quizCount = 6,
    difficulty = 'intermediate',
    focusArea = 'comprehensive',
  } = body;

  const extracted = await extractTextFromUpload(fileData, text);
  if (!extracted) {
    return null;
  }

  return generateOfflineDeck({
    text: extracted,
    titleHint,
    cardCount,
    quizCount,
    difficulty,
    focusArea,
    sourceFileName: titleHint ? `${titleHint}.txt` : 'Uploaded Notes.txt',
    sourceFileSize: `${extracted.length} chars`,
  });
};

// Endpoint: Generate Study Deck from Document (Text, PDF, or Image)
app.post('/api/generate-deck', async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      text,
      fileData,
      titleHint,
      cardCount = 10,
      quizCount = 6,
      difficulty = 'intermediate',
      focusArea = 'comprehensive',
    } = req.body;

    if (!text && !fileData) {
      res.status(400).json({ error: 'Please provide document text or an uploaded file.' });
      return;
    }

    if (!getGeminiKey() || isAiUnavailable()) {
      const localDeck = await buildLocalDeck(req.body);
      if (!localDeck) {
        res.status(400).json({
          error:
            'The AI backend is not configured right now and the document could not be read as text. ' +
            'Paste the notes as text or add a valid GEMINI_API_KEY on the server.',
          code: 'AI_UNAVAILABLE',
        });
        return;
      }
      res.json({
        success: true,
        generatedOffline: true,
        notice:
          'The AI provider is unavailable, so this deck was built on the server with the local ' +
          'document analyser. Add a valid GEMINI_API_KEY to get AI-written material.',
        deck: localDeck,
      });
      return;
    }

    const contents: any[] = [];

    // If an inline file (PDF, image, etc.) is provided
    if (fileData && fileData.base64 && fileData.mimeType) {
      contents.push({
        inlineData: {
          mimeType: fileData.mimeType,
          data: fileData.base64,
        },
      });
    }

    const promptText = `
You are an expert pedagogical study coach and educator.
Analyze the provided document or study material thoroughly.
Extract the key concepts, core principles, definitions, mechanisms, relationships, and applications.
Create a high-impact, active-recall study deck with:
1. Exactly ${cardCount} flashcards.
   - Front (question): Clear, active recall prompt, term inquiry, or conceptual problem. Avoid trivial yes/no questions.
   - Back (answer): Comprehensive, punchy, and clear explanation.
   - Hint: A subtle mnemonic clue or guiding tip.
   - Key Concept: 1-4 word primary subject term.
   - Topic Tag: Categorical topic.
2. Exactly ${quizCount} multiple-choice quiz questions.
   - Difficulty level: ${difficulty}. Focus emphasis: ${focusArea}.
   - Each question must test understanding, reasoning, or application—not just superficial keyword matching.
   - Provide exactly 4 plausible options.
   - Indicate the zero-based index of the correct answer (0, 1, 2, or 3).
   - Provide a clear, educational explanation detailing why the answer is correct and why other choices are misconceptions.
3. Deck summary and estimated study time (in minutes).

${titleHint ? `User suggested title or subject: "${titleHint}"` : ''}
${text ? `Document Text:\n"""\n${text}\n"""` : ''}
`;

    contents.push({ text: promptText });

    const schemaConfig = {
      systemInstruction:
        'You are an elite educational technologist who designs world-class spaced repetition flashcards and diagnostic assessments. Always produce accurate, well-formatted, and insightful educational content.',
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          title: {
            type: Type.STRING,
            description: 'Clear, concise title for this study deck based on document content',
          },
          summary: {
            type: Type.STRING,
            description: 'A 2-3 sentence summary of the key subject matter covered in this document',
          },
          keyTopics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '3 to 6 major topic or category tags found in the document',
          },
          estimatedStudyTimeMinutes: {
            type: Type.INTEGER,
            description: 'Estimated minutes to study the flashcards and take the quiz',
          },
          flashcards: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'Unique identifier, e.g. card_1' },
                question: { type: Type.STRING, description: 'Question or prompt for the front of the flashcard' },
                answer: { type: Type.STRING, description: 'Accurate and insightful answer for the back of the flashcard' },
                hint: { type: Type.STRING, description: 'A mnemonic or hint to aid recall without giving away the full answer' },
                keyConcept: { type: Type.STRING, description: 'The main term or concept being tested' },
                topicTag: { type: Type.STRING, description: 'Specific subtopic tag' },
              },
              required: ['id', 'question', 'answer', 'hint', 'keyConcept', 'topicTag'],
            },
          },
          quiz: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.STRING, description: 'Unique identifier, e.g. q_1' },
                question: { type: Type.STRING, description: 'Question statement' },
                options: {
                  type: Type.ARRAY,
                  items: { type: Type.STRING },
                  description: 'Exactly 4 multiple-choice options',
                },
                correctIndex: {
                  type: Type.INTEGER,
                  description: 'Zero-based index of the correct option (0, 1, 2, or 3)',
                },
                explanation: {
                  type: Type.STRING,
                  description: 'Detailed explanation of why the correct option is right and others are incorrect',
                },
                topicTag: { type: Type.STRING, description: 'Subtopic category' },
                difficulty: { type: Type.STRING, description: 'easy, medium, or hard' },
              },
              required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'topicTag', 'difficulty'],
            },
          },
        },
        required: ['title', 'summary', 'keyTopics', 'estimatedStudyTimeMinutes', 'flashcards', 'quiz'],
      },
    };

    // Resilient call with failover across models
    let responseText = '';
    let lastError: any = null;

    for (const model of AI_MODELS) {
      try {
        responseText = await generateWithTimeout(model, contents, schemaConfig);
        if (responseText) break;
      } catch (callErr: any) {
        lastError = callErr;
        const message = callErr?.message || String(callErr);
        console.warn(`Attempt with ${model} failed: ${message}`);
        if (looksLikeAuthFailure(message)) {
          markAiUnavailable(message);
          break;
        }
        if (callErr?.name === 'AbortError') {
          lastError = new Error('The AI provider did not respond in time.');
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (!responseText) {
      // AI failed -> build the deck locally so the phone still gets one.
      const localDeck = await buildLocalDeck(req.body);
      if (localDeck) {
        res.json({
          success: true,
          generatedOffline: true,
          notice:
            'The AI provider did not answer, so this deck was built on the server with the local ' +
            'document analyser.',
          deck: localDeck,
        });
        return;
      }

      res.status(500).json({
        error: lastError?.message || 'Failed to generate study deck from document.',
        code: 'AI_UNAVAILABLE',
      });
      return;
    }

    const parsedData = JSON.parse(responseText);

    res.json({
      success: true,
      deck: {
        id: `deck_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
        createdAt: new Date().toISOString(),
        ...parsedData,
      },
    });
  } catch (error: any) {
    console.error('Error generating study deck:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate study deck from document.',
    });
  }
});

// Endpoint: AI Concept Deep Dive / Explanation
app.post('/api/explain-concept', async (req: Request, res: Response): Promise<void> => {
  try {
    const { concept, context, question } = req.body;

    if (!concept && !question) {
      res.status(400).json({ error: 'Concept or question is required.' });
      return;
    }

    const prompt = `
You are a master teacher. Provide a crystal-clear, intuitive breakdown of the following concept:
Concept / Question: "${concept || question}"
Context: "${context || 'General understanding'}"

Please explain it using the Feynman Technique:
1. Intuitive Everyday Analogy (simple, vivid comparison).
2. Core Mechanism / Technical Definition (concise and accurate).
3. Common Pitfall / Misconception to avoid.
4. Quick Memory Mnemonic (a catchy phrase or acronym to remember it forever).
Format your response in neat, well-spaced markdown with bold highlights.
`;

    let explanationText = '';

    if (isAiUnavailable()) {
      res.json({
        success: true,
        generatedOffline: true,
        explanation: buildOfflineExplanation(concept || question || '', context || ''),
      });
      return;
    }

    // 1. Try OpenAI if key is present
    if (getOpenAIKey()) {
      try {
        explanationText = await callOpenAIText(prompt);
      } catch (openAiErr: any) {
        const message = openAiErr?.message || String(openAiErr);
        console.warn('OpenAI explanation failed:', message);
        if (looksLikeAuthFailure(message)) {
          markAiUnavailable(message);
        }
      }
    }

    // 2. Fallback to Google Gemini
    if (!explanationText && !isAiUnavailable()) {
      for (const model of AI_MODELS) {
        try {
          explanationText = await generateWithTimeout(model, prompt);
          if (explanationText) break;
        } catch (callErr: any) {
          const message = callErr?.message || String(callErr);
          console.warn(`Gemini attempt with ${model} failed: ${message}`);
          if (looksLikeAuthFailure(message)) {
            markAiUnavailable(message);
            break;
          }
        }
      }
    }

    if (!explanationText) {
      res.json({
        success: true,
        generatedOffline: true,
        explanation: buildOfflineExplanation(concept || question || '', context || ''),
      });
      return;
    }

    res.json({
      success: true,
      explanation: explanationText,
    });
  } catch (error: any) {
    console.error('Error explaining concept:', error);
    res.status(500).json({
      error: error?.message || 'Failed to explain concept.',
    });
  }
});

// Endpoint: Generate targeted follow-up quiz questions for missed areas
app.post('/api/reinforce-weak-areas', async (req: Request, res: Response): Promise<void> => {
  try {
    const { missedQuestions, topic, count = 4 } = req.body;

    if (isAiUnavailable()) {
      res.json({
        success: true,
        generatedOffline: true,
        questions: buildOfflineReinforcement(
          {
            id: 'deck_local',
            title: topic || 'Study Deck',
            summary: '',
            keyTopics: [],
            estimatedStudyTimeMinutes: 5,
            flashcards: (missedQuestions || []).map((m: any, index: number) => ({
              id: `fc_local_${index + 1}`,
              question: m.question,
              answer: m.correctAnswer,
              hint: m.explanation || '',
              keyConcept: m.topicTag || 'Review',
              topicTag: m.topicTag || 'Review',
            })),
            quiz: [],
            createdAt: new Date().toISOString(),
            stats: { timesStudied: 0, bestQuizScore: 0, quizzesTaken: 0 },
          },
          (missedQuestions || []).map((m: any) => ({
            question: m.question,
            correctAnswer: m.correctAnswer,
            explanation: m.explanation,
            topicTag: m.topicTag,
          })),
          count
        ),
      });
      return;
    }

    const prompt = `
A student struggled with the following questions/concepts during their quiz on "${topic || 'Document Study'}":
${JSON.stringify(missedQuestions, null, 2)}

Generate ${count} brand-new diagnostic reinforcement questions targeting these specific weak points with fresh phrasing and scenarios so the student can master them.
`;

    const config = {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
            },
            correctIndex: { type: Type.INTEGER },
            explanation: { type: Type.STRING },
            topicTag: { type: Type.STRING },
            difficulty: { type: Type.STRING },
          },
          required: ['id', 'question', 'options', 'correctIndex', 'explanation', 'topicTag', 'difficulty'],
        },
      },
    };

    let responseText = '';
    let lastError: any = null;

    for (const model of AI_MODELS) {
      try {
        responseText = await generateWithTimeout(model, prompt, config);
        if (responseText) break;
      } catch (callErr: any) {
        lastError = callErr;
        const message = callErr?.message || String(callErr);
        console.warn(`Attempt with ${model} failed: ${message}`);
        if (looksLikeAuthFailure(message)) {
          markAiUnavailable(message);
          break;
        }
        await new Promise((resolve) => setTimeout(resolve, 800));
      }
    }

    if (!responseText) {
      res.json({
        success: true,
        generatedOffline: true,
        questions: buildOfflineReinforcement(
          {
            id: 'deck_local',
            title: topic || 'Study Deck',
            summary: '',
            keyTopics: [],
            estimatedStudyTimeMinutes: 5,
            flashcards: (missedQuestions || []).map((m: any, index: number) => ({
              id: `fc_local_${index + 1}`,
              question: m.question,
              answer: m.correctAnswer,
              hint: m.explanation || '',
              keyConcept: m.topicTag || 'Review',
              topicTag: m.topicTag || 'Review',
            })),
            quiz: [],
            createdAt: new Date().toISOString(),
            stats: { timesStudied: 0, bestQuizScore: 0, quizzesTaken: 0 },
          },
          (missedQuestions || []).map((m: any) => ({
            question: m.question,
            correctAnswer: m.correctAnswer,
            explanation: m.explanation,
            topicTag: m.topicTag,
          })),
          count
        ),
      });
      return;
    }

    const questions = JSON.parse(responseText || '[]');
    res.json({ success: true, questions });
  } catch (error: any) {
    console.error('Error reinforcing weak areas:', error);
    res.status(500).json({
      error: error?.message || 'Failed to generate reinforcement questions.',
    });
  }
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  const isDev = process.env.NODE_ENV !== 'production';
  const httpServer = http.createServer(app);

  if (isDev) {
    const { createServer: createViteServer } = await import('vite');
    const disableHmr = process.env.DISABLE_HMR === 'true';
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        hmr: disableHmr ? false : { server: httpServer },
      },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req: Request, res: Response) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  httpServer.listen(PORT, '0.0.0.0', () => {
    const addresses = getLanAddresses();
    console.log(
      `CogniLearn server listening on port ${PORT} in ${isDev ? 'development' : 'production'} mode`
    );
    console.log(`  Local:   http://localhost:${PORT}`);
    addresses.forEach((address) => console.log(`  Network: http://${address}:${PORT}`));
  });
}

startServer();
