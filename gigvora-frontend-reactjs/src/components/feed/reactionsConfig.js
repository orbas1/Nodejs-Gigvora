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
  },
  {
    id: 'celebrate',
    label: 'Celebrate',
    activeLabel: 'Celebrating',
    Icon: SparklesIcon,
    activeClasses: 'border-amber-200 bg-amber-50 text-amber-700',
    dotClassName: 'bg-amber-500',
    description: 'Mark major wins and launches.',
  },
  {
    id: 'support',
    label: 'Support',
    activeLabel: 'Supporting',
    Icon: HandRaisedIcon,
    activeClasses: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    dotClassName: 'bg-emerald-500',
    description: 'Signal you have their back.',
  },
  {
    id: 'love',
    label: 'Champion',
    activeLabel: 'Championing',
    Icon: HeartIcon,
    activeClasses: 'border-rose-200 bg-rose-50 text-rose-700',
    dotClassName: 'bg-rose-500',
    description: 'Spotlight heartfelt wins and gratitude.',
  },
  {
    id: 'insightful',
    label: 'Insightful',
    activeLabel: 'Finding insightful',
    Icon: LightBulbIcon,
    activeClasses: 'border-violet-200 bg-violet-50 text-violet-700',
    dotClassName: 'bg-violet-500',
    description: 'Highlight thought leadership.',
  },
];

export const DEFAULT_REACTION_ICON = HandThumbUpIcon;

export const REACTION_LOOKUP = REACTION_OPTIONS.reduce((map, option) => {
  map[option.id] = option;
  return map;
}, {});

export const REACTION_ALIASES = {
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
  supportive: 'support',
  care: 'support',
  caring: 'support',
  insightful: 'insightful',
  insight: 'insightful',
  insights: 'insightful',
  curious: 'insightful',
  curiosity: 'insightful',
};

export function getReactionOption(reactionId) {
  if (!reactionId) {
    return null;
  }
  const key = reactionId.toLowerCase();
  const canonical = REACTION_ALIASES[key] ?? key;
  return REACTION_LOOKUP[canonical] ?? null;
}

export function formatReactionSummaryLabel(total) {
  if (!Number.isFinite(total) || total <= 0) {
    return null;
  }
  return `${total} ${total === 1 ? 'appreciation' : 'appreciations'}`;
}
