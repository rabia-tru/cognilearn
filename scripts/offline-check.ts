import { generateOfflineDeck } from '../src/utils/offlineGenerator';
import { DEMO_PRESET_DOCUMENTS } from '../src/data/sampleDecks';

for (const preset of DEMO_PRESET_DOCUMENTS) {
  const deck = generateOfflineDeck({
    text: preset.sampleText,
    titleHint: preset.title,
    cardCount: 8,
    quizCount: 4,
  });
  console.log('='.repeat(70));
  console.log(preset.title, '=>', deck.flashcards.length, 'cards,', deck.quiz.length, 'quiz');
  deck.flashcards.forEach((c) => {
    console.log(`  [${c.topicTag}] ${c.question}`);
    console.log(`     A: ${String(c.answer).slice(0, 100)}`);
  });
  deck.quiz.forEach((q) => {
    console.log(`  Q: ${q.question}  (correct #${q.correctIndex})`);
    q.options.forEach((o, i) => console.log(`     ${i === q.correctIndex ? '*' : ' '} ${String(o).slice(0, 80)}`));
  });
}
