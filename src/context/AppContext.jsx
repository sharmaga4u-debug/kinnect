import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { realtime } from '../services/realtime';

/* ──────────────────────────────────────────
   Seed Contacts
────────────────────────────────────────── */
const SEED_CONTACTS = [
  {
    id: 'c1', name: 'Aarav Sharma', relation: 'Grandson', emoji: '👦',
    avatarBg: '#DBEAFE', avatarColor: '#1E40AF',
    city: 'London', country: 'UK', timezone: 'Europe/London',
    phone: '+44 7700 900001',
    statusText: 'At school until 3:30 PM',
  },
  {
    id: 'c2', name: 'Priya Nair', relation: 'Daughter', emoji: '👩',
    avatarBg: '#FCE7F3', avatarColor: '#9D174D',
    city: 'Toronto', country: 'Canada', timezone: 'America/Toronto',
    phone: '+1 416 555 0101',
    statusText: 'Free for video call this evening',
  },
  {
    id: 'c3', name: 'Riya Sharma', relation: 'Granddaughter', emoji: '👧',
    avatarBg: '#DCFCE7', avatarColor: '#166534',
    city: 'Bangalore', country: 'India', timezone: 'Asia/Kolkata',
    phone: '+91 98765 43210',
    statusText: 'Studying for exams',
  },
  {
    id: 'c4', name: 'Dev Menon', relation: 'Son', emoji: '👨',
    avatarBg: '#FEF3C7', avatarColor: '#92400E',
    city: 'San Francisco', country: 'USA', timezone: 'America/Los_Angeles',
    phone: '+1 415 555 0199',
    statusText: 'In morning meetings',
  },
];

