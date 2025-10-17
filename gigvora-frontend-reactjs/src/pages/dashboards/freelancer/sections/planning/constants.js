import {
  AcademicCapIcon,
  BriefcaseIcon,
  BuildingOffice2Icon,
  CalendarDaysIcon,
  ClipboardDocumentCheckIcon,
  ClockIcon,
  HeartIcon,
  SparklesIcon,
} from '@heroicons/react/24/outline';

export const EVENT_TYPE_OPTIONS = [
  {
    value: 'project',
    label: 'Project milestone',
    description: 'Client project ceremonies, milestones, and delivery checkpoints.',
    tone: 'bg-blue-50 text-blue-700 border-blue-200',
    icon: ClipboardDocumentCheckIcon,
    color: '#2563eb',
  },
  {
    value: 'gig',
    label: 'Gig production',
    description: 'Launchpad gigs, modular offers, and fulfilment activities.',
    tone: 'bg-violet-50 text-violet-700 border-violet-200',
    icon: SparklesIcon,
    color: '#7c3aed',
  },
  {
    value: 'job_interview',
    label: 'Job interview',
    description: 'Hiring loops, interview prep, and onsite visits.',
    tone: 'bg-sky-50 text-sky-700 border-sky-200',
    icon: BriefcaseIcon,
    color: '#0ea5e9',
  },
  {
    value: 'mentorship',
    label: 'Mentorship booking',
    description: 'Mentor sessions, advisory retainers, or coaching calls.',
    tone: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    icon: AcademicCapIcon,
    color: '#14b8a6',
  },
  {
    value: 'volunteering',
    label: 'Volunteering',
    description: 'Community impact, pro-bono engagements, and guild events.',
    tone: 'bg-green-50 text-green-700 border-green-200',
    icon: HeartIcon,
    color: '#16a34a',
  },
  {
    value: 'client_meeting',
    label: 'Client meeting',
    description: 'Relationship health checks, discovery calls, and renewals.',
    tone: 'bg-amber-50 text-amber-700 border-amber-200',
    icon: BuildingOffice2Icon,
    color: '#f97316',
  },
  {
    value: 'other',
    label: 'Personal / other',
    description: 'Personal focus, wellbeing, and miscellaneous calendar blocks.',
    tone: 'bg-slate-100 text-slate-700 border-slate-200',
    icon: CalendarDaysIcon,
    color: '#475569',
  },
];

export const EVENT_STATUS_OPTIONS = [
  { value: 'tentative', label: 'Tentative', tone: 'bg-amber-100 text-amber-800 border-amber-200' },
  { value: 'confirmed', label: 'Confirmed', tone: 'bg-emerald-100 text-emerald-700 border-emerald-200' },
  { value: 'in_progress', label: 'In progress', tone: 'bg-sky-100 text-sky-800 border-sky-200' },
  { value: 'completed', label: 'Completed', tone: 'bg-blue-100 text-blue-800 border-blue-200' },
  { value: 'cancelled', label: 'Cancelled', tone: 'bg-rose-100 text-rose-700 border-rose-200' },
];

export const RELATED_ENTITY_OPTIONS = [
  { value: '', label: 'None' },
  { value: 'project', label: 'Project workspace' },
  { value: 'gig', label: 'Gig order' },
  { value: 'job', label: 'Job opportunity' },
  { value: 'mentorship', label: 'Mentorship programme' },
  { value: 'volunteering', label: 'Volunteering campaign' },
  { value: 'client', label: 'Client account' },
  { value: 'community', label: 'Community event' },
  { value: 'other', label: 'Other link' },
];

export const REMINDER_OPTIONS = [
  { value: '', label: 'No reminder' },
  { value: 5, label: '5 minutes before' },
  { value: 10, label: '10 minutes before' },
  { value: 15, label: '15 minutes before' },
  { value: 30, label: '30 minutes before' },
  { value: 60, label: '1 hour before' },
  { value: 120, label: '2 hours before' },
  { value: 240, label: '4 hours before' },
  { value: 720, label: '12 hours before' },
  { value: 1440, label: '1 day before' },
  { value: 2880, label: '2 days before' },
];

export const EVENT_SOURCE_OPTIONS = [
  { value: 'manual', label: 'Manual entry' },
  { value: 'google', label: 'Google calendar sync' },
  { value: 'outlook', label: 'Outlook calendar sync' },
  { value: 'gigvora', label: 'Gigvora automation' },
];

export function createOptionLookup(options) {
  return options.reduce((accumulator, option) => {
    accumulator.set(option.value, option);
    return accumulator;
  }, new Map());
}

export const EVENT_TYPE_LOOKUP = createOptionLookup(EVENT_TYPE_OPTIONS);
export const EVENT_STATUS_LOOKUP = createOptionLookup(EVENT_STATUS_OPTIONS);

export function resolveTypeMeta(type) {
  return EVENT_TYPE_LOOKUP.get(type) ?? EVENT_TYPE_LOOKUP.get('other');
}

export function resolveStatusMeta(status) {
  return EVENT_STATUS_LOOKUP.get(status) ?? EVENT_STATUS_LOOKUP.get('confirmed');
}

export function getTypeIcon(type) {
  return resolveTypeMeta(type)?.icon ?? ClockIcon;
}

export const TYPE_COLOR_MAP = EVENT_TYPE_OPTIONS.reduce((accumulator, option) => {
  accumulator[option.value] = option.color;
  return accumulator;
}, {});

export const DEFAULT_LOOKBACK_OPTIONS = [7, 14, 30, 60, 90];
export const DEFAULT_LOOKAHEAD_OPTIONS = [14, 30, 45, 60, 90, 120];

export const STATUS_PROGRESS_ORDER = ['tentative', 'confirmed', 'in_progress', 'completed', 'cancelled'];
