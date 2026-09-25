// Wisdom topics shown on the Wisdom tab
export const TOPICS = [
  {
    id: 'bhagavad-gita',
    title: 'Bhagavad Gita',
    icon: '📿',
    color: '#D97706',
    bg: '#FFFBEB',
    summary: 'Timeless spiritual wisdom, duty, and peace of mind.',
    verse: {
      source: 'Bhagavad Gita – Chapter 2, Verse 47',
      sanskrit: 'कर्मण्येवाधिकारस्ते मा फलेषु कदाचन।\nमा कर्मफलहेतुर्भूर्मा ते सङ्गोऽस्त्वकर्मणि॥',
      transliteration: 'Karmaṇyevādhikāraste mā phaleṣu kadācana\nMā karmaphalahetur bhūr mā te saṅgo\'stvakarmaṇi',
      meaning: 'You have a right to perform your prescribed duty, but not to the fruits of action. Never consider yourself the cause of results, and never be attached to inaction.',
      words: [
        { word: 'कर्मण्य (Karmaṇya)', meaning: 'in action / duty' },
        { word: 'अधिकार (Adhikāra)', meaning: 'right / authority' },
        { word: 'फल (Phala)', meaning: 'fruit / result' },
        { word: 'कर्म (Karma)', meaning: 'action / deed' },
      ],
      insight: 'Practice doing everyday chores with devotion and love. Leave the worries of outcome to the universe.'
    },
    circles: [
      { id: 'GRP-GITA-9021', name: 'Morning Gita Satsang', schedule: 'Daily 6:30 AM – 7:00 AM IST', members: 24, language: 'Hindi & English' },
      { id: 'GRP-GITA-1044', name: 'Evening Gita Verses for Grandkids', schedule: 'Sat & Sun 5:00 PM IST', members: 16, language: 'English' }
    ]
  },
  {
    id: 'ramayana',
    title: 'Ramayana & Moral Stories',
    icon: '🏹',
    color: '#16A34A',
    bg: '#F0FDF4',
    summary: 'Virtue, righteous living, courage, and loving family bonds.',
    verse: {
      source: 'Ramayana – Bala Kanda, 1.1.18',
      sanskrit: 'रामो विग्रहवान् धर्मः साधुः सत्यपराक्रमः।\nराजा सर्वस्य लोकस्य देवानां मघवानिव॥',
      transliteration: 'Rāmo vigranavān dharmaḥ sādhuḥ satyaparākramaḥ\nRājā sarvasya lokasya devānāṃ maghavāniva',
      meaning: 'Rama is the very embodiment of righteousness, noble, virtuous, and of true valor. He protects and guides all with compassion.',
      words: [
        { word: 'राम (Rāma)', meaning: 'Lord Rama, ideal righteous leader' },
        { word: 'धर्म (Dharma)', meaning: 'virtue, ethics, and duty' },
        { word: 'सत्य (Satya)', meaning: 'truthfulness' },
        { word: 'पराक्रम (Parākrama)', meaning: 'courage & inner strength' },
      ],
      insight: 'Stories of Rama and Sita inspire grandchildren to stand for kindness and respect towards elders.'
    },
    circles: [
      { id: 'GRP-RAMA-4567', name: 'Ramayana Storytellers', schedule: 'Mon, Wed, Fri 8:00 PM IST', members: 18, language: 'Tamil & English' }
    ]
  },
  {
    id: 'yoga-wellness',
    title: 'Yoga, Pranayama & Wellness',
    icon: '🧘',
    color: '#7C3AED',
    bg: '#F5F3FF',
    summary: 'Gentle morning asanas, breathing exercises, and natural vitality.',
    verse: {
      source: 'Patanjali Yoga Sutras 1.2',
      sanskrit: 'योगश्चित्तवृत्तिनिरोधः॥',
      transliteration: 'Yogaś citta-vṛtti-nirodhaḥ',
      meaning: 'Yoga is the calming and stilling of the turbulent fluctuations of the mind.',
      words: [
        { word: 'योग (Yoga)', meaning: 'union / spiritual discipline' },
        { word: 'चित्त (Citta)', meaning: 'consciousness / mind' },
        { word: 'निरोध (Nirodha)', meaning: 'quietude / stilling' }
      ],
      insight: 'A 10-minute Anulom-Vilom (alternate nostril breathing) after morning bath rejuvenates heart and lung capacity.'
    },
    circles: [
      { id: 'GRP-YOGA-2026', name: 'Gentle Chair Yoga & Pranayama for Elders', schedule: 'Daily 7:15 AM – 7:45 AM IST', members: 31, language: 'Hindi & English' }
    ]
  },
  {
    id: 'history-heritage',
    title: 'Indian Heritage & Architecture',
    icon: '🏛️',
    color: '#2563EB',
    bg: '#EFF6FF',
    summary: 'Ancient temples, astronomy, classical literature, and festivals.',
    verse: {
      source: 'Maha Upanishad 6.71-73',
      sanskrit: 'उदारचरितानां तु वसुधैव कुटुम्बकम्॥',
      transliteration: 'Udāra-caritānāṁ tu vasudhaiva kuṭumbakam',
      meaning: 'To the noble and magnanimous in heart, the entire world is one loving family.',
      words: [
        { word: 'उदार (Udāra)', meaning: 'generous / noble-minded' },
        { word: 'वसुधा (Vasudhā)', meaning: 'mother earth' },
        { word: 'कुटुम्बक (Kuṭumbaka)', meaning: 'loving family' }
      ],
      insight: 'Sharing stories of Tanjore Big Temple and Konark Sun Temple with grandkids abroad keeps roots vibrant.'
    },
    circles: [
      { id: 'GRP-HIST-5520', name: 'Heritage Wonders & Grandkid Tales', schedule: 'Sunday 11:00 AM IST', members: 22, language: 'English' }
    ]
  },
  {
    id: 'classical-music',
    title: 'Classical Music & Bhajans',
    icon: '🎶',
    color: '#DB2777',
    bg: '#FDF2F8',
    summary: 'Soothing ragas, Carnatic & Hindustani devotional compositions.',
    verse: {
      source: 'Thyagaraja Kriti – Nada Tanumanisham',
      sanskrit: 'नादतनमनिशं शङ्करं नमामि मे मनसा शिरसा॥',
      transliteration: 'Nāda-tanum-aniśaṁ śaṅkaraṁ namāmi me manasā śirasā',
      meaning: 'I bow continuously in thought and devotion to Lord Shiva, whose very body is pure celestial divine sound (Nada).',
      words: [
        { word: 'नाद (Nāda)', meaning: 'divine cosmic sound' },
        { word: 'तनु (Tanu)', meaning: 'embodiment / form' },
        { word: 'मनसा (Manasā)', meaning: 'with whole mind & heart' }
      ],
      insight: 'Listening to morning Raga Bhupali or Bilawal creates positive vibrations throughout your living room.'
    },
    circles: [
      { id: 'GRP-MUSIC-7890', name: 'Morning Bhajans & Stotras Circle', schedule: 'Daily 6:00 AM IST', members: 42, language: 'All Languages' }
    ]
  },
  {
    id: 'cooking-ayurveda',
    title: 'Traditional Cooking & Ayurveda',
    icon: '🍲',
    color: '#EA580C',
    bg: '#FFF7ED',
    summary: 'Grandmother secrets, medicinal herbs, healing spices, and seasonal thalis.',
    verse: {
      source: 'Charaka Samhita – Sutrasthana',
      sanskrit: 'आहारसम्भवं वस्तु रोगाश्चाहारसम्भावाः॥',
      transliteration: 'Āhāra-sambhavaṁ vastu rogāścāhāra-sambhavāḥ',
      meaning: 'Health, strength, and vitality are born of wholesome food, just as illness arises from improper diet.',
      words: [
        { word: 'आहार (Āhāra)', meaning: 'wholesome food / nourishment' },
        { word: 'सम्भव (Sambhava)', meaning: 'originating from' },
        { word: 'आरोग्य (Ārogya)', meaning: 'freedom from disease' }
      ],
      insight: 'Teach your grandchildren how golden turmeric, black pepper, and warm ghee heal colds naturally.'
    },
    circles: [
      { id: 'GRP-COOK-3312', name: 'Nani’s Kitchen & Herbal Remedies', schedule: 'Saturday 4:00 PM IST', members: 29, language: 'Hindi & English' }
    ]
  },
  {
    id: 'science-nature',
    title: 'Science & Curious Grandkids',
    icon: '🔬',
    color: '#0891B2',
    bg: '#ECFEFF',
    summary: 'Stars, space travel, flora & fauna, and playful scientific puzzles.',
    verse: {
      source: 'Rig Veda 1.164.46',
      sanskrit: 'एकं सद्विप्रा बहुधा वदन्ति॥',
      transliteration: 'Ekaṁ sad viprā bahudhā vadanti',
      meaning: 'Truth is one; wise scientists and seekers perceive and describe it in multiple beautiful ways.',
      words: [
        { word: 'एकम् (Ekam)', meaning: 'one absolute truth' },
        { word: 'सत् (Sat)', meaning: 'eternal truth / reality' },
        { word: 'विप्राः (Viprāḥ)', meaning: 'wise thinkers & scholars' }
      ],
      insight: 'Fun questions to ask grandkids: How do plants know when spring has arrived? Why is the sunset golden red?'
    },
    circles: [
      { id: 'GRP-SCI-8190', name: 'Curious Kids & Grandparents Space Club', schedule: 'Sunday 6:00 PM IST', members: 19, language: 'English' }
    ]
  }
];

