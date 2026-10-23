import { DEMO_PRESET_DOCUMENTS } from '../src/data/sampleDecks';

const sentence =
  'Photosynthesis is the fundamental biological process that converts light energy into chemical energy stored in carbohydrates.';

const CUES = ['is defined as','is known as','is called','is characterized by','is responsible for','refers to','consists of','plays a key role','takes place','leads to','results in','depends on','works by','is used to','helps to','involves','occurs','produces','requires','describes','happens','converts','contains','forms','means','uses','is','are'];

const lower = sentence.toLowerCase();
for (const cue of CUES) {
  const index = lower.indexOf(cue);
  if (index === -1) continue;
  const before = index > 0 ? sentence[index - 1] : '';
  const after = sentence[index + cue.length] || '';
  const okBefore = !(before && /[A-Za-z0-9]/.test(before));
  const okAfter = !(after && /[A-Za-z0-9]/.test(after));
  console.log(cue.padEnd(20), index, 'beforeOK=' + okBefore, 'afterOK=' + okAfter, '->', JSON.stringify(sentence.slice(0, index)));
}
