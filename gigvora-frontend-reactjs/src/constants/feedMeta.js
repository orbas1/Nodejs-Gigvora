import {
  BriefcaseIcon,
  FaceSmileIcon,
  HandRaisedIcon,
  PhotoIcon,
  PresentationChartBarIcon,
  RocketLaunchIcon,
  UsersIcon,
} from '@heroicons/react/24/outline';

import { deepFreeze } from './menuSchema.js';

export const COMPOSER_OPTIONS = deepFreeze([
  {
    id: 'update',
    label: 'Update',
    description: 'Share wins, milestones, and shout-outs with your network.',
    icon: FaceSmileIcon,
  },
  {
    id: 'media',
    label: 'Media',
    description: 'Upload demos, decks, and reels directly to your feed.',
    icon: PhotoIcon,
  },
  {
    id: 'job',
    label: 'Job',
    description: 'List a permanent, contract, or interim opportunity.',
    icon: BriefcaseIcon,
  },
  {
    id: 'gig',
    label: 'Gig',
    description: 'Promote a specialist engagement with clear deliverables.',
    icon: PresentationChartBarIcon,
  },
  {
    id: 'project',
    label: 'Project',
    description: 'Rally collaborators around a multi-disciplinary brief.',
    icon: UsersIcon,
  },
  {
    id: 'volunteering',
    label: 'Volunteering',
    description: 'Mobilise talent towards purpose-led community missions.',
    icon: HandRaisedIcon,
  },
  {
    id: 'launchpad',
    label: 'Launchpad',
    description: 'Showcase cohort-based Experience Launchpad programmes.',
    icon: RocketLaunchIcon,
  },
]);

export const QUICK_EMOJIS = Object.freeze(['🚀', '🎉', '👏', '🤝', '🔥', '💡', '✅', '🙌', '🌍', '💬']);

export const GIF_LIBRARY = deepFreeze([
  {
    id: 'celebration',
    label: 'Celebration',
    url: 'https://media.giphy.com/media/5GoVLqeAOo6PK/giphy.gif',
    tone: 'Celebrating big wins',
  },
  {
    id: 'team-high-five',
    label: 'Team high-five',
    url: 'https://media.giphy.com/media/111ebonMs90YLu/giphy.gif',
    tone: 'Recognising collaboration',
  },
  {
    id: 'product-launch',
    label: 'Product launch',
    url: 'https://media.giphy.com/media/3oEjI6SIIHBdRxXI40/giphy.gif',
    tone: 'Shipping moments & go-lives',
  },
  {
    id: 'inspiration',
    label: 'Inspiration',
    url: 'https://media.giphy.com/media/l0HUpt2s9Pclgt9Vm/giphy.gif',
    tone: 'Ideas, creativity, momentum',
  },
]);

const allowedMembershipValues = ['user', 'freelancer', 'agency', 'company', 'headhunter', 'mentor', 'admin'];
const allowedMembershipSet = new Set(allowedMembershipValues);

export const ALLOWED_FEED_MEMBERSHIPS = Object.freeze({
  has(value) {
    return allowedMembershipSet.has(`${value}`.toLowerCase());
  },
  [Symbol.iterator]() {
    return allowedMembershipSet[Symbol.iterator]();
  },
});
