import {
  HandThumbUpIcon,
  SparklesIcon,
  HandRaisedIcon,
  HeartIcon,
  LightBulbIcon,
} from '@heroicons/react/24/outline';

export const REACTION_OPTIONS = [
  {
    id: 'like',
    label: 'Appreciate',
    activeLabel: 'Appreciated',
    Icon: HandThumbUpIcon,
    activeClasses: 'border-sky-200 bg-sky-50 text-sky-700',
    dotClassName: 'bg-sky-500',
    description: 'Show gratitude or agreement.',
    sentiment: 'gratitude',
  },
  {
    id: 'celebrate',
    label: 'Celebrate',
    activeLabel: 'Celebrating',
    Icon: SparklesIcon,
    activeClasses: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
    description: 'Mark major wins and launches.',
    sentiment: 'celebration',
  },
  {
    id: 'support',
    label: 'Support',
    activeLabel: 'Supporting',
    Icon: HandRaisedIcon,
    activeClasses: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
    description: 'Signal you have their back.',
    sentiment: 'allyship',
  },
  {
    id: 'love',
    label: 'Champion',
    activeLabel: 'Championing',
    Icon: HeartIcon,
    activeClasses: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClassName: 'bg-rose-500',
    description: 'Spotlight heartfelt wins and gratitude.',
    sentiment: 'advocacy',
  },
  {
    id: 'insightful',
    label: 'Insightful',
    activeLabel: 'Finding insightful',
    Icon: LightBulbIcon,
    activeClasses: 'border-violet-200 bg-violet-50 text-violet-700',
    dotClassName: 'bg-violet-500',
    description: 'Highlight thought leadership.',
    sentiment: 'thought-leadership',
  },
];

export const REACTION_LOOKUP = REACTION_OPTIONS.reduce((map, option) => {
  map[option.id] = option;
  return map;
}, {});

export const REACTION_ALIASES = {
  appreciate: 'like',
  appreciated: 'like',
  like: 'like',
  likes: 'like',
  heart: 'love',
  hearts: 'love',
  love: 'love',
  loved: 'love',
  celebrate: 'celebrate',
  celebration: 'celebrate',
  celebrations: 'celebrate',
  support: 'support',
  supported: 'support',
  supporting: 'support',
  supportive: 'support',
  care: 'support',
  caring: 'support',
  insightful: 'insightful',
  insight: 'insightful',
  insights: 'insightful',
  curious: 'insightful',
  curiosity: 'insightful',
};

export const REACTION_SUMMARY_LABELS = {
  like: 'appreciations',
  celebrate: 'celebrations',
  support: 'supports',
  love: 'champions',
  insightful: 'insights',
};

export const REACTION_SUMMARY_FALLBACK = REACTION_OPTIONS.reduce((acc, option) => {
  acc[option.id] = 0;
  return acc;
}, {});

export default REACTION_OPTIONS;
