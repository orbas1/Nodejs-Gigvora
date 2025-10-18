export const APPLICATION_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'in_review', label: 'Review' },
  { value: 'interview', label: 'Interview' },
  { value: 'offered', label: 'Offer' },
  { value: 'accepted', label: 'Accepted' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'withdrawn', label: 'Withdrawn' },
];

export const RESPONSE_TYPE_OPTIONS = [
  { value: 'message', label: 'Message' },
  { value: 'request_info', label: 'Info' },
  { value: 'approval', label: 'Approve' },
  { value: 'rejection', label: 'Reject' },
  { value: 'update', label: 'Update' },
];

export const CONTRACT_STATUS_OPTIONS = [
  { value: 'draft', label: 'Draft' },
  { value: 'awaiting_signature', label: 'Signing' },
  { value: 'active', label: 'Active' },
  { value: 'on_hold', label: 'Paused' },
  { value: 'completed', label: 'Done' },
  { value: 'cancelled', label: 'Cancelled' },
];

export const SPEND_CATEGORY_OPTIONS = [
  { value: 'travel', label: 'Travel' },
  { value: 'stipend', label: 'Stipend' },
  { value: 'equipment', label: 'Gear' },
  { value: 'training', label: 'Training' },
  { value: 'operations', label: 'Ops' },
  { value: 'other', label: 'Other' },
];

export const REVIEW_VISIBILITY_OPTIONS = [
  { value: 'private', label: 'Private' },
  { value: 'shared', label: 'Shared' },
];

export const OPEN_CONTRACT_STATES = new Set(['draft', 'awaiting_signature', 'active', 'on_hold']);
export const CLOSED_CONTRACT_STATES = new Set(['completed', 'cancelled']);