/* ──────────────────────────────────────────
   Consolidated Topics with Daily Wisdom & Circles
────────────────────────────────────────── */
const RICH_TOPICS = [
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

/* ──────────────────────────────────────────
   Seed Chats & Messages
────────────────────────────────────────── */
const SEED_CHATS = {
  'family-group': {
    id: 'family-group',
    name: 'Sharma Family 🏡',
    avatar: '🏡',
    avatarBg: '#FEF3C7',
    avatarColor: '#B45309',
    relation: '5 family members',
    unread: 0,
    messages: [
      { id: 'm1', senderName: 'Priya Nair', text: 'Good morning everyone! Hope Dadi and Dad are having a warm start to the day. ❤️', time: '8:15 AM', isMe: false },
      { id: 'm2', senderName: 'Aarav Sharma', text: 'Dadi!! I scored 1st prize in the Science fair today in London! 🏆', time: '8:42 AM', isMe: false },
      { id: 'm3', senderName: 'You', text: 'Jeete raho beta! So proud of you Aarav! Bhagwan bless you with wisdom and joy. 🙏✨', time: '8:45 AM', isMe: true },
      { id: 'm4', senderName: 'Dev Menon', text: 'Way to go Aarav! Sending sweets from San Francisco! 🍬', time: '9:05 AM', isMe: false },
      { id: 'm5', senderName: 'Riya Sharma', text: 'Nani, did you light the evening lamp yet? Calling you at 6:30 PM!', time: '9:20 AM', isMe: false },
    ]
  },
  'c1': {
    id: 'c1',
    name: 'Aarav Sharma',
    avatar: '👦',
    avatarBg: '#DBEAFE',
    avatarColor: '#1E40AF',
    relation: 'Grandson · London',
    unread: 0,
    messages: [
      { id: 'm10', senderName: 'Aarav Sharma', text: 'Hey Dadi! Did you see the cherry blossom video I sent in the memories album?', time: 'Yesterday', isMe: false },
      { id: 'm11', senderName: 'You', text: 'Yes beta, it looked like paradise! Reminded me of Kashmir trips with your grandfather.', time: 'Yesterday', isMe: true },
      { id: 'm12', senderName: 'Aarav Sharma', text: 'Can you teach me the next Gita verse this Saturday on video call? 📖', time: '10:14 AM', isMe: false },
    ]
  },
  'c2': {
    id: 'c2',
    name: 'Priya Nair',
    avatar: '👩',
    avatarBg: '#FCE7F3',
    avatarColor: '#9D174D',
    relation: 'Daughter · Toronto',
    unread: 0,
    messages: [
      { id: 'm20', senderName: 'Priya Nair', text: 'Namaste Ma! Did you take your morning walking routine and knee exercises today?', time: '7:30 AM', isMe: false },
      { id: 'm21', senderName: 'You', text: 'Yes Priya beta, did 20 minutes of garden walk and pranayama. Feeling fresh!', time: '7:40 AM', isMe: true },
      { id: 'm22', senderName: 'Priya Nair', text: 'Wonderful! Sending you photos of the autumn leaves here in Toronto.', time: '7:45 AM', isMe: false },
    ]
  },
  'c3': {
    id: 'c3',
    name: 'Riya Sharma',
    avatar: '👧',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    relation: 'Granddaughter · Bangalore',
    unread: 0,
    messages: [
      { id: 'm30', senderName: 'Riya Sharma', text: 'Nani! The ginger pickle you sent with Chachu arrived! It is SO delicious! 😋', time: 'Yesterday', isMe: false },
      { id: 'm31', senderName: 'You', text: 'Make sure you eat it with hot parathas! Have you started preparing for board exams?', time: 'Yesterday', isMe: true },
      { id: 'm32', senderName: 'Riya Sharma', text: 'Yes Nani! I recite the Gayatri mantra before opening my math books, just like you taught me! ❤️', time: '11:02 AM', isMe: false },
    ]
  },
  'c4': {
    id: 'c4',
    name: 'Dev Menon',
    avatar: '👨',
    avatarBg: '#FEF3C7',
    avatarColor: '#92400E',
    relation: 'Son · San Francisco',
    unread: 0,
    messages: [
      { id: 'm40', senderName: 'Dev Menon', text: 'Hi Maa, how is the weather in Delhi today? Hope you have turned on the warm heater.', time: 'Yesterday', isMe: false },
      { id: 'm41', senderName: 'You', text: 'Mild sunny winter here Dev. Eat home-cooked food and don’t skip your lunch in office.', time: 'Yesterday', isMe: true },
      { id: 'm42', senderName: 'Dev Menon', text: 'Promise! Will call you on Sunday 8:00 AM your time so we can chat peacefully.', time: 'Yesterday', isMe: false },
    ]
  }
};

/* ──────────────────────────────────────────
   Seed Community Posts
────────────────────────────────────────── */
const SEED_COMMUNITY_POSTS = [
  {
    id: 'p1',
    author: 'Riya Sharma',
    authorRelation: 'Granddaughter · Bangalore',
    avatar: '👧',
    avatarBg: '#DCFCE7',
    avatarColor: '#166534',
    time: '2 hours ago',
    tag: 'Diwali & Celebrations 🪔',
    category: 'family',
    title: 'Lit 21 Diyas for Peace & Family Health',
    content: 'We lit diyas all across our veranda in Bangalore! Dedicated the first diya to Nani and Nana ji. Wishing everyone immense joy and sound health across all time zones!',
    likes: 14,
    hasLiked: false,
    comments: [
      { id: 'c101', author: 'Priya Nair', text: 'So proud of you Riya beta! Looks truly peaceful.', time: '1 hour ago' },
      { id: 'c102', author: 'Aarav Sharma', text: 'Save some sweets for when we visit India! 😋', time: '45 mins ago' }
    ]
  },
  {
    id: 'p2',
    author: 'Aarav Sharma',
    authorRelation: 'Grandson · London',
    avatar: '👦',
    avatarBg: '#DBEAFE',
    avatarColor: '#1E40AF',
    time: '5 hours ago',
    tag: 'Milestone & Pride 🏆',
    category: 'family',
    title: 'First Prize in London School Science Exhibition!',
    content: 'Our working model on Renewable Solar Irrigation won 1st prize today! Dadi spent 20 minutes with me on video call yesterday explaining how farmers in Punjab use canal waters. Her wisdom was the highlight of our presentation!',
    likes: 22,
    hasLiked: true,
    comments: [
      { id: 'c201', author: 'Dev Menon', text: 'Brilliant work Aarav! That canal example was genius.', time: '3 hours ago' }
    ]
  },
  {
    id: 'p3',
    author: 'Morning Gita Satsang Circle',
    authorRelation: 'Spiritual Community · 24 Elders',
    avatar: '📿',
    avatarBg: '#FEF3C7',
    avatarColor: '#92400E',
    time: 'Today 6:45 AM',
    tag: 'Daily Reflection 📖',
    category: 'spiritual',
    title: 'Verse of the Day: Performing Duty with a Joyful Heart',
    content: '“Focus wholeheartedly on your seva and duty, free from anxiety about future outcomes.” When we prepare morning breakfast or call our children, let it be an offering of unconditional love. Have a tranquil day, everyone!',
    likes: 35,
    hasLiked: false,
    comments: [
      { id: 'c301', author: 'Rajesh Kumar', text: 'Hari Om. Such peaceful thoughts to start the morning.', time: '5 hours ago' }
    ]
  },
  {
    id: 'p4',
    author: 'Priya Nair',
    authorRelation: 'Daughter · Toronto',
    avatar: '👩',
    avatarBg: '#FCE7F3',
    avatarColor: '#9D174D',
    time: 'Yesterday',
    tag: 'Kitchen Memories 🍲',
    category: 'family',
    title: 'Made Maa’s Special Ginger-Cardamom Masala Tea',
    content: 'It’s 4°C outside in Toronto, but our kitchen smells just like home. Brewed fresh ginger, crushed green cardamom, and a pinch of cinnamon following Maa’s handwritten recipe. Warm hugs to everyone back home!',
    likes: 19,
    hasLiked: false,
    comments: [
      { id: 'c401', author: 'Riya Sharma', text: 'Bua, please post the exact measurements! Mine never turns out as spicy.', time: 'Yesterday' }
    ]
  }
];

/* ──────────────────────────────────────────
   Context Setup
────────────────────────────────────────── */
const AppContext = createContext(null);

export function AppProvider({ children }) {
  // Check saved session, or start null so user sees the login screen
  const [user, setUserState] = useState(() => {
    try {
      const saved = localStorage.getItem('kinnect_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [familyCode, setFamilyCodeState] = useState(() => {
    return localStorage.getItem('kinnect_family_code') || 'sharma-family';
  });

  const setFamilyCode = useCallback((code) => {
    const clean = (code || 'sharma-family').toLowerCase().replace(/[^a-z0-9-_]/g, '');
    setFamilyCodeState(clean);
    localStorage.setItem('kinnect_family_code', clean);
    if (user) {
      realtime.init(user, clean);
    }
  }, [user]);

  const setUser = useCallback((newUser) => {
    setUserState(newUser);
    try {
      if (newUser) {
        localStorage.setItem('kinnect_user', JSON.stringify(newUser));
        realtime.init(newUser, familyCode);
      } else {
        localStorage.removeItem('kinnect_user');
      }
    } catch (e) {
      console.error(e);
    }
  }, [familyCode]);

  const logout = useCallback(() => {
    setUser(null);
  }, [setUser]);

  const [activeTab, setActiveTab] = useState('chats'); // 'chats' | 'calls' | 'community' | 'wisdom' | 'album'
  const [contacts] = useState(SEED_CONTACTS);
  const [topics] = useState(RICH_TOPICS);
  const [chats, setChats] = useState(SEED_CHATS);
  const [activeChatId, setActiveChatId] = useState('family-group');
  const [communityPosts, setCommunityPosts] = useState(SEED_COMMUNITY_POSTS);
  const [activeCall, setActiveCall] = useState(null);
  const [incomingCall, setIncomingCall] = useState(null);
  const [realtimeConnected, setRealtimeConnected] = useState(false);
  const [peerId, setPeerId] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [fontScale, setFontScale] = useState('normal'); // 'normal' | 'large' | 'xlarge'
  const [selectedLanguage, setSelectedLanguage] = useState('hi');
  const [storageMode, setStorageMode] = useState('archive');

  // Pre-seeded family feedback
  const [feedbackList, setFeedbackList] = useState([
    {
      id: 'fb-1',
      memberName: 'Priya Nair (Toronto)',
      rating: 5,
      text: 'The large text toggle and direct chat window are so helpful for Maa! She was able to voice message us easily.',
      date: 'Today',
      language: 'Hindi'
    },
    {
      id: 'fb-2',
      memberName: 'Aarav Sharma (London)',
      rating: 5,
      text: 'Love learning the Gita verses with Dadi in one tab! The audio pronunciation button is super cool.',
      date: 'Yesterday',
      language: 'English'
    }
  ]);

  const submitFeedback = useCallback((newFb) => {
    const item = {
      id: 'fb-' + Date.now(),
      date: 'Just now',
      ...newFb
    };
    setFeedbackList(prev => [item, ...prev]);
  }, []);

  // Snippets/video messages
  const [snippets, setSnippets] = useState([
    {
      id: 'sn1', from: 'Aarav Sharma', emoji: '👦', duration: '0:42',
      time: '2 hours ago', thumbnail: '🎥', message: 'Hey Dadi! Watch my school play clip!',
      watched: false
    },
    {
      id: 'sn2', from: 'Riya Sharma', emoji: '👧', duration: '1:05',
      time: 'Yesterday', thumbnail: '📸', message: 'Happy Diwali from Bangalore! We lit 21 diyas!',
      watched: true
    },
  ]);

  // Joined circle IDs
  const [joinedCircleIds, setJoinedCircleIds] = useState(['GRP-GITA-9021', 'GRP-RAMA-4567']);

  // Apply font scale to body class
  useEffect(() => {
    document.body.classList.remove('font-large', 'font-xlarge');
    if (fontScale === 'large') document.body.classList.add('font-large');
    if (fontScale === 'xlarge') document.body.classList.add('font-xlarge');
  }, [fontScale]);

  // Initialize Realtime Service when user is present
  useEffect(() => {
    if (!user) return;

    realtime.init(user, familyCode);

    const unsubStatus = realtime.on('connection_status', ({ connected }) => {
      setRealtimeConnected(connected);
    });

    const unsubPeer = realtime.on('peer_ready', ({ peerId }) => {
      setPeerId(peerId);
    });

    // Handle real-time chat messages from other devices
    const unsubChat = realtime.on('chat_message', (incomingMsg) => {
      const targetChatId = incomingMsg.chatId === 'family-group' 
        ? 'family-group' 
        : (incomingMsg.senderId === user.id ? incomingMsg.chatId : incomingMsg.senderId);

      setChats(prev => {
        const currentChat = prev[targetChatId] || prev['family-group'];
        if (!currentChat) return prev;

        // Prevent duplicate messages
        if (currentChat.messages.some(m => m.id === incomingMsg.id)) {
          return prev;
        }

        const formattedMsg = {
          id: incomingMsg.id,
          senderName: incomingMsg.senderName,
          text: incomingMsg.text,
          time: incomingMsg.time,
          isMe: false,
          type: incomingMsg.type || 'text',
          audioUrl: incomingMsg.audioUrl,
          audioDuration: incomingMsg.audioDuration,
          imageUrl: incomingMsg.imageUrl
        };

        return {
          ...prev,
          [targetChatId]: {
            ...currentChat,
            messages: [...currentChat.messages, formattedMsg],
            unread: activeChatId === targetChatId ? 0 : (currentChat.unread || 0) + 1
          }
        };
      });
    });

    // Handle incoming video/audio call
    const unsubCall = realtime.on('incoming_call', (callData) => {
      // Don't ring self
      if (callData.caller?.id === user.id) return;
      setIncomingCall(callData);
    });

    // Handle call response
    const unsubCallAccepted = realtime.on('call_accepted', (callData) => {
      console.log('[App] Remote family member answered call:', callData);
    });

    const unsubCallEnded = realtime.on('call_ended', () => {
      setActiveCall(null);
      setIncomingCall(null);
      setRemoteStream(null);
    });

    return () => {
      unsubStatus();
      unsubPeer();
      unsubChat();
      unsubCall();
      unsubCallAccepted();
      unsubCallEnded();
    };
  }, [user, familyCode, activeChatId]);

  // Direct navigation to open a specific contact's chat
  const openChat = useCallback((contactOrChatId) => {
    setActiveTab('chats');
    setActiveChatId(contactOrChatId);
    // Mark as read
    setChats(prev => {
      if (!prev[contactOrChatId]) return prev;
      return {
        ...prev,
        [contactOrChatId]: { ...prev[contactOrChatId], unread: 0 }
      };
    });
  }, []);

  // Send a message in active or target chat (Local + Realtime Broadcast)
  const sendMessage = useCallback((chatId, text, type = 'text', media = {}) => {
    if (!text && !media.audioDuration && !media.imageUrl) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const localId = 'msg-' + Date.now();

    const newMsg = {
      id: localId,
      senderName: user ? user.name : 'You',
      text: text || '',
      time: timeStr,
      isMe: true,
      type,
      ...media
    };

    // Update local state immediately
    setChats(prev => {
      const currentChat = prev[chatId];
      if (!currentChat) return prev;
      return {
        ...prev,
        [chatId]: {
          ...currentChat,
          messages: [...currentChat.messages, newMsg]
        }
      };
    });

    // Broadcast across devices in real-time
    realtime.sendChatMessage({
      chatId,
      text,
      type,
      media
    });

    // Optional warm fallback reply if chatting with bot contact and alone
    if (!realtime.isConnected && (chatId.startsWith('c') || chatId === 'family-group')) {
      setTimeout(() => {
        let replyText = 'Thank you! Sent you my love ❤️';
        let sender = 'Family';

        if (chatId === 'c1') {
          sender = 'Aarav Sharma';
          replyText = 'Love you Dadi! Can’t wait to video call you this weekend! 👦🎒';
        } else if (chatId === 'c2') {
          sender = 'Priya Nair';
          replyText = 'Namaste Ma! Just finished lunch. Take your herbal tea and rest well today! ☕❤️';
        } else if (chatId === 'c3') {
          sender = 'Riya Sharma';
          replyText = 'Got your message Nani! Sending you warm hugs and sweets from Bangalore! 🪔✨';
        } else if (chatId === 'c4') {
          sender = 'Dev Menon';
          replyText = 'Thanks Maa! Please don’t take any strain. I will ring you early Sunday morning. 🙏';
        } else if (chatId === 'family-group') {
          sender = 'Priya Nair';
          replyText = 'So true! Let’s all get together on a family video call this Sunday evening! 👨‍👩‍👧‍👦';
        }

        const autoReply = {
          id: 'reply-' + Date.now(),
          senderName: sender,
          text: replyText,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          isMe: false,
          type: 'text'
        };

        setChats(prev => {
          const currentChat = prev[chatId];
          if (!currentChat) return prev;
          return {
            ...prev,
            [chatId]: {
              ...currentChat,
              messages: [...currentChat.messages, autoReply]
            }
          };
        });
      }, 1600);
    }
  }, [user]);

  // Start Call (Video / Audio)
  const startCall = useCallback((contact, type) => {
    const callData = { contact, type, startTime: Date.now() };
    setActiveCall(callData);

    // Broadcast incoming call alert to target device
    realtime.initiateCall({ targetContact: contact, callType: type });
  }, []);

  // Answer Incoming Call
  const answerIncomingCall = useCallback(() => {
    if (!incomingCall) return;

    const callerContact = {
      id: incomingCall.caller?.id || 'caller',
      name: incomingCall.caller?.name || 'Family Member',
      emoji: incomingCall.caller?.avatar || '👵',
      city: 'Live Connection',
      country: 'Online',
      peerId: incomingCall.caller?.peerId
    };

    setActiveCall({
      contact: callerContact,
      type: incomingCall.callType || 'video',
      startTime: Date.now(),
      isIncoming: true,
      callData: incomingCall
    });

    realtime.respondToCall({ callData: incomingCall, accepted: true });
    setIncomingCall(null);
  }, [incomingCall]);

  // Decline Incoming Call
  const declineIncomingCall = useCallback(() => {
    if (!incomingCall) return;
    realtime.respondToCall({ callData: incomingCall, accepted: false });
    setIncomingCall(null);
  }, [incomingCall]);

  const endCall = useCallback(() => {
    if (activeCall) {
      realtime.endCall({ callData: activeCall.callData || activeCall });
    }
    setActiveCall(null);
    setRemoteStream(null);
  }, [activeCall]);

  // Join or leave a learning circle
  const toggleCircle = useCallback((circleId) => {
    setJoinedCircleIds(prev =>
      prev.includes(circleId) ? prev.filter(id => id !== circleId) : [...prev, circleId]
    );
  }, []);

  // Community Interactions
  const likeCommunityPost = useCallback((postId) => {
    setCommunityPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      const nextLiked = !p.hasLiked;
      return {
        ...p,
        hasLiked: nextLiked,
        likes: nextLiked ? p.likes + 1 : p.likes - 1
      };
    }));
  }, []);

  const addCommunityComment = useCallback((postId, commentText) => {
    if (!commentText.trim()) return;
    const newComment = {
      id: 'cm-' + Date.now(),
      author: user ? user.name : 'You',
      text: commentText.trim(),
      time: 'Just now'
    };
    setCommunityPosts(prev => prev.map(p => {
      if (p.id !== postId) return p;
      return {
        ...p,
        comments: [...p.comments, newComment]
      };
    }));
  }, [user]);

  const createCommunityPost = useCallback(({ title, content, tag, category }) => {
    const newPost = {
      id: 'p-' + Date.now(),
      author: user ? user.name : 'You',
      authorRelation: 'Me · Matriarch',
      avatar: user?.avatar || '👵',
      avatarBg: '#FEF3C7',
      avatarColor: '#B45309',
      time: 'Just now',
      tag: tag || 'Family Blessing 🙏',
      category: category || 'family',
      title: title || 'Warm Greetings to My Family',
      content: content.trim(),
      likes: 1,
      hasLiked: true,
      comments: []
    };
    setCommunityPosts(prev => [newPost, ...prev]);
  }, [user]);

  const markSnippetWatched = useCallback((id) => {
    setSnippets(prev => prev.map(s => s.id === id ? { ...s, watched: true } : s));
  }, []);

  // Total unread chat count
  const totalUnreadChats = Object.values(chats).reduce((sum, c) => sum + (c.unread || 0), 0);

  return (
    <AppContext.Provider value={{
      user, setUser, logout,
      familyCode, setFamilyCode,
      realtimeConnected, peerId,
      activeTab, setActiveTab,
      contacts,
      topics,
      chats, activeChatId, setActiveChatId, openChat, sendMessage, totalUnreadChats,
      communityPosts, likeCommunityPost, addCommunityComment, createCommunityPost,
      joinedCircleIds, toggleCircle,
      snippets, markSnippetWatched,
      activeCall, incomingCall, startCall, answerIncomingCall, declineIncomingCall, endCall,
      remoteStream, setRemoteStream,
      fontScale, setFontScale,
      selectedLanguage, setSelectedLanguage,
      feedbackList, submitFeedback,
      storageMode, setStorageMode,
    }}>
      {children}
    </AppContext.Provider>
  );
}

export const useApp = () => useContext(AppContext);
export default AppContext;
