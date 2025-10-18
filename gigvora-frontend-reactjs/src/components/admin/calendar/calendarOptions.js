export const PROVIDERS = [
  { value: 'google', label: 'Google' },
  { value: 'microsoft', label: 'Microsoft' },
  { value: 'zoho', label: 'Zoho' },
  { value: 'calendly', label: 'Calendly' },
  { value: 'other', label: 'Other' },
];

export const SYNC_STATES = [
  { value: 'connected', label: 'Connected' },
  { value: 'syncing', label: 'Syncing' },
  { value: 'needs_attention', label: 'Attention' },
  { value: 'disconnected', label: 'Disconnected' },
];

export const EVENT_TYPES = [
  'ops_review',
  'training',
  'launch',
  'webinar',
  'support',
  'governance',
];

export const VISIBILITY = ['internal', 'external', 'private'];

export const STATUSES = ['draft', 'scheduled', 'published', 'cancelled'];

export const DAYS = [
  { value: '0', label: 'Sunday' },
  { value: '1', label: 'Monday' },
  { value: '2', label: 'Tuesday' },
  { value: '3', label: 'Wednesday' },
  { value: '4', label: 'Thursday' },
  { value: '5', label: 'Friday' },
  { value: '6', label: 'Saturday' },
];
