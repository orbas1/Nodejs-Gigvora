import {
  RocketLaunchIcon,
  EnvelopeOpenIcon,
  ChatBubbleBottomCenterTextIcon,
  HandThumbUpIcon,
  FlagIcon,
} from '@heroicons/react/24/outline';

export const FREELANCER_PIPELINE_STAGES = [
  {
    id: 'ready',
    label: 'Ready to start',
    description:
      'Confirm your profile, rates, and availability so you can move quickly when invited.',
    icon: RocketLaunchIcon,
    tone: 'bg-slate-900 text-white',
    progressTone: 'bg-slate-900',
    aliases: ['ready', 'lead-in', 'lead_in', 'ready_to_start', 'lead'],
    coaching:
      'Refresh your portfolio items and note current capacity so talent partners can confidently send work your way.',
    cta: { label: 'Update profile', href: '/dashboard/freelancer/profile' },
  },
  {
    id: 'applied',
    label: 'Applied',
    description: 'Follow up with hiring managers within 24 hours and share tailored project highlights.',
    icon: EnvelopeOpenIcon,
    tone: 'bg-sky-600 text-white',
    progressTone: 'bg-sky-500',
    aliases: ['applied', 'application', 'applied_stage', 'proposal', 'proposal-sent', 'submitted'],
    coaching:
      'Send personalised follow-ups and attach recent case studies to stand out from the queue.',
    cta: { label: 'View submissions', href: '/dashboard/freelancer/projects' },
  },
  {
    id: 'interviewing',
    label: 'Interviewing',
    description: 'Prepare talking points that emphasise outcomes, metrics, and collaboration style.',
    icon: ChatBubbleBottomCenterTextIcon,
    tone: 'bg-violet-600 text-white',
    progressTone: 'bg-violet-500',
    aliases: ['interviewing', 'interview', 'interview_stage', 'interviews', 'discovery', 'discovery-scheduled'],
    coaching:
      'Draft agenda notes and share them with the hiring panel so every conversation stays structured.',
    cta: { label: 'Plan interviews', href: '/calendar' },
  },
  {
    id: 'offer',
    label: 'Offer',
    description: 'Loop in your talent partner to review terms and surface any blockers early.',
    icon: HandThumbUpIcon,
    tone: 'bg-amber-500 text-slate-900',
    progressTone: 'bg-amber-400',
    aliases: ['offer', 'offers', 'offer_stage', 'negotiation', 'contract', 'contract-review'],
    coaching:
      'Align on pricing scenarios and contract terms so you can sign with confidence.',
    cta: { label: 'Review terms', href: '/inbox' },
  },
  {
    id: 'kickoff',
    label: 'Kickoff',
    description: 'Meet the client team, agree on the delivery plan, and track milestones in Gigvora.',
    icon: FlagIcon,
    tone: 'bg-emerald-600 text-white',
    progressTone: 'bg-emerald-500',
    aliases: ['kickoff', 'kick_off', 'kick-off', 'won', 'closed_won', 'launch', 'onboarding'],
    coaching:
      'Share the kickoff checklist and confirm responsibilities so delivery momentum stays high from day one.',
    cta: { label: 'Launch workspace', href: '/dashboard/freelancer/projects' },
  },
];

export default FREELANCER_PIPELINE_STAGES;
