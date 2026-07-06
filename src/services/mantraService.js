const DEFAULT_PROMPT = 'Build confidence and self-trust';
const SETTINGS_STORAGE_KEY = 'intakeConfig';

export const MANTRA_KEYWORD_GROUPS = [
  {
    title: 'Emotional',
    options: ['Confidence', 'Inner Peace', 'Self-Love', 'Gratitude', 'Joy'],
  },
  {
    title: 'Mindset',
    options: ['Focus', 'Mental Clarity', 'Discipline', 'Courage', 'Mindfulness'],
  },
  {
    title: 'Growth',
    options: ['Success', 'Motivation', 'Abundance', 'Creativity'],
  },
  {
    title: 'Healing',
    options: ['Letting Go', 'Emotional Balance', 'Stress Relief', 'Deep Sleep'],
  },
];

export const MANTRA_VOICE_OPTIONS = [
  {
    title: 'Female',
    description: 'Warm and nurturing female voice',
  },
  {
    title: 'Male',
    description: 'Deep and resonant male voice',
  },
];

export const MANTRA_MUSIC_OPTIONS = [
  {
    title: 'Ambient',
    description: 'Atmospheric ambient soundscapes',
  },
  {
    title: 'Tech House',
    description: 'Rhythmic instrumental house background',
  },
];

export const MANTRA_LENGTH_OPTIONS = [
  {
    title: '1 min',
    description: 'Quick affirmation',
  },
  {
    title: '3 min',
    description: 'Standard meditation length',
  },
  {
    title: '5 min',
    description: 'Deep immersive experience',
  },
];

export const DEFAULT_MANTRA_SETTINGS = {
  keywords: [],
  voice: '',
  music: '',
  length: '',
};

export function getInitialMantraContext() {
  return sessionStorage.getItem('intakePrompt') || DEFAULT_PROMPT;
}

export function getInitialMantraSettings() {
  try {
    const settings = JSON.parse(sessionStorage.getItem(SETTINGS_STORAGE_KEY) || '{}');

    return {
      ...DEFAULT_MANTRA_SETTINGS,
      ...settings,
      keywords: Array.isArray(settings.keywords) ? settings.keywords : [],
    };
  } catch {
    return { ...DEFAULT_MANTRA_SETTINGS };
  }
}

export function saveInitialMantraSettings(settings) {
  sessionStorage.setItem(
    SETTINGS_STORAGE_KEY,
    JSON.stringify({
      ...DEFAULT_MANTRA_SETTINGS,
      ...settings,
      keywords: Array.isArray(settings.keywords) ? settings.keywords : [],
    }),
  );
}

