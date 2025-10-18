export const VIEW_OPTIONS = [
  { id: 'overview', label: 'Overview' },
  { id: 'table', label: 'Table' },
  { id: 'insights', label: 'Insights' },
];

export const STATUS_OPTIONS = [
  { value: 'published', label: 'Live', badge: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  { value: 'pending', label: 'Queue', badge: 'bg-amber-50 text-amber-700 border-amber-200' },
  { value: 'draft', label: 'Draft', badge: 'bg-slate-100 text-slate-600 border-slate-200' },
  { value: 'archived', label: 'Archive', badge: 'bg-slate-100 text-slate-500 border-slate-200' },
];

export const HIGHLIGHT_OPTIONS = [
  { value: 'all', label: 'All' },
  { value: 'true', label: 'Pinned' },
  { value: 'false', label: 'Standard' },
];

export const SOURCE_OPTIONS = [
  { value: 'invited', label: 'Invited' },
  { value: 'auto-request', label: 'Auto' },
  { value: 'imported', label: 'Import' },
  { value: 'manual', label: 'Manual' },
];

export const FORM_STEPS = [
  { id: 'info', label: 'Info' },
  { id: 'content', label: 'Story' },
  { id: 'publish', label: 'Publish' },
];
