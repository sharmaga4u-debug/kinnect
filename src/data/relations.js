// Indian family relations with names in Hindi and Telugu, grouped by generation
// (gen: +2 grandparents … 0 you … -2 grandchildren) for the family tree.
export const RELATIONS = [
  { id: 'dadi',   en: "Grandmother (father's side)", hi: 'दादी',   te: 'నానమ్మ',    gen: 2 },
  { id: 'dada',   en: "Grandfather (father's side)", hi: 'दादा',   te: 'తాతయ్య',    gen: 2 },
  { id: 'nani',   en: "Grandmother (mother's side)", hi: 'नानी',   te: 'అమ్మమ్మ',   gen: 2 },
  { id: 'nana',   en: "Grandfather (mother's side)", hi: 'नाना',   te: 'తాతయ్య',    gen: 2 },
  { id: 'mother', en: 'Mother',                       hi: 'माँ',    te: 'అమ్మ',      gen: 1 },
  { id: 'father', en: 'Father',                       hi: 'पापा',   te: 'నాన్న',     gen: 1 },
  { id: 'tauji',  en: "Father's elder brother",       hi: 'ताऊजी',  te: 'పెదనాన్న',  gen: 1 },
  { id: 'chacha', en: "Father's younger brother",     hi: 'चाचा',   te: 'బాబాయ్',    gen: 1 },
  { id: 'bua',    en: "Father's sister",              hi: 'बुआ',    te: 'అత్తయ్య',   gen: 1 },
  { id: 'mama',   en: "Mother's brother",             hi: 'मामा',   te: 'మామయ్య',    gen: 1 },
  { id: 'mausi',  en: "Mother's sister",              hi: 'मौसी',   te: 'పిన్ని',     gen: 1 },
  { id: 'spouse', en: 'Husband / Wife',               hi: 'जीवनसाथी', te: 'భాగస్వామి', gen: 0 },
  { id: 'brother', en: 'Brother',                     hi: 'भाई',    te: 'అన్న / తమ్ముడు', gen: 0 },
  { id: 'sister', en: 'Sister',                       hi: 'बहन',    te: 'అక్క / చెల్లి', gen: 0 },
  { id: 'cousin', en: 'Cousin',                       hi: 'कज़िन',   te: 'కజిన్',     gen: 0 },
  { id: 'son',    en: 'Son',                          hi: 'बेटा',   te: 'కొడుకు',    gen: -1 },
  { id: 'daughter', en: 'Daughter',                   hi: 'बेटी',   te: 'కూతురు',    gen: -1 },
  { id: 'nephew', en: 'Nephew / Niece',               hi: 'भतीजा / भतीजी', te: 'మేనల్లుడు / మేనకోడలు', gen: -1 },
  { id: 'grandson', en: 'Grandson',                   hi: 'पोता / नाती', te: 'మనవడు',   gen: -2 },
  { id: 'granddaughter', en: 'Granddaughter',         hi: 'पोती / नातिन', te: 'మనవరాలు', gen: -2 },
  { id: 'friend', en: 'Friend',                       hi: 'दोस्त',  te: 'స్నేహితుడు', gen: 0 },
];

export const GENERATIONS = [
  { gen: 2, label: 'Grandparents' },
  { gen: 1, label: 'Parents, uncles & aunts' },
  { gen: 0, label: 'You, siblings & cousins' },
  { gen: -1, label: 'Children, nephews & nieces' },
  { gen: -2, label: 'Grandchildren' },
];

export const relationById = (id) => RELATIONS.find(r => r.id === id);

// The native-language name to show next to the English one
export function nativeRelation(rel, lang) {
  if (!rel) return '';
  return lang === 'te' ? rel.te : rel.hi;
}

// Ready-made questions for recording family memories
export const MEMORY_PROMPTS = [
  'What was your school like when you were my age?',
  'How did you and grandpa / grandma meet?',
  'What games did you play as a child?',
  'Tell me about the house you grew up in',
  'What was your favourite festival and why?',
  'What is your special recipe? How do you make it?',
  'What was your first job?',
  'What advice would you give me for life?',
];