export function createMantraTitle(prompt) {
  const cleanedPrompt = prompt
    .replace(/[^\p{L}\p{N}\s-]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleanedPrompt) {
    return 'New mantra';
  }

  return cleanedPrompt
    .split(' ')
    .slice(0, 5)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export function createInitialAssistantMessage(prompt) {
  const title = createMantraTitle(prompt);

  return `Your "${title}" mantra is ready. Ask me to refine it - change the tone, length, or focus.`;
}

function includesAny(value, terms) {
  return terms.some((term) => value.includes(term));
}

function isOpeningEditRequest(value) {
  return (
    includesAny(value, ['first', 'opening', 'beginning', 'start']) &&
    includesAny(value, ['sentence', 'sentense', 'sentences', 'sentenses', 'line', 'lines'])
  );
}

function isClosingEditRequest(value) {
  return (
    includesAny(value, ['last', 'final', 'closing', 'ending', 'end']) &&
    includesAny(value, ['sentence', 'sentense', 'sentences', 'sentenses', 'line', 'lines'])
  );
}

function createFocusedLine(value, fallback) {
  if (includesAny(value, ['love', 'self-love', 'self love'])) {
    return 'I open my heart to love, and I let it guide me gently.';
  }

  if (includesAny(value, ['goal', 'goals', 'achiev', 'success', 'successful'])) {
    return 'I move steadily toward my goals, and I trust myself to achieve lasting success.';
  }

  if (includesAny(value, ['focus', 'focused', 'clarity'])) {
    return 'I return to clarity, choose what matters, and focus on one steady step.';
  }

  if (includesAny(value, ['calm', 'peace', 'soft', 'gentle'])) {
    return 'I soften into this moment with calm, patience, and trust.';
  }

  if (includesAny(value, ['confidence', 'confident', 'courage'])) {
    return 'I trust my voice, my choices, and the confidence growing within me.';
  }

  return fallback;
}

export function createInitialMantra(prompt) {
  const normalizedPrompt = prompt.trim().toLowerCase();

  if (normalizedPrompt.includes('focus') || normalizedPrompt.includes('focused')) {
    return [
      'I am exactly where I need to be.',
      'With every breath, I return to clarity and presence.',
      'I choose one meaningful step, and I give it my full attention.',
      'My energy is steady. My mind is clear. My focus supports what matters.',
    ].join('\n\n');
  }

  if (normalizedPrompt.includes('calm') || normalizedPrompt.includes('peace')) {
    return [
      'I soften into this moment.',
      'With every breath, I welcome calm into my body and mind.',
      'I release what I cannot control and return to what is here.',
      'I am safe. I am steady. I can move gently through today.',
    ].join('\n\n');
  }

  return [
    'I am exactly where I need to be.',
    'With every breath, I welcome presence.',
    'I trust my voice. I trust my path. I trust myself to build confidence and self-trust.',
    'What is mine will find me, and what I give will return.',
    'I am calm. I am capable. I am enough - today and always.',
  ].join('\n\n');
}

export function createAssistantReply(message) {
  const normalizedMessage = message.toLowerCase();

  if (/^(hi|hello|hey)\b/.test(normalizedMessage.trim())) {
    return 'Hi. Tell me what you want to change in the mantra, and I will update the current text.';
  }

  if (isOpeningEditRequest(normalizedMessage)) {
    if (includesAny(normalizedMessage, ['love', 'self-love', 'self love'])) {
      return 'I updated the opening sentence so the mantra begins with love.';
    }

    if (includesAny(normalizedMessage, ['goal', 'goals', 'achiev', 'success', 'successful'])) {
      return 'I updated the opening sentence so the mantra begins with goals and success.';
    }

    return 'I updated the opening sentence while keeping the rest of the mantra intact.';
  }

  if (isClosingEditRequest(normalizedMessage)) {
    if (includesAny(normalizedMessage, ['goal', 'goals', 'achiev', 'success', 'successful'])) {
      return 'I updated the closing sentence so the mantra ends with achieving your goals.';
    }

    return 'I updated the closing sentence while keeping the rest of the mantra intact.';
  }

  if (normalizedMessage.includes('shorter')) {
    return 'Absolutely. I will make the mantra shorter while keeping the same emotional focus.';
  }

  if (normalizedMessage.includes('confidence')) {
    return 'I will add more confidence-focused affirmations and keep the tone grounded.';
  }

  if (normalizedMessage.includes('calmer')) {
    return 'I will soften the language and make the mantra feel calmer.';
  }

  return 'I can refine the mantra around that direction while preserving your original context.';
}

export function refineMantraText(currentText, message) {
  const normalizedMessage = message.toLowerCase();
  const paragraphs = currentText.split('\n\n').filter(Boolean);

  if (normalizedMessage.includes('shorter')) {
    return paragraphs.slice(0, 3).join('\n\n');
  }

  if (isOpeningEditRequest(normalizedMessage)) {
    const nextOpening = createFocusedLine(
      normalizedMessage,
      'I begin this moment with clarity, trust, and intention.',
    );
    return [nextOpening, ...paragraphs.slice(1)].join('\n\n');
  }

  if (isClosingEditRequest(normalizedMessage)) {
    const nextClosing = createFocusedLine(
      normalizedMessage,
      'I close this mantra with trust, clarity, and grounded intention.',
    );
    return [...paragraphs.slice(0, -1), nextClosing].join('\n\n');
  }

  if (normalizedMessage.includes('confidence')) {
    const confidenceLine = 'I trust myself to speak, choose, and move with confidence.';

    if (paragraphs.includes(confidenceLine)) {
      return currentText;
    }

    return [...paragraphs, confidenceLine].join('\n\n');
  }

  if (normalizedMessage.includes('calmer')) {
    return currentText.replaceAll('I trust', 'I gently trust').replaceAll('I am exactly', 'I am quietly');
  }

  return currentText;
}

export async function requestMantraRefinement(currentMantra, message, settings = {}) {
  try {
    const response = await fetch('/api/refine-mantra', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        currentMantra,
        message,
        settings,
      }),
    });

    if (!response.ok) {
      throw new Error('AI refinement endpoint is unavailable.');
    }

    const refinement = await response.json();

    return {
      mode: refinement.mode || 'direct_edit',
      reply: refinement.reply || createAssistantReply(message),
      mantra: refinement.mantra || currentMantra,
      suggestedMantra: refinement.suggestedMantra || '',
    };
  } catch {
    return {
      mode: 'direct_edit',
      reply: createAssistantReply(message),
      mantra: refineMantraText(currentMantra, message),
      suggestedMantra: '',
    };
  }
}
