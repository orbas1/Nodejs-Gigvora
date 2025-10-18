export const STATUS_ORDER = ['draft', 'pending_review', 'approved', 'published', 'paused', 'archived'];

export const STATUS_LABELS = {
  draft: 'Drafts',
  pending_review: 'Review',
  approved: 'Ready',
  published: 'Live',
  paused: 'Paused',
  archived: 'Archived',
};

export const STATUS_OPTIONS = STATUS_ORDER.map((value) => ({
  value,
  label: STATUS_LABELS[value] ?? value,
}));

export const STATUS_BADGES = {
  draft: 'border-slate-200 bg-slate-100 text-slate-700',
  pending_review: 'border-amber-200 bg-amber-100 text-amber-800',
  approved: 'border-sky-200 bg-sky-100 text-sky-700',
  published: 'border-emerald-200 bg-emerald-100 text-emerald-700',
  paused: 'border-orange-200 bg-orange-100 text-orange-700',
  archived: 'border-rose-200 bg-rose-100 text-rose-700',
};

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'internal', label: 'Internal' },
  { value: 'private', label: 'Private' },
];

export const WORKPLACE_OPTIONS = [
  { value: 'remote', label: 'Remote' },
  { value: 'hybrid', label: 'Hybrid' },
  { value: 'onsite', label: 'On-site' },
  { value: 'flex', label: 'Flexible' },
];

export const EMPLOYMENT_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'temporary', label: 'Temporary' },
  { value: 'internship', label: 'Internship' },
];

export const CONTRACT_OPTIONS = [
  { value: 'full_time', label: 'Full-time' },
  { value: 'part_time', label: 'Part-time' },
  { value: 'contract', label: 'Contract' },
  { value: 'freelance', label: 'Freelance' },
  { value: 'temporary', label: 'Temporary' },
];

export const EXPERIENCE_OPTIONS = [
  { value: 'entry', label: 'Entry' },
  { value: 'mid', label: 'Mid' },
  { value: 'senior', label: 'Senior' },
  { value: 'lead', label: 'Lead' },
  { value: 'executive', label: 'Executive' },
];

export const COMPENSATION_OPTIONS = [
  { value: 'salary', label: 'Salary' },
  { value: 'hourly', label: 'Hourly' },
  { value: 'commission', label: 'Commission' },
  { value: 'stipend', label: 'Stipend' },
];

export const WORKFLOW_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'review', label: 'Review' },
  { value: 'ready', label: 'Ready' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

export const APPROVAL_OPTIONS = [
  { value: 'pending_review', label: 'Pending' },
  { value: 'approved', label: 'Approved' },
  { value: 'rejected', label: 'Rejected' },
];

export const PROMOTION_FLAGS = [
  { key: 'featured', label: 'Featured' },
  { key: 'highlighted', label: 'Highlight' },
  { key: 'newsletter', label: 'Newsletter' },
  { key: 'pushNotification', label: 'Push' },
];
